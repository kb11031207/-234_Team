"""Face detection and search endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.schemas.pydantic import FaceSearchRequest, FaceSearchResponse, MediaResponse
from app.models.database import DetectedFace, FaceCluster, ClusterMember, Media
from app.services.face_clustering import (
    cluster_event_faces,
    get_cluster_for_face,
    get_faces_in_cluster,
    get_all_clusters_with_representatives,
    get_unclustered_faces,
    get_media_ids_in_cluster,
    get_total_face_count,
)
from app.services.face_queue import get_face_queue
import uuid
import logging
import time

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/search-by-selfie")
async def search_by_selfie(
    event_id: str,
    file: UploadFile = File(...),
    tolerance: float = 0.6,
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a selfie and find all photos you appear in
    
    THIS IS THE MAIN FEATURE - "Find me in this event"
    
    User flow:
    1. User goes to event
    2. Clicks "Find me"
    3. Uploads selfie
    4. Gets all photos they appear in
    """
    from app.services.face_recognition_service import get_face_service
    import io
    
    try:
        event_uuid = uuid.UUID(event_id)
        
        logger.info(f"Selfie search requested for event {event_id}")
        
        # PERFORMANCE TRACKING: Start total timing (includes face detection)
        total_start_time = time.time()
        
        # Read uploaded selfie
        read_start = time.time()
        selfie_bytes = await file.read()
        read_time = time.time() - read_start
        
        if not selfie_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No image data received"
            )
        
        # Detect face in selfie (THIS IS THE BOTTLENECK!)
        face_detection_start = time.time()
        face_service = get_face_service()
        try:
            detected_faces = face_service.detect_and_encode_faces(selfie_bytes)
        except Exception as e:
            logger.error(f"Failed to detect face in selfie: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not detect face in uploaded image. Please upload a clear photo of your face."
            )
        face_detection_time = time.time() - face_detection_start
        
        if not detected_faces:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No face detected in selfie. Please upload a clear photo of your face."
            )
        
        if len(detected_faces) > 1:
            logger.warning(f"Multiple faces detected in selfie ({len(detected_faces)}), using first one")
        
        # Use first detected face
        selfie_encoding = detected_faces[0]['face_encoding']
        
        logger.info(
            f"✅ Face detection complete: {face_detection_time:.3f}s "
            f"(model={'CNN' if face_service.model == 'large' else 'HOG'})"
        )
        
        # PERFORMANCE TRACKING: Start search timing (after face detection)
        search_start_time = time.time()
        cluster_search_time = 0
        unclustered_search_time = 0
        db_query_time = 0
        
        # Get total faces for comparison
        total_faces = await get_total_face_count(db, event_uuid)
        
        # HYBRID SEARCH: Search clusters first (fast), then unclustered faces (complete)
        matching_media_ids = set()
        matching_faces_count = 0
        
        # PART 1: Search existing clusters (fast path - O(k) where k = number of clusters)
        cluster_start = time.time()
        clusters_with_reps = await get_all_clusters_with_representatives(db, event_uuid)
        db_query_time += time.time() - cluster_start
        
        cluster_comparisons = 0
        if clusters_with_reps:
            logger.info(f"🔍 Searching {len(clusters_with_reps)} existing clusters (vs {total_faces} total faces)")
            cluster_compare_start = time.time()
            for cluster, representative_face in clusters_with_reps:
                try:
                    # Compare selfie against cluster representative
                    is_match, distance = face_service.compare_faces(
                        selfie_encoding,
                        representative_face.face_encoding
                    )
                    cluster_comparisons += 1
                    
                    if is_match:
                        # Get all media IDs in this cluster
                        db_start = time.time()
                        cluster_media_ids = await get_media_ids_in_cluster(db, cluster.cluster_id)
                        db_query_time += time.time() - db_start
                        matching_media_ids.update(cluster_media_ids)
                        matching_faces_count += cluster.face_count
                        logger.debug(
                            f"Match found in cluster {cluster.cluster_id}: "
                            f"{len(cluster_media_ids)} photos, {cluster.face_count} faces"
                        )
                except Exception as e:
                    logger.error(f"Error comparing with cluster {cluster.cluster_id}: {str(e)}")
                    continue
            cluster_search_time = time.time() - cluster_compare_start
        
        # PART 2: Search unclustered faces (catch new photos that haven't been clustered yet)
        unclustered_start = time.time()
        unclustered_faces = await get_unclustered_faces(db, event_uuid)
        db_query_time += time.time() - unclustered_start
        
        unclustered_comparisons = 0
        if unclustered_faces:
            logger.info(f"🔍 Searching {len(unclustered_faces)} unclustered faces")
            unclustered_compare_start = time.time()
            for face in unclustered_faces:
                try:
                    is_match, distance = face_service.compare_faces(
                        selfie_encoding,
                        face.face_encoding
                    )
                    unclustered_comparisons += 1
                    
                    if is_match:
                        matching_media_ids.add(face.media_id)
                        matching_faces_count += 1
                        logger.debug(f"Match found in unclustered face {face.face_id}")
                except Exception as e:
                    logger.error(f"Error comparing with unclustered face {face.face_id}: {str(e)}")
                    continue
            unclustered_search_time = time.time() - unclustered_compare_start
        
        # Check if we found any matches
        if not matching_media_ids:
            # Check if there are any faces at all in the event
            total_faces_result = await db.execute(
                select(func.count(DetectedFace.face_id))
                .where(DetectedFace.event_id == event_uuid)
                .where(DetectedFace.face_encoding.isnot(None))
            )
            total_faces = total_faces_result.scalar() or 0
            
            if total_faces == 0:
                return {
                    "matches": [],
                    "total": 0,
                    "message": "No faces detected in this event yet"
                }
            else:
                return {
                    "matches": [],
                    "total": 0,
                    "message": "No matches found. You don't appear in any photos yet."
                }
        
        # Get unique media IDs as list
        media_ids = list(matching_media_ids)
        
        # PART 3: Trigger background clustering if unclustered faces exist (for next search)
        if unclustered_faces and background_tasks:
            logger.info(
                f"Triggering background clustering for {len(unclustered_faces)} unclustered faces"
            )
            # Create a new database session for the background task
            async def cluster_task():
                from app.core.database import async_session_maker
                async with async_session_maker() as bg_db:
                    try:
                        await cluster_event_faces(bg_db, event_uuid, tolerance=tolerance)
                        queue = get_face_queue()
                        await queue.mark_clustered(event_uuid)
                        logger.info(f"Background clustering completed for event {event_id}")
                    except Exception as e:
                        logger.error(f"Background clustering failed: {str(e)}")
            
            background_tasks.add_task(cluster_task)
        
        # Fetch media details
        media_fetch_start = time.time()
        media_result = await db.execute(
            select(Media)
            .where(Media.media_id.in_(media_ids))
            .order_by(Media.created_at.desc())
        )
        media_list = list(media_result.scalars().all())
        db_query_time += time.time() - media_fetch_start
        
        # Calculate times
        total_search_time = time.time() - search_start_time
        total_request_time = time.time() - total_start_time
        
        # PERFORMANCE LOGGING
        total_comparisons = cluster_comparisons + unclustered_comparisons
        speedup_ratio = total_faces / total_comparisons if total_comparisons > 0 else 1
        
        logger.info(
            f"⚡ COMPLETE PERFORMANCE BREAKDOWN: "
            f"Total Request={total_request_time:.3f}s | "
            f"Face Detection={face_detection_time:.3f}s ({face_detection_time/total_request_time*100:.1f}%) | "
            f"Search={total_search_time:.3f}s ({total_search_time/total_request_time*100:.1f}%) | "
            f"Clusters={cluster_search_time:.3f}s ({cluster_comparisons} comparisons) | "
            f"Unclustered={unclustered_search_time:.3f}s ({unclustered_comparisons} comparisons) | "
            f"DB={db_query_time:.3f}s | "
            f"Total faces={total_faces} | "
            f"Comparisons={total_comparisons} | "
            f"Speedup={speedup_ratio:.1f}x | "
            f"Found={len(media_list)} photos"
        )
        
        # Warn if face detection is the bottleneck
        if face_detection_time > total_search_time * 2:
            logger.warning(
                f"⚠️  Face detection ({face_detection_time:.3f}s) is taking longer than search ({total_search_time:.3f}s). "
                f"Consider using HOG model for faster detection (less accurate but 10-20x faster)."
            )
        
        # Return response with performance metrics in headers
        response_data = {
            "matches": media_list,
            "total": len(media_list),
            "faces_matched": matching_faces_count,
            "message": f"Found you in {len(media_list)} photo(s)!",
            "performance": {
                "total_request_time_seconds": round(total_request_time, 3),
                "face_detection_time_seconds": round(face_detection_time, 3),
                "search_time_seconds": round(total_search_time, 3),
                "cluster_search_time_seconds": round(cluster_search_time, 3),
                "unclustered_search_time_seconds": round(unclustered_search_time, 3),
                "db_query_time_seconds": round(db_query_time, 3),
                "file_read_time_seconds": round(read_time, 3),
                "total_faces": total_faces,
                "cluster_comparisons": cluster_comparisons,
                "unclustered_comparisons": unclustered_comparisons,
                "total_comparisons": total_comparisons,
                "speedup_ratio": round(speedup_ratio, 1),
                "face_detection_model": face_service.model,
            }
        }
        
        return response_data
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event_id format"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Selfie search failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.post("/search", response_model=FaceSearchResponse)
async def search_faces(
    search_request: FaceSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search for similar faces in an event (legacy endpoint)
    
    Use /search-by-selfie instead for uploading selfies
    """
    event_id = search_request.event_id
    logger.info(f"Face search requested for event {event_id}")
    
    # Return empty - use /search-by-selfie for actual selfie uploads
    return {
        "matches": [],
        "total": 0,
    }


@router.post("/search-by-face/{face_id}")
async def search_by_face_id(
    face_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Find all photos containing faces similar to the given face
    
    This is the "Find Similar" feature - click on a face, see all photos with that person
    """
    try:
        face_uuid = uuid.UUID(face_id)
        
        # Get the cluster this face belongs to
        cluster_id = await get_cluster_for_face(db, face_uuid)
        
        if not cluster_id:
            logger.warning(f"Face {face_id} not found in any cluster")
            return {
                "cluster_id": None,
                "face_count": 0,
                "media": [],
            }
        
        # Get all faces in this cluster
        faces = await get_faces_in_cluster(db, cluster_id)
        
        # Get all unique media IDs
        media_ids = list(set([face.media_id for face in faces]))
        
        # Fetch media details
        result = await db.execute(
            select(Media)
            .where(Media.media_id.in_(media_ids))
            .limit(limit)
        )
        media_list = result.scalars().all()
        
        logger.info(f"Found {len(media_list)} photos containing similar faces to {face_id}")
        
        return {
            "cluster_id": str(cluster_id),
            "face_count": len(faces),
            "media": media_list,
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid face_id format"
        )
    except Exception as e:
        logger.error(f"Search by face ID failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/events/{event_id}/clusters")
async def get_event_clusters(
    event_id: str,
    min_faces: int = 1,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all face clusters (groups of people) in an event
    
    Returns a list of people detected in the event, with their representative face
    and count of photos they appear in
    """
    try:
        event_uuid = uuid.UUID(event_id)
        
        # Query clusters for the event
        query = (
            select(FaceCluster)
            .where(FaceCluster.event_id == event_uuid)
            .where(FaceCluster.face_count >= min_faces)
            .order_by(FaceCluster.face_count.desc())  # Most photos first
            .limit(limit)
            .offset(offset)
        )
        
        result = await db.execute(query)
        clusters = result.scalars().all()
        
        # Get total count
        count_query = (
            select(func.count(FaceCluster.cluster_id))
            .where(FaceCluster.event_id == event_uuid)
            .where(FaceCluster.face_count >= min_faces)
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Format response with representative face info
        clusters_data = []
        for cluster in clusters:
            # Get representative face
            rep_face = None
            if cluster.representative_face_id:
                face_result = await db.execute(
                    select(DetectedFace)
                    .where(DetectedFace.face_id == cluster.representative_face_id)
                )
                rep_face = face_result.scalar_one_or_none()
            
            cluster_data = {
                "cluster_id": str(cluster.cluster_id),
                "event_id": str(cluster.event_id),
                "face_count": cluster.face_count,
                "identified_user_id": str(cluster.identified_user_id) if cluster.identified_user_id else None,
                "identified_at": cluster.identified_at,
                "created_at": cluster.created_at,
            }
            
            if rep_face:
                # Get media for representative face
                media_result = await db.execute(
                    select(Media).where(Media.media_id == rep_face.media_id)
                )
                media = media_result.scalar_one_or_none()
                
                cluster_data["representative_face"] = {
                    "face_id": str(rep_face.face_id),
                    "media_id": str(rep_face.media_id),
                    "thumbnail_url": media.thumbnail_url if media else None,
                    "blob_url": media.blob_url if media else None,
                    "bbox": {
                        "x": float(rep_face.bbox_x),
                        "y": float(rep_face.bbox_y),
                        "width": float(rep_face.bbox_width),
                        "height": float(rep_face.bbox_height),
                    }
                }
            
            clusters_data.append(cluster_data)
        
        logger.info(f"Found {len(clusters_data)} clusters for event {event_id}")
        
        return {
            "clusters": clusters_data,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + len(clusters_data)) < total,
            }
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event_id format"
        )
    except Exception as e:
        logger.error(f"Get clusters failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch clusters: {str(e)}"
        )


@router.post("/clusters/{cluster_id}/identify")
async def identify_cluster(
    cluster_id: str,
    db: AsyncSession = Depends(get_db),
    # TODO: Add authentication - current_user: User = Depends(get_current_user)
):
    """
    Identify yourself in a cluster (claim "This is me")
    
    Links a cluster to a user account so they can easily find all photos of themselves
    """
    try:
        cluster_uuid = uuid.UUID(cluster_id)
        
        # Get cluster
        result = await db.execute(
            select(FaceCluster).where(FaceCluster.cluster_id == cluster_uuid)
        )
        cluster = result.scalar_one_or_none()
        
        if not cluster:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cluster not found"
            )
        
        # TODO: Set identified_user_id to current user
        # cluster.identified_user_id = current_user.user_id
        # cluster.identified_at = func.now()
        # await db.commit()
        
        logger.info(f"Cluster {cluster_id} identified by user")
        
        return {
            "cluster_id": str(cluster.cluster_id),
            "face_count": cluster.face_count,
            "message": f"Successfully identified yourself in {cluster.face_count} photos",
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid cluster_id format"
        )
    except Exception as e:
        logger.error(f"Cluster identification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Identification failed: {str(e)}"
        )


@router.post("/events/{event_id}/trigger-clustering")
async def trigger_clustering(
    event_id: str,
    background_tasks: BackgroundTasks,
    tolerance: float = 0.6,
    force_full_rebuild: bool = False,
    db: AsyncSession = Depends(get_db),
    # TODO: Add auth - must be event owner
):
    """
    Manually trigger face clustering for an event
    
    Useful for:
    - Event owner wants to refresh clustering
    - Initial clustering after batch upload
    - Adjusting tolerance parameter
    - Force full rebuild (force_full_rebuild=True)
    
    Args:
        force_full_rebuild: If True, forces full rebuild instead of smart decision
    """
    try:
        event_uuid = uuid.UUID(event_id)
        
        logger.info(
            f"Manual clustering triggered for event {event_id} "
            f"(force_full_rebuild={force_full_rebuild})"
        )
        
        # Run clustering in background
        async def cluster_task():
            from app.core.database import async_session_maker
            async with async_session_maker() as bg_db:
                await cluster_event_faces(
                    bg_db, 
                    event_uuid, 
                    tolerance=tolerance,
                    force_full_rebuild=force_full_rebuild
                )
                queue = get_face_queue()
                await queue.mark_clustered(event_uuid)
        
        background_tasks.add_task(cluster_task)
        
        return {
            "status": "started",
            "event_id": event_id,
            "force_full_rebuild": force_full_rebuild,
            "message": "Clustering started in background",
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event_id format"
        )
    except Exception as e:
        logger.error(f"Trigger clustering failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger clustering: {str(e)}"
        )


@router.get("/media/{media_id}/faces")
async def get_media_faces(
    media_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all detected faces in a specific media item
    
    Returns bounding boxes and cluster information for each face
    """
    try:
        media_uuid = uuid.UUID(media_id)
        
        # Get all faces in this media
        result = await db.execute(
            select(DetectedFace)
            .where(DetectedFace.media_id == media_uuid)
        )
        faces = result.scalars().all()
        
        # Get cluster info for each face
        faces_data = []
        for face in faces:
            cluster_id = await get_cluster_for_face(db, face.face_id)
            
            # Get cluster info if exists
            cluster_info = None
            if cluster_id:
                cluster_result = await db.execute(
                    select(FaceCluster).where(FaceCluster.cluster_id == cluster_id)
                )
                cluster = cluster_result.scalar_one_or_none()
                if cluster:
                    cluster_info = {
                        "cluster_id": str(cluster.cluster_id),
                        "face_count": cluster.face_count,
                        "identified_user_id": str(cluster.identified_user_id) if cluster.identified_user_id else None,
                    }
            
            faces_data.append({
                "face_id": str(face.face_id),
                "bbox": {
                    "x": float(face.bbox_x),
                    "y": float(face.bbox_y),
                    "width": float(face.bbox_width),
                    "height": float(face.bbox_height),
                },
                "confidence": float(face.confidence) if face.confidence else 1.0,
                "cluster": cluster_info,
            })
        
        return {
            "media_id": media_id,
            "faces": faces_data,
            "total_faces": len(faces_data),
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid media_id format"
        )
    except Exception as e:
        logger.error(f"Get media faces failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch faces: {str(e)}"
        )

