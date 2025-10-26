# Environment Variables Setup

## Quick Start

Create a `.env` file in the project root with the following variables:

```bash
# =============================================================================
# AZURE STORAGE (Required for photo/video uploads)
# =============================================================================
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=YOUR_ACCOUNT;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=event-media

# =============================================================================
# AZURE FACE API (Required for face detection/recognition)
# =============================================================================
AZURE_FACE_API_KEY=your_azure_face_api_key_here
AZURE_FACE_API_ENDPOINT=https://YOUR_RESOURCE_NAME.cognitiveservices.azure.com/

# =============================================================================
# BACKEND SECURITY
# =============================================================================
SECRET_KEY=your-secret-key-at-least-32-characters-long-random-string

# =============================================================================
# FIREBASE CONFIGURATION (Frontend - for user authentication)
# =============================================================================
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Where to Get These Values

### Azure Storage
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Storage Accounts
3. Select your storage account (or create one)
4. Go to "Access keys" in the left sidebar
5. Copy the connection string

### Azure Face API
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Cognitive Services"
3. Create a "Face" resource (or use existing)
4. Go to "Keys and Endpoint"
5. Copy KEY 1 and the Endpoint URL

### Secret Key
Generate a secure random string:
```bash
# On Linux/Mac/Windows with OpenSSL
openssl rand -hex 32

# Or use Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Firebase Configuration (Frontend)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) > Project settings
4. Scroll down to "Your apps" section
5. Click on the Web app (</>) icon
6. Copy all the config values from `firebaseConfig`

## Notes

- **DO NOT commit the `.env` file** - it's already in `.gitignore`
- The `DATABASE_URL` is automatically set by `docker-compose.yml` for development
- For production, you'll need to provide an external database URL

