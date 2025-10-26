"""Test user endpoints"""

import pytest


class TestUserProfile:
    """Test user profile endpoints"""
    
    def test_get_current_user_profile(self, authenticated_client, test_user):
        """Test getting authenticated user's profile"""
        response = authenticated_client.get("/api/v1/users/me")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == str(test_user.user_id)
        assert data["email"] == test_user.email
        assert data["display_name"] == test_user.display_name
        assert "firebase_uid" in data
    
    def test_get_profile_unauthenticated(self, client):
        """Test getting profile without authentication"""
        response = client.get("/api/v1/users/me")
        
        assert response.status_code in [401, 403]
    
    def test_update_user_profile(self, authenticated_client, test_user):
        """Test updating user profile"""
        update_data = {
            "display_name": "Updated Name",
            "photo_url": "https://example.com/new_photo.jpg"
        }
        
        response = authenticated_client.put(
            "/api/v1/users/me",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["display_name"] == "Updated Name"
        assert data["photo_url"] == update_data["photo_url"]
    
    def test_update_profile_partial(self, authenticated_client):
        """Test updating only display name"""
        response = authenticated_client.put(
            "/api/v1/users/me",
            json={"display_name": "Only Name Changed"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["display_name"] == "Only Name Changed"
    
    def test_update_profile_unauthenticated(self, client):
        """Test updating profile without authentication"""
        response = client.put(
            "/api/v1/users/me",
            json={"display_name": "Hacker"}
        )
        
        assert response.status_code in [401, 403]

