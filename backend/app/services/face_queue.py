"""Smart queue system for batch face processing"""

import asyncio
from collections import defaultdict
from typing import Dict, Set
import uuid
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class FaceProcessingQueue:
    """
    Manages face detection queue and batched clustering
    
    Strategy:
    - Process face detection immediately (fast, no rate limits)
    - Queue clustering requests by event
    - Batch cluster when: 
      1. 10+ new photos added to event, OR
      2. 5 minutes since last cluster, OR
      3. Manual trigger
    """
    
    def __init__(self):
        # Track events that need clustering: event_id -> set of new media_ids
        self.pending_clusters: Dict[uuid.UUID, Set[uuid.UUID]] = defaultdict(set)
        
        # Track last cluster time per event
        self.last_cluster_time: Dict[uuid.UUID, datetime] = {}
        
        # Thresholds
        self.BATCH_SIZE_THRESHOLD = 10  # Cluster after 10 new photos
        self.TIME_THRESHOLD = timedelta(minutes=5)  # Or after 5 minutes
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
        
        logger.info("FaceProcessingQueue initialized")
    
    async def add_media_for_clustering(self, event_id: uuid.UUID, media_id: uuid.UUID):
        """
        Add a media item to the clustering queue
        
        Args:
            event_id: Event UUID
            media_id: Media UUID that was just processed
        """
        async with self._lock:
            self.pending_clusters[event_id].add(media_id)
            pending_count = len(self.pending_clusters[event_id])
            
            logger.info(f"Added media {media_id} to clustering queue for event {event_id}. Pending: {pending_count}")
    
    async def should_cluster(self, event_id: uuid.UUID) -> bool:
        """
        Check if an event should be clustered now
        
        Returns:
            True if clustering should run
        """
        async with self._lock:
            pending_count = len(self.pending_clusters.get(event_id, set()))
            
            # No pending items
            if pending_count == 0:
                return False
            
            # Threshold 1: Enough new photos
            if pending_count >= self.BATCH_SIZE_THRESHOLD:
                logger.info(f"Event {event_id} reached batch threshold: {pending_count} photos")
                return True
            
            # Threshold 2: Enough time has passed
            last_cluster = self.last_cluster_time.get(event_id)
            if last_cluster:
                time_since_last = datetime.now() - last_cluster
                if time_since_last >= self.TIME_THRESHOLD:
                    logger.info(f"Event {event_id} reached time threshold: {time_since_last}")
                    return True
            else:
                # Never clustered before and has pending items
                if pending_count > 0:
                    logger.info(f"Event {event_id} has {pending_count} pending photos and never clustered")
                    return True
            
            return False
    
    async def mark_clustered(self, event_id: uuid.UUID):
        """Mark an event as clustered and clear its queue"""
        async with self._lock:
            if event_id in self.pending_clusters:
                count = len(self.pending_clusters[event_id])
                self.pending_clusters[event_id].clear()
                self.last_cluster_time[event_id] = datetime.now()
                logger.info(f"Cleared {count} pending items for event {event_id}")
    
    async def get_pending_events(self) -> list[uuid.UUID]:
        """Get list of events that need clustering"""
        async with self._lock:
            return [
                event_id 
                for event_id in self.pending_clusters.keys() 
                if await self.should_cluster(event_id)
            ]
    
    async def force_cluster(self, event_id: uuid.UUID):
        """Force clustering for an event (manual trigger)"""
        async with self._lock:
            if event_id in self.pending_clusters:
                logger.info(f"Force clustering requested for event {event_id}")
                # Just return True, the caller will handle clustering
                return True
            return False


# Global queue instance
_queue_instance: FaceProcessingQueue | None = None


def get_face_queue() -> FaceProcessingQueue:
    """Get or create the global face processing queue"""
    global _queue_instance
    if _queue_instance is None:
        _queue_instance = FaceProcessingQueue()
    return _queue_instance

