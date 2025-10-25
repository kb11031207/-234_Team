"""Event management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.database import User, Event
from app.schemas.pydantic import EventCreate, EventResponse, AccessCodeValidation
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

