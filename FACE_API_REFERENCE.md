# 🎭 Face Detection & Clustering API Reference

Quick reference for all face-related endpoints.

---

## 📸 Face Detection (Automatic)

Face detection happens automatically when photos are uploaded via the media endpoints.

### Flow:
```
POST /api/v1/media/upload-url → Upload to blob → POST /api/v1/media/{id}/confirm
↓
Background: Face detection + Smart batching + Clustering
```

---

## 👥 Get People in Event

**Endpoint**: `GET /api/v1/faces/events/{event_id}/clusters`

**Purpose**: See all people (face clusters) detected in an event

**Query Parameters**:
- `min_faces` (default: 1) - Minimum photos person must appear in
- `limit` (default: 50) - Max results
- `offset` (default: 0) - Pagination offset

**Response**:
```json
{
  "clusters": [
    {
      "cluster_id": "550e8400-e29b-41d4-a716-446655440000",
      "event_id": "650e8400-e29b-41d4-a716-446655440000",
      "face_count": 15,
      "representative_face": {
        "face_id": "750e8400-e29b-41d4-a716-446655440000",
        "media_id": "850e8400-e29b-41d4-a716-446655440000",
        "thumbnail_url": "https://seenpool.blob.core.windows.net/media/thumb.jpg",
        "blob_url": "https://seenpool.blob.core.windows.net/media/photo.jpg",
        "bbox": {
          "x": 0.25,
          "y": 0.30,
          "width": 0.15,
          "height": 0.20
        }
      },
      "identified_user_id": null,
      "identified_at": null,
      "created_at": "2025-10-26T15:30:00Z"
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

**Use Case**: Display a grid of people in the event, showing one representative photo of each person's face.

---

## 🔍 Find All Photos of a Person

**Endpoint**: `POST /api/v1/faces/search-by-face/{face_id}`

**Purpose**: Find all photos containing a specific person ("Find Similar" feature)

**Query Parameters**:
- `limit` (default: 50) - Max results

**Response**:
```json
{
  "cluster_id": "550e8400-e29b-41d4-a716-446655440000",
  "face_count": 15,
  "media": [
    {
      "media_id": "850e8400-e29b-41d4-a716-446655440000",
      "event_id": "650e8400-e29b-41d4-a716-446655440000",
      "blob_url": "https://...",
      "thumbnail_url": "https://...",
      "filename": "photo.jpg",
      "face_count": 3,
      "face_detection_status": "completed",
      "created_at": "2025-10-26T15:30:00Z"
    }
  ]
}
```

**Use Case**: User clicks on their face in one photo → see all photos they appear in.

---

## 📷 Get Faces in a Photo

**Endpoint**: `GET /api/v1/faces/media/{media_id}/faces`

**Purpose**: Get all detected faces and their locations in a specific photo

**Response**:
```json
{
  "media_id": "850e8400-e29b-41d4-a716-446655440000",
  "faces": [
    {
      "face_id": "750e8400-e29b-41d4-a716-446655440000",
      "bbox": {
        "x": 0.25,
        "y": 0.30,
        "width": 0.15,
        "height": 0.20
      },
      "confidence": 0.98,
      "cluster": {
        "cluster_id": "550e8400-e29b-41d4-a716-446655440000",
        "face_count": 15,
        "identified_user_id": null
      }
    },
    {
      "face_id": "751e8400-e29b-41d4-a716-446655440000",
      "bbox": {
        "x": 0.60,
        "y": 0.25,
        "width": 0.12,
        "height": 0.18
      },
      "confidence": 0.95,
      "cluster": {
        "cluster_id": "551e8400-e29b-41d4-a716-446655440000",
        "face_count": 8,
        "identified_user_id": "951e8400-e29b-41d4-a716-446655440000"
      }
    }
  ],
  "total_faces": 2
}
```

**Use Case**: Draw bounding boxes on photo, allow user to click on faces.

**Frontend Example**:
```typescript
// Draw face bounding boxes on image
faces.forEach(face => {
  const x = face.bbox.x * imageWidth;
  const y = face.bbox.y * imageHeight;
  const w = face.bbox.width * imageWidth;
  const h = face.bbox.height * imageHeight;
  
  // Draw rectangle at (x, y) with size (w, h)
  ctx.strokeRect(x, y, w, h);
});
```

---

## 🏷️ Identify Yourself in a Cluster

**Endpoint**: `POST /api/v1/faces/clusters/{cluster_id}/identify`

**Purpose**: Claim "This is me" for a group of faces

**Headers**: `Authorization: Bearer {firebase_token}` (TODO: implement)

**Response**:
```json
{
  "cluster_id": "550e8400-e29b-41d4-a716-446655440000",
  "face_count": 15,
  "message": "Successfully identified yourself in 15 photos"
}
```

**Use Case**: User finds their cluster → clicks "This is me" → all those photos tagged with their user ID.

---

## 🔄 Manually Trigger Clustering

**Endpoint**: `POST /api/v1/faces/events/{event_id}/trigger-clustering`

**Purpose**: Force re-clustering (for event owner)

**Query Parameters**:
- `tolerance` (default: 0.6) - Face matching strictness (0.4-0.8)

**Headers**: `Authorization: Bearer {firebase_token}` (TODO: implement)

**Response**:
```json
{
  "status": "started",
  "event_id": "650e8400-e29b-41d4-a716-446655440000",
  "message": "Clustering started in background"
}
```

**Use Case**: 
- Event owner uploads many photos at once → manually triggers clustering
- Wants to adjust tolerance parameter
- Wants to refresh clustering after people are identified

---

## 🎨 Frontend Integration Examples

### Display People Grid

```typescript
// Fetch all people in event
const response = await fetch(`/api/v1/faces/events/${eventId}/clusters?min_faces=3`);
const data = await response.json();

// Render grid of people
data.clusters.forEach(cluster => {
  const face = cluster.representative_face;
  const imageUrl = face.thumbnail_url;
  const bbox = face.bbox;
  
  // Crop image to face using bbox
  // Show "X photos" badge with face_count
});
```

### Click on Face to Search

```typescript
// User clicks on a face in a photo
async function handleFaceClick(faceId: string) {
  const response = await fetch(`/api/v1/faces/search-by-face/${faceId}`, {
    method: 'POST'
  });
  const data = await response.json();
  
  // Navigate to gallery showing all photos of this person
  router.push(`/events/${eventId}/person/${data.cluster_id}`);
}
```

### Draw Face Bounding Boxes

```typescript
// Load photo and overlay faces
const response = await fetch(`/api/v1/faces/media/${mediaId}/faces`);
const { faces } = await response.json();

const img = new Image();
img.src = photoUrl;
img.onload = () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  
  // Draw image
  ctx.drawImage(img, 0, 0);
  
  // Draw face boxes
  faces.forEach(face => {
    const x = face.bbox.x * img.width;
    const y = face.bbox.y * img.height;
    const w = face.bbox.width * img.width;
    const h = face.bbox.height * img.height;
    
    ctx.strokeStyle = '#D2C1A1';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    
    // Make clickable
    canvas.addEventListener('click', (e) => {
      if (isInsideBox(e.offsetX, e.offsetY, x, y, w, h)) {
        handleFaceClick(face.face_id);
      }
    });
  });
};
```

### "This is Me" Button

```typescript
async function identifyCluster(clusterId: string) {
  const token = await getFirebaseToken();
  
  const response = await fetch(`/api/v1/faces/clusters/${clusterId}/identify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  // Show success message
  toast.success(data.message); // "Successfully identified yourself in 15 photos"
}
```

---

## 🔔 Processing Status

Check if face detection is complete:

```typescript
// Poll media status
const checkStatus = async (mediaId: string) => {
  const response = await fetch(`/api/v1/media/${mediaId}`);
  const media = await response.json();
  
  switch (media.face_detection_status) {
    case 'pending':
      // Not started yet
      break;
    case 'processing':
      // Currently detecting faces
      break;
    case 'completed':
      // Done! face_count available
      console.log(`Found ${media.face_count} faces`);
      break;
    case 'failed':
      // Error occurred
      break;
  }
};
```

---

## 📊 Error Responses

All endpoints return standard error format:

```json
{
  "detail": "Error message here",
  "code": "OPTIONAL_ERROR_CODE"
}
```

**Common Status Codes**:
- `200 OK` - Success
- `400 Bad Request` - Invalid UUID format
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error (check logs)

---

## 🧪 Testing with cURL

### Get clusters
```bash
curl http://localhost:8000/api/v1/faces/events/YOUR_EVENT_ID/clusters
```

### Search by face
```bash
curl -X POST http://localhost:8000/api/v1/faces/search-by-face/YOUR_FACE_ID
```

### Get faces in photo
```bash
curl http://localhost:8000/api/v1/faces/media/YOUR_MEDIA_ID/faces
```

### Trigger clustering
```bash
curl -X POST "http://localhost:8000/api/v1/faces/events/YOUR_EVENT_ID/trigger-clustering?tolerance=0.6"
```

---

## 🎯 Key Concepts

### Face ID
- Unique identifier for a detected face in a photo
- One photo can have multiple face IDs

### Cluster ID
- Unique identifier for a group of similar faces (one person)
- Links multiple face IDs together

### Representative Face
- The "best" face chosen to represent a cluster
- Typically the clearest/highest confidence detection

### Bounding Box (bbox)
- Rectangle coordinates where face was detected
- Normalized to 0-1 range (multiply by image dimensions)

### Tolerance
- How similar faces must be to match (0.4-0.8)
- Lower = stricter (fewer false positives, may miss some)
- Higher = looser (more matches, more false positives)

---

## 💡 Pro Tips

1. **Show face count badges** - Users love seeing "15 photos" next to each person
2. **Crop to face bbox** - Show just the face, not the whole photo
3. **Group by clusters** - "You appear in 15 photos" is clearer than showing 15 individual faces
4. **Clickable faces** - Let users click on any face to see all photos of that person
5. **Loading states** - Face detection takes 1-2 seconds, show progress
6. **Fallback for no faces** - Some photos have no faces, that's OK!

---

## 🚀 Ready to Build!

You now have everything you need to build:
- Person gallery page (show all people in event)
- Face search feature (find all photos of yourself)
- Face highlighting (draw boxes on photos)
- "This is me" identification

**Happy coding!** 🎉

