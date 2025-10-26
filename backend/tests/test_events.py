"""Test event endpoints"""

import pytest
from datetime import datetime


class TestPublicEvents:
    """Test public events listing"""
    
    def test_get_public_events_empty(self, client):
        """Test getting public events when none exist"""
        response = client.get("/api/v1/events/public")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_public_events_with_data(self, client, test_event):
        """Test getting public events with existing data"""
        response = client.get("/api/v1/events/public")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        
        event = data[0]
        assert event["title"] == "Test Event"
        assert event["is_public"] == True
        assert "latitude" in event
        assert "longitude" in event
    
    def test_private_events_not_in_public_list(self, client, private_event):
        """Test that private events don't appear in public list"""
        response = client.get("/api/v1/events/public")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0  # Private event should not appear


class TestGetEvent:
    """Test getting single event"""
    
    def test_get_existing_event(self, client, test_event):
        """Test getting an existing event by ID"""
        response = client.get(f"/api/v1/events/{test_event.event_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["event_id"] == str(test_event.event_id)
        assert data["title"] == test_event.title
        assert data["access_code"] == test_event.access_code
    
    def test_get_nonexistent_event(self, client):
        """Test getting a non-existent event"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/events/{fake_uuid}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestValidateAccessCode:
    """Test access code validation"""
    
    def test_valid_access_code(self, client, test_event):
        """Test validating a correct access code"""
        response = client.post(
            "/api/v1/events/validate-access",
            json={"access_code": "TEST123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_access"] == True
        assert data["event_id"] == str(test_event.event_id)
        assert data["title"] == test_event.title
    
    def test_invalid_access_code(self, client):
        """Test validating an incorrect access code"""
        response = client.post(
            "/api/v1/events/validate-access",
            json={"access_code": "WRONG999"}
        )
        
        assert response.status_code == 404
        assert "invalid" in response.json()["detail"].lower()
    
    def test_missing_access_code(self, client):
        """Test request without access code"""
        response = client.post(
            "/api/v1/events/validate-access",
            json={}
        )
        
        assert response.status_code == 422  # Validation error


class TestCreateEvent:
    """Test event creation"""
    
    def test_create_event_authenticated(self, authenticated_client):
        """Test creating an event as authenticated user"""
        event_data = {
            "title": "New Test Event",
            "description": "Description here",
            "is_public": True,
            "can_add": "code_holders",
            "location_text": "New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060
        }
        
        response = authenticated_client.post(
            "/api/v1/events",
            json=event_data
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["title"] == event_data["title"]
        assert data["is_public"] == event_data["is_public"]
        assert "event_id" in data
        assert "access_code" in data
        assert len(data["access_code"]) > 0
    
    def test_create_event_unauthenticated(self, client):
        """Test creating event without authentication"""
        event_data = {
            "title": "New Event",
            "is_public": True
        }
        
        response = client.post(
            "/api/v1/events",
            json=event_data
        )
        
        # Should fail without auth
        assert response.status_code in [401, 403]
    
    def test_create_event_missing_title(self, authenticated_client):
        """Test creating event without required title"""
        response = authenticated_client.post(
            "/api/v1/events",
            json={"is_public": True}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_create_event_invalid_can_add(self, authenticated_client):
        """Test creating event with invalid can_add value"""
        response = authenticated_client.post(
            "/api/v1/events",
            json={
                "title": "Test",
                "can_add": "invalid_value"
            }
        )
        
        assert response.status_code == 422


class TestMyEvents:
    """Test getting user's events"""
    
    def test_get_my_events(self, authenticated_client, test_event):
        """Test getting authenticated user's events"""
        response = authenticated_client.get("/api/v1/events/me/events")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(e["event_id"] == str(test_event.event_id) for e in data)
    
    def test_get_my_events_unauthenticated(self, client):
        """Test getting events without authentication"""
        response = client.get("/api/v1/events/me/events")
        
        assert response.status_code in [401, 403]


class TestEventStats:
    """Test event statistics"""
    
    def test_get_event_stats(self, client, test_event, test_media):
        """Test getting statistics for an event"""
        response = client.get(f"/api/v1/events/{test_event.event_id}/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_media" in data
        assert "total_photos" in data
        assert "total_faces_detected" in data
        assert "processing_status" in data
        
        # Should have 3 media items from fixture
        assert data["total_media"] == 3
    
    def test_get_stats_nonexistent_event(self, client):
        """Test getting stats for non-existent event"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/events/{fake_uuid}/stats")
        
        assert response.status_code == 404

