"""Event management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.database import User, Event
from app.schemas.pydantic import EventCreate, EventResponse, AccessCodeValidation, PublicEventResponse, EventStatsResponse
from app.api.deps import get_current_user
from app.services.access_code import generate_unique_access_code

router = APIRouter()


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new event"""
    # Generate unique access code
    access_code = await generate_unique_access_code(db)
    
    # Create event
    new_event = Event(
        owner_id=current_user.user_id,
        title=event_data.title,
        description=event_data.description,
        access_code=access_code,
        is_public=event_data.is_public,
        can_add=event_data.can_add,
        event_date=event_data.event_date,
        location_text=event_data.location_text,
        latitude=event_data.latitude,
        longitude=event_data.longitude,
    )
    
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    # TODO: Generate QR code asynchronously
    
    return new_event


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get event details (public or with valid access code)"""
    result = await db.execute(
        select(Event).where(Event.event_id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    return event


@router.post("/validate-access")
async def validate_access_code(
    validation: AccessCodeValidation,
    db: AsyncSession = Depends(get_db),
):
    """Validate access code and return event info"""
    result = await db.execute(
        select(Event).where(Event.access_code == validation.access_code)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid access code",
        )
    
    return {
        "event_id": event.event_id,
        "title": event.title,
        "has_access": True,
        "can_upload": True,  # TODO: Check can_add permissions
    }


@router.get("/me/events", response_model=List[EventResponse])
async def get_my_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all events owned by current user"""
    result = await db.execute(
        select(Event).where(Event.owner_id == current_user.user_id)
    )
    events = result.scalars().all()
    
    return events


@router.get("/public", response_model=List[PublicEventResponse])
async def get_public_events(
    latitude: float = None,
    longitude: float = None,
    radius: float = 50.0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    Get public events (for home page map)
    
    Args:
        latitude: User's latitude (optional, for nearby events)
        longitude: User's longitude (optional)
        radius: Search radius in km (default: 50)
        limit: Max results (default: 50)
    """
    from sqlalchemy import func
    from app.models.database import Media
    
    # Base query for public events
    query = select(
        Event,
        func.count(Media.media_id).label('media_count')
    ).outerjoin(
        Media, Event.event_id == Media.event_id
    ).where(
        Event.is_public == True
    ).group_by(Event.event_id)
    
    # TODO: Add distance-based filtering if lat/lon provided
    # This requires PostGIS or distance calculation
    
    query = query.limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Build response
    events = []
    for row in rows:
        event = row[0]
        media_count = row[1]
        events.append(PublicEventResponse(
            event_id=event.event_id,
            title=event.title,
            location_text=event.location_text,
            latitude=event.latitude,
            longitude=event.longitude,
            event_date=event.event_date,
            cover_photo_url=event.cover_photo_url,
            media_count=media_count,
            created_at=event.created_at,
        ))
    
    return events


@router.get("/{event_id}/stats", response_model=EventStatsResponse)
async def get_event_statistics(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get event statistics"""
    from sqlalchemy import func, case
    from app.models.database import Media, DetectedFace, FaceCluster
    
    # Get event
    event_result = await db.execute(
        select(Event).where(Event.event_id == event_id)
    )
    event = event_result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # Get media statistics
    media_stats = await db.execute(
        select(
            func.count(Media.media_id).label('total_media'),
            func.sum(case((Media.media_type == 'photo', 1), else_=0)).label('total_photos'),
            func.sum(case((Media.media_type == 'video', 1), else_=0)).label('total_videos'),
            func.sum(case((Media.face_detection_status == 'completed', 1), else_=0)).label('completed'),
            func.sum(case((Media.face_detection_status == 'processing', 1), else_=0)).label('processing'),
            func.sum(case((Media.face_detection_status == 'pending', 1), else_=0)).label('pending'),
            func.sum(case((Media.face_detection_status == 'failed', 1), else_=0)).label('failed'),
        ).where(Media.event_id == event_id)
    )
    media_row = media_stats.first()
    
    # Get face statistics
    face_stats = await db.execute(
        select(
            func.count(DetectedFace.face_id).label('total_faces')
        ).where(DetectedFace.event_id == event_id)
    )
    total_faces = face_stats.scalar() or 0
    
    # Get cluster statistics
    cluster_stats = await db.execute(
        select(
            func.count(FaceCluster.cluster_id).label('total_clusters'),
            func.count(FaceCluster.identified_user_id).label('identified_people')
        ).where(FaceCluster.event_id == event_id)
    )
    cluster_row = cluster_stats.first()
    
    return EventStatsResponse(
        event_id=event.event_id,
        title=event.title,
        total_media=media_row[0] or 0,
        total_photos=int(media_row[1] or 0),
        total_videos=int(media_row[2] or 0),
        total_faces_detected=total_faces,
        total_people_clusters=cluster_row[0] or 0,
        identified_people=cluster_row[1] or 0,
        processing_status={
            "completed": int(media_row[3] or 0),
            "processing": int(media_row[4] or 0),
            "pending": int(media_row[5] or 0),
            "failed": int(media_row[6] or 0),
        }
    )

