"""Azure Blob Storage service"""

from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from datetime import datetime, timedelta
from app.core.config import settings
import uuid


def get_blob_client():
    """Get Azure Blob Service Client"""
    return BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)


async def generate_presigned_upload_url(
    filename: str,
    content_type: str,
    expiry_minutes: int = 5
) -> tuple[str, str]:
    """
    Generate presigned URL for direct upload to Azure Blob Storage
    
    Args:
        filename: Original filename
        content_type: MIME type
        expiry_minutes: URL expiry time in minutes
        
    Returns:
        Tuple of (presigned_upload_url, blob_url)
    """
    # Generate unique blob name
    file_extension = filename.split('.')[-1] if '.' in filename else ''
    blob_name = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
    
    # Get blob client
    blob_service_client = get_blob_client()
    container_client = blob_service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
    blob_client = container_client.get_blob_client(blob_name)
    
    # Generate SAS token for upload
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=settings.AZURE_STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.utcnow() + timedelta(minutes=expiry_minutes),
    )
    
    # Construct URLs
    presigned_url = f"{blob_client.url}?{sas_token}"
    blob_url = blob_client.url
    
    return presigned_url, blob_url


async def delete_blob(blob_url: str):
    """
    Delete a blob from Azure Blob Storage
    
    Args:
        blob_url: Full blob URL
    """
    # Extract blob name from URL
    blob_name = blob_url.split('/')[-1].split('?')[0]
    
    # Get blob client and delete
    blob_service_client = get_blob_client()
    container_client = blob_service_client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
    blob_client = container_client.get_blob_client(blob_name)
    
    await blob_client.delete_blob()

