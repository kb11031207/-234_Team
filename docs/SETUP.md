# Setup Guide

This guide will help you set up the development environment for the Event Photo Sharing App.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Docker & Docker Compose** - [Download](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download](https://git-scm.com/downloads)
- **PostgreSQL** (optional if using Docker) - [Download](https://www.postgresql.org/download/)

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/-234_Team.git
cd -234_Team
```

## 2. Azure Setup (Use Your Credits!)

### 2.1 Create Azure Resources

1. **Azure Database for PostgreSQL**
   ```bash
   # Via Azure Portal or CLI
   az postgres flexible-server create \
     --name event-photos-db \
     --resource-group your-resource-group \
     --location eastus \
     --admin-user dbadmin \
     --admin-password YourSecurePassword123! \
     --sku-name Standard_B1ms \
     --tier Burstable \
     --storage-size 32
   ```

2. **Azure Blob Storage**
   ```bash
   # Create storage account
   az storage account create \
     --name eventphotostorage \
     --resource-group your-resource-group \
     --location eastus \
     --sku Standard_LRS
   
   # Create container for uploads
   az storage container create \
     --name event-media \
     --account-name eventphotostorage
   ```

3. **Azure Face API**
   ```bash
   # Create Cognitive Services Face API
   az cognitiveservices account create \
     --name event-photos-face-api \
     --resource-group your-resource-group \
     --kind Face \
     --sku F0 \
     --location eastus \
     --yes
   
   # Get keys
   az cognitiveservices account keys list \
     --name event-photos-face-api \
     --resource-group your-resource-group
   ```

### 2.2 Get Connection Strings

- **Database**: Get from Azure Portal → PostgreSQL → Connection strings
- **Storage**: Get from Azure Portal → Storage Account → Access keys
- **Face API**: Get from Azure Portal → Cognitive Services → Keys and Endpoint

## 3. Firebase Setup

### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "Event Photo Sharing"
4. Enable Google Analytics (optional)

### 3.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Google** sign-in provider
4. Add your domain to authorized domains

### 3.3 Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Under "Your apps", click web icon (</>)
3. Register app and copy the config object
4. Download service account JSON:
   - Go to **Project Settings** → **Service accounts**
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` (DO NOT COMMIT!)

## 4. Backend Setup

### 4.1 Create Virtual Environment

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate
```

### 4.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Configure Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://dbadmin:YourSecurePassword123!@event-photos-db.postgres.database.azure.com:5432/postgres

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=event-media

# Azure Face API
AZURE_FACE_API_KEY=your_face_api_key_here
AZURE_FACE_API_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=../firebase-service-account.json

# App Config
SECRET_KEY=your-secret-key-generate-with-openssl-rand-hex-32
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4.4 Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 4.5 Start Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

## 5. Frontend Setup

### 5.1 Install Dependencies

```bash
cd frontend
npm install
# or
pnpm install
```

### 5.2 Configure Environment Variables

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 5.3 Start Development Server

```bash
npm run dev
# or
pnpm dev
```

Frontend will be available at: http://localhost:5173

## 6. Docker Setup (Alternative)

If you prefer to use Docker for everything:

### 6.1 Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: event_photos
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/event_photos
    depends_on:
      - db
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### 6.2 Run with Docker

```bash
docker-compose up --build
```

## 7. Verify Setup

### Test Backend
```bash
curl http://localhost:8000/api/v1/health
# Should return: {"status": "healthy"}
```

### Test Frontend
Open http://localhost:5173 in your browser

### Test Database Connection
```bash
# From backend directory
python -c "from app.core.database import engine; import asyncio; asyncio.run(engine.connect())"
```

## 8. Create Your First Event (Manual Test)

1. Open frontend at http://localhost:5173
2. Click "Sign in with Google"
3. Click "Create Event"
4. Fill in details and create
5. Upload a test photo
6. Check if it appears in the gallery

## Common Issues

### Issue: PostgreSQL connection refused
**Solution**: Make sure PostgreSQL is running and connection string is correct

### Issue: Azure Face API 401 Unauthorized
**Solution**: Check your API key and endpoint are correct in `.env`

### Issue: Firebase auth not working
**Solution**: Verify Firebase config and ensure domain is authorized

### Issue: CORS errors
**Solution**: Add frontend URL to `CORS_ORIGINS` in backend `.env`

## Next Steps

1. **Database Schema**: Review and customize database models in `backend/app/models/`
2. **API Endpoints**: Start building endpoints in `backend/app/routers/`
3. **UI Components**: Create React components in `frontend/src/components/`
4. **Authentication Flow**: Implement Firebase auth in frontend
5. **Upload Flow**: Build the photo upload pipeline

## Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Azure Face API Docs](https://learn.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-identity)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [SQLAlchemy 2.0 Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/)

## Need Help?

- Check the [description.md](./description.md) for project overview
- Review [TECH_STACK.md](./TECH_STACK.md) for technology decisions
- Check `.cursorrules` for coding conventions

