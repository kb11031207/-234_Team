# UI/UX Improvements Research Document

## Project Overview

**Current Name:** Event Photos / event-photo-frontend  
**Target Name:** The Scene  
**Purpose:** Web application for sharing and organizing event photos with AI-powered face detection

---

## 🛠️ Tech Stack

### Core Technologies
- **Framework:** React 18.2.0
- **Language:** TypeScript 5.3.0
- **Build Tool:** Vite 5.0.0
- **Routing:** React Router DOM 6.20.0
- **State Management:** React Query (TanStack Query) 5.0.0
- **Styling:** Tailwind CSS 4.1.17 (installed but not configured/used)
- **Maps:** Leaflet 1.9.4 + React Leaflet 4.2.1 (installed but not implemented)
- **Authentication:** Firebase 10.7.0 (Google Sign-In)
- **HTTP Client:** Axios 1.6.0
- **File Upload:** React Dropzone 14.2.0 (installed, not used)
- **QR Codes:** qrcode.react 3.1.0 (installed, not used)
- **Geolocation:** geolib 3.3.4 (installed, not used)

### Current Styling Approach
- **Inline styles** throughout the codebase
- **No design system** or component library
- **Basic CSS** in `index.css` (only Leaflet CSS import and basic reset)
- **Tailwind CSS installed but NOT configured** (no tailwind.config file)
- **No UI component library** (no shadcn/ui, Material-UI, etc.)

---

## 📁 Project Structure

```
src/
├── api/              # API integration functions
│   ├── events.ts     # Event API calls (create, get, getMyEvents, validateAccessCode)
│   └── media.ts      # Media API calls (upload, getEventMedia)
├── components/       # React components
│   ├── event/        # Empty folder
│   ├── face/         # Empty folder
│   ├── homepage/     # Homepage components (all placeholders)
│   │   ├── InteractiveMap.tsx      # Placeholder
│   │   ├── EventMarker.tsx         # Placeholder
│   │   ├── EventMarkerPopup.tsx    # Placeholder
│   │   ├── AccessCodeInput.tsx     # Placeholder
│   │   └── DistanceFilter.tsx      # Placeholder
│   ├── layout/       # Layout components
│   │   ├── Layout.tsx    # Basic layout wrapper
│   │   ├── Header.tsx    # Navigation header (inline styles)
│   │   └── Footer.tsx    # Footer (inline styles)
│   ├── media/        # Empty folder
│   └── ui/           # Empty folder
├── context/          # React Context
│   └── AuthContext.tsx   # Firebase authentication context
├── hooks/            # Custom React hooks
│   └── useGeolocation.ts # Placeholder (not implemented)
├── lib/              # Library configurations
│   ├── api.ts        # Axios client with auth interceptors
│   └── firebase.ts   # Firebase initialization
├── pages/            # Page components
│   ├── HomePage.tsx           # Basic homepage (no map)
│   ├── CreateEventPage.tsx    # Event creation form
│   ├── EventPage.tsx          # Event details page
│   ├── MyEventsPage.tsx       # User's events list
│   ├── UploadPage.tsx         # Upload page (placeholder)
│   ├── SearchFacePage.tsx     # Face search page (placeholder)
│   └── NotFoundPage.tsx       # 404 page
├── types/            # TypeScript type definitions
│   └── index.ts      # Event, Media, User, Face types
└── utils/            # Utility functions
    ├── distance.ts       # Placeholder (not implemented)
    ├── geolocation.ts    # Placeholder (not implemented)
    └── index.ts          # Exports
```

---

## 🗺️ Current Application Flow

### Routing Structure
```
/                       → HomePage (basic text, no map)
/create                 → CreateEventPage (event creation form)
/events/:eventId        → EventPage (event details)
/events/:eventId/upload → UploadPage (placeholder)
/events/:eventId/search → SearchFacePage (placeholder)
/my-events              → MyEventsPage (user's events list)
```

### Authentication Flow
1. User clicks "Sign In with Google" in Header
2. Firebase Auth popup appears
3. On success, `AuthContext` registers user with backend via `/api/v1/auth/register`
4. Firebase ID token is automatically added to all API requests via Axios interceptor
5. User state is available throughout app via `useAuth()` hook

### Data Fetching Pattern
- **React Query** used for all API calls
- **Queries:** `useQuery` for GET requests
- **Mutations:** `useMutation` for POST/PUT/DELETE requests
- **Caching:** Automatic caching and refetching handled by React Query

---

## 🎨 Current UI/UX State

### HomePage (`src/pages/HomePage.tsx`)
- **Current State:** Basic text content with buttons
- **Missing:** Map implementation (InteractiveMap is placeholder)
- **Missing:** Public events fetching and display
- **Missing:** Geolocation integration
- **Styling:** Inline styles, no visual design

### Header (`src/components/layout/Header.tsx`)
- **Current State:** Basic navigation bar
- **App Name:** "Event Photos" (needs to change to "The Scene")
- **Features:** Sign in/out, navigation links
- **Styling:** Dark background (#333), inline styles

### EventPage (`src/pages/EventPage.tsx`)
- **Current State:** Basic event details display
- **Missing:** Photo gallery implementation
- **Missing:** Face detection visualization
- **Missing:** Upload functionality integration
- **Styling:** Inline styles

### MyEventsPage (`src/pages/MyEventsPage.tsx`)
- **Current State:** Grid of event cards
- **Features:** Links to event details
- **Styling:** Basic grid layout with inline styles

### CreateEventPage (`src/pages/CreateEventPage.tsx`)
- **Current State:** Basic form with title, description, public toggle
- **Missing:** Location picker (map integration)
- **Missing:** Date picker
- **Missing:** Upload permissions selector (can_add field)
- **Styling:** Inline styles

### UploadPage (`src/pages/UploadPage.tsx`)
- **Current State:** Placeholder text
- **Missing:** File upload implementation
- **Missing:** Drag & drop functionality
- **Missing:** Upload progress
- **Note:** React Dropzone is installed but not used

### SearchFacePage (`src/pages/SearchFacePage.tsx`)
- **Current State:** Placeholder text
- **Missing:** Selfie upload
- **Missing:** Face search API integration
- **Missing:** Results display

---

## 🔌 API Integration

### Current API Functions

#### Events API (`src/api/events.ts`)
- ✅ `createEvent(data)` → POST `/api/v1/events`
- ✅ `getEvent(eventId)` → GET `/api/v1/events/{eventId}`
- ✅ `getMyEvents()` → GET `/api/v1/events/me/events`
- ✅ `validateAccessCode(code)` → POST `/api/v1/events/validate-access`
- ❌ **Missing:** `getPublicEvents(lat, lng, radius)` → GET `/api/v1/events/public`

#### Media API (`src/api/media.ts`)
- ✅ `getUploadUrl(data)` → POST `/api/v1/media/upload-url`
- ✅ `uploadToBlob(url, file)` → PUT to Azure Blob Storage
- ✅ `confirmUpload(mediaId)` → POST `/api/v1/media/{mediaId}/confirm`
- ✅ `getEventMedia(eventId)` → GET `/api/v1/media/events/{eventId}/media`
- ❌ **Missing:** Face-related API calls

### API Client Configuration (`src/lib/api.ts`)
- ✅ Axios instance with base URL from env
- ✅ Auth token interceptor (Firebase ID token)
- ✅ Error handling interceptor
- ✅ Base URL: `VITE_API_BASE_URL` or `http://localhost:8000`

---

## 🗺️ Map Implementation Status

### Current State
- **Leaflet installed** but **NOT implemented**
- **InteractiveMap component** is a placeholder
- **EventMarker component** is a placeholder
- **EventMarkerPopup component** is a placeholder
- **DistanceFilter component** is a placeholder
- **HomePage** does not use any map components

### Required Implementation
1. **InteractiveMap component** with Leaflet
2. **Geolocation hook** (`useGeolocation`) to get user location
3. **Public events API call** (`getPublicEvents`) with lat/lng/radius
4. **Event markers** on map with popups
5. **Distance filtering** (1 mile radius as per requirements)
6. **Click handler** to navigate to event details

### API Endpoint Available
- `GET /api/v1/events/public?latitude={lat}&longitude={lng}&radius={km}&limit={limit}`
- Returns array of public events with location data
- Response includes: `event_id`, `title`, `location_text`, `latitude`, `longitude`, `event_date`, `cover_photo_url`, `media_count`

---

## 🎯 Key Requirements from User

1. **App Name Change:** "Event Photos" → "The Scene"
2. **Map on Landing Page:** Snap Map-style interface showing events within 1 mile radius
3. **Better UI/UX:** Current UI is basic, needs modern design
4. **Event Manager Flow:**
   - Create account (required to create events)
   - Create public or private events
   - Control who can upload (owner only, code holders, or public)
   - Access code for private events
5. **Face Scanning:** Users can find all photos with their face in an event

---

## 🚫 Missing Features & Placeholders

### Not Implemented
1. ❌ Map on homepage (InteractiveMap is placeholder)
2. ❌ Geolocation hook (useGeolocation is placeholder)
3. ❌ Distance calculation utilities (distance.ts is placeholder)
4. ❌ Public events API call
5. ❌ Photo gallery on EventPage
6. ❌ File upload functionality (UploadPage is placeholder)
7. ❌ Face search functionality (SearchFacePage is placeholder)
8. ❌ Location picker in CreateEventPage
9. ❌ Date picker in CreateEventPage
10. ❌ QR code display (qrcode.react installed but not used)
11. ❌ Tailwind CSS configuration (installed but not configured)

### Partially Implemented
1. ⚠️ Event creation (basic form, missing location/date/permissions)
2. ⚠️ Event display (basic info, missing gallery)
3. ⚠️ Authentication (works, but no error handling UI)

---

## 🎨 UI/UX Design Opportunities

### Current Problems
1. **No design system** - everything uses inline styles
2. **No visual hierarchy** - basic text and buttons
3. **No responsive design** - fixed layouts
4. **No loading states** - basic "Loading..." text
5. **No error states** - basic error messages
6. **No animations** - static UI
7. **No modern UI patterns** - feels like early 2000s web app

### Design Inspiration Sources
1. **Snap Map** - Map-based event discovery
2. **Instagram** - Photo gallery and event feed
3. **Eventbrite** - Event cards and details
4. **Google Maps** - Map markers and popups
5. **Airbnb** - Clean, modern UI with great spacing

### Recommended Design Approach
1. **Set up Tailwind CSS** properly (create config file)
2. **Create a design system** with:
   - Color palette (primary, secondary, accent colors)
   - Typography scale
   - Spacing system
   - Component library (buttons, cards, inputs, etc.)
3. **Implement modern UI patterns:**
   - Card-based layouts
   - Glassmorphism for map overlays
   - Smooth animations and transitions
   - Loading skeletons
   - Error states with retry buttons
4. **Responsive design:**
   - Mobile-first approach
   - Breakpoints for tablet and desktop
   - Touch-friendly interactions
5. **Map integration:**
   - Full-screen map on homepage
   - Custom map markers with event photos
   - Smooth popups with event details
   - Clustering for many events
   - Location search and filters

---

## 📋 Implementation Priorities

### Phase 1: Foundation
1. Configure Tailwind CSS
2. Create design system (colors, typography, spacing)
3. Create reusable UI components (Button, Card, Input, etc.)
4. Update app name to "The Scene" throughout codebase

### Phase 2: Map Implementation
1. Implement `useGeolocation` hook
2. Implement `getPublicEvents` API function
3. Implement `InteractiveMap` component with Leaflet
4. Implement `EventMarker` and `EventMarkerPopup` components
5. Integrate map into HomePage
6. Add distance filtering (1 mile radius)

### Phase 3: UI/UX Improvements
1. Redesign HomePage with map
2. Redesign Header with new branding
3. Redesign EventPage with photo gallery
4. Redesign CreateEventPage with location picker
5. Redesign MyEventsPage with better cards
6. Add loading states and error handling
7. Add animations and transitions

### Phase 4: Feature Completion
1. Implement photo upload (UploadPage)
2. Implement face search (SearchFacePage)
3. Implement photo gallery on EventPage
4. Add QR code display for events
5. Add access code input modal

---

## 🔍 Code Patterns to Follow

### Data Fetching
```typescript
// Use React Query for all API calls
const { data, isLoading, error } = useQuery({
  queryKey: ['events', eventId],
  queryFn: () => getEvent(eventId),
  enabled: !!eventId,
})
```

### Authentication
```typescript
// Use AuthContext for user state
const { user, signInWithGoogle, signOut } = useAuth()
```

### API Calls
```typescript
// Use apiClient from lib/api.ts
// Auth token is automatically added via interceptor
const response = await apiClient.get('/api/v1/events/public', {
  params: { latitude, longitude, radius: 1.6 } // 1 mile = 1.6 km
})
```

### Component Structure
```typescript
// Functional components with TypeScript
const Component = () => {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return <div>...</div>
}
```

---

## 🎯 Specific Implementation Notes

### Map Integration
- **Library:** Leaflet + React Leaflet (already installed)
- **Styling:** Need to import Leaflet CSS (already in index.css)
- **Markers:** Custom icons with event photos
- **Popups:** Event details with cover photo, title, date, media count
- **Clustering:** Consider using `react-leaflet-cluster` for many events
- **Location:** Get user location via browser Geolocation API
- **Radius:** Default 1 mile (1.6 km) for nearby events

### Styling Strategy
- **Primary:** Tailwind CSS utility classes
- **Custom:** Tailwind config for brand colors and spacing
- **Components:** Reusable components in `src/components/ui/`
- **Layouts:** Consistent spacing and typography
- **Responsive:** Mobile-first breakpoints

### Component Organization
- **Pages:** Route-level components in `src/pages/`
- **Components:** Reusable components in `src/components/`
- **UI Components:** Base UI components in `src/components/ui/`
- **Feature Components:** Feature-specific components in `src/components/{feature}/`

---

## 🚀 Next Steps

1. **Research UI/UX patterns** for map-based event discovery apps
2. **Create design system** with Tailwind CSS
3. **Implement map** on homepage
4. **Redesign all pages** with modern UI
5. **Add missing features** (upload, face search, gallery)
6. **Test and iterate** on user experience

---

## 📝 Notes

- All homepage map components are currently placeholders
- Tailwind CSS is installed but not configured (no config file)
- No environment variables file found (need to create `.env` for API URL)
- Firebase config uses environment variables (need to verify)
- All utility functions (geolocation, distance) are placeholders
- No error boundaries or global error handling
- No loading skeletons or spinners
- No toast notifications for user feedback
- No form validation libraries
- No date picker library installed

---

## 🔗 Related Files

- **API Documentation:** `docs/API_ENDPOINTS.md`
- **API Endpoints JSON:** `docs/endpoints.json`
- **Type Definitions:** `src/types/index.ts`
- **API Client:** `src/lib/api.ts`
- **Auth Context:** `src/context/AuthContext.tsx`
- **Main App:** `src/App.tsx`
- **HomePage:** `src/pages/HomePage.tsx`

---

**Research Date:** 2024  
**Status:** Complete - Ready for implementation planning

