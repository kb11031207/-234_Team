"""API dependencies - database sessions, auth, etc."""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user_firebase_uid
from app.models.database import User, Event


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    firebase_uid: str = Depends(get_current_user_firebase_uid),
) -> User:
    """
    Get current authenticated user from database
    
    Args:
        db: Database session
        firebase_uid: Firebase UID from token
        
    Returns:
        User model instance
        
    Raises:
        HTTPException: If user not found
    """
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first.",
        )
    
    return user


async def verify_access_code(
    event_id: str,
    x_access_code: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Event:
    """
    Verify access code for an event
    
    Args:
        event_id: Event UUID
        x_access_code: Access code from header
        db: Database session
        
    Returns:
        Event model instance
        
    Raises:
        HTTPException: If event not found or access code invalid
    """
    result = await db.execute(
        select(Event).where(Event.event_id == event_id)
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )
    
    # Public events don't need access code
    if event.is_public:
        return event
    
    # Private events require access code
    if not x_access_code or x_access_code != event.access_code:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing access code",
        )
    
    return event

