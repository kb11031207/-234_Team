"""Face clustering service using face_recognition library"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from typing import List, Dict, Optional, Tuple, Set
from app.models.database import DetectedFace, FaceCluster, ClusterMember
from app.services.face_recognition_service import get_face_service
from app.services.face_queue import get_face_queue
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)


async def cluster_event_faces(
    db: AsyncSession,
    event_id: uuid.UUID,
    tolerance: float = 0.6,
    force_full_rebuild: bool = False
) -> int:
    """
    Smart clustering: Automatically chooses incremental or full rebuild
    
    This is the main entry point for clustering. It decides whether to use
    incremental clustering (fast for small batches) or full rebuild (ensures correctness).
    
    Args:
        db: Database session
        event_id: Event UUID
        tolerance: Face distance tolerance (lower = more strict, default 0.6)
        force_full_rebuild: If True, always use full rebuild (manual override)
        
    Returns:
        Number of clusters created/updated
    """
    # Get statistics for decision making
    total_faces = await get_total_face_count(db, event_id)
    new_faces = await get_unclustered_face_count(db, event_id)
    
    # Get last full rebuild time
    queue = get_face_queue()
    last_full_rebuild = await queue.get_last_full_rebuild_time(event_id)
    days_since_last_full = 0
    if last_full_rebuild:
        days_since_last_full = (datetime.now() - last_full_rebuild).days
    
    # Make decision
    use_incremental = should_use_incremental(
        total_faces=total_faces,
        new_faces=new_faces,
        force_full=force_full_rebuild,
        days_since_last_full=days_since_last_full
    )
    
    if use_incremental:
        logger.info(
            f"Using INCREMENTAL clustering: {new_faces} new faces, {total_faces} total faces"
        )
        result = await cluster_incremental(db, event_id, tolerance)
    else:
        logger.info(
            f"Using FULL REBUILD clustering: {total_faces} total faces"
        )
        result = await cluster_full_rebuild(db, event_id, tolerance)
        # Mark that we did a full rebuild
        await queue.mark_full_rebuild(event_id)
    
    return result


async def cluster_full_rebuild(
    db: AsyncSession, 
    event_id: uuid.UUID, 
    tolerance: float = 0.6
):
    """
    Full rebuild clustering: Delete all existing clusters and rebuild from scratch
    
    This ensures correctness by:
    1. Deleting all existing clusters
    2. Using a greedy clustering algorithm (largest clusters first)
    3. Ensuring each face is only in ONE cluster
    
    Args:
        db: Database session
        event_id: Event UUID
        tolerance: Face distance tolerance (lower = more strict, default 0.6)
        
    Returns:
        Number of clusters created
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
        f"✅ Full rebuild clustering complete for event {event_id}: "
        f"{cluster_count} clusters, {total_faces_clustered} faces clustered, "
        f"{len(faces) - total_faces_clustered} faces unmatched"
    )
    
    return cluster_count


async def cluster_incremental(
    db: AsyncSession,
    event_id: uuid.UUID,
    tolerance: float = 0.6
) -> int:
    """
    Incremental clustering: Add new faces to existing clusters
    
    This is faster than full rebuild for small batches:
    1. Get existing clusters with representatives
    2. Get unclustered faces
    3. Compare each unclustered face against cluster representatives
    4. Add to matching cluster or create new cluster
    
    Args:
        db: Database session
        event_id: Event UUID
        tolerance: Face distance tolerance (lower = more strict, default 0.6)
        
    Returns:
        Number of new clusters created (not total clusters)
    """
    logger.info(f"🔄 Starting incremental clustering for event {event_id} (tolerance={tolerance})")
    
    # Get existing clusters with representatives
    clusters_with_reps = await get_all_clusters_with_representatives(db, event_id)
    
    if not clusters_with_reps:
        logger.info("No existing clusters found, falling back to full rebuild")
        return await cluster_full_rebuild(db, event_id, tolerance)
    
    logger.info(f"Found {len(clusters_with_reps)} existing clusters")
    
    # Get unclustered faces
    unclustered_faces = await get_unclustered_faces(db, event_id)
    
    if not unclustered_faces:
        logger.info("No unclustered faces found")
        return 0
    
    logger.info(f"Found {len(unclustered_faces)} unclustered faces to add")
    
    face_service = get_face_service()
    new_cluster_count = 0
    faces_added_to_existing = 0
    
    # Process each unclustered face
    for face in unclustered_faces:
        if not face.face_encoding:
            logger.warning(f"Face {face.face_id} has no encoding, skipping")
            continue
        
        best_match_cluster = None
        best_distance = float('inf')
        
        # Compare against all cluster representatives
        for cluster, representative_face in clusters_with_reps:
            try:
                is_match, distance = face_service.compare_faces(
                    face.face_encoding,
                    representative_face.face_encoding
                )
                
                if is_match and distance < best_distance:
                    best_distance = distance
                    best_match_cluster = cluster
            except Exception as e:
                logger.error(f"Error comparing face {face.face_id} with cluster {cluster.cluster_id}: {str(e)}")
                continue
        
        # Add to best matching cluster or create new cluster
        if best_match_cluster:
            # Add to existing cluster
            similarity = max(0.0, min(1.0, 1.0 - best_distance))
            
            member = ClusterMember(
                cluster_id=best_match_cluster.cluster_id,
                face_id=face.face_id,
                similarity_score=similarity,
            )
            db.add(member)
            
            # Update cluster face count
            best_match_cluster.face_count += 1
            faces_added_to_existing += 1
            
            logger.debug(
                f"  ✓ Added face {face.face_id} to cluster {best_match_cluster.cluster_id} "
                f"(similarity={similarity:.3f})"
            )
        else:
            # Create new cluster
            cluster = FaceCluster(
                event_id=event_id,
                representative_face_id=face.face_id,
                face_count=1,
            )
            db.add(cluster)
            await db.flush()  # Get cluster_id
            
            # Add representative to cluster
            member = ClusterMember(
                cluster_id=cluster.cluster_id,
                face_id=face.face_id,
                similarity_score=1.0,
            )
            db.add(member)
            
            # Add to our list for future comparisons
            clusters_with_reps.append((cluster, face))
            new_cluster_count += 1
            
            logger.debug(f"  ✓ Created new cluster {cluster.cluster_id} for face {face.face_id}")
        
        # Commit after each face to avoid huge transactions
        await db.commit()
    
    logger.info(
        f"✅ Incremental clustering complete for event {event_id}: "
        f"{new_cluster_count} new clusters created, "
        f"{faces_added_to_existing} faces added to existing clusters"
    )
    
    return new_cluster_count


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


async def get_all_clusters_with_representatives(
    db: AsyncSession,
    event_id: uuid.UUID
) -> List[Tuple[FaceCluster, DetectedFace]]:
    """
    Get all clusters for an event with their representative faces
    
    This is used for fast face search - instead of comparing against all faces,
    we compare against cluster representatives (much fewer comparisons).
    
    Args:
        db: Database session
        event_id: Event UUID
        
    Returns:
        List of (cluster, representative_face) tuples
        Returns empty list if no clusters exist or representative faces are missing
    """
    # Get all clusters for the event
    clusters_result = await db.execute(
        select(FaceCluster)
        .where(FaceCluster.event_id == event_id)
        .where(FaceCluster.representative_face_id.isnot(None))
    )
    clusters = list(clusters_result.scalars().all())
    
    if not clusters:
        logger.debug(f"No clusters found for event {event_id}")
        return []
    
    # Get representative faces for each cluster
    result = []
    for cluster in clusters:
        if not cluster.representative_face_id:
            logger.warning(f"Cluster {cluster.cluster_id} has no representative_face_id")
            continue
        
        # Get the representative face
        face_result = await db.execute(
            select(DetectedFace)
            .where(DetectedFace.face_id == cluster.representative_face_id)
            .where(DetectedFace.face_encoding.isnot(None))
        )
        representative_face = face_result.scalar_one_or_none()
        
        if representative_face:
            result.append((cluster, representative_face))
        else:
            logger.warning(
                f"Representative face {cluster.representative_face_id} not found "
                f"or has no encoding for cluster {cluster.cluster_id}"
            )
    
    logger.debug(f"Found {len(result)} clusters with representatives for event {event_id}")
    return result


async def get_unclustered_faces(
    db: AsyncSession,
    event_id: uuid.UUID
) -> List[DetectedFace]:
    """
    Get all faces in an event that are not yet in any cluster
    
    This is used for hybrid search - we need to search unclustered faces
    separately to ensure we find photos that were just uploaded but not yet clustered.
    
    Args:
        db: Database session
        event_id: Event UUID
        
    Returns:
        List of DetectedFace objects that are not in any cluster
        Returns empty list if all faces are clustered or no faces exist
    """
    # Get all faces in the event that have encodings
    # and are NOT in any cluster (no ClusterMember entry)
    result = await db.execute(
        select(DetectedFace)
        .where(DetectedFace.event_id == event_id)
        .where(DetectedFace.face_encoding.isnot(None))
        .where(
            ~DetectedFace.face_id.in_(
                select(ClusterMember.face_id)
            )
        )
    )
    unclustered_faces = list(result.scalars().all())
    
    logger.debug(
        f"Found {len(unclustered_faces)} unclustered faces for event {event_id}"
    )
    return unclustered_faces


async def get_media_ids_in_cluster(
    db: AsyncSession,
    cluster_id: uuid.UUID
) -> Set[uuid.UUID]:
    """
    Get all unique media IDs that contain faces in a given cluster
    
    This is used to quickly get all photos containing a person (cluster)
    without loading all the face objects.
    
    Args:
        db: Database session
        cluster_id: Cluster UUID
        
    Returns:
        Set of media UUIDs containing faces in this cluster
    """
    # Get all faces in the cluster and extract their media IDs
    result = await db.execute(
        select(DetectedFace.media_id)
        .join(ClusterMember, DetectedFace.face_id == ClusterMember.face_id)
        .where(ClusterMember.cluster_id == cluster_id)
        .distinct()
    )
    media_ids = {row[0] for row in result.all()}
    
    logger.debug(f"Found {len(media_ids)} unique media in cluster {cluster_id}")
    return media_ids


# ============================================================================
# Statistics Helper Functions
# ============================================================================

async def get_total_face_count(
    db: AsyncSession,
    event_id: uuid.UUID
) -> int:
    """
    Get total number of faces with encodings in an event
    
    Args:
        db: Database session
        event_id: Event UUID
        
    Returns:
        Total count of faces with encodings
    """
    result = await db.execute(
        select(func.count(DetectedFace.face_id))
        .where(DetectedFace.event_id == event_id)
        .where(DetectedFace.face_encoding.isnot(None))
    )
    count = result.scalar() or 0
    return count


async def get_unclustered_face_count(
    db: AsyncSession,
    event_id: uuid.UUID
) -> int:
    """
    Get count of faces that are not yet in any cluster
    
    Args:
        db: Database session
        event_id: Event UUID
        
    Returns:
        Count of unclustered faces
    """
    result = await db.execute(
        select(func.count(DetectedFace.face_id))
        .where(DetectedFace.event_id == event_id)
        .where(DetectedFace.face_encoding.isnot(None))
        .where(
            ~DetectedFace.face_id.in_(
                select(ClusterMember.face_id)
            )
        )
    )
    count = result.scalar() or 0
    return count


# ============================================================================
# Decision Logic
# ============================================================================

def should_use_incremental(
    total_faces: int,
    new_faces: int,
    force_full: bool,
    days_since_last_full: int
) -> bool:
    """
    Decide whether to use incremental clustering or full rebuild
    
    Decision criteria:
    - Use INCREMENTAL when: small batch, established event, recent full rebuild
    - Use FULL REBUILD when: first time, large batch, maintenance needed
    
    Args:
        total_faces: Total number of faces in event
        new_faces: Number of unclustered faces
        force_full: Manual override to force full rebuild
        days_since_last_full: Days since last full rebuild (0 if never)
        
    Returns:
        True if incremental should be used, False for full rebuild
    """
    # Rule 1: Manual override → Always full rebuild
    if force_full:
        logger.debug("Force full rebuild requested")
        return False
    
    # Rule 2: First time clustering → Full rebuild
    if total_faces == new_faces:
        logger.debug("First time clustering - using full rebuild")
        return False
    
    # Rule 3: Very small event → Full rebuild (fast anyway)
    if total_faces < 100:
        logger.debug(f"Small event ({total_faces} faces) - using full rebuild")
        return False
    
    # Rule 4: Large batch → Full rebuild (incremental would be slow)
    if new_faces > 100:
        logger.debug(f"Large batch ({new_faces} faces) - using full rebuild")
        return False
    
    # Rule 5: New faces > 20% of total → Full rebuild (too many changes)
    if total_faces > 0 and new_faces > total_faces * 0.2:
        percentage = (new_faces / total_faces) * 100
        logger.debug(
            f"Too many new faces ({percentage:.1f}% of total) - using full rebuild"
        )
        return False
    
    # Rule 6: Maintenance → Full rebuild (ensures correctness)
    if days_since_last_full >= 1:
        logger.debug(
            f"Maintenance rebuild needed ({days_since_last_full} days since last) - using full rebuild"
        )
        return False
    
    # Rule 7: Everything else → Incremental (fast!)
    logger.debug(
        f"Incremental clustering: {new_faces} new faces, {total_faces} total, "
        f"{days_since_last_full} days since last full rebuild"
    )
    return True

