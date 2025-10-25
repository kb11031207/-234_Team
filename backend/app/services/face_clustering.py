"""Face clustering service"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict
from app.models.database import DetectedFace, FaceCluster, ClusterMember
from app.services.azure_face import find_similar_faces
import uuid


async def cluster_event_faces(db: AsyncSession, event_id: uuid.UUID, similarity_threshold: float = 0.7):
    """
    Cluster similar faces within an event
    
    Args:
        db: Database session
        event_id: Event UUID
        similarity_threshold: Minimum similarity score (0-1)
    """
    # Get all detected faces for the event
    result = await db.execute(
        select(DetectedFace).where(DetectedFace.event_id == event_id)
    )
    faces = result.scalars().all()
    
    if not faces:
        return
    
    # Track which faces have been clustered
    unclustered_faces = list(faces)
    
    while unclustered_faces:
        # Take first unclustered face as cluster representative
        representative_face = unclustered_faces.pop(0)
        
        # Create new cluster
        cluster = FaceCluster(
            event_id=event_id,
            representative_face_id=representative_face.face_id,
            face_count=1,
        )
        db.add(cluster)
        await db.flush()
        
        # Add representative to cluster
        member = ClusterMember(
            cluster_id=cluster.cluster_id,
            face_id=representative_face.face_id,
            similarity_score=1.0,
        )
        db.add(member)
        
        # Find similar faces
        face_ids = [f.azure_face_id for f in unclustered_faces if f.azure_face_id]
        
        if face_ids:
            similar_faces = await find_similar_faces(
                face_id=representative_face.azure_face_id,
                face_ids=face_ids,
            )
            
            # Add similar faces to cluster
            for similar in similar_faces:
                if similar['confidence'] >= similarity_threshold:
                    # Find the face object
                    matching_face = next(
                        (f for f in unclustered_faces if f.azure_face_id == similar['face_id']),
                        None
                    )
                    
                    if matching_face:
                        # Add to cluster
                        member = ClusterMember(
                            cluster_id=cluster.cluster_id,
                            face_id=matching_face.face_id,
                            similarity_score=similar['confidence'],
                        )
                        db.add(member)
                        
                        # Remove from unclustered
                        unclustered_faces.remove(matching_face)
                        
                        # Update cluster face count
                        cluster.face_count += 1
        
        await db.commit()

