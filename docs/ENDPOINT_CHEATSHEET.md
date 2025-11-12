# API Endpoint Cheat Sheet

Quick reference for what endpoints to call for each page.

---

## 🏠 **Home Page**

```
GET /api/v1/events/public?latitude={lat}&longitude={lon}
```
Returns: List of public events with locations for map markers

---

## 🖼️ **Gallery Page** 

```
1. GET /api/v1/events/{event_id}
   → Event details (title, date, location, etc.)

2. GET /api/v1/media/events/{event_id}/media?limit=50&offset=0
   → Photos/videos for gallery

3. GET /api/v1/media/{media_id}/faces
   → Faces in clicked photo (for highlighting)

4. POST /api/v1/faces/search
   Body: { event_id, face_id }
   → Find all photos of same person ("Find Similar")
```

---

## 📊 **View Events Page** (Manager Dashboard)

```
1. GET /api/v1/events/me/events [AUTH REQUIRED]
   → List of my events

2. GET /api/v1/events/{event_id}/stats
   → Stats for each event (photo count, face count, etc.)
```

---

## 👤 **Profile Page**

```
1. GET /api/v1/users/me [AUTH REQUIRED]
   → User profile data

2. PUT /api/v1/users/me [AUTH REQUIRED]
   Body: { display_name, photo_url }
   → Update profile
```

---

## 🔍 **Search Face Page**

```
1. GET /api/v1/faces/events/{event_id}/clusters?min_faces=2
   → All people/faces in event (grid of face clusters)

2. POST /api/v1/faces/search
   Body: { event_id, face_id }
   → All photos of selected person

3. POST /api/v1/faces/clusters/{cluster_id}/identify [AUTH REQUIRED]
   → "This is me" button - claim your face cluster
```

---

## 📤 **Upload Flow**

```
1. POST /api/v1/media/upload-url
   Body: { event_id, filename, content_type, file_size, uploader_id }
   → Get presigned Azure URL

2. PUT {presigned_url}
   Body: <file binary>
   → Upload directly to Azure Blob

3. POST /api/v1/media/{media_id}/confirm
   Body: (none)
   → Trigger face detection
```

---

## 🔧 **Utility Endpoints**

```
# Validate Access Code
POST /api/v1/events/validate-access
Body: { access_code }

# Create Event
POST /api/v1/events [AUTH REQUIRED]
Body: { title, description, is_public, can_add, event_date, location_text, latitude, longitude }

# Update Event
PUT /api/v1/events/{event_id} [AUTH REQUIRED, OWNER ONLY]
Body: { title?, description?, is_public?, can_add?, event_date?, location_text?, latitude?, longitude? }
(all fields optional)

# Delete Event
DELETE /api/v1/events/{event_id} [AUTH REQUIRED, OWNER ONLY]

# Get Single Media
GET /api/v1/media/{media_id}
→ Get details of a specific media item

# Delete Media
DELETE /api/v1/media/{media_id} [AUTH REQUIRED, OWNER OR UPLOADER]

# Trigger Manual Clustering (Owner only)
POST /api/v1/faces/events/{event_id}/cluster [AUTH REQUIRED]
Body: { tolerance: 0.6 }
```

---

## 🔐 **Auth Header Format**

```typescript
headers: {
  Authorization: `Bearer ${firebaseIdToken}`
}
```

---

## 📊 **Key Response Fields**

### Media (Photo)
```typescript
{
  media_id: string,
  blob_url: string,          // Full resolution
  thumbnail_url: string,     // Use for gallery
  face_count: number,
  face_detection_status: "pending" | "processing" | "completed" | "failed"
}
```

### Face
```typescript
{
  face_id: string,
  bbox_x: number,      // 0-1 (multiply by image width)
  bbox_y: number,      // 0-1 (multiply by image height)
  bbox_width: number,  // 0-1
  bbox_height: number, // 0-1
  cluster_id: string | null
}
```

### Face Cluster (Person)
```typescript
{
  cluster_id: string,
  face_count: number,          // How many photos
  representative_face: {...},  // Best face to display
  identified_user: {...}       // If claimed by user
}
```

---

## 🎯 **Common Patterns**

### Pagination
```typescript
?limit=50&offset=0  // First page
?limit=50&offset=50 // Second page
```

### Sorting
```typescript
?sort=newest   // Default
?sort=oldest
?sort=most_faces
```

### Filtering
```typescript
?has_faces=true   // Only photos with faces
?min_faces=2      // Clusters with 2+ photos
```

---

## 🚀 **Quick Start**

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# API docs
http://localhost:8000/docs

# Health check
http://localhost:8000/health
```

---

## 📝 **Notes**

- **All list endpoints support pagination**
- **Face bounding boxes are normalized (0-1 range)**
- **Face detection happens asynchronously after upload**
- **Poll `face_detection_status` to check progress**
- **Private events require access code validation**


