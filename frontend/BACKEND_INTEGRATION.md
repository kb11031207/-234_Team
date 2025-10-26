# Backend Integration Guide

This document explains how to connect the frontend to the FastAPI backend when it's ready.

---

## 🎯 Current Status

**Frontend**: ✅ Fully functional with mock data  
**Backend**: ⏳ Not yet implemented

The frontend is built to work standalone for UI development. All components use a mock API that simulates backend responses.

---

## 🔄 Switching from Mock to Real API

### **Step 1: Complete Backend Setup**

Make sure the backend is running:
```bash
cd backend
uvicorn app.main:app --reload
# Should be accessible at http://localhost:8000
```

Test the health endpoint:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### **Step 2: Update Environment Variables**

In `frontend/.env.local`, verify the API URL:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### **Step 3: Switch API Layer**

Edit `frontend/src/api/index.ts`:

**Before (Mock API):**
```typescript
import { mockApi } from './mock-api'
export const api = mockApi
```

**After (Real API):**
```typescript
import { backendApi } from './backend-api'
export const api = backendApi
```

### **Step 4: Implement Backend Functions**

In `frontend/src/api/backend-api.ts`, uncomment the API calls:

```typescript
// Before:
async getAll(): Promise<Event[]> {
  throw new Error('Backend not implemented yet')
}

// After:
async getAll(): Promise<Event[]> {
  const response = await api.get('/events')
  return response.data
}
```

Do this for all functions in:
- `eventsApi`
- `mediaApi`
- `facesApi`

### **Step 5: Add Firebase Auth Token**

Uncomment the auth interceptor in `backend-api.ts`:

```typescript
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### **Step 6: Test Each Endpoint**

1. **Events**: Create event, view events list
2. **Media**: Upload photo, view gallery
3. **Faces**: Search for faces, identify clusters

---

## 📋 Backend API Checklist

Ensure your FastAPI backend implements these endpoints:

### **Events Endpoints**
- [ ] `GET /api/v1/events` - List all events
- [ ] `GET /api/v1/events/{event_id}` - Get single event
- [ ] `GET /api/v1/events/by-code/{access_code}` - Get by access code
- [ ] `GET /api/v1/events/my-events` - Current user's events
- [ ] `POST /api/v1/events` - Create event
- [ ] `PUT /api/v1/events/{event_id}` - Update event
- [ ] `DELETE /api/v1/events/{event_id}` - Delete event

### **Media Endpoints**
- [ ] `GET /api/v1/media/event/{event_id}` - Get event media
- [ ] `POST /api/v1/media/upload-url` - Get presigned upload URL
- [ ] `POST /api/v1/media/confirm` - Confirm upload
- [ ] `DELETE /api/v1/media/{media_id}` - Delete media

### **Faces Endpoints**
- [ ] `GET /api/v1/faces/clusters/{event_id}` - Get face clusters
- [ ] `GET /api/v1/faces/cluster/{cluster_id}/media` - Get media by cluster
- [ ] `POST /api/v1/faces/identify` - Identify cluster
- [ ] `POST /api/v1/faces/search` - Search similar faces

### **Auth Endpoint**
- [ ] `POST /api/v1/auth/verify` - Verify Firebase token

---

## 🛠️ Expected Request/Response Formats

### **Create Event**
```typescript
// Request
POST /api/v1/events
{
  "title": "My Event",
  "description": "Event description",
  "is_public": true,
  "can_add": "code_holders",
  "event_date": "2024-12-20T14:00:00Z",
  "location_text": "Downtown"
}

// Response
{
  "event_id": "uuid-here",
  "access_code": "ABC123",
  "qr_code_url": "https://...",
  // ... other fields
}
```

### **Upload Media**
```typescript
// 1. Get upload URL
POST /api/v1/media/upload-url
{
  "event_id": "uuid-here",
  "filename": "photo.jpg",
  "content_type": "image/jpeg"
}

// Response
{
  "upload_url": "https://azure-blob-url-with-sas-token",
  "media_id": "uuid-here",
  "blob_url": "https://blob-url"
}

// 2. Upload to Azure (from frontend directly)
PUT {upload_url}
Body: <file binary>

// 3. Confirm upload (triggers face detection)
POST /api/v1/media/confirm
{
  "media_id": "uuid-here"
}
```

### **Search Faces**
```typescript
// Request
POST /api/v1/faces/search
FormData:
  - file: <image file>
  - event_id: "uuid-here"

// Response
[
  {
    "cluster_id": "uuid-here",
    "face_count": 5,
    "thumbnail_url": "https://...",
    // ... other fields
  }
]
```

---

## 🔐 Authentication Flow

1. **Frontend**: User signs in with Google via Firebase
2. **Frontend**: Get Firebase ID token
3. **Frontend**: Send token in Authorization header: `Bearer {token}`
4. **Backend**: Verify token with Firebase Admin SDK
5. **Backend**: Extract user info from token
6. **Backend**: Create/update user in database
7. **Backend**: Return protected resource

---

## ⚠️ Common Issues

### Issue: CORS Errors
**Solution**: Add frontend URL to backend CORS origins:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: 401 Unauthorized
**Solution**: Check Firebase token is being sent:
```typescript
// In browser DevTools > Network tab
// Check request headers for:
Authorization: Bearer eyJhbGc...
```

### Issue: Upload fails
**Solution**: 
1. Check Azure Blob Storage connection
2. Verify presigned URL expiry (default 5 minutes)
3. Check CORS settings on Azure Blob container

---

## 🧪 Testing Strategy

### Phase 1: Test with Mock Data (Current)
- ✅ Build all UI components
- ✅ Test user flows
- ✅ Verify responsive design
- ✅ Test state management

### Phase 2: Test Backend Individually
- Test each endpoint with Postman/curl
- Verify database operations
- Test Firebase auth
- Test Azure integrations

### Phase 3: Connect Frontend to Backend
- Switch to real API
- Test each feature end-to-end
- Handle errors gracefully
- Add loading states

### Phase 4: Polish
- Add retry logic for failed requests
- Implement offline detection
- Add request caching (React Query)
- Optimize performance

---

## 📦 Data Types

All TypeScript interfaces are in `frontend/src/lib/mockData.ts`:

- `Event` - Event data structure
- `Media` - Photo/video data
- `FaceCluster` - AI face cluster data
- `DetectedFace` - Individual face detection

These match the Pydantic schemas in your backend.

---

## 🎨 UI Components Already Built

All these components work with the mock API and will automatically work with the real API once you switch:

- ✅ Home page with floating menu
- ✅ Event creation form
- ✅ Event gallery
- ✅ Photo upload with dropzone
- ✅ Face cluster display
- ✅ Search interface
- ✅ Modal dialogs
- ✅ Loading states

---

## 🚀 Quick Start Checklist

When backend is ready:

1. [ ] Start backend server
2. [ ] Verify `http://localhost:8000/docs` loads
3. [ ] Update `VITE_API_BASE_URL` in `.env.local`
4. [ ] Switch API in `frontend/src/api/index.ts`
5. [ ] Uncomment functions in `backend-api.ts`
6. [ ] Test authentication flow
7. [ ] Test each feature end-to-end
8. [ ] Fix any bugs
9. [ ] Deploy! 🎉

---

## 💡 Tips

- **Console Logging**: Mock API logs all calls with `📡 [MOCK API]` prefix
- **Network Tab**: Check browser DevTools to see actual API calls
- **React Query DevTools**: Add to see request/cache status
- **Error Handling**: Add try/catch blocks for all API calls

---

## 📞 Need Help?

Check these files for implementation details:
- `frontend/src/api/mock-api.ts` - Mock implementation (reference)
- `frontend/src/api/backend-api.ts` - Real implementation (to complete)
- `frontend/src/lib/mockData.ts` - Data types and mock data
- `backend/app/main.py` - Backend API structure

---

**Remember**: The frontend is fully functional with mock data, so you can develop the UI independently while the backend is being built! 🎨

