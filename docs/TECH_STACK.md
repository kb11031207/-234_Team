# Tech Stack Documentation

## Overview
This document outlines the complete technology stack for the Event Photo Sharing App.

## Frontend Stack

### Core Framework
- **React 18+** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state management
- **Context API** - Global app state (auth, theme)

### UI & Styling
- **Tailwind CSS** or **Material-UI** - Choose one for consistent styling
- **React Router** - Client-side routing
- **React Dropzone** - File upload interface

### Authentication
- **Firebase SDK** - Client-side auth
- **Google OAuth** - Primary login method

### Image Handling
- **Browser Canvas API** - Image preview and optimization
- **React Image Gallery** - Photo viewing experience

## Backend Stack

### Core Framework
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Python 3.11+** - Programming language

### Database & ORM
- **PostgreSQL** - Relational database
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **asyncpg** - Async PostgreSQL driver

### Authentication & Security
- **firebase-admin** - Firebase token verification
- **python-jose** - JWT handling (if needed)
- **passlib** - Password hashing (if needed)

### Azure Integration
- **azure-storage-blob** - Blob storage operations
- **azure-cognitiveservices-vision-face** - Face detection API
- **azure-identity** - Managed identity support

### Background Processing
- **FastAPI BackgroundTasks** - Simple async tasks
- **Celery + Redis** - For complex/long-running jobs (optional)

### Validation & Serialization
- **Pydantic v2** - Data validation
- **Python typing** - Type hints

### Image Processing
- **Pillow (PIL)** - Image manipulation
- **python-magic** - File type detection

## Infrastructure & DevOps

### Containerization
- **Docker** - Application containerization
- **Docker Compose** - Local development orchestration

### Cloud Services (Azure)
- **Azure Database for PostgreSQL** - Managed database
- **Azure Blob Storage** - File storage
- **Azure Face API** - AI face detection
- **Azure Container Instances** or **App Service** - Deployment

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting

## Development Tools

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Black** - Python code formatting
- **MyPy** - Python static type checking
- **Ruff** - Fast Python linter

### Testing
- **pytest** - Python testing framework
- **pytest-asyncio** - Async test support
- **Vitest** - Frontend unit testing
- **React Testing Library** - Component testing

### API Documentation
- **FastAPI Swagger UI** - Auto-generated API docs
- **OpenAPI 3.0** - API specification

## Package Management

### Frontend
- **npm** or **pnpm** - Node package manager

### Backend
- **pip** - Python package manager
- **venv** - Virtual environment

## Key Dependencies Summary

### Backend (requirements.txt)
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
asyncpg>=0.29.0
alembic>=1.12.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
firebase-admin>=6.2.0
azure-storage-blob>=12.19.0
azure-cognitiveservices-vision-face>=0.6.0
pillow>=10.0.0
python-multipart>=0.0.6
python-dotenv>=1.0.0
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "firebase": "^10.7.0",
    "axios": "^1.6.0",
    "react-dropzone": "^14.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

## Why These Choices?

### FastAPI over Node.js
- Better Python ecosystem for AI/ML integration
- Excellent async support
- Auto-generated API documentation
- Strong typing with Pydantic

### PostgreSQL over NoSQL
- ACID compliance for critical event/media data
- Excellent JSON support for flexible metadata
- Strong relationship modeling (events → media → faces)
- Mature ecosystem and tooling

### Azure over AWS
- You have Azure credits
- Face API is mature and well-documented
- Good Python SDK support
- Easy integration with other Azure services

### Firebase Auth
- Free tier generous enough for MVP
- Google OAuth built-in
- Client SDKs are excellent
- Easy token verification on backend

### Vite over Create React App
- Much faster dev server and builds
- Better TypeScript support
- Smaller bundle sizes
- Modern tooling

## Scalability Considerations

### Current Architecture Supports:
- **~1,000 events** simultaneously
- **~10,000 photos per event**
- **~100 concurrent uploads**

### Future Optimizations:
- Add Redis for caching frequently accessed events
- Use CDN for serving images (Azure CDN)
- Implement Celery for heavy AI workloads
- Database read replicas for high traffic
- Image thumbnail generation at multiple sizes

