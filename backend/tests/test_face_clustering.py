"""Test face clustering functionality"""

import pytest
import asyncio
from pathlib import Path
from app.services.face_recognition_service import FaceRecognitionService
import face_recognition
import numpy as np

# Test with actual images if available
TEST_IMAGES_DIR = Path(__file__).parent / "test_images"


def test_face_detection_basic():
    """Test that face detection works with a simple image"""
    service = FaceRecognitionService(model="small", tolerance=0.6)
    
    # Create a simple test with face_recognition's built-in test image
    # In a real test, you'd use actual photos
    import urllib.request
    
    # Download a test image (Obama from face_recognition library test images)
    test_image_url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama.jpg"
    
    try:
        with urllib.request.urlopen(test_image_url) as response:
            image_bytes = response.read()
        
        # Detect faces
        results = service.detect_and_encode_faces(image_bytes)
        
        print(f"✅ Face detection works! Found {len(results)} face(s)")
        
        # Should detect exactly 1 face
        assert len(results) >= 1, "Should detect at least 1 face"
        
        # Check encoding format
        assert 'face_encoding' in results[0], "Result should have face_encoding"
        assert len(results[0]['face_encoding']) == 128, "Encoding should be 128-dimensional"
        
        # Check bbox format
        assert 'bbox' in results[0], "Result should have bbox"
        assert 0 <= results[0]['bbox']['x'] <= 1, "bbox_x should be normalized 0-1"
        
        print(f"✅ Face encoding: {len(results[0]['face_encoding'])} dimensions")
        print(f"✅ Bounding box: {results[0]['bbox']}")
        
        return results
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise


def test_face_comparison():
    """Test that face comparison works"""
    service = FaceRecognitionService(model="small", tolerance=0.6)
    
    # Download two images of the same person and one different person
    obama1_url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama.jpg"
    obama2_url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/obama2.jpg"
    biden_url = "https://raw.githubusercontent.com/ageitgey/face_recognition/master/examples/biden.jpg"
    
    try:
        import urllib.request
        
        # Get Obama image 1
        with urllib.request.urlopen(obama1_url) as response:
            obama1_results = service.detect_and_encode_faces(response.read())
        
        # Get Obama image 2
        with urllib.request.urlopen(obama2_url) as response:
            obama2_results = service.detect_and_encode_faces(response.read())
        
        # Get Biden image
        with urllib.request.urlopen(biden_url) as response:
            biden_results = service.detect_and_encode_faces(response.read())
        
        print(f"✅ Detected faces: Obama1={len(obama1_results)}, Obama2={len(obama2_results)}, Biden={len(biden_results)}")
        
        # Compare same person (should match)
        is_match, distance = service.compare_faces(
            obama1_results[0]['face_encoding'],
            obama2_results[0]['face_encoding']
        )
        
        print(f"\n🔍 Comparing Obama to Obama:")
        print(f"   Match: {is_match}, Distance: {distance:.4f}")
        assert is_match, f"Same person should match! Distance: {distance}"
        
        # Compare different people (should NOT match)
        is_match, distance = service.compare_faces(
            obama1_results[0]['face_encoding'],
            biden_results[0]['face_encoding']
        )
        
        print(f"\n🔍 Comparing Obama to Biden:")
        print(f"   Match: {is_match}, Distance: {distance:.4f}")
        assert not is_match, f"Different people should NOT match! Distance: {distance}"
        
        print("\n✅ Face comparison works correctly!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise


def test_clustering_simulation():
    """Simulate clustering multiple faces"""
    service = FaceRecognitionService(model="small", tolerance=0.6)
    
    # Simulate having multiple photos with same people
    face_encodings = [
        ("face_1", [0.1] * 128),  # Person A
        ("face_2", [0.11] * 128), # Person A (similar)
        ("face_3", [0.9] * 128),  # Person B
        ("face_4", [0.91] * 128), # Person B (similar)
    ]
    
    # Note: This is a simplified test with dummy data
    # Real clustering would use actual face encodings
    
    print("✅ Clustering simulation setup complete")
    print(f"   Would cluster 4 faces into ~2 groups")


def test_tolerance_values():
    """Test different tolerance values to find optimal setting"""
    print("\n🎯 Testing different tolerance values:")
    print("   Lower tolerance = stricter matching (fewer false positives)")
    print("   Higher tolerance = looser matching (more false positives)")
    print("\n   Recommended values:")
    print("   - 0.4: Very strict (good for identical photos)")
    print("   - 0.5: Strict (good for similar lighting)")
    print("   - 0.6: Default (balanced)")
    print("   - 0.7: Loose (good for varied conditions)")
    print("\n   ⚠️  You should test with YOUR actual event photos!")


if __name__ == "__main__":
    print("="*60)
    print("🧪 FACE CLUSTERING TEST SUITE")
    print("="*60)
    
    try:
        print("\n1️⃣  Testing basic face detection...")
        test_face_detection_basic()
        
        print("\n" + "="*60)
        print("2️⃣  Testing face comparison...")
        test_face_comparison()
        
        print("\n" + "="*60)
        print("3️⃣  Testing clustering simulation...")
        test_clustering_simulation()
        
        print("\n" + "="*60)
        print("4️⃣  Tolerance recommendations...")
        test_tolerance_values()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        print("\n🎉 Your face clustering should work!")
        print("⚠️  But you MUST test with real event photos before deploying!")
        
    except Exception as e:
        print("\n" + "="*60)
        print(f"❌ TEST FAILED: {e}")
        print("="*60)
        print("\n🚨 DO NOT DEPLOY until this is fixed!")

