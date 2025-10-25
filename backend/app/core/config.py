"""Application settings and configuration"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # App
    PROJECT_NAME: str = "Event Photo Sharing"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str
    
    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str
    AZURE_STORAGE_CONTAINER_NAME: str = "event-media"
    
    # Azure Face API
    AZURE_FACE_API_KEY: str
    AZURE_FACE_API_ENDPOINT: str
    
    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str
    
    # Security
    SECRET_KEY: str
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

