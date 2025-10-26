"""Test media endpoints"""

import pytest


class TestListEventMedia:
    """Test listing media for an event"""
    
    def test_list_media_empty_event(self, client, test_event):
        """Test listing media for event with no media"""
        response = client.get(f"/api/v1/media/events/{test_event.event_id}/media")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_list_media_with_data(self, client, test_event, test_media):
        """Test listing media for event with media"""
        response = client.get(f"/api/v1/media/events/{test_event.event_id}/media")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 3
        
        # Check first media item
        media = data[0]
        assert "media_id" in media
        assert "blob_url" in media
        assert "thumbnail_url" in media
        assert "face_count" in media
        assert media["face_detection_status"] == "completed"
    
    def test_list_media_pagination(self, client, test_event, test_media):
        """Test pagination for media listing"""
        # Get first 2
        response = client.get(
            f"/api/v1/media/events/{test_event.event_id}/media",
            params={"limit": 2, "offset": 0}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Get next 2
        response = client.get(
            f"/api/v1/media/events/{test_event.event_id}/media",
            params={"limit": 2, "offset": 2}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Only 1 remaining
    
    def test_list_media_sort_most_faces(self, client, test_event, test_media):
        """Test sorting media by face count"""
        response = client.get(
            f"/api/v1/media/events/{test_event.event_id}/media",
            params={"sort": "most_faces"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be sorted by face_count descending
        face_counts = [m["face_count"] for m in data]
        assert face_counts == sorted(face_counts, reverse=True)
    
    def test_list_media_filter_has_faces(self, client, test_event, test_media):
        """Test filtering media by face presence"""
        response = client.get(
            f"/api/v1/media/events/{test_event.event_id}/media",
            params={"has_faces": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All test media have faces
        assert len(data) == 3
        assert all(m["face_count"] > 0 for m in data)


class TestGetMediaFaces:
    """Test getting faces in specific media"""
    
    def test_get_faces_for_media(self, client, test_media):
        """Test getting faces for a media item"""
        media = test_media[0]
        response = client.get(f"/api/v1/media/{media.media_id}/faces")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "media_id" in data
        assert "faces" in data
        assert "total_faces" in data
        assert isinstance(data["faces"], list)
    
    def test_get_faces_nonexistent_media(self, client):
        """Test getting faces for non-existent media"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/media/{fake_uuid}/faces")
        
        assert response.status_code == 404


class TestUploadFlow:
    """Test upload URL generation"""
    
    def test_get_upload_url(self, client, test_event, mock_azure_blob):
        """Test getting presigned upload URL"""
        upload_request = {
            "event_id": str(test_event.event_id),
            "filename": "test_photo.jpg",
            "content_type": "image/jpeg",
            "file_size": 1024 * 1024
        }
        
        response = client.post(
            "/api/v1/media/upload-url",
            json=upload_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "upload_url" in data
        assert "media_id" in data
        assert "blob_url" in data
        assert "storage.example.com" in data["upload_url"]
    
    def test_get_upload_url_missing_fields(self, client):
        """Test upload URL request with missing fields"""
        response = client.post(
            "/api/v1/media/upload-url",
            json={"filename": "test.jpg"}
        )
        
        assert response.status_code == 422

