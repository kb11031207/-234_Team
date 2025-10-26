"""Face clustering service using face_recognition library"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Optional
from app.models.database import DetectedFace, FaceCluster, ClusterMember
from app.services.face_recognition_service import get_face_service
import uuid
import logging

logger = logging.getLogger(__name__)


async def cluster_event_faces(
    db: AsyncSession, 
    event_id: uuid.UUID, 
    tolerance: float = 0.6,
    incremental: bool = False
):
    """
    Cluster similar faces within an event using face encodings
    
    This prevents duplicate clusters by:
    1. Using a greedy clustering algorithm (largest clusters first)
    2. Ensuring each face is only in ONE cluster
    3. Deleting old clusters and rebuilding from scratch
    
    Args:
        db: Database session
        event_id: Event UUID
        tolerance: Face distance tolerance (lower = more strict, default 0.6)
        incremental: If True, try to add to existing clusters; if False, rebuild from scratch
    """
    logger.info(f"🔍 Starting face clustering for event {event_id} (tolerance={tolerance})")
    
    # Get all detected faces for the event that have encodings
    result = await db.execute(
        select(DetectedFace)
        .where(DetectedFace.event_id == event_id)
        .where(DetectedFace.face_encoding.isnot(None))
    )
    faces = list(result.scalars().all())
    
    if not faces:
        logger.info(f"⚠️ No faces with encodings found for event {event_id}")
        return
    
    logger.info(f"📊 Found {len(faces)} faces to cluster")
    
    # Delete existing clusters for this event (rebuild from scratch prevents duplicates)
    deleted_result = await db.execute(
        delete(FaceCluster).where(FaceCluster.event_id == event_id)
    )
    deleted_count = deleted_result.rowcount if hasattr(deleted_result, 'rowcount') else 0
    logger.info(f"🗑️ Deleted {deleted_count} existing clusters")
    await db.commit()
    
    # Track which faces have been clustered
    unclustered_faces = list(faces)
    face_service = get_face_service()
    
    cluster_count = 0
    total_faces_clustered = 0
    
    while unclustered_faces:
        # Take first unclustered face as cluster representative
        representative_face = unclustered_faces.pop(0)
        
        if not representative_face.face_encoding:
            logger.warning(f"Face {representative_face.face_id} has no encoding, skipping")
            continue
        
        # Create new cluster
        cluster = FaceCluster(
            event_id=event_id,
            representative_face_id=representative_face.face_id,
            face_count=1,
        )
        db.add(cluster)
        await db.flush()  # Get cluster_id
        
        # Add representative to cluster
        member = ClusterMember(
            cluster_id=cluster.cluster_id,
            face_id=representative_face.face_id,
            similarity_score=1.0,
        )
        db.add(member)
        
        matched_faces = []
        
        # Find similar faces using face encodings
        for face in unclustered_faces[:]:  # Iterate over copy
            if not face.face_encoding:
                continue
            
            try:
                # Compare encodings
                is_match, distance = face_service.compare_faces(
                    representative_face.face_encoding,
                    face.face_encoding
                )
                
                if is_match:
                    # Add to cluster
                    similarity = max(0.0, min(1.0, 1.0 - distance))  # Clamp to [0, 1]
                    
                    member = ClusterMember(
                        cluster_id=cluster.cluster_id,
                        face_id=face.face_id,
                        similarity_score=similarity,
                    )
                    db.add(member)
                    
                    # Track for removal
                    matched_faces.append(face)
                    
                    # Update cluster face count
                    cluster.face_count += 1
                    
                    logger.debug(f"  ✓ Matched face {face.face_id} (similarity={similarity:.3f})")
            
            except Exception as e:
                logger.error(f"Error comparing faces: {str(e)}")
                continue
        
        # Remove matched faces from unclustered list
        for face in matched_faces:
            unclustered_faces.remove(face)
        
        cluster_count += 1
        total_faces_clustered += cluster.face_count
        
        logger.info(
            f"📦 Cluster {cluster_count}: {cluster.face_count} face(s) "
            f"(representative: {representative_face.face_id})"
        )
        
        # Commit after each cluster to avoid huge transactions
        await db.commit()
    
    logger.info(
        f"✅ Clustering complete for event {event_id}: "
        f"{cluster_count} clusters, {total_faces_clustered} faces clustered, "
        f"{len(faces) - total_faces_clustered} faces unmatched"
    )
    
    return cluster_count


async def get_cluster_for_face(
    db: AsyncSession,
    face_id: uuid.UUID
) -> Optional[uuid.UUID]:
    """
    Get the cluster ID that a face belongs to
    
    Args:
        db: Database session
        face_id: Face UUID
        
    Returns:
        Cluster UUID or None
    """
    result = await db.execute(
        select(ClusterMember.cluster_id)
        .where(ClusterMember.face_id == face_id)
    )
    cluster_id = result.scalar_one_or_none()
    return cluster_id


async def get_faces_in_cluster(
    db: AsyncSession,
    cluster_id: uuid.UUID
) -> List[DetectedFace]:
    """
    Get all faces in a cluster
    
    Args:
        db: Database session
        cluster_id: Cluster UUID
        
    Returns:
        List of DetectedFace objects
    """
    result = await db.execute(
        select(DetectedFace)
        .join(ClusterMember, DetectedFace.face_id == ClusterMember.face_id)
        .where(ClusterMember.cluster_id == cluster_id)
    )
    faces = result.scalars().all()
    return list(faces)

