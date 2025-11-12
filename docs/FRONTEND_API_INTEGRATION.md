# Frontend API Integration Guide

Quick reference for frontend developers to integrate with the backend API.

## ✅ All Endpoints Implemented and Ready

### Base URL
```
Development: http://localhost:8000
Production: https://your-backend.dockploy.app
```

---

## 📄 Page-by-Page Integration

### 🏠 Home Page

**What you need:** Public events with locations for map markers

**Endpoint:**
```typescript
GET /api/v1/events/public?latitude=40.7128&longitude=-74.0060&limit=50
```

**Response:**
```typescript
interface PublicEvent {
  event_id: string;
  title: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  event_date: string | null;
  cover_photo_url: string | null;
  media_count: number;
  created_at: string;
}

// Response
PublicEvent[]
```

**Usage Example:**
```typescript
import axios from 'axios';

const fetchPublicEvents = async (userLat?: number, userLon?: number) => {
  const response = await axios.get('/api/v1/events/public', {
    params: {
      latitude: userLat,
      longitude: userLon,
      limit: 50
    }
  });
  return response.data;
};
```

---

### 🖼️ Gallery Page

**What you need:** Event info + photos with face data

**Endpoints:**

1. **Get Event Details**
```typescript
GET /api/v1/events/{event_id}
```

2. **Get Event Media (Photos)**
```typescript
GET /api/v1/media/events/{event_id}/media?limit=50&offset=0&sort=newest
```

Query params:
- `limit`: Max results (default: 50, max: 100)
- `offset`: Pagination offset
- `sort`: "newest" | "oldest" | "most_faces"
- `has_faces`: true | false (optional filter)

**Response:**
```typescript
interface Media {
  media_id: string;
  event_id: string;
  blob_url: string;  // Full resolution image URL
  thumbnail_url: string | null;
  filename: string;
  content_type: string;
  file_size: number;
  width: number;
  height: number;
  media_type: "photo" | "video";
  face_detection_status: "pending" | "processing" | "completed" | "failed";
  face_count: number;
  created_at: string;
}

// Response
Media[]
```

3. **Get Faces in Photo** (when user clicks on a photo)
```typescript
GET /api/v1/media/{media_id}/faces
```

**Response:**
```typescript
interface FaceInMedia {
  face_id: string;
  bbox_x: number;  // 0-1 normalized
  bbox_y: number;
  bbox_width: number;
  bbox_height: number;
  confidence: number;
  cluster_id: string | null;
  identified_user: {
    user_id: string;
    display_name: string;
  } | null;
}

// Response
{
  media_id: string;
  faces: FaceInMedia[];
  total_faces: number;
}
```

**Usage Example:**
```typescript
// Fetch gallery photos
const fetchGalleryPhotos = async (eventId: string, page: number = 0) => {
  const response = await axios.get(`/api/v1/media/events/${eventId}/media`, {
    params: {
      limit: 50,
      offset: page * 50,
      sort: 'newest'
    }
  });
  return response.data;
};

// Fetch faces when photo clicked
const fetchPhotoFaces = async (mediaId: string) => {
  const response = await axios.get(`/api/v1/media/${mediaId}/faces`);
  return response.data;
};

// Render face bounding box
const renderFaceBox = (face: FaceInMedia, imageWidth: number, imageHeight: number) => {
  const x = face.bbox_x * imageWidth;
  const y = face.bbox_y * imageHeight;
  const width = face.bbox_width * imageWidth;
  const height = face.bbox_height * imageHeight;
  
  return <div 
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      border: '2px solid yellow',
      cursor: 'pointer'
    }}
    onClick={() => findSimilarFaces(face.face_id)}
  />;
};
```

---

### 📊 View Events Page (Manager Dashboard)

**What you need:** User's events + statistics

**Endpoints:**

1. **Get My Events**
```typescript
GET /api/v1/events/me/events
Authorization: Bearer <firebase_token>
```

2. **Get Event Stats** (for each event)
```typescript
GET /api/v1/events/{event_id}/stats
```

**Response:**
```typescript
interface EventStats {
  event_id: string;
  title: string;
  total_media: number;
  total_photos: number;
  total_videos: number;
  total_faces_detected: number;
  total_people_clusters: number;
  identified_people: number;
  processing_status: {
    completed: number;
    processing: number;
    pending: number;
    failed: number;
  };
}
```

**Usage Example:**
```typescript
const fetchMyEvents = async (firebaseToken: string) => {
  const response = await axios.get('/api/v1/events/me/events', {
    headers: {
      Authorization: `Bearer ${firebaseToken}`
    }
  });
  return response.data;
};

const fetchEventStats = async (eventId: string) => {
  const response = await axios.get(`/api/v1/events/${eventId}/stats`);
  return response.data;
};
```

---

### 👤 Profile Page

**What you need:** User profile data

**Endpoints:**

1. **Get Current User**
```typescript
GET /api/v1/users/me
Authorization: Bearer <firebase_token>
```

2. **Update Profile**
```typescript
PUT /api/v1/users/me
Authorization: Bearer <firebase_token>

Body: {
  display_name?: string;
  photo_url?: string;
}
```

**Usage Example:**
```typescript
const fetchUserProfile = async (firebaseToken: string) => {
  const response = await axios.get('/api/v1/users/me', {
    headers: { Authorization: `Bearer ${firebaseToken}` }
  });
  return response.data;
};

const updateUserProfile = async (
  firebaseToken: string,
  displayName: string,
  photoUrl: string
) => {
  const response = await axios.put(
    '/api/v1/users/me',
    { display_name: displayName, photo_url: photoUrl },
    { headers: { Authorization: `Bearer ${firebaseToken}` } }
  );
  return response.data;
};
```

---

### 🔍 Search Face Page

**What you need:** Face clusters + similar faces

**Endpoints:**

1. **Get All People in Event** (face clusters)
```typescript
GET /api/v1/faces/events/{event_id}/clusters?limit=50&min_faces=2
```

Query params:
- `limit`: Max results (default: 50)
- `offset`: Pagination offset
- `min_faces`: Minimum faces in cluster (default: 1)

**Response:**
```typescript
interface FaceCluster {
  cluster_id: string;
  event_id: string;
  face_count: number;
  representative_face: {
    face_id: string;
    media_id: string;
    thumbnail_url: string;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null;
  identified_user: {
    user_id: string;
    display_name: string;
    photo_url: string;
  } | null;
}

// Response
{
  clusters: FaceCluster[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

2. **Find Similar Faces** (click on a face to see all photos)
```typescript
POST /api/v1/faces/search

Body: {
  event_id: string;
  face_id: string;
}
```

**Response:**
```typescript
{
  query_face_id: string;
  cluster_id: string | null;
  matches: Array<{
    media_id: string;
    face_id: string;
    blob_url: string;
    thumbnail_url: string;
    similarity_score: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  total: number;
}
```

3. **Identify Self** ("This is me" button)
```typescript
POST /api/v1/faces/clusters/{cluster_id}/identify
Authorization: Bearer <firebase_token>
```

**Usage Example:**
```typescript
// Get all people in event
const fetchEventPeople = async (eventId: string) => {
  const response = await axios.get(`/api/v1/faces/events/${eventId}/clusters`, {
    params: { min_faces: 2 }  // Only show people with 2+ photos
  });
  return response.data;
};

// Find all photos of a person
const findSimilarFaces = async (eventId: string, faceId: string) => {
  const response = await axios.post('/api/v1/faces/search', {
    event_id: eventId,
    face_id: faceId
  });
  return response.data;
};

// Claim "This is me"
const identifyMyself = async (clusterId: string, firebaseToken: string) => {
  const response = await axios.post(
    `/api/v1/faces/clusters/${clusterId}/identify`,
    {},
    { headers: { Authorization: `Bearer ${firebaseToken}` } }
  );
  return response.data;
};
```

---

## 🔐 Authentication

All protected endpoints require Firebase ID token:

```typescript
// Get Firebase token
const user = firebase.auth().currentUser;
const token = await user?.getIdToken();

// Use in requests
axios.get('/api/v1/users/me', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## 📤 Photo Upload Flow

**Complete upload flow:**

```typescript
// Step 1: Get presigned upload URL
const getUploadUrl = async (
  eventId: string,
  file: File,
  uploaderId?: string
) => {
  const response = await axios.post('/api/v1/media/upload-url', {
    event_id: eventId,
    filename: file.name,
    content_type: file.type,
    file_size: file.size,
    uploader_id: uploaderId
  });
  return response.data;  // { upload_url, media_id, blob_url }
};

// Step 2: Upload file directly to Azure Blob
const uploadToBlob = async (uploadUrl: string, file: File) => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
      'x-ms-blob-type': 'BlockBlob'
    }
  });
};

// Step 3: Confirm upload (triggers face detection)
const confirmUpload = async (mediaId: string) => {
  const response = await axios.post(`/api/v1/media/${mediaId}/confirm`);
  return response.data;  // { status: 'processing', media_id }
};

// Complete flow
const uploadPhoto = async (eventId: string, file: File, uploaderId?: string) => {
  // 1. Get presigned URL
  const { upload_url, media_id } = await getUploadUrl(eventId, file, uploaderId);
  
  // 2. Upload to Azure
  await uploadToBlob(upload_url, file);
  
  // 3. Confirm and trigger face detection
  await confirmUpload(media_id);
  
  console.log('Upload complete! Face detection started.');
};
```

---

## 🎨 TypeScript API Client Example

**Create a typed API client:**

```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';

class EventPhotoAPI {
  private client: AxiosInstance;
  
  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Events
  async getPublicEvents(lat?: number, lon?: number) {
    const { data } = await this.client.get('/api/v1/events/public', {
      params: { latitude: lat, longitude: lon }
    });
    return data;
  }
  
  async getEvent(eventId: string) {
    const { data } = await this.client.get(`/api/v1/events/${eventId}`);
    return data;
  }
  
  async getMyEvents() {
    const { data } = await this.client.get('/api/v1/events/me/events');
    return data;
  }
  
  async createEvent(eventData: any) {
    const { data } = await this.client.post('/api/v1/events', eventData);
    return data;
  }
  
  async getEventStats(eventId: string) {
    const { data } = await this.client.get(`/api/v1/events/${eventId}/stats`);
    return data;
  }
  
  async updateEvent(eventId: string, eventData: any) {
    const { data } = await this.client.put(`/api/v1/events/${eventId}`, eventData);
    return data;
  }
  
  async deleteEvent(eventId: string) {
    const { data } = await this.client.delete(`/api/v1/events/${eventId}`);
    return data;
  }
  
  // Media
  async getEventMedia(eventId: string, limit = 50, offset = 0) {
    const { data } = await this.client.get(`/api/v1/media/events/${eventId}/media`, {
      params: { limit, offset }
    });
    return data;
  }
  
  async getMedia(mediaId: string) {
    const { data } = await this.client.get(`/api/v1/media/${mediaId}`);
    return data;
  }
  
  async getMediaFaces(mediaId: string) {
    const { data } = await this.client.get(`/api/v1/media/${mediaId}/faces`);
    return data;
  }
  
  async deleteMedia(mediaId: string) {
    const { data } = await this.client.delete(`/api/v1/media/${mediaId}`);
    return data;
  }
  
  // Faces
  async getEventClusters(eventId: string, minFaces = 1) {
    const { data } = await this.client.get(`/api/v1/faces/events/${eventId}/clusters`, {
      params: { min_faces: minFaces }
    });
    return data;
  }
  
  async searchFaces(eventId: string, faceId: string) {
    const { data } = await this.client.post('/api/v1/faces/search', {
      event_id: eventId,
      face_id: faceId
    });
    return data;
  }
  
  async identifyInCluster(clusterId: string) {
    const { data} = await this.client.post(`/api/v1/faces/clusters/${clusterId}/identify`);
    return data;
  }
  
  // Users
  async getUserProfile() {
    const { data } = await this.client.get('/api/v1/users/me');
    return data;
  }
  
  async updateUserProfile(displayName: string, photoUrl: string) {
    const { data } = await this.client.put('/api/v1/users/me', {
      display_name: displayName,
      photo_url: photoUrl
    });
    return data;
  }
}

// Export singleton
export const api = new EventPhotoAPI(import.meta.env.VITE_API_BASE_URL);
```

**Usage in components:**
```typescript
import { api } from '@/api/client';

// In your component
useEffect(() => {
  const loadEvents = async () => {
    const events = await api.getPublicEvents();
    setEvents(events);
  };
  loadEvents();
}, []);
```

---

## 🚀 Testing Endpoints

**Use the Swagger UI:**
```
http://localhost:8000/docs
```

All endpoints are documented with:
- Request/response schemas
- Example payloads
- "Try it out" functionality

---

## ⚠️ Important Notes

1. **All UUIDs are strings** in API responses (not UUID objects)
2. **Bounding boxes are normalized** (0-1 range) - multiply by image dimensions
3. **Pagination** is available on list endpoints - use `limit` and `offset`
4. **Face detection is async** - check `face_detection_status` field
5. **Access codes** required for private events - validate before uploading

---

## 🐛 Error Handling

```typescript
try {
  const data = await api.getEvent(eventId);
} catch (error) {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 404:
        console.error('Event not found');
        break;
      case 401:
        console.error('Not authenticated');
        break;
      case 403:
        console.error('No access to this event');
        break;
      default:
        console.error('Server error:', error.response?.data);
    }
  }
}
```

---

## ✅ Quick Checklist for Integration

- [ ] Set up axios with base URL
- [ ] Implement Firebase auth token passing
- [ ] Create API client class/functions
- [ ] Handle loading states for all async calls
- [ ] Implement error handling
- [ ] Add pagination for lists
- [ ] Cache responses with React Query
- [ ] Test upload flow end-to-end
- [ ] Test face detection polling
- [ ] Handle edge cases (no faces, no photos, etc.)

---

## 📞 Need Help?

- Check Swagger docs: `http://localhost:8000/docs`
- See full API spec: `docs/API_ENDPOINTS.md`
- Backend issues: Check your console logs
- CORS issues: Verify `CORS_ORIGINS` in backend .env


