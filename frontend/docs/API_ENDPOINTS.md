# API Endpoints Documentation

## Base URL
- **Local Development**: `http://localhost:8000`
- **Production**: `https://your-backend.dockploy.app`

## API Version
All endpoints are prefixed with `/api/v1`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Events](#events)
4. [Media](#media)
5. [Faces](#faces)
6. [Frontend Page Mappings](#frontend-page-mappings)

---

## 🔐 Authentication

### Register or Login User
```http
POST /api/v1/auth/register
```

**Description:** Register or login user with Firebase token. Creates user if doesn't exist, returns existing user otherwise.

**Headers:**
```json
{
  "Authorization": "Bearer <firebase_id_token>"
}
```

**Body:**
```json
{
  "email": "user@example.com",
  "display_name": "John Doe",
  "photo_url": "https://..."
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "firebase_uid": "string",
  "email": "user@example.com",
  "display_name": "John Doe",
  "photo_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Current User (Auth)
```http
GET /api/v1/auth/me
```

**Auth:** Required (Bearer token)

**Response:** User object (same as register response)

---

## 👤 Users

### Get Current User Profile
```http
GET /api/v1/users/me
```

**Auth:** Required (Bearer token)

**Response:**
```json
{
  "user_id": "uuid",
  "firebase_uid": "string",
  "email": "user@example.com",
  "display_name": "John Doe",
  "photo_url": "https://...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Update User Profile
```http
PUT /api/v1/users/me
```

**Auth:** Required

**Body:**
```json
{
  "display_name": "Jane Doe",
  "photo_url": "https://new-photo.jpg"
}
```

**Response:** Updated user object

---

## 🎉 Events

### Create Event
```http
POST /api/v1/events
```

**Auth:** Required

**Body:**
```json
{
  "title": "Sarah's Wedding",
  "description": "Join us for the celebration!",
  "is_public": false,
  "can_add": "code_holders",
  "event_date": "2024-06-15T18:00:00Z",
  "location_text": "Central Park, NYC",
  "latitude": 40.785091,
  "longitude": -73.968285
}
```

**Response:**
```json
{
  "event_id": "uuid",
  "owner_id": "uuid",
  "title": "Sarah's Wedding",
  "description": "Join us for the celebration!",
  "access_code": "ABC123XYZ",
  "qr_code_url": null,
  "is_public": false,
  "can_add": "code_holders",
  "event_date": "2024-06-15T18:00:00Z",
  "location_text": "Central Park, NYC",
  "latitude": 40.785091,
  "longitude": -73.968285,
  "cover_photo_url": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Get Event by ID
```http
GET /api/v1/events/{event_id}
```

**Auth:** Optional (public events viewable by anyone)

**Response:** Event object (same as create)

### Get My Events (Manager View)
```http
GET /api/v1/events/me/events
```

**Auth:** Required

**Response:**
```json
[
  {
    "event_id": "uuid",
    "title": "My Event",
    "description": "...",
    "access_code": "ABC123",
    "is_public": true,
    "media_count": 45,
    "face_count": 120,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Public Events (Home Page Map)
```http
GET /api/v1/events/public
```

**Auth:** Optional

**Query Params:**
- `latitude` (optional): User's latitude for nearby events
- `longitude` (optional): User's longitude
- `radius` (optional): Search radius in km (default: 50)
- `limit` (optional): Max results (default: 50)

**Response:**
```json
[
  {
    "event_id": "uuid",
    "title": "Public Event Name",
    "location_text": "Central Park",
    "latitude": 40.785091,
    "longitude": -73.968285,
    "event_date": "2024-06-15T18:00:00Z",
    "cover_photo_url": "https://...",
    "media_count": 25,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Validate Access Code
```http
POST /api/v1/events/validate-access
```

**Auth:** Optional

**Body:**
```json
{
  "access_code": "ABC123XYZ"
}
```

**Response:**
```json
{
  "event_id": "uuid",
  "title": "Event Name",
  "has_access": true,
  "can_upload": true
}
```

### Get Event Statistics
```http
GET /api/v1/events/{event_id}/stats
```

**Auth:** Optional (owner gets more details)

**Response:**
```json
{
  "event_id": "uuid",
  "title": "Event Name",
  "total_media": 150,
  "total_photos": 145,
  "total_videos": 5,
  "total_faces_detected": 420,
  "total_people_clusters": 35,
  "identified_people": 8,
  "processing_status": {
    "completed": 145,
    "processing": 3,
    "pending": 2,
    "failed": 0
  }
}
```

### Update Event
```http
PUT /api/v1/events/{event_id}
```

**Auth:** Required (must be owner)

**Body:** (all fields optional)
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "is_public": true,
  "can_add": "code_holders",
  "event_date": "2024-06-15T18:00:00Z",
  "location_text": "New Location",
  "latitude": 40.785091,
  "longitude": -73.968285
}
```

**Response:** Updated event object (same as create response)

### Delete Event
```http
DELETE /api/v1/events/{event_id}
```

**Auth:** Required (must be owner)

**Response:**
```json
{
  "message": "Event deleted successfully"
}
```

---

## 📸 Media

### Get Upload URL (Presigned)
```http
POST /api/v1/media/upload-url
```

**Auth:** Optional

**Body:**
```json
{
  "event_id": "uuid",
  "filename": "photo.jpg",
  "content_type": "image/jpeg",
  "file_size": 2048576,
  "uploader_id": "uuid"
}
```

**Response:**
```json
{
  "upload_url": "https://storage.azure.com/presigned...",
  "media_id": "uuid",
  "blob_url": "https://storage.azure.com/container/file.jpg"
}
```

**Flow:**
1. Frontend calls this endpoint
2. Gets presigned URL
3. Uploads file directly to Azure Blob using presigned URL (client-side)
4. Calls confirm endpoint

### Confirm Upload
```http
POST /api/v1/media/{media_id}/confirm
```

**Auth:** Optional

**Body:** None

**Response:**
```json
{
  "status": "processing",
  "media_id": "uuid"
}
```

### Get Event Media (Gallery Page)
```http
GET /api/v1/media/events/{event_id}/media
```

**Auth:** Optional (public events, or needs access code)

**Query Params:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)
- `sort` (default: "newest"): "newest" | "oldest" | "most_faces"
- `has_faces` (optional): true | false (filter by face presence)

**Response:**
```json
[
  {
    "media_id": "uuid",
    "event_id": "uuid",
    "blob_url": "https://storage.azure.com/...",
    "thumbnail_url": "https://storage.azure.com/.../thumb.jpg",
    "filename": "photo.jpg",
    "content_type": "image/jpeg",
    "file_size": 2048576,
    "width": 1920,
    "height": 1080,
    "media_type": "photo",
    "face_detection_status": "completed",
    "face_count": 3,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

### Get Media by ID
```http
GET /api/v1/media/{media_id}
```

**Auth:** Optional

**Response:**
```json
{
  "media_id": "uuid",
  "event_id": "uuid",
  "blob_url": "https://storage.azure.com/...",
  "thumbnail_url": "https://storage.azure.com/.../thumb.jpg",
  "filename": "photo.jpg",
  "content_type": "image/jpeg",
  "file_size": 2048576,
  "width": 1920,
  "height": 1080,
  "media_type": "photo",
  "face_detection_status": "completed",
  "face_count": 3,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get Faces in Media
```http
GET /api/v1/media/{media_id}/faces
```

**Auth:** Optional

**Response:**
```json
{
  "media_id": "uuid",
  "faces": [
    {
      "face_id": "uuid",
      "bbox_x": 0.25,
      "bbox_y": 0.30,
      "bbox_width": 0.15,
      "bbox_height": 0.20,
      "confidence": 0.98,
      "cluster_id": "uuid",
      "identified_user": {
        "user_id": "uuid",
        "display_name": "John Doe"
      }
    }
  ],
  "total_faces": 3
}
```

### Delete Media
```http
DELETE /api/v1/media/{media_id}
```

**Auth:** Required (owner or uploader)

**Response:**
```json
{
  "message": "Media deleted successfully"
}
```

---

## 😊 Faces

### Search Faces (Find Similar)
```http
POST /api/v1/faces/search
```

**Auth:** Optional

**Body:** (Note: FastAPI accepts these as separate body parameters)
```json
{
  "event_id": "uuid",
  "face_id": "uuid"
}
```

**Note:** The actual implementation accepts `event_id` and `face_id` as separate body parameters using FastAPI's `Body(...)` syntax.

**Response:**
```json
{
  "query_face_id": "uuid",
  "cluster_id": "uuid",
  "matches": [
    {
      "media_id": "uuid",
      "face_id": "uuid",
      "blob_url": "https://...",
      "thumbnail_url": "https://...",
      "similarity_score": 0.95,
      "bbox": {
        "x": 0.25,
        "y": 0.30,
        "width": 0.15,
        "height": 0.20
      }
    }
  ],
  "total": 15
}
```

### Get Event Clusters (People in Event)
```http
GET /api/v1/faces/events/{event_id}/clusters
```

**Auth:** Optional

**Query Params:**
- `limit` (default: 50)
- `offset` (default: 0)
- `min_faces` (default: 1): Minimum faces in cluster

**Response:**
```json
{
  "clusters": [
    {
      "cluster_id": "uuid",
      "event_id": "uuid",
      "face_count": 15,
      "representative_face": {
        "face_id": "uuid",
        "media_id": "uuid",
        "thumbnail_url": "https://...",
        "bbox": {
          "x": 0.25,
          "y": 0.30,
          "width": 0.15,
          "height": 0.20
        }
      },
      "identified_user": {
        "user_id": "uuid",
        "display_name": "John Doe",
        "photo_url": "https://..."
      }
    }
  ],
  "pagination": {
    "total": 35,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

### Identify Self in Cluster
```http
POST /api/v1/faces/clusters/{cluster_id}/identify
```

**Auth:** Required

**Body:** (empty or optional name)
```json
{
  "display_name": "John Doe"
}
```

**Response:**
```json
{
  "cluster_id": "uuid",
  "identified_user_id": "uuid",
  "message": "Successfully identified yourself in 15 photos"
}
```

### Trigger Face Clustering (Manual)
```http
POST /api/v1/faces/events/{event_id}/cluster
```

**Auth:** Required (must be event owner)

**Body:**
```json
{
  "tolerance": 0.6
}
```

**Response:**
```json
{
  "status": "started",
  "event_id": "uuid",
  "message": "Clustering started in background"
}
```

---

## 🗺️ Frontend Page Mappings

### Home Page
**Required Data:**
- Public events with locations for map markers
- User's current location (from browser geolocation API)

**Endpoints:**
```http
GET /api/v1/events/public?latitude=40.7128&longitude=-74.0060&radius=50
```

**Components:**
- Map with markers
- Event cards on click
- "Create Event" button (if logged in)

---

### Gallery Page
**Required Data:**
- Event information
- All photos/videos with blob URLs
- Face detection status
- Face bounding boxes (for face highlighting)

**Endpoints:**
```http
GET /api/v1/events/{event_id}
GET /api/v1/media/events/{event_id}/media?limit=50&offset=0
GET /api/v1/media/{media_id}/faces (when user clicks on photo)
```

**Components:**
- Event header with title, date, location
- Photo grid with lazy loading
- Photo modal/lightbox
- "Find Similar" button on faces
- Face count badge

---

### View Events Page (Manager)
**Required Data:**
- All events owned by current user
- Event statistics

**Endpoints:**
```http
GET /api/v1/events/me/events
GET /api/v1/events/{event_id}/stats (for each event)
```

**Components:**
- Event cards with stats
- Access code display
- QR code
- Edit/Delete buttons
- "Create New Event" button

---

### Profile Page (Manager)
**Required Data:**
- User account information
- Events created
- Photos uploaded
- Face identifications

**Endpoints:**
```http
GET /api/v1/users/me
PUT /api/v1/users/me (for updates)
GET /api/v1/events/me/events
```

**Components:**
- Profile info (name, email, photo)
- Edit profile form
- Event list
- Account settings

---

### Search Face Page
**Required Data:**
- Face clusters in event
- Similar faces for selected face

**Endpoints:**
```http
GET /api/v1/faces/events/{event_id}/clusters
POST /api/v1/faces/search (with face_id)
POST /api/v1/faces/clusters/{cluster_id}/identify (claim "this is me")
```

**Components:**
- Upload selfie option
- Face cluster grid
- "This is me" button
- Similar photos grid

---

## 🔑 Authentication Flow

### For Protected Endpoints:

1. Frontend gets Firebase ID token
2. Sends in Authorization header: `Bearer <firebase_id_token>`
3. Backend validates with Firebase Admin SDK
4. Returns user info or error

### For Access Code Protected Resources:

Option 1: Include in request body
```json
{
  "access_code": "ABC123"
}
```

Option 2: Store in session after validation

---

## 📊 Response Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (no access)
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

## 🚀 Additional Endpoints (Nice to Have)

### Batch Operations
```http
POST /api/v1/media/upload-urls (bulk presigned URLs)
DELETE /api/v1/media/batch (bulk delete)
```

### Event Invites
```http
POST /api/v1/events/{event_id}/invite (email invitation)
```

### Download
```http
GET /api/v1/events/{event_id}/download (all photos as ZIP)
GET /api/v1/faces/clusters/{cluster_id}/download (photos of person)
```

---

## 📝 Notes for Frontend Team

1. **Always handle loading states** - All requests are async
2. **Implement pagination** - Don't load 1000 photos at once
3. **Cache access codes** - Store in localStorage after validation
4. **Handle errors gracefully** - Show user-friendly messages
5. **Use React Query** - Automatic caching, refetching, optimistic updates
6. **Lazy load images** - Use intersection observer
7. **Presigned upload flow**:
   - Get presigned URL from backend
   - Upload directly to Azure (doesn't hit your backend)
   - Confirm upload
   - Poll for face detection completion

---

## 🔐 Security Notes

1. Never expose access codes in URLs (use request body or headers)
2. Validate event ownership before allowing updates/deletes
3. Rate limit upload endpoints
4. Validate file types and sizes
5. Sanitize user input (especially display_name)


