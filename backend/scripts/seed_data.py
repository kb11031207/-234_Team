"""Seed database with test data"""

import asyncio
from app.core.database import async_session_maker
from app.models.database import User, Event


async def seed_data():
    """Create test data for development"""
    async with async_session_maker() as db:
        # Create test user
        test_user = User(
            firebase_uid="test_firebase_uid_123",
            email="test@example.com",
            display_name="Test User",
            photo_url="https://via.placeholder.com/150",
        )
        db.add(test_user)
        await db.flush()
        
        # Create test event
        test_event = Event(
            owner_id=test_user.user_id,
            title="Test Wedding Event",
            description="A beautiful wedding celebration",
            access_code="TEST123",
            is_public=True,
            can_add="code_holders",
            location_text="Central Park, NYC",
            latitude=40.785091,
            longitude=-73.968285,
        )
        db.add(test_event)
        
        await db.commit()
        
        print("✅ Test data created successfully!")
        print(f"   User: {test_user.email}")
        print(f"   Event: {test_event.title} (Code: {test_event.access_code})")


if __name__ == "__main__":
    asyncio.run(seed_data())

