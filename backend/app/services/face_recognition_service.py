"""Face recognition service using open-source face_recognition library"""

import face_recognition
import numpy as np
from PIL import Image
import io
from typing import List, Tuple, Optional, Dict
import logging

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    """Service for detecting faces and generating encodings using face_recognition library"""
    
    def __init__(self, model: str = "large", tolerance: float = 0.6):
        """
        Initialize face recognition service
        
        Args:
            model: "large" (more accurate) or "small" (faster)
            tolerance: How much distance between faces to consider a match (lower = more strict)
        """
        self.model = model
        self.tolerance = tolerance
        logger.info(f"FaceRecognitionService initialized with model={model}, tolerance={tolerance}")
    
    def detect_and_encode_faces(self, image_bytes: bytes) -> List[Dict]:
        """
        Detect faces in an image and generate encodings
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            List of dictionaries containing:
            - face_encoding: 128-d vector as list
            - bbox: (top, right, bottom, left) in pixels
            - confidence: always 1.0 for face_recognition library
        """
        try:
            # Load image from bytes
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL Image to numpy array
            image_array = np.array(image)
            
            # Get image dimensions
            height, width = image_array.shape[:2]
            
            # Detect face locations
            face_locations = face_recognition.face_locations(
                image_array,
                model="cnn" if self.model == "large" else "hog"
            )
            
            if not face_locations:
                logger.info("No faces detected in image")
                return []
            
            # Generate face encodings
            face_encodings = face_recognition.face_encodings(
                image_array,
                known_face_locations=face_locations,
                model=self.model
            )
            
            # Prepare results
            results = []
            for location, encoding in zip(face_locations, face_encodings):
                top, right, bottom, left = location
                
                # Normalize bounding box to 0-1 range
                bbox_x = left / width
                bbox_y = top / height
                bbox_width = (right - left) / width
                bbox_height = (bottom - top) / height
                
                results.append({
                    'face_encoding': encoding.tolist(),  # Convert numpy array to list for JSON
                    'bbox': {
                        'x': float(bbox_x),
                        'y': float(bbox_y),
                        'width': float(bbox_width),
                        'height': float(bbox_height)
                    },
                    'bbox_pixels': {
                        'top': top,
                        'right': right,
                        'bottom': bottom,
                        'left': left
                    },
                    'confidence': 1.0  # face_recognition doesn't provide confidence scores
                })
            
            logger.info(f"Detected {len(results)} face(s) in image")
            return results
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            raise
    
    def compare_faces(
        self,
        known_encoding: List[float],
        candidate_encoding: List[float]
    ) -> Tuple[bool, float]:
        """
        Compare two face encodings
        
        Args:
            known_encoding: 128-d vector of known face
            candidate_encoding: 128-d vector of candidate face
            
        Returns:
            Tuple of (is_match, distance)
            - is_match: True if faces match within tolerance
            - distance: Euclidean distance between encodings (lower = more similar)
        """
        try:
            # Convert lists back to numpy arrays
            known = np.array(known_encoding)
            candidate = np.array(candidate_encoding)
            
            # Calculate face distance (Euclidean distance)
            distance = face_recognition.face_distance([known], candidate)[0]
            
            # Check if match within tolerance
            is_match = distance <= self.tolerance
            
            return is_match, float(distance)
            
        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            raise
    
    def find_best_match(
        self,
        candidate_encoding: List[float],
        known_encodings: List[Tuple[str, List[float]]]
    ) -> Optional[Tuple[str, float]]:
        """
        Find the best matching face from a list of known faces
        
        Args:
            candidate_encoding: 128-d vector of face to match
            known_encodings: List of (face_id, encoding) tuples
            
        Returns:
            Tuple of (best_match_face_id, distance) or None if no match within tolerance
        """
        if not known_encodings:
            return None
        
        try:
            candidate = np.array(candidate_encoding)
            
            best_match_id = None
            best_distance = float('inf')
            
            for face_id, encoding in known_encodings:
                known = np.array(encoding)
                distance = face_recognition.face_distance([known], candidate)[0]
                
                if distance < best_distance:
                    best_distance = distance
                    best_match_id = face_id
            
            # Only return match if within tolerance
            if best_distance <= self.tolerance:
                logger.info(f"Found match: face_id={best_match_id}, distance={best_distance:.4f}")
                return best_match_id, float(best_distance)
            else:
                logger.info(f"No match found within tolerance. Best distance: {best_distance:.4f}")
                return None
                
        except Exception as e:
            logger.error(f"Error finding best match: {str(e)}")
            raise
    
    def cluster_faces(
        self,
        face_encodings: List[Tuple[str, List[float]]],
        tolerance: Optional[float] = None
    ) -> List[List[str]]:
        """
        Cluster faces by similarity using Chinese Whispers algorithm
        
        Args:
            face_encodings: List of (face_id, encoding) tuples
            tolerance: Optional custom tolerance for this clustering operation
            
        Returns:
            List of clusters, where each cluster is a list of face_ids
        """
        if not face_encodings:
            return []
        
        try:
            # Extract just the encodings
            encodings = [np.array(enc) for _, enc in face_encodings]
            face_ids = [face_id for face_id, _ in face_encodings]
            
            # Use face_recognition's built-in clustering (Chinese Whispers)
            # This is more sophisticated than simple distance-based clustering
            from sklearn.cluster import DBSCAN
            
            # Calculate pairwise distances
            distances = []
            for i, enc1 in enumerate(encodings):
                for j, enc2 in enumerate(encodings):
                    if i < j:
                        dist = face_recognition.face_distance([enc1], enc2)[0]
                        distances.append(dist)
            
            # Use DBSCAN clustering
            tol = tolerance if tolerance is not None else self.tolerance
            clustering = DBSCAN(
                eps=tol,
                min_samples=1,
                metric='precomputed'
            )
            
            # Create distance matrix
            n = len(encodings)
            distance_matrix = np.zeros((n, n))
            idx = 0
            for i in range(n):
                for j in range(i + 1, n):
                    distance_matrix[i][j] = distances[idx]
                    distance_matrix[j][i] = distances[idx]
                    idx += 1
            
            # Fit clustering
            labels = clustering.fit_predict(distance_matrix)
            
            # Group face_ids by cluster label
            clusters = {}
            for face_id, label in zip(face_ids, labels):
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(face_id)
            
            # Convert to list of clusters
            result = list(clusters.values())
            
            logger.info(f"Clustered {len(face_encodings)} faces into {len(result)} clusters")
            return result
            
        except Exception as e:
            logger.error(f"Error clustering faces: {str(e)}")
            # Fallback: treat each face as its own cluster
            return [[face_id] for face_id, _ in face_encodings]


# Global service instance
_face_service: Optional[FaceRecognitionService] = None


def get_face_service() -> FaceRecognitionService:
    """Get or create the global face recognition service instance"""
    global _face_service
    if _face_service is None:
        from app.core.config import settings
        _face_service = FaceRecognitionService(
            model=getattr(settings, 'FACE_RECOGNITION_MODEL', 'large'),
            tolerance=getattr(settings, 'FACE_RECOGNITION_TOLERANCE', 0.6)
        )
    return _face_service

