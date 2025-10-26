"""Media upload and management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.database import Media
from app.schemas.pydantic import MediaUploadRequest, MediaResponse, PresignedUploadResponse
from app.api.deps import verify_access_code
from app.services.azure_blob import generate_presigned_upload_url
from app.workers.face_processor import process_media_faces

router = APIRouter()


@router.post("/upload-url", response_model=PresignedUploadResponse)
async def get_upload_url(
    upload_request: MediaUploadRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get presigned URL for direct upload to Azure Blob Storage"""
    # TODO: Verify access code or user permissions
    
    # Generate presigned URL
    upload_url, blob_url = await generate_presigned_upload_url(
        filename=upload_request.filename,
        content_type=upload_request.content_type,
    )
    
    # Create media record in pending state
    media = Media(
        event_id=upload_request.event_id,
        uploader_id=upload_request.uploader_id,
        blob_url=blob_url,
        filename=upload_request.filename,
        content_type=upload_request.content_type,
        file_size=upload_request.file_size,
        media_type="photo",  # TODO: Detect from content_type
        face_detection_status="pending",
    )
    
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return {
        "upload_url": upload_url,
        "media_id": media.media_id,
        "blob_url": blob_url,
    }


@router.post("/{media_id}/confirm")
async def confirm_upload(
    media_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Confirm upload and trigger face detection"""
    # TODO: Get media from DB, update status
    
    # Trigger face detection in background
    background_tasks.add_task(process_media_faces, media_id)
    
    return {"status": "processing", "media_id": media_id}


@router.get("/events/{event_id}/media", response_model=List[MediaResponse])
async def list_event_media(
    event_id: str,
    limit: int = 50,
    offset: int = 0,
    sort: str = "newest",
    has_faces: bool = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all media for an event (Gallery Page)
    
    Args:
        event_id: Event UUID
        limit: Max results (default: 50, max: 100)
        offset: Pagination offset (default: 0)
        sort: Sort order - "newest", "oldest", "most_faces" (default: newest)
        has_faces: Filter by face presence (optional)
    """
    from sqlalchemy import desc, asc
    
    # Clamp limit
    limit = min(limit, 100)
    
    # Build query
    query = select(Media).where(Media.event_id == event_id)
    
    # Filter by face presence
    if has_faces is not None:
        if has_faces:
            query = query.where(Media.face_count > 0)
        else:
            query = query.where(Media.face_count == 0)
    
    # Sort
    if sort == "oldest":
        query = query.order_by(asc(Media.created_at))
    elif sort == "most_faces":
        query = query.order_by(desc(Media.face_count), desc(Media.created_at))
    else:  # newest (default)
        query = query.order_by(desc(Media.created_at))
    
    # Pagination
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    media_items = result.scalars().all()
    
    return media_items


@router.get("/{media_id}/faces")
async def get_media_faces(
    media_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all faces detected in a specific media item"""
    from app.models.database import DetectedFace, FaceCluster, ClusterMember, User
    from sqlalchemy.orm import selectinload
    
    # Get media
    media_result = await db.execute(
        select(Media).where(Media.media_id == media_id)
    )
    media = media_result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found",
        )
    
    # Get faces with cluster and user information
    faces_query = select(DetectedFace).where(DetectedFace.media_id == media_id)
    faces_result = await db.execute(faces_query)
    faces = faces_result.scalars().all()
    
    # Build response with cluster info
    response_faces = []
    for face in faces:
        # Find cluster for this face
        cluster_member_result = await db.execute(
            select(ClusterMember).where(ClusterMember.face_id == face.face_id)
        )
        cluster_member = cluster_member_result.scalar_one_or_none()
        
        cluster_id = None
        identified_user = None
        
        if cluster_member:
            cluster_id = cluster_member.cluster_id
            
            # Get identified user if any
            cluster_result = await db.execute(
                select(FaceCluster).where(FaceCluster.cluster_id == cluster_id)
            )
            cluster = cluster_result.scalar_one_or_none()
            
            if cluster and cluster.identified_user_id:
                user_result = await db.execute(
                    select(User).where(User.user_id == cluster.identified_user_id)
                )
                user = user_result.scalar_one_or_none()
                if user:
                    identified_user = {
                        "user_id": str(user.user_id),
                        "display_name": user.display_name
                    }
        
        response_faces.append({
            "face_id": str(face.face_id),
            "bbox_x": float(face.bbox_x) if face.bbox_x else None,
            "bbox_y": float(face.bbox_y) if face.bbox_y else None,
            "bbox_width": float(face.bbox_width) if face.bbox_width else None,
            "bbox_height": float(face.bbox_height) if face.bbox_height else None,
            "confidence": float(face.confidence) if face.confidence else None,
            "cluster_id": str(cluster_id) if cluster_id else None,
            "identified_user": identified_user,
        })
    
    return {
        "media_id": str(media.media_id),
        "faces": response_faces,
        "total_faces": len(response_faces)
    }

