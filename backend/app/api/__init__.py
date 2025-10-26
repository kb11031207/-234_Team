"""API endpoints"""

from fastapi import APIRouter
from .endpoints import auth, events, faces, media, config

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(faces.router, prefix="/faces", tags=["faces"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(config.router, prefix="/config", tags=["config"])
