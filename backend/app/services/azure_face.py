"""Azure Face API service"""

from azure.cognitiveservices.vision.face import FaceClient
from msrest.authentication import CognitiveServicesCredentials
from app.core.config import settings
from typing import List, Dict


def get_face_client() -> FaceClient:
    """Get Azure Face API client"""
    return FaceClient(
        settings.AZURE_FACE_API_ENDPOINT,
        CognitiveServicesCredentials(settings.AZURE_FACE_API_KEY)
    )


async def detect_faces(image_url: str) -> List[Dict]:
    """
    Detect faces in an image using Azure Face API
    
    Args:
        image_url: URL of image to analyze
        
    Returns:
        List of detected faces with bounding boxes and face IDs
    """
    face_client = get_face_client()
    
    # Detect faces
    detected_faces = face_client.face.detect_with_url(
        url=image_url,
        return_face_id=True,
        return_face_landmarks=False,
        return_face_attributes=None,
        recognition_model='recognition_04',
        detection_model='detection_03',
    )
    
    # Format results
    faces = []
    for face in detected_faces:
        rect = face.face_rectangle
        # Note: Azure returns pixel coordinates, we'll need to normalize in the worker
        faces.append({
            'face_id': face.face_id,
            'rectangle': {
                'left': rect.left,
                'top': rect.top,
                'width': rect.width,
                'height': rect.height,
            }
        })
    
    return faces


async def find_similar_faces(
    face_id: str,
    face_ids: List[str],
    max_candidates: int = 50
) -> List[Dict]:
    """
    Find similar faces using Azure Face API
    
    Args:
        face_id: Query face ID
        face_ids: List of face IDs to search against
        max_candidates: Maximum number of results
        
    Returns:
        List of similar faces with similarity scores
    """
    face_client = get_face_client()
    
    # Find similar faces
    similar_faces = face_client.face.find_similar(
        face_id=face_id,
        face_ids=face_ids,
        max_num_of_candidates_returned=max_candidates,
        mode='matchFace',  # or 'matchPerson' for higher confidence
    )
    
    # Format results
    results = []
    for similar_face in similar_faces:
        results.append({
            'face_id': similar_face.face_id,
            'confidence': similar_face.confidence,
        })
    
    return results

