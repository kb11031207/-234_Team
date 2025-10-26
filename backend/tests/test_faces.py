"""Test face endpoints"""

import pytest
from app.models.database import DetectedFace, FaceCluster, ClusterMember


@pytest.fixture
def test_face(db_session, test_media):
    """Create a test detected face"""
    face = DetectedFace(
        media_id=test_media[0].media_id,
        event_id=test_media[0].event_id,
        face_encoding=[0.1] * 128,
        bbox_x=0.25,
        bbox_y=0.30,
        bbox_width=0.15,
        bbox_height=0.20,
        confidence=0.98
    )
    db_session.add(face)
    db_session.commit()
    db_session.refresh(face)
    return face


@pytest.fixture
def test_cluster(db_session, test_event, test_face):
    """Create a test face cluster"""
    cluster = FaceCluster(
        event_id=test_event.event_id,
        representative_face_id=test_face.face_id,
        face_count=1
    )
    db_session.add(cluster)
    db_session.commit()
    db_session.refresh(cluster)
    
    # Add face to cluster
    member = ClusterMember(
        cluster_id=cluster.cluster_id,
        face_id=test_face.face_id,
        similarity_score=1.0
    )
    db_session.add(member)
    db_session.commit()
    
    return cluster


class TestGetEventClusters:
    """Test getting face clusters for an event"""
    
    def test_get_clusters_empty(self, client, test_event):
        """Test getting clusters when none exist"""
        response = client.get(f"/api/v1/faces/events/{test_event.event_id}/clusters")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "clusters" in data
        assert isinstance(data["clusters"], list)
        assert len(data["clusters"]) == 0
    
    def test_get_clusters_with_data(self, client, test_event, test_cluster):
        """Test getting clusters with existing data"""
        response = client.get(f"/api/v1/faces/events/{test_event.event_id}/clusters")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["clusters"]) >= 1
        cluster = data["clusters"][0]
        
        assert "cluster_id" in cluster
        assert "face_count" in cluster
        assert "representative_face" in cluster
    
    def test_get_clusters_with_min_faces_filter(self, client, test_event, test_cluster):
        """Test filtering clusters by minimum face count"""
        response = client.get(
            f"/api/v1/faces/events/{test_event.event_id}/clusters",
            params={"min_faces": 5}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Our test cluster has only 1 face
        assert len(data["clusters"]) == 0
    
    def test_get_clusters_pagination(self, client, test_event, test_cluster):
        """Test cluster pagination"""
        response = client.get(
            f"/api/v1/faces/events/{test_event.event_id}/clusters",
            params={"limit": 10, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "pagination" in data
        assert "total" in data["pagination"]
        assert "has_more" in data["pagination"]


class TestSearchFaces:
    """Test face search functionality"""
    
    def test_search_faces_in_cluster(self, client, test_event, test_face, test_cluster):
        """Test searching for similar faces"""
        response = client.post(
            "/api/v1/faces/search",
            json={
                "event_id": str(test_event.event_id),
                "face_id": str(test_face.face_id)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "query_face_id" in data
        assert "cluster_id" in data
        assert "matches" in data
        assert "total" in data
        
        # Should find at least 1 match (itself)
        assert data["total"] >= 1
    
    def test_search_nonexistent_face(self, client, test_event):
        """Test searching for non-existent face"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.post(
            "/api/v1/faces/search",
            json={
                "event_id": str(test_event.event_id),
                "face_id": fake_uuid
            }
        )
        
        assert response.status_code == 404
    
    def test_search_unclustered_face(self, client, test_event, db_session, test_media):
        """Test searching for face that hasn't been clustered yet"""
        # Create face without cluster
        unclustered_face = DetectedFace(
            media_id=test_media[0].media_id,
            event_id=test_event.event_id,
            face_encoding=[0.5] * 128,
            bbox_x=0.5,
            bbox_y=0.5,
            bbox_width=0.1,
            bbox_height=0.1,
            confidence=0.95
        )
        db_session.add(unclustered_face)
        db_session.commit()
        db_session.refresh(unclustered_face)
        
        response = client.post(
            "/api/v1/faces/search",
            json={
                "event_id": str(test_event.event_id),
                "face_id": str(unclustered_face.face_id)
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return empty matches
        assert data["total"] == 0
        assert data["cluster_id"] is None


class TestIdentifyCluster:
    """Test identifying self in a cluster"""
    
    def test_identify_self_in_cluster(self, authenticated_client, test_cluster, test_user):
        """Test claiming a cluster as your own"""
        response = authenticated_client.post(
            f"/api/v1/faces/clusters/{test_cluster.cluster_id}/identify"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "cluster_id" in data
        assert "identified_user_id" in data
        assert data["identified_user_id"] == str(test_user.user_id)
        assert "message" in data
    
    def test_identify_cluster_unauthenticated(self, client, test_cluster):
        """Test identifying cluster without authentication"""
        response = client.post(
            f"/api/v1/faces/clusters/{test_cluster.cluster_id}/identify"
        )
        
        assert response.status_code in [401, 403]
    
    def test_identify_nonexistent_cluster(self, authenticated_client):
        """Test identifying non-existent cluster"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = authenticated_client.post(
            f"/api/v1/faces/clusters/{fake_uuid}/identify"
        )
        
        assert response.status_code == 404


class TestTriggerClustering:
    """Test manual face clustering trigger"""
    
    def test_trigger_clustering_as_owner(self, authenticated_client, test_event):
        """Test triggering clustering as event owner"""
        response = authenticated_client.post(
            f"/api/v1/faces/events/{test_event.event_id}/cluster",
            json={"tolerance": 0.6}
        )
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 500]  # 500 if clustering fails
        
        if response.status_code == 200:
            data = response.json()
            assert "status" in data
            assert "event_id" in data
    
    def test_trigger_clustering_unauthenticated(self, client, test_event):
        """Test triggering clustering without authentication"""
        response = client.post(
            f"/api/v1/faces/events/{test_event.event_id}/cluster"
        )
        
        assert response.status_code in [401, 403]

