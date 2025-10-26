"""Background worker for face detection processing"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.database import Media, DetectedFace
from app.services.face_recognition_service import get_face_service
from app.services.azure_blob import download_blob
from app.services.face_clustering import cluster_event_faces
from app.services.face_queue import get_face_queue
import uuid
import logging

logger = logging.getLogger(__name__)


async def process_media_faces(media_id: uuid.UUID):
    """
    Background task to detect faces in uploaded media
    
    Strategy:
    1. Detect faces immediately (fast, no rate limits)
    2. Add to clustering queue
    3. Cluster only when batch threshold reached
    
    Args:
        media_id: Media UUID to process
    """
    media = None
    async with async_session_maker() as db:
        try:
            # Get media from database
            result = await db.execute(
                select(Media).where(Media.media_id == media_id)
            )
            media = result.scalar_one_or_none()
            
            if not media:
                logger.error(f"Media {media_id} not found")
                return
            
            # Update status to processing
            media.face_detection_status = "processing"
            await db.commit()
            
            logger.info(f"Processing media {media_id} for event {media.event_id}")
            
            # Download image from Azure Blob Storage
            logger.info(f"Downloading image from blob: {media.blob_url}")
            try:
                image_bytes = await download_blob(media.blob_url)
            except Exception as e:
                logger.error(f"Failed to download image: {str(e)}")
                raise
            
            # Detect faces using face_recognition library (LOCAL - no rate limits!)
            face_service = get_face_service()
            try:
                faces = face_service.detect_and_encode_faces(image_bytes)
            except Exception as e:
                logger.error(f"Face detection failed: {str(e)}")
                raise
            
            logger.info(f"Detected {len(faces)} face(s) in media {media_id}")
            
            # Store detected faces with encodings
            for i, face_data in enumerate(faces):
                bbox = face_data['bbox']
                
                detected_face = DetectedFace(
                    media_id=media.media_id,
                    event_id=media.event_id,
                    face_encoding=face_data['face_encoding'],  # 128-d vector as JSON
                    bbox_x=bbox['x'],
                    bbox_y=bbox['y'],
                    bbox_width=bbox['width'],
                    bbox_height=bbox['height'],
                    confidence=face_data['confidence'],
                )
                db.add(detected_face)
                logger.debug(f"Stored face {i+1}/{len(faces)} with encoding")
            
            # Update media status
            media.face_count = len(faces)
            media.face_detection_status = "completed"
            await db.commit()
            
            logger.info(f"✅ Successfully processed media {media_id}: {len(faces)} faces")
            
            # Add to clustering queue (smart batching)
            if len(faces) > 0:
                queue = get_face_queue()
                await queue.add_media_for_clustering(media.event_id, media.media_id)
                
                # Check if we should cluster now
                if await queue.should_cluster(media.event_id):
                    logger.info(f"🔄 Triggering clustering for event {media.event_id}")
                    try:
                        await cluster_event_faces(db, media.event_id)
                        await queue.mark_clustered(media.event_id)
                        logger.info(f"✅ Clustering completed for event {media.event_id}")
                    except Exception as e:
                        logger.error(f"Clustering failed for event {media.event_id}: {str(e)}")
                        # Don't fail the whole process if clustering fails
                else:
                    logger.info(f"⏳ Queued for batch clustering (not at threshold yet)")
            else:
                logger.info(f"No faces detected, skipping clustering queue")
            
        except Exception as e:
            logger.error(f"❌ Error processing media {media_id}: {str(e)}", exc_info=True)
            
            # Update status to failed
            if media:
                try:
                    media.face_detection_status = "failed"
                    await db.commit()
                except Exception as commit_error:
                    logger.error(f"Failed to update media status: {str(commit_error)}")
            
            # Don't re-raise - this is a background task

