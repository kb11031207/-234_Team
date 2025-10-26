"""
Manual test script for face detection and clustering
Run this with your own event photos!

Usage:
    python scripts/test_face_detection_manual.py path/to/photos/folder
"""

import sys
from pathlib import Path
import asyncio
from PIL import Image

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.face_recognition_service import FaceRecognitionService


def test_with_folder(folder_path: str):
    """Test face detection with all images in a folder"""
    
    print("="*70)
    print("🧪 MANUAL FACE DETECTION TEST")
    print("="*70)
    
    folder = Path(folder_path)
    if not folder.exists():
        print(f"❌ Folder not found: {folder_path}")
        return
    
    # Find all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
    image_files = [f for f in folder.iterdir() if f.suffix in image_extensions]
    
    if not image_files:
        print(f"❌ No image files found in {folder_path}")
        print(f"   Looking for: {', '.join(image_extensions)}")
        return
    
    print(f"\n📁 Found {len(image_files)} image(s) in {folder_path}")
    print("-"*70)
    
    # Initialize face recognition service
    service = FaceRecognitionService(model="large", tolerance=0.6)
    
    all_faces = []
    
    # Process each image
    for i, image_file in enumerate(image_files, 1):
        print(f"\n{i}. Processing: {image_file.name}")
        
        try:
            # Read image
            with open(image_file, 'rb') as f:
                image_bytes = f.read()
            
            # Detect faces
            faces = service.detect_and_encode_faces(image_bytes)
            
            print(f"   ✅ Found {len(faces)} face(s)")
            
            if faces:
                for j, face in enumerate(faces, 1):
                    bbox = face['bbox']
                    print(f"      Face {j}: bbox=({bbox['x']:.3f}, {bbox['y']:.3f}, "
                          f"{bbox['width']:.3f}x{bbox['height']:.3f}), "
                          f"confidence={face['confidence']:.3f}")
                
                # Store faces with image info
                for face in faces:
                    all_faces.append({
                        'image': image_file.name,
                        'face_id': f"{image_file.stem}_face_{len(all_faces)}",
                        'encoding': face['face_encoding'],
                        'bbox': face['bbox']
                    })
            else:
                print(f"   ⚠️  No faces detected")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    # Summary
    print("\n" + "="*70)
    print("📊 SUMMARY")
    print("="*70)
    print(f"Total images processed: {len(image_files)}")
    print(f"Total faces detected: {len(all_faces)}")
    
    if len(all_faces) >= 2:
        print("\n🔍 Testing face comparison (first 2 faces)...")
        face1 = all_faces[0]
        face2 = all_faces[1]
        
        is_match, distance = service.compare_faces(
            face1['encoding'],
            face2['encoding']
        )
        
        print(f"\nComparing:")
        print(f"  Face 1: {face1['image']}")
        print(f"  Face 2: {face2['image']}")
        print(f"  Result: {'✅ MATCH' if is_match else '❌ NO MATCH'}")
        print(f"  Distance: {distance:.4f} (threshold: 0.6)")
        print(f"\n  💡 Lower distance = more similar")
        print(f"     < 0.4 = Very similar (definitely same person)")
        print(f"     0.4-0.6 = Similar (probably same person)")
        print(f"     > 0.6 = Different (probably different people)")
    
    # Test clustering if we have enough faces
    if len(all_faces) >= 3:
        print("\n" + "="*70)
        print("🎯 CLUSTERING TEST")
        print("="*70)
        
        # Prepare data for clustering
        face_data = [(face['face_id'], face['encoding']) for face in all_faces]
        
        print(f"Clustering {len(face_data)} faces...")
        
        try:
            clusters = service.cluster_faces(face_data, tolerance=0.6)
            
            print(f"\n✅ Created {len(clusters)} cluster(s):")
            
            for i, cluster in enumerate(clusters, 1):
                print(f"\n  Cluster {i} ({len(cluster)} faces):")
                for face_id in cluster:
                    # Find the original face info
                    face_info = next(f for f in all_faces if f['face_id'] == face_id)
                    print(f"    - {face_info['image']}")
            
            print("\n💡 Faces in the same cluster should be the same person!")
            
        except Exception as e:
            print(f"❌ Clustering failed: {e}")
    
    print("\n" + "="*70)
    print("✅ TEST COMPLETE!")
    print("="*70)
    print("\nNext steps:")
    print("1. Check if face detection found all faces")
    print("2. Verify clustering grouped same people together")
    print("3. If results are bad, try adjusting tolerance:")
    print("   - Lower tolerance (0.4-0.5) = stricter matching")
    print("   - Higher tolerance (0.7-0.8) = looser matching")
    print("4. Once satisfied, you can deploy!")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_face_detection_manual.py <path_to_photos_folder>")
        print("\nExample:")
        print("  python scripts/test_face_detection_manual.py C:/Users/YourName/Pictures/TestEvent")
        sys.exit(1)
    
    folder_path = sys.argv[1]
    test_with_folder(folder_path)

