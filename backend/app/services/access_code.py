"""Access code generation service"""

import random
import string
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.database import Event


async def generate_unique_access_code(db: AsyncSession, length: int = 8) -> str:
    """
    Generate a unique access code for an event
    
    Args:
        db: Database session
        length: Length of access code (default 8)
        
    Returns:
        Unique access code
    """
    while True:
        # Generate random code (uppercase letters and digits)
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
        
        # Check if code already exists
        result = await db.execute(
            select(Event).where(Event.access_code == code)
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            return code

