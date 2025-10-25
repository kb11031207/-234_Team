"""Authentication endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_firebase_uid
from app.models.database import User
from app.schemas.pydantic import UserCreate, UserResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    firebase_uid: str = Depends(get_current_user_firebase_uid),
    db: AsyncSession = Depends(get_db),
):
    """
    Register or login user with Firebase token
    Creates user if doesn't exist, returns existing user otherwise
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_uid)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        return existing_user
    
    # Create new user
    new_user = User(
        firebase_uid=firebase_uid,
        email=user_data.email,
        display_name=user_data.display_name,
        photo_url=user_data.photo_url,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user information"""
    return current_user

