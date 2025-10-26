"""Shared test fixtures and configuration"""

# ============================================================================
# Mock face_recognition and dependencies BEFORE any app imports
# This prevents ImportError for dlib/face_recognition during testing
# ============================================================================
import sys
from unittest.mock import MagicMock

# Mock face_recognition and its dependencies
sys.modules['face_recognition'] = MagicMock()
sys.modules['cv2'] = MagicMock()
sys.modules['sklearn'] = MagicMock()
sys.modules['sklearn.cluster'] = MagicMock()
sys.modules['dlib'] = MagicMock()

# Now we can safely import everything else
import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.database import User, Event, Media
from app.api.deps import get_current_user
import uuid


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_db():
    """Create shared SQLite database for testing (file-based so sync and async can share)"""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker, Session
    import tempfile
    import os
    
    # Create a temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(db_fd)
    
    db_url = f"sqlite:///{db_path}"
    db_url_async = f"sqlite+aiosqlite:///{db_path}"
    
    # Create sync engine for test data setup
    sync_engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
    
    # Create async engine for API calls  
    async_engine = create_async_engine(
        db_url_async,
        connect_args={"check_same_thread": False},
    )
    
    # Create tables
    Base.metadata.create_all(bind=sync_engine)
    
    # Create session makers
    SyncSessionLocal = sessionmaker(bind=sync_engine, class_=Session)
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)
    
    yield {"sync": SyncSessionLocal, "async": AsyncSessionLocal}
    
    # Cleanup
    sync_engine.dispose()
    import asyncio
    asyncio.run(async_engine.dispose())
    os.unlink(db_path)


@pytest.fixture
def db_session(test_db):
    """Get a sync database session for test data setup"""
    session = test_db["sync"]()
    try:
        yield session
    finally:
        session.close()


# ============================================================================
# FastAPI Client Fixtures
# ============================================================================

@pytest.fixture
def client(test_db):
    """Create test client with mocked database"""
    
    async def override_get_db():
        async with test_db["async"]() as session:
            yield session
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def authenticated_client(client, test_user):
    """Create test client with authenticated user"""
    
    def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    yield client
    
    app.dependency_overrides.clear()


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        firebase_uid="test_firebase_uid_123",
        email="test@example.com",
        display_name="Test User",
        photo_url="https://example.com/photo.jpg"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_event(db_session, test_user):
    """Create a test event"""
    event = Event(
        owner_id=test_user.user_id,
        title="Test Event",
        description="A test event",
        access_code="TEST123",
        is_public=True,
        can_add="code_holders",
        location_text="Test Location",
        latitude=40.7128,
        longitude=-74.0060
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


@pytest.fixture
def private_event(db_session, test_user):
    """Create a private test event"""
    event = Event(
        owner_id=test_user.user_id,
        title="Private Event",
        description="A private event",
        access_code="PRIVATE456",
        is_public=False,
        can_add="code_holders"
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


@pytest.fixture
def test_media(db_session, test_event):
    """Create test media items"""
    media_items = []
    for i in range(3):
        media = Media(
            event_id=test_event.event_id,
            blob_url=f"https://storage.example.com/photo{i}.jpg",
            thumbnail_url=f"https://storage.example.com/thumb{i}.jpg",
            filename=f"photo{i}.jpg",
            content_type="image/jpeg",
            file_size=1024 * 1024,
            width=1920,
            height=1080,
            media_type="photo",
            face_detection_status="completed",
            face_count=2 + i
        )
        db_session.add(media)
        media_items.append(media)
    
    db_session.commit()
    for m in media_items:
        db_session.refresh(m)
    
    return media_items


# ============================================================================
# Mock Fixtures
# ============================================================================

@pytest.fixture
def mock_azure_blob(monkeypatch):
    """Mock Azure Blob Storage"""
    async def mock_generate_presigned_upload_url(filename, content_type):
        return (
            f"https://storage.example.com/upload?token=mock_token",
            f"https://storage.example.com/{filename}"
        )
    
    monkeypatch.setattr(
        "app.services.azure_blob.generate_presigned_upload_url",
        mock_generate_presigned_upload_url
    )


@pytest.fixture
def mock_face_detection(monkeypatch):
    """Mock face detection service"""
    def mock_detect_faces(image_bytes):
        return [
            {
                'face_encoding': [0.1] * 128,
                'bbox': {'x': 0.25, 'y': 0.3, 'width': 0.15, 'height': 0.2},
                'confidence': 0.98
            }
        ]
    
    monkeypatch.setattr(
        "app.services.face_recognition_service.FaceRecognitionService.detect_and_encode_faces",
        mock_detect_faces
    )

