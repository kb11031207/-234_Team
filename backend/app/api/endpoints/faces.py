"""Face detection and search endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.pydantic import FaceSearchRequest, FaceSearchResponse

router = APIRouter()


@router.post("/search", response_model=FaceSearchResponse)
async def search_faces(
    search_request: FaceSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Search for similar faces in an event"""
    # TODO: Implement face search
    return {
        "matches": [],
        "total": 0,
    }


@router.get("/events/{event_id}/clusters")
async def get_event_clusters(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all face clusters (groups of people) in an event"""
    # TODO: Implement cluster listing
    return {"clusters": []}

