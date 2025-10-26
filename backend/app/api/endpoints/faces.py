"""Face detection and search endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.schemas.pydantic import FaceSearchRequest, FaceSearchResponse
from app.models.database import DetectedFace, FaceCluster, ClusterMember, Media, User
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/search")
async def search_faces(
    event_id: str = Body(...),
    face_id: str = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Search for similar faces in an event
    Finds all photos containing the same person as the given face
    """
    # Get the face
    face_result = await db.execute(
        select(DetectedFace).where(DetectedFace.face_id == face_id)
    )
    face = face_result.scalar_one_or_none()
    
    if not face:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Face not found",
        )
    
    # Find cluster for this face
    cluster_member_result = await db.execute(
        select(ClusterMember).where(ClusterMember.face_id == face_id)
    )
    cluster_member = cluster_member_result.scalar_one_or_none()
    
    if not cluster_member:
        # Face not clustered yet
        return {
            "query_face_id": str(face_id),
            "cluster_id": None,
            "matches": [],
            "total": 0
        }
    
    cluster_id = cluster_member.cluster_id
    
    # Get all faces in the same cluster
    all_members_result = await db.execute(
        select(ClusterMember).where(ClusterMember.cluster_id == cluster_id)
    )
    all_members = all_members_result.scalars().all()
    
    # Get media and face details for each match
    matches = []
    for member in all_members:
        face_result = await db.execute(
            select(DetectedFace).where(DetectedFace.face_id == member.face_id)
        )
        matched_face = face_result.scalar_one_or_none()
        
        if matched_face:
            media_result = await db.execute(
                select(Media).where(Media.media_id == matched_face.media_id)
            )
            media = media_result.scalar_one_or_none()
            
            if media:
                matches.append({
                    "media_id": str(media.media_id),
                    "face_id": str(matched_face.face_id),
                    "blob_url": media.blob_url,
                    "thumbnail_url": media.thumbnail_url,
                    "similarity_score": float(member.similarity_score) if member.similarity_score else 1.0,
                    "bbox": {
                        "x": float(matched_face.bbox_x) if matched_face.bbox_x else None,
                        "y": float(matched_face.bbox_y) if matched_face.bbox_y else None,
                        "width": float(matched_face.bbox_width) if matched_face.bbox_width else None,
                        "height": float(matched_face.bbox_height) if matched_face.bbox_height else None,
                    }
                })
    
    return {
        "query_face_id": str(face_id),
        "cluster_id": str(cluster_id),
        "matches": matches,
        "total": len(matches)
    }


@router.get("/events/{event_id}/clusters")
async def get_event_clusters(
    event_id: str,
    limit: int = 50,
    offset: int = 0,
    min_faces: int = 1,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all face clusters (groups of people) in an event
    Used for "Find People" or "Search Face" page
    """
    # Query clusters for this event
    query = select(FaceCluster).where(
        FaceCluster.event_id == event_id,
        FaceCluster.face_count >= min_faces
    ).order_by(
        FaceCluster.face_count.desc()
    ).limit(limit).offset(offset)
    
    result = await db.execute(query)
    clusters = result.scalars().all()
    
    # Build response with representative face details
    response_clusters = []
    for cluster in clusters:
        cluster_data = {
            "cluster_id": str(cluster.cluster_id),
            "event_id": str(cluster.event_id),
            "face_count": cluster.face_count,
            "representative_face": None,
            "identified_user": None,
        }
        
        # Get representative face
        if cluster.representative_face_id:
            face_result = await db.execute(
                select(DetectedFace).where(DetectedFace.face_id == cluster.representative_face_id)
            )
            rep_face = face_result.scalar_one_or_none()
            
            if rep_face:
                media_result = await db.execute(
                    select(Media).where(Media.media_id == rep_face.media_id)
                )
                media = media_result.scalar_one_or_none()
                
                cluster_data["representative_face"] = {
                    "face_id": str(rep_face.face_id),
                    "media_id": str(rep_face.media_id),
                    "thumbnail_url": media.thumbnail_url if media else None,
                    "bbox": {
                        "x": float(rep_face.bbox_x) if rep_face.bbox_x else None,
                        "y": float(rep_face.bbox_y) if rep_face.bbox_y else None,
                        "width": float(rep_face.bbox_width) if rep_face.bbox_width else None,
                        "height": float(rep_face.bbox_height) if rep_face.bbox_height else None,
                    }
                }
        
        # Get identified user if any
        if cluster.identified_user_id:
            user_result = await db.execute(
                select(User).where(User.user_id == cluster.identified_user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user:
                cluster_data["identified_user"] = {
                    "user_id": str(user.user_id),
                    "display_name": user.display_name,
                    "photo_url": user.photo_url,
                }
        
        response_clusters.append(cluster_data)
    
    # Get total count
    count_query = select(FaceCluster).where(
        FaceCluster.event_id == event_id,
        FaceCluster.face_count >= min_faces
    )
    count_result = await db.execute(count_query)
    total = len(count_result.scalars().all())
    
    return {
        "clusters": response_clusters,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total
        }
    }


@router.post("/clusters/{cluster_id}/identify")
async def identify_self_in_cluster(
    cluster_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Identify yourself in a cluster ("This is me" button)
    Associates your user account with this face cluster
    """
    # Get cluster
    cluster_result = await db.execute(
        select(FaceCluster).where(FaceCluster.cluster_id == cluster_id)
    )
    cluster = cluster_result.scalar_one_or_none()
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )
    
    # Update cluster with identified user
    from datetime import datetime
    cluster.identified_user_id = current_user.user_id
    cluster.identified_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(cluster)
    
    return {
        "cluster_id": str(cluster.cluster_id),
        "identified_user_id": str(current_user.user_id),
        "message": f"Successfully identified yourself in {cluster.face_count} photo(s)"
    }


@router.post("/events/{event_id}/cluster")
async def trigger_face_clustering(
    event_id: str,
    tolerance: float = Body(0.6),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger face clustering for an event
    (Owner only - for re-clustering or initial clustering)
    """
    from app.models.database import Event
    from fastapi import BackgroundTasks
    
    # Verify user owns the event
    event_result = await db.execute(
        select(Event).where(Event.event_id == event_id)
    )
    event = event_result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    if event.owner_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only event owner can trigger clustering",
        )
    
    # Trigger clustering (should be background task)
    from app.services.face_clustering import cluster_event_faces
    import asyncio
    
    # For now, run synchronously (in production, use Celery or BackgroundTasks)
    try:
        await cluster_event_faces(db, event_id, tolerance=tolerance)
        return {
            "status": "completed",
            "event_id": str(event_id),
            "message": "Clustering completed successfully"
        }
    except Exception as e:
        return {
            "status": "failed",
            "event_id": str(event_id),
            "message": f"Clustering failed: {str(e)}"
        }

