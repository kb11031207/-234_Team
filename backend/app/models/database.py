"""SQLAlchemy models matching DATABASE_SCHEMA.md"""

from sqlalchemy import Column, String, Boolean, Integer, DECIMAL, ForeignKey, Text, BigInteger, CheckConstraint, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class User(Base):
    """User accounts (event creators)"""
    __tablename__ = "users"
    
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255))
    display_name = Column(String(255))
    photo_url = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="uploader")


class Event(Base):
    """Photo sharing events"""
    __tablename__ = "events"
    
    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Event details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    access_code = Column(String(20), unique=True, nullable=False, index=True)
    qr_code_url = Column(Text)
    
    # Privacy settings
    is_public = Column(Boolean, default=False)
    can_add = Column(String(20), default="code_holders")
    
    # Event metadata
    event_date = Column(TIMESTAMP(timezone=True))
    location_text = Column(String(255))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    
    # Media
    cover_photo_url = Column(Text)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("can_add IN ('owner_only', 'code_holders', 'public')", name="check_can_add"),
    )
    
    # Relationships
    owner = relationship("User", back_populates="events")
    media = relationship("Media", back_populates="event", cascade="all, delete-orphan")
    detected_faces = relationship("DetectedFace", back_populates="event", cascade="all, delete-orphan")
    face_clusters = relationship("FaceCluster", back_populates="event", cascade="all, delete-orphan")


class Media(Base):
    """Uploaded photos and videos"""
    __tablename__ = "media"
    
    media_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), index=True)
    
    # Storage
    blob_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text)
    filename = Column(String(255))
    content_type = Column(String(100))
    file_size = Column(BigInteger)
    
    # Dimensions
    width = Column(Integer)
    height = Column(Integer)
    
    # Type
    media_type = Column(String(20), default="photo")
    
    # Face detection status
    face_detection_status = Column(String(20), default="pending", index=True)
    face_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("media_type IN ('photo', 'video')", name="check_media_type"),
        CheckConstraint(
            "face_detection_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')",
            name="check_face_detection_status"
        ),
    )
    
    # Relationships
    event = relationship("Event", back_populates="media")
    uploader = relationship("User", back_populates="media")
    detected_faces = relationship("DetectedFace", back_populates="media", cascade="all, delete-orphan")


class DetectedFace(Base):
    """Individual faces detected by Azure Face API"""
    __tablename__ = "detected_faces"
    
    face_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media.media_id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Azure Face API data
    azure_face_id = Column(String(255), index=True)
    
    # Bounding box (normalized 0-1)
    bbox_x = Column(DECIMAL(5, 4))
    bbox_y = Column(DECIMAL(5, 4))
    bbox_width = Column(DECIMAL(5, 4))
    bbox_height = Column(DECIMAL(5, 4))
    
    # Detection confidence
    confidence = Column(DECIMAL(5, 4))
    
    # Timestamp
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("bbox_x >= 0 AND bbox_x <= 1", name="check_bbox_x"),
        CheckConstraint("bbox_y >= 0 AND bbox_y <= 1", name="check_bbox_y"),
        CheckConstraint("bbox_width >= 0 AND bbox_width <= 1", name="check_bbox_width"),
        CheckConstraint("bbox_height >= 0 AND bbox_height <= 1", name="check_bbox_height"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="check_confidence"),
    )
    
    # Relationships
    media = relationship("Media", back_populates="detected_faces")
    event = relationship("Event", back_populates="detected_faces")
    cluster_memberships = relationship("ClusterMember", back_populates="face", cascade="all, delete-orphan")


class FaceCluster(Base):
    """Groups of similar faces (same person) within an event"""
    __tablename__ = "face_clusters"
    
    cluster_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.event_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Representative face
    representative_face_id = Column(UUID(as_uuid=True), ForeignKey("detected_faces.face_id", ondelete="SET NULL"), index=True)
    face_count = Column(Integer, default=0)
    
    # User identification
    identified_user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), index=True)
    identified_at = Column(TIMESTAMP(timezone=True))
    
    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    event = relationship("Event", back_populates="face_clusters")
    representative_face = relationship("DetectedFace", foreign_keys=[representative_face_id])
    identified_user = relationship("User", foreign_keys=[identified_user_id])
    members = relationship("ClusterMember", back_populates="cluster", cascade="all, delete-orphan")


class ClusterMember(Base):
    """Many-to-many relationship linking faces to clusters"""
    __tablename__ = "cluster_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("face_clusters.cluster_id", ondelete="CASCADE"), nullable=False, index=True)
    face_id = Column(UUID(as_uuid=True), ForeignKey("detected_faces.face_id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Similarity score from Azure Find Similar
    similarity_score = Column(DECIMAL(5, 4))
    
    # Timestamp
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Constraints
    __table_args__ = (
        CheckConstraint("similarity_score >= 0 AND similarity_score <= 1", name="check_similarity_score"),
    )
    
    # Relationships
    cluster = relationship("FaceCluster", back_populates="members")
    face = relationship("DetectedFace", back_populates="cluster_memberships")

