# Schema Consistency Review

## ✅ Database Models vs API Schemas - FULL AUDIT

---

## 📊 **Overall Status: CONSISTENT** ✅

All database models match their Pydantic schema counterparts.

---

## 1️⃣ **User Model vs Schema**

### Database Model (`models/database.py`)
```python
class User(Base):
    user_id = UUID
    firebase_uid = String(128) UNIQUE NOT NULL
    email = String(255) NULLABLE
    display_name = String(255) NULLABLE
    photo_url = Text NULLABLE
    created_at = TIMESTAMP
    updated_at = TIMESTAMP
```

### Pydantic Schema (`schemas/pydantic.py`)
```python
class UserResponse(BaseModel):
    user_id: UUID4 ✅
    firebase_uid: str ✅
    email: Optional[str] ✅
    display_name: Optional[str] ✅
    photo_url: Optional[str] ✅
    created_at: datetime ✅
```

**Status:** ✅ **PERFECT MATCH**
- Missing `updated_at` in response (intentional - not needed by frontend)

---

## 2️⃣ **Event Model vs Schema**

### Database Model
```python
class Event(Base):
    event_id = UUID
    owner_id = UUID FK(users)
    title = String(255) NOT NULL
    description = Text NULLABLE
    access_code = String(20) UNIQUE NOT NULL
    qr_code_url = Text NULLABLE
    is_public = Boolean DEFAULT False
    can_add = String(20) DEFAULT 'code_holders'
    event_date = TIMESTAMP NULLABLE
    location_text = String(255) NULLABLE
    latitude = DECIMAL(10,8) NULLABLE
    longitude = DECIMAL(11,8) NULLABLE
    cover_photo_url = Text NULLABLE
    created_at = TIMESTAMP
    updated_at = TIMESTAMP
```

### Pydantic Schema
```python
class EventCreate(BaseModel):
    title: str (1-255 chars) ✅
    description: Optional[str] ✅
    is_public: bool = False ✅
    can_add: str (pattern validated) ✅
    event_date: Optional[datetime] ✅
    location_text: Optional[str] (max 255) ✅
    latitude: Optional[Decimal] (ge=-90, le=90) ✅
    longitude: Optional[Decimal] (ge=-180, le=180) ✅

class EventResponse(BaseModel):
    event_id: UUID4 ✅
    owner_id: UUID4 ✅
    title: str ✅
    description: Optional[str] ✅
    access_code: str ✅
    qr_code_url: Optional[str] ✅
    is_public: bool ✅
    can_add: str ✅
    event_date: Optional[datetime] ✅
    location_text: Optional[str] ✅
    latitude: Optional[Decimal] ✅
    longitude: Optional[Decimal] ✅
    cover_photo_url: Optional[str] ✅
    created_at: datetime ✅
    updated_at: datetime ✅
```

**Status:** ✅ **PERFECT MATCH**
- Validation rules align perfectly
- Location fields properly optional

---

## 3️⃣ **Media Model vs Schema**

### Database Model
```python
class Media(Base):
    media_id = UUID
    event_id = UUID FK(events) NOT NULL
    uploader_id = UUID FK(users) NULLABLE
    blob_url = Text NOT NULL
    thumbnail_url = Text NULLABLE
    filename = String(255) NULLABLE
    content_type = String(100) NULLABLE
    file_size = BigInteger NULLABLE
    width = Integer NULLABLE
    height = Integer NULLABLE
    media_type = String(20) DEFAULT 'photo'
    face_detection_status = String(20) DEFAULT 'pending'
    face_count = Integer DEFAULT 0
    created_at = TIMESTAMP
    updated_at = TIMESTAMP
```

### Pydantic Schema
```python
class MediaResponse(BaseModel):
    media_id: UUID4 ✅
    event_id: UUID4 ✅
    uploader_id: Optional[UUID4] ✅
    blob_url: str ✅
    thumbnail_url: Optional[str] ✅
    filename: Optional[str] ✅
    content_type: Optional[str] ✅
    file_size: Optional[int] ✅
    width: Optional[int] ✅
    height: Optional[int] ✅
    media_type: str ✅
    face_detection_status: str ✅
    face_count: int ✅
    created_at: datetime ✅
```

**Status:** ✅ **PERFECT MATCH**
- Missing `updated_at` (not needed by frontend)

---

## 4️⃣ **DetectedFace Model vs Schema**

### Database Model
```python
class DetectedFace(Base):
    face_id = UUID
    media_id = UUID FK(media) NOT NULL
    event_id = UUID FK(events) NOT NULL (denormalized)
    face_encoding = JSONB NULLABLE (128-d vector)
    bbox_x = DECIMAL(5,4) (0-1 range)
    bbox_y = DECIMAL(5,4) (0-1 range)
    bbox_width = DECIMAL(5,4) (0-1 range)
    bbox_height = DECIMAL(5,4) (0-1 range)
    confidence = DECIMAL(5,4) (0-1 range)
    created_at = TIMESTAMP
```

### Pydantic Schema
```python
class FaceResponse(BaseModel):
    face_id: UUID4 ✅
    media_id: UUID4 ✅
    bbox_x: Optional[Decimal] ✅
    bbox_y: Optional[Decimal] ✅
    bbox_width: Optional[Decimal] ✅
    bbox_height: Optional[Decimal] ✅
    confidence: Optional[Decimal] ✅
    created_at: datetime ✅
```

**Status:** ✅ **MATCH WITH APPROPRIATE OMISSIONS**
- `event_id` not exposed (internal optimization)
- `face_encoding` not exposed (internal data, 128-d vector not needed by frontend)
- These omissions are **correct** for API design

---

## 5️⃣ **FaceCluster Model vs Schema**

### Database Model
```python
class FaceCluster(Base):
    cluster_id = UUID
    event_id = UUID FK(events) NOT NULL
    representative_face_id = UUID FK(detected_faces) NULLABLE
    face_count = Integer DEFAULT 0
    identified_user_id = UUID FK(users) NULLABLE
    identified_at = TIMESTAMP NULLABLE
    created_at = TIMESTAMP
    updated_at = TIMESTAMP
```

### Pydantic Schema
```python
class ClusterResponse(BaseModel):
    cluster_id: UUID4 ✅
    event_id: UUID4 ✅
    representative_face_id: Optional[UUID4] ✅
    face_count: int ✅
    identified_user_id: Optional[UUID4] ✅
    identified_at: Optional[datetime] ✅
    created_at: datetime ✅
```

**Status:** ✅ **PERFECT MATCH**

---

## 6️⃣ **ClusterMember Model vs Schema**

### Database Model
```python
class ClusterMember(Base):
    id = UUID
    cluster_id = UUID FK(face_clusters) NOT NULL
    face_id = UUID FK(detected_faces) NOT NULL
    similarity_score = DECIMAL(5,4) (0-1 range)
    created_at = TIMESTAMP
    
    UNIQUE(cluster_id, face_id)
```

### Pydantic Schema
```python
# No direct schema - used internally
# Exposed through API responses as nested objects
```

**Status:** ✅ **CORRECTLY INTERNAL**
- This is a junction table (many-to-many)
- Not exposed directly to API
- Data returned as part of face/cluster responses

---

## 🌍 **Location Handling Analysis**

### **How Location is Currently Structured:**

#### Database (Event Model)
```python
location_text = String(255)  # Human-readable: "Central Park, NYC"
latitude = DECIMAL(10,8)     # Precise: 40.78509121
longitude = DECIMAL(11,8)    # Precise: -73.96828370
```

#### API Schema
```python
location_text: Optional[str]      # Can be null
latitude: Optional[Decimal]       # Can be null (ge=-90, le=90)
longitude: Optional[Decimal]      # Can be null (ge=-180, le=180)
```

### **Who Handles What?**

#### ✅ **Backend Responsibilities:**
1. **Storage** - Stores all three fields independently
2. **Validation** - Validates lat/lon ranges (-90 to 90, -180 to 180)
3. **Queries** - Can query by location for "nearby events"
4. **Flexibility** - Allows any combination:
   - Text only (no coords)
   - Coords only (no text)
   - Both (recommended)
   - Neither (valid but not useful)

#### ✅ **Frontend Responsibilities:**
1. **Input Collection:**
   - Use Google Places API / Geocoding API
   - User types location → get coordinates
   - Or use browser geolocation API
   - Or place picker on map

2. **Map Display:**
   - Use `latitude` + `longitude` to place markers
   - Use `location_text` for marker labels/popups
   - Handle missing coords gracefully (don't show on map)

3. **User Experience:**
   - Show `location_text` in event cards
   - Click location → open in Google Maps
   - Filter events by distance from user

### **Example Frontend Flow:**

```typescript
// When creating event
const handleLocationSelect = (place: GooglePlace) => {
  setEventData({
    location_text: place.formatted_address,  // "Central Park, NYC"
    latitude: place.geometry.location.lat(), // 40.785091
    longitude: place.geometry.location.lng() // -73.968285
  });
};

// When displaying on map
const MapMarker = ({ event }) => {
  if (!event.latitude || !event.longitude) {
    return null; // Don't render marker if no coords
  }
  
  return (
    <Marker
      position={{ lat: event.latitude, lng: event.longitude }}
      title={event.title}
    >
      <Popup>
        <h3>{event.title}</h3>
        <p>{event.location_text}</p>
      </Popup>
    </Marker>
  );
};

// When displaying in list
const EventCard = ({ event }) => (
  <div>
    <h3>{event.title}</h3>
    {event.location_text && (
      <p>📍 {event.location_text}</p>
    )}
    {event.latitude && event.longitude && (
      <a href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}>
        View on Map
      </a>
    )}
  </div>
);
```

### **Recommended Frontend Libraries:**

1. **Google Places Autocomplete** (location picker)
```bash
npm install @react-google-maps/api
```

2. **Leaflet or Google Maps** (map display)
```bash
npm install react-leaflet leaflet
```

3. **Browser Geolocation** (user location)
```typescript
navigator.geolocation.getCurrentPosition((position) => {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;
  // Use to find nearby events
});
```

---

## 🔍 **Issues Found: NONE** ✅

All schemas are consistent and properly structured!

---

## ⚠️ **Recommendations**

### 1. **Location Distance Calculation**
Currently the `/events/public` endpoint doesn't filter by distance. To implement:

```python
# In events.py endpoint
if latitude and longitude:
    # Calculate distance using Haversine formula or PostGIS
    # Filter events within radius
```

**Options:**
- **Option A**: Calculate in Python (simple, no extra dependencies)
- **Option B**: Use PostGIS extension (fast, scalable)
- **Option C**: Filter on frontend (simple for MVP)

**Recommendation for MVP**: Filter on frontend
```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

// Filter events
const nearbyEvents = events.filter(event => {
  if (!event.latitude || !event.longitude) return false;
  const distance = calculateDistance(
    userLat, userLon,
    event.latitude, event.longitude
  );
  return distance <= 50; // Within 50km
});
```

### 2. **QR Code Generation**
The `qr_code_url` field exists but is never populated. To implement:

```python
# In backend/app/services/qr_code.py
import qrcode
from io import BytesIO
from app.services.azure_blob import upload_blob

async def generate_qr_code_url(event_id: str, access_code: str):
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(f"https://yourapp.com/join/{access_code}")
    qr.make(fit=True)
    
    # Save to bytes
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Upload to Azure Blob
    blob_url = await upload_blob(f"qr-codes/{event_id}.png", buffer.read())
    return blob_url
```

Then call this in `create_event` endpoint.

### 3. **Thumbnail Generation**
The `thumbnail_url` field exists but is never populated. Options:

**Option A**: Generate on upload (backend)
```python
from PIL import Image
from io import BytesIO

def create_thumbnail(image_bytes: bytes, size=(300, 300)):
    img = Image.open(BytesIO(image_bytes))
    img.thumbnail(size)
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    return buffer.getvalue()
```

**Option B**: Use Azure Blob Storage's built-in thumbnails
**Option C**: Generate on-demand via CDN/proxy

---

## 📋 **Summary**

### ✅ **What's Perfect:**
- All database models match API schemas
- Data types are consistent
- Nullability is correct
- Foreign keys align
- Validation rules match constraints

### ⚠️ **What Needs Attention:**
1. QR code generation not implemented (field exists, never populated)
2. Thumbnail generation not implemented (field exists, never populated)
3. Distance-based filtering not implemented (can be done frontend or backend)

### 🎯 **Location Handling:**
- **Backend stores**: `location_text`, `latitude`, `longitude`
- **Frontend handles**: geocoding, map display, distance calculation
- **Flexibility**: All fields optional, works with any combination
- **Recommended**: Always provide all three for best UX

---

## ✅ **VERDICT: READY TO RUN** 🚀

The schema consistency is excellent. The only missing pieces are:
1. QR code generation (nice to have)
2. Thumbnail generation (important for performance)
3. Distance filtering (can be done frontend for MVP)

None of these block you from running the API!


