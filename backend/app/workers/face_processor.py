"""Background worker for face detection processing"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.database import Media, DetectedFace
from app.services.azure_face import detect_faces
from app.services.face_clustering import cluster_event_faces
import uuid


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
            
            # Detect faces using Azure Face API
            faces = await detect_faces(media.blob_url)
            
            # Store detected faces
            for face_data in faces:
                # Normalize bounding box coordinates (Azure returns pixels)
                rect = face_data['rectangle']
                
                if media.width and media.height:
                    bbox_x = rect['left'] / media.width
                    bbox_y = rect['top'] / media.height
                    bbox_width = rect['width'] / media.width
                    bbox_height = rect['height'] / media.height
                else:
                    # If dimensions not available, skip normalization
                    bbox_x = rect['left']
                    bbox_y = rect['top']
                    bbox_width = rect['width']
                    bbox_height = rect['height']
                
                detected_face = DetectedFace(
                    media_id=media.media_id,
                    event_id=media.event_id,
                    azure_face_id=face_data['face_id'],
                    bbox_x=bbox_x,
                    bbox_y=bbox_y,
                    bbox_width=bbox_width,
                    bbox_height=bbox_height,
                    confidence=1.0,  # Azure doesn't return confidence for detection
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

