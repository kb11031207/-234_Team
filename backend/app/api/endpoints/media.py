"""Media upload and management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
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
    db: AsyncSession = Depends(get_db),
):
    """Get all media for an event"""
    # TODO: Implement media listing with pagination
    return []

