# Design Document

## Overview

The Interactive Event Map Homepage serves as the primary landing page for the event photo sharing application. It provides users with an intuitive map-based interface to discover nearby events, access private events with codes, and create new events. The design leverages the existing React/TypeScript frontend with Vite, integrating a modern mapping solution to display events based on their stored latitude/longitude coordinates.

## Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM for navigation
- **Map Library**: Leaflet with React-Leaflet (recommended for open-source, lightweight solution)
- **Styling**: CSS Modules or Styled Components for component-level styling

### Backend Integration
- **API Endpoints**: Leverage existing `/events/public` endpoint with location filtering
- **Authentication**: Firebase Auth integration for event creation
- **Access Code Validation**: Use existing `/events/validate-access` endpoint

### Data Flow
1. User visits homepage → Request geolocation permission
2. Fetch public events from `/events/public` with lat/lng parameters
3. Render map with event markers
4. Handle user interactions (marker clicks, access code input, event creation)

## Components and Interfaces

### Core Components

#### 1. HomePage Component
```typescript
interface HomePageProps {}

interface HomePageState {
  userLocation: GeolocationCoordinates | null;
  events: PublicEvent[];
  selectedEvent: PublicEvent | null;
  accessCodeInput: string;
  distanceFilter: number;
  isLoading: boolean;
  error: string | null;
}
```

#### 2. InteractiveMap Component
```typescript
interface InteractiveMapProps {
  events: PublicEvent[];
  userLocation: GeolocationCoordinates | null;
  onEventMarkerClick: (event: PublicEvent) => void;
  distanceFilter: number;
}

interface EventMarker {
  eventId: string;
  position: [number, number]; // [lat, lng]
  title: string;
  isPublic: boolean;
  mediaCount: number;
  eventDate: Date;
}
```

#### 3. AccessCodeInput Component
```typescript
interface AccessCodeInputProps {
  onSubmit: (code: string) => void;
  isLoading: boolean;
  error: string | null;
}
```

#### 4. EventMarkerPopup Component
```typescript
interface EventMarkerPopupProps {
  event: PublicEvent;
  onAccessEvent: () => void;
  onRequestAccess: () => void;
}
```

#### 5. DistanceFilter Component
```typescript
interface DistanceFilterProps {
  currentDistance: number;
  onDistanceChange: (distance: number) => void;
  options: number[]; // [10, 20, 50]
}
```

### API Interfaces

#### Enhanced Public Events Endpoint
```typescript
interface PublicEventResponse {
  event_id: string;
  title: string;
  location_text: string;
  latitude: number;
  longitude: number;
  event_date: string;
  cover_photo_url: string | null;
  media_count: number;
  created_at: string;
  is_public: boolean; // Add to existing schema
}

interface LocationFilterParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles
  limit?: number;
}
```

## Data Models

### Frontend State Models

#### GeolocationState
```typescript
interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  error: GeolocationPositionError | null;
}
```

#### MapViewState
```typescript
interface MapViewState {
  center: [number, number];
  zoom: number;
  bounds: LatLngBounds | null;
}
```

#### EventFilterState
```typescript
interface EventFilterState {
  distance: number;
  showPublicOnly: boolean;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}
```

### Backend Enhancements

#### Distance Calculation
Implement Haversine formula for distance calculation in the backend:

```python
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles using Haversine formula"""
    # Implementation details in backend
```

#### Enhanced Events Query
```python
async def get_public_events_with_location(
    latitude: float = None,
    longitude: float = None,
    radius: float = 50.0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    # Enhanced query with distance filtering
```

## Error Handling

### Geolocation Errors
- **Permission Denied**: Show default map view with all events
- **Position Unavailable**: Fallback to IP-based location or default view
- **Timeout**: Retry with increased timeout, then fallback

### API Errors
- **Network Errors**: Show retry button with exponential backoff
- **Invalid Access Code**: Clear input and show error message
- **Event Not Found**: Handle gracefully with user-friendly message

### Map Errors
- **Tile Loading Failures**: Provide fallback tile sources
- **Marker Rendering Issues**: Graceful degradation to list view

## Testing Strategy

### Unit Tests
- Component rendering and prop handling
- Geolocation utility functions
- Distance calculation accuracy
- Access code validation logic

### Integration Tests
- Map interaction workflows
- API integration with mock responses
- Authentication flow for event creation
- Error handling scenarios

### End-to-End Tests
- Complete user journey: location → map → event access
- Cross-browser compatibility for geolocation
- Mobile responsiveness and touch interactions
- Performance testing with large numbers of events

### Accessibility Tests
- Keyboard navigation for map controls
- Screen reader compatibility for event information
- High contrast mode support
- Focus management for modal interactions

## Performance Considerations

### Map Optimization
- **Marker Clustering**: Group nearby events to prevent overcrowding
- **Lazy Loading**: Load event details on marker interaction
- **Viewport Culling**: Only render markers in visible area
- **Debounced Updates**: Limit API calls during map panning/zooming

### Data Loading
- **Progressive Loading**: Load nearby events first, then expand radius
- **Caching Strategy**: Cache events by location with TTL
- **Prefetching**: Preload event details for visible markers
- **Image Optimization**: Use thumbnail URLs for marker previews

### Mobile Performance
- **Touch Optimization**: Larger touch targets for mobile
- **Reduced Animation**: Minimize animations on low-end devices
- **Efficient Rendering**: Use React.memo for expensive components
- **Bundle Splitting**: Code-split map components for faster initial load

## Security Considerations

### Location Privacy
- **Permission Handling**: Clear explanation of location usage
- **Fallback Options**: Function without location access
- **Data Minimization**: Only request necessary location precision

### Access Code Security
- **Input Validation**: Sanitize access code input
- **Rate Limiting**: Prevent brute force attempts
- **Secure Transmission**: HTTPS for all API calls

### Map Security
- **XSS Prevention**: Sanitize user-generated content in popups
- **CSRF Protection**: Use existing CSRF tokens for API calls
- **Content Security Policy**: Restrict external map tile sources

## Implementation Phases

### Phase 1: Basic Map Integration
- Set up Leaflet with React-Leaflet
- Implement geolocation detection
- Create basic map with event markers
- Add distance filtering

### Phase 2: Interactive Features
- Implement marker click handlers
- Add access code input functionality
- Create event marker popups
- Handle public/private event access

### Phase 3: Enhanced UX
- Add marker clustering
- Implement smooth animations
- Add loading states and error handling
- Optimize for mobile devices

### Phase 4: Advanced Features
- Add event creation integration
- Implement advanced filtering options
- Add search functionality
- Performance optimizations