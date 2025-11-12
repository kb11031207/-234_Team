"""Pydantic schemas for API request/response validation"""

from pydantic import BaseModel, EmailStr, Field, UUID4
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============================================================================
# User Schemas
# ============================================================================

class UserCreate(BaseModel):
    """Schema for user registration"""
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    display_name: Optional[str] = Field(None, max_length=255)
    photo_url: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    user_id: UUID4
    firebase_uid: str
    email: Optional[str]
    display_name: Optional[str]
    photo_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Event Schemas
# ============================================================================

class EventCreate(BaseModel):
    """Schema for creating an event"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False
    can_add: str = Field(default="code_holders", pattern="^(owner_only|code_holders|public)$")
    event_date: Optional[datetime] = None
    location_text: Optional[str] = Field(None, max_length=255)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)


class EventUpdate(BaseModel):
    """Schema for updating an event (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None
    can_add: Optional[str] = Field(None, pattern="^(owner_only|code_holders|public)$")
    event_date: Optional[datetime] = None
    location_text: Optional[str] = Field(None, max_length=255)
    latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(None, ge=-180, le=180)


class EventResponse(BaseModel):
    """Schema for event response"""
    event_id: UUID4
    owner_id: UUID4
    title: str
    description: Optional[str]
    access_code: str
    qr_code_url: Optional[str]
    is_public: bool
    can_add: str
    event_date: Optional[datetime]
    location_text: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    cover_photo_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AccessCodeValidation(BaseModel):
    """Schema for validating access code"""
    access_code: str = Field(..., min_length=1, max_length=20)


# ============================================================================
# Media Schemas
# ============================================================================

class MediaUploadRequest(BaseModel):
    """Schema for requesting upload URL"""
    event_id: UUID4
    filename: str
    content_type: str
    file_size: int
    uploader_id: Optional[UUID4] = None


class PresignedUploadResponse(BaseModel):
    """Schema for presigned upload URL response"""
    upload_url: str
    media_id: UUID4
    blob_url: str


class MediaResponse(BaseModel):
    """Schema for media response"""
    media_id: UUID4
    event_id: UUID4
    uploader_id: Optional[UUID4]
    blob_url: str
    thumbnail_url: Optional[str]
    filename: Optional[str]
    content_type: Optional[str]
    file_size: Optional[int]
    width: Optional[int]
    height: Optional[int]
    media_type: str
    face_detection_status: str
    face_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Face Schemas
# ============================================================================

class FaceResponse(BaseModel):
    """Schema for detected face response"""
    face_id: UUID4
    media_id: UUID4
    bbox_x: Optional[Decimal]
    bbox_y: Optional[Decimal]
    bbox_width: Optional[Decimal]
    bbox_height: Optional[Decimal]
    confidence: Optional[Decimal]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClusterResponse(BaseModel):
    """Schema for face cluster response"""
    cluster_id: UUID4
    event_id: UUID4
    representative_face_id: Optional[UUID4]
    face_count: int
    identified_user_id: Optional[UUID4]
    identified_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class FaceSearchRequest(BaseModel):
    """Schema for face search request"""
    event_id: UUID4
    selfie_url: str  # Or base64 encoded image


class FaceSearchResponse(BaseModel):
    """Schema for face search results"""
    matches: List[MediaResponse]
    total: int


# ============================================================================
# Common Schemas
# ============================================================================

class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str
    code: Optional[str] = None


class PaginationParams(BaseModel):
    """Schema for pagination parameters"""
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class PaginationResponse(BaseModel):
    """Schema for pagination info in responses"""
    total: int
    limit: int
    offset: int
    has_more: bool


# ============================================================================
# Extended Response Schemas for API
# ============================================================================

class EventLocation(BaseModel):
    """Schema for event location"""
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    location_text: Optional[str]


class PublicEventResponse(BaseModel):
    """Schema for public event listing (map markers)"""
    event_id: UUID4
    title: str
    location_text: Optional[str]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    event_date: Optional[datetime]
    cover_photo_url: Optional[str]
    media_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventStatsResponse(BaseModel):
    """Schema for event statistics"""
    event_id: UUID4
    title: str
    total_media: int
    total_photos: int
    total_videos: int
    total_faces_detected: int
    total_people_clusters: int
    identified_people: int
    processing_status: dict
    

class MediaWithFacesResponse(MediaResponse):
    """Schema for media with face information"""
    faces: List["FaceResponse"] = []


class ClusterWithRepresentative(ClusterResponse):
    """Schema for cluster with representative face details"""
    representative_face: Optional["FaceResponse"] = None
    representative_media_url: Optional[str] = None
    identified_user: Optional["UserResponse"] = None

