"""User profile endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.database import User
from app.schemas.pydantic import UserResponse, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile"""
    # Update fields if provided
    if user_data.display_name is not None:
        current_user.display_name = user_data.display_name
    
    if user_data.photo_url is not None:
        current_user.photo_url = user_data.photo_url
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

