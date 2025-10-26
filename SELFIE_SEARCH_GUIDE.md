# 🤳 Selfie Search - "Find Me in This Event"

## ✅ **NOW IMPLEMENTED!**

This is the MAIN feature - users can upload their selfie and see all photos they appear in.

---

## 🎯 **How It Works**

```
User Flow:
1. Go to event page
2. Click "Find Me" button
3. Upload selfie
4. Get list of ALL photos they appear in
```

**Backend Process:**
```
Selfie uploaded
   ↓
Detect face in selfie (generates 128-d vector)
   ↓
Compare vector against ALL faces in event database
   ↓
Find matches (distance < 0.6 = same person)
   ↓
Return list of photos
```

---

## 📡 **API Endpoint**

**Endpoint**: `POST /api/v1/faces/search-by-selfie`

**Method**: Multipart form data (file upload)

**Parameters**:
- `event_id` (query param) - UUID of the event
- `file` (form data) - The selfie image
- `tolerance` (query param, optional) - Matching strictness (default 0.6)

**Response**:
```json
{
  "matches": [
    {
      "media_id": "...",
      "blob_url": "https://...",
      "thumbnail_url": "https://...",
      "face_count": 3,
      "created_at": "2025-10-26T15:30:00Z"
    }
  ],
  "total": 5,
  "faces_matched": 8,
  "message": "Found you in 5 photo(s)!"
}
```

---

## 🧪 **Test with cURL**

```bash
# Upload a selfie and search
curl -X POST "http://localhost:8000/api/v1/faces/search-by-selfie?event_id=YOUR_EVENT_ID" \
  -F "file=@/path/to/your/selfie.jpg"

# With custom tolerance
curl -X POST "http://localhost:8000/api/v1/faces/search-by-selfie?event_id=YOUR_EVENT_ID&tolerance=0.7" \
  -F "file=@/path/to/your/selfie.jpg"
```

---

## 💻 **Frontend Implementation**

### React/TypeScript Example

```typescript
// SearchFacePage.tsx or within EventPage

const searchByFace = async (selfieFile: File, eventId: string) => {
  const formData = new FormData();
  formData.append('file', selfieFile);
  
  const response = await fetch(
    `http://localhost:8000/api/v1/faces/search-by-selfie?event_id=${eventId}`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }
  
  const data = await response.json();
  return data;
};

// Usage in component:
const handleSelfieUpload = async (file: File) => {
  setLoading(true);
  setError(null);
  
  try {
    const result = await searchByFace(file, eventId);
    
    if (result.total === 0) {
      setMessage("Sorry, you don't appear in any photos yet 😔");
    } else {
      setMessage(result.message); // "Found you in 5 photo(s)!"
      setPhotos(result.matches);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### UI Component Example

```tsx
<div className="find-me-section">
  <h2>Find Yourself in This Event</h2>
  <p>Upload a clear photo of your face to find all photos you appear in</p>
  
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleSelfieUpload(file);
    }}
  />
  
  {loading && <p>🔍 Searching...</p>}
  
  {error && <p className="error">❌ {error}</p>}
  
  {message && <p className="success">✅ {message}</p>}
  
  {photos.length > 0 && (
    <div className="photo-grid">
      {photos.map(photo => (
        <img key={photo.media_id} src={photo.thumbnail_url} alt="You" />
      ))}
    </div>
  )}
</div>
```

---

## 🎨 **Better UX with Camera Support**

```tsx
import { useRef, useState } from 'react';

const FaceSearchWithCamera = ({ eventId }: { eventId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [searching, setSearching] = useState(false);
  
  const startCamera = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
    setStream(mediaStream);
  };
  
  const captureAndSearch = async () => {
    if (!videoRef.current) return;
    
    // Capture frame from video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg');
    });
    
    // Search
    setSearching(true);
    try {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const result = await searchByFace(file, eventId);
      // Handle result...
    } finally {
      setSearching(false);
      // Stop camera
      stream?.getTracks().forEach(track => track.stop());
    }
  };
  
  return (
    <div>
      <h3>📸 Find Me Using Camera</h3>
      <video ref={videoRef} autoPlay playsInline />
      
      {!stream && (
        <button onClick={startCamera}>Start Camera</button>
      )}
      
      {stream && (
        <button onClick={captureAndSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Capture & Search'}
        </button>
      )}
    </div>
  );
};
```

---

## 🚨 **Error Messages**

The API returns helpful error messages:

### No Face Detected
```json
{
  "detail": "No face detected in selfie. Please upload a clear photo of your face."
}
```
**Status**: 400 Bad Request

**Frontend handling**:
```typescript
if (error.includes('No face detected')) {
  alert('⚠️ No face found! Please upload a clearer photo.');
}
```

### No Matches Found
```json
{
  "matches": [],
  "total": 0,
  "message": "No matches found. You don't appear in any photos yet."
}
```
**Status**: 200 OK (not an error!)

**Frontend handling**:
```typescript
if (result.total === 0) {
  alert('😔 You don\'t appear in any photos yet. Upload some!');
}
```

### Multiple Faces in Selfie
**Behavior**: Uses first detected face, logs warning

```json
{
  "matches": [...],
  "total": 3,
  "message": "Found you in 3 photo(s)!"
}
```

---

## ⚡ **Performance**

### Speed:
- **Selfie face detection**: ~1-2 seconds
- **Comparison with 100 faces**: ~0.5 seconds
- **Comparison with 1000 faces**: ~2-3 seconds

### Optimization Tips:
1. Show loading indicator
2. Process in background
3. Cache results (user unlikely to change between requests)

```typescript
// Cache for 5 minutes
const cacheKey = `face-search-${eventId}-${userId}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  const { timestamp, data } = JSON.parse(cached);
  if (Date.now() - timestamp < 5 * 60 * 1000) {
    return data; // Use cached result
  }
}
```

---

## 🎯 **Recommended UI Flow**

### Option 1: Button on Event Page

```
Event Gallery
[Photo] [Photo] [Photo]...

[📸 Find Me in These Photos]
   ↓ (click)
Modal opens with:
- Upload selfie
- Or use camera
- "Searching..." animation
- Results grid
```

### Option 2: Separate Search Page

```
/events/{id}/search

"Find Yourself in This Event"
[Upload Selfie] or [Use Camera]
   ↓
Results page with all matches
```

### Option 3: Onboarding Flow

```
First time user enters event:
"Want to find photos of yourself?"
[Yes] → Capture selfie → Auto-search
[No] → Browse normally
```

---

## 📊 **Analytics Ideas**

```typescript
// Track searches
analytics.track('face_search_performed', {
  event_id: eventId,
  matches_found: result.total,
  faces_matched: result.faces_matched,
  search_time: searchDuration,
});

// Track when users find themselves
if (result.total > 0) {
  analytics.track('user_found_themselves', {
    photo_count: result.total,
  });
}
```

---

## ✅ **Complete Example**

```typescript
// src/components/FaceSearch.tsx
import { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface FaceSearchProps {
  eventId: string;
}

export const FaceSearch = ({ eventId }: FaceSearchProps) => {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSearching(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(
        `/api/v1/faces/search-by-selfie?event_id=${eventId}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail);
      }
      
      const data = await response.json();
      setResults(data);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };
  
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-4">find yourself</h2>
      <p className="text-body mb-6">
        upload a selfie to see all photos you appear in
      </p>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={searching}
        className="mb-4"
      />
      
      {searching && (
        <div className="text-center py-8">
          <div className="animate-spin">🔍</div>
          <p>searching for you...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error}
        </div>
      )}
      
      {results && results.total === 0 && (
        <p className="text-gray-600">
          😔 you don't appear in any photos yet
        </p>
      )}
      
      {results && results.total > 0 && (
        <div>
          <p className="text-green-600 font-bold mb-4">
            ✅ {results.message}
          </p>
          <div className="grid grid-cols-3 gap-4">
            {results.matches.map((photo: any) => (
              <img
                key={photo.media_id}
                src={photo.thumbnail_url || photo.blob_url}
                alt="You"
                className="rounded-lg shadow-md hover:scale-105 transition"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
```

---

## 🎉 **You're Ready!**

The selfie search feature is now **fully implemented** and ready to use!

**Test it:**
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test endpoint
curl -X POST "http://localhost:8000/api/v1/faces/search-by-selfie?event_id=YOUR_EVENT_ID" \
  -F "file=@selfie.jpg"
```

**Then integrate into your frontend!** 🚀

