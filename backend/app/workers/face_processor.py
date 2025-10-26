"""Background worker for face detection processing"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.database import Media, DetectedFace
from app.services.face_recognition_service import get_face_service
from app.services.azure_blob import download_blob
from app.services.face_clustering import cluster_event_faces
import uuid
import logging

logger = logging.getLogger(__name__)


async def process_media_faces(media_id: uuid.UUID):
    """
    Background task to detect faces in uploaded media
    
    Args:
        media_id: Media UUID to process
    """
    async with async_session_maker() as db:
        try:
            # Get media from database
            result = await db.execute(
                select(Media).where(Media.media_id == media_id)
            )
            media = result.scalar_one_or_none()
            
            if not media:
                print(f"Media {media_id} not found")
                return
            
            # Update status to processing
            media.face_detection_status = "processing"
            await db.commit()
            
            # Download image from Azure Blob Storage
            logger.info(f"Downloading image from blob: {media.blob_url}")
            image_bytes = await download_blob(media.blob_url)
            
            # Detect faces using face_recognition library
            face_service = get_face_service()
            faces = face_service.detect_and_encode_faces(image_bytes)
            
            logger.info(f"Detected {len(faces)} faces in media {media_id}")
            
            # Store detected faces with encodings
            for face_data in faces:
                bbox = face_data['bbox']
                
                detected_face = DetectedFace(
                    media_id=media.media_id,
                    event_id=media.event_id,
                    face_encoding=face_data['face_encoding'],  # Store 128-d vector as JSON
                    bbox_x=bbox['x'],
                    bbox_y=bbox['y'],
                    bbox_width=bbox['width'],
                    bbox_height=bbox['height'],
                    confidence=face_data['confidence'],
                )
                db.add(detected_face)
            
            # Update media
            media.face_count = len(faces)
            media.face_detection_status = "completed"
            await db.commit()
            
            # Trigger clustering for the event
            await cluster_event_faces(db, media.event_id)
            
            print(f"Processed {len(faces)} faces in media {media_id}")
            
        except Exception as e:
            # Update status to failed
            if media:
                media.face_detection_status = "failed"
                await db.commit()
            print(f"Error processing media {media_id}: {str(e)}")

