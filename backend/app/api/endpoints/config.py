from fastapi import APIRouter, Depends
from ..deps import get_current_user
from app.core.config import settings

router = APIRouter()

@router.get("/maps-key")
def get_maps_api_key(current_user = Depends(get_current_user)):
    """
    Get the Google Maps API key. This endpoint requires authentication
    to prevent unauthorized access to the API key.
    """
    return {"api_key": settings.GOOGLE_MAPS_API_KEY}