"""Face clustering service using face_recognition library"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict
from app.models.database import DetectedFace, FaceCluster, ClusterMember
from app.services.face_recognition_service import get_face_service
import uuid
import logging

logger = logging.getLogger(__name__)


async def cluster_event_faces(db: AsyncSession, event_id: uuid.UUID, tolerance: float = 0.6):
    """
    Cluster similar faces within an event using face encodings
    
    Args:
        db: Database session
        event_id: Event UUID
        tolerance: Face distance tolerance (lower = more strict, default 0.6)
    """
    logger.info(f"Starting face clustering for event {event_id}")
    
    # Get all detected faces for the event that have encodings
    result = await db.execute(
        select(DetectedFace)
        .where(DetectedFace.event_id == event_id)
        .where(DetectedFace.face_encoding.isnot(None))
    )
    faces = result.scalars().all()
    
    if not faces:
        logger.info(f"No faces with encodings found for event {event_id}")
        return
    
    logger.info(f"Found {len(faces)} faces to cluster")
    
    # Delete existing clusters for this event (we'll rebuild them)
    await db.execute(
        delete(FaceCluster).where(FaceCluster.event_id == event_id)
    )
    await db.commit()
    
    # Track which faces have been clustered
    unclustered_faces = list(faces)
    face_service = get_face_service()
    
    cluster_count = 0
    
    while unclustered_faces:
        # Take first unclustered face as cluster representative
        representative_face = unclustered_faces.pop(0)
        
        if not representative_face.face_encoding:
            continue
        
        # Create new cluster
        cluster = FaceCluster(
            event_id=event_id,
            representative_face_id=representative_face.face_id,
            face_count=1,
        )
        db.add(cluster)
        await db.flush()
        
        # Add representative to cluster
        member = ClusterMember(
            cluster_id=cluster.cluster_id,
            face_id=representative_face.face_id,
            similarity_score=1.0,
        )
        db.add(member)
        
        # Find similar faces using face encodings
        faces_to_check = []
        for face in unclustered_faces[:]:  # Use slice to iterate over copy
            if face.face_encoding:
                # Compare encodings
                is_match, distance = face_service.compare_faces(
                    representative_face.face_encoding,
                    face.face_encoding
                )
                
                if is_match:
                    # Add to cluster
                    member = ClusterMember(
                        cluster_id=cluster.cluster_id,
                        face_id=face.face_id,
                        similarity_score=1.0 - distance,  # Convert distance to similarity
                    )
                    db.add(member)
                    
                    # Remove from unclustered
                    unclustered_faces.remove(face)
                    
                    # Update cluster face count
                    cluster.face_count += 1
        
        cluster_count += 1
        logger.info(f"Created cluster {cluster_count} with {cluster.face_count} faces")
        
        await db.commit()
    
    logger.info(f"Clustering complete: {cluster_count} clusters created for event {event_id}")

