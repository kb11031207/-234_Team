"""Test Azure Storage connection"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.services.azure_blob import get_blob_client, generate_presigned_upload_url


async def test_azure_connection():
    """Test Azure Blob Storage connection"""
    print("[TEST] Testing Azure Blob Storage Connection...\n")
    
    try:
        # Test 1: Get blob client
        print("[1] Testing connection to Azure Storage...")
        blob_service_client = get_blob_client()
        print(f"   [OK] Connected to: {blob_service_client.account_name}")
        
        # Test 2: Check container exists
        print(f"\n[2] Checking if container '{settings.AZURE_STORAGE_CONTAINER_NAME}' exists...")
        container_client = blob_service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
        exists = container_client.exists()
        
        if exists:
            print(f"   [OK] Container exists!")
        else:
            print(f"   [WARN] Container does not exist. Creating it...")
            container_client.create_container()
            print(f"   [OK] Container created!")
        
        # Test 3: Generate presigned URL
        print("\n[3] Testing presigned URL generation...")
        upload_url, blob_url = await generate_presigned_upload_url(
            filename="test.jpg",
            content_type="image/jpeg"
        )
        print(f"   [OK] Presigned URL generated!")
        print(f"   [INFO] Blob URL: {blob_url[:80]}...")
        
        # Test 4: List containers
        print("\n[4] Listing all containers...")
        containers = blob_service_client.list_containers()
        for container in containers:
            print(f"   [CONTAINER] {container.name}")
        
        print("\n" + "="*60)
        print("[SUCCESS] ALL TESTS PASSED! Azure Storage is configured correctly!")
        print("="*60)
        
    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        print("\n[TROUBLESHOOTING]")
        print("   1. Check AZURE_STORAGE_CONNECTION_STRING in backend/.env")
        print("   2. Verify storage account exists in Azure Portal")
        print("   3. Make sure connection string is from 'Access keys' section")
        return False
    
    return True


if __name__ == "__main__":
    asyncio.run(test_azure_connection())

