# Research Summary: UI/UX Improvements for "The Scene"

## Executive Summary

This document summarizes the research findings for improving the UI/UX of "The Scene" (formerly "Event Photos"), a web application for sharing and organizing event photos with AI-powered face detection.

**Current Status:** Basic functionality exists, but UI/UX is minimal with inline styles and placeholder components.

**Goal:** Transform the application into a modern, user-friendly platform with a Snap Map-style landing page and improved design throughout.

---

## 📊 Current State Analysis

### What's Working
- ✅ React + TypeScript + Vite setup
- ✅ React Router for navigation
- ✅ React Query for data fetching
- ✅ Firebase authentication (Google Sign-In)
- ✅ API integration with Axios
- ✅ Basic page structure (HomePage, EventPage, CreateEventPage, etc.)
- ✅ Type definitions for Event, Media, User, Face
- ✅ API client with auth interceptors

### What's Missing
- ❌ Map implementation (Leaflet installed but not used)
- ❌ Public events API call
- ❌ Geolocation integration
- ❌ Photo gallery on EventPage
- ❌ File upload functionality
- ❌ Face search functionality
- ❌ Location picker in CreateEventPage
- ❌ Date picker in CreateEventPage
- ❌ Tailwind CSS configuration
- ❌ Design system / component library
- ❌ Modern UI/UX design

### What's Placeholder
- ⚠️ InteractiveMap component (placeholder)
- ⚠️ EventMarker component (placeholder)
- ⚠️ EventMarkerPopup component (placeholder)
- ⚠️ AccessCodeInput component (placeholder)
- ⚠️ DistanceFilter component (placeholder)
- ⚠️ useGeolocation hook (placeholder)
- ⚠️ Distance calculation utilities (placeholder)
- ⚠️ UploadPage (placeholder)
- ⚠️ SearchFacePage (placeholder)

---

## 🎯 Key Requirements

### 1. App Name Change
- **Current:** "Event Photos" / "event-photo-frontend"
- **Target:** "The Scene"
- **Action:** Update throughout codebase (Header, Footer, package.json, etc.)

### 2. Map on Landing Page
- **Requirement:** Snap Map-style interface showing events within 1 mile radius
- **Features:**
  - Full-screen map on homepage
  - User location indicator
  - Event markers with cover photos
  - Event popups with details
  - Click to navigate to event page
  - Radius filter (1 mile default)

### 3. Better UI/UX
- **Current:** Inline styles, basic layout, no design system
- **Target:** Modern, clean, professional design
- **Features:**
  - Tailwind CSS configuration
  - Design system (colors, typography, spacing)
  - Reusable UI components
  - Responsive design
  - Loading states
  - Error handling
  - Animations and transitions

### 4. Event Manager Flow
- **Requirements:**
  - Create account (required to create events)
  - Create public or private events
  - Control who can upload (owner only, code holders, or public)
  - Access code for private events
  - QR code display

### 5. Face Scanning Feature
- **Requirements:**
  - Users can view all photos with their face in an event
  - Upload selfie to find photos
  - Face detection visualization
  - Similar faces grouping

---

## 🗺️ Architecture Overview

### Current Architecture

```
App.tsx
├── QueryClientProvider (React Query)
├── AuthProvider (Firebase Auth)
└── BrowserRouter
    └── Routes
        ├── / → HomePage (no map)
        ├── /create → CreateEventPage
        ├── /events/:eventId → EventPage
        ├── /events/:eventId/upload → UploadPage (placeholder)
        ├── /events/:eventId/search → SearchFacePage (placeholder)
        └── /my-events → MyEventsPage
```

### Data Flow

1. **Authentication:**
   - User signs in with Google → Firebase Auth
   - AuthContext registers user with backend
   - Firebase ID token added to API requests via Axios interceptor

2. **Data Fetching:**
   - React Query for all API calls
   - Automatic caching and refetching
   - Optimistic updates for mutations

3. **API Integration:**
   - Axios client with base URL from env
   - Auth token interceptor
   - Error handling interceptor

---

## 🎨 Design System Requirements

### Color Palette

**Primary Colors:**
- Deep Blue (#1E40AF) - Trust, professionalism
- Vibrant Purple (#7C3AED) - Creativity, energy
- Warm Orange (#F59E0B) - Warmth, friendliness

**Neutral Colors:**
- Dark Gray (#1F2937) - Text, backgrounds
- Medium Gray (#6B7280) - Secondary text
- Light Gray (#F3F4F6) - Backgrounds
- White (#FFFFFF) - Primary background

### Typography

**Heading Font:** Inter or Poppins (Bold)
- Modern, geometric
- Easy to read
- Professional

**Body Font:** Inter (Regular)
- Clean, readable
- System font fallback
- Comfortable for long text

### Spacing Scale

- Base: 4px (0.25rem)
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px

### Component Library

**Base Components:**
- Button (primary, secondary, outline, ghost)
- Card (default, elevated, outlined)
- Input (text, textarea, select)
- Modal (default, fullscreen)
- Loading (spinner, skeleton)
- Error (message, retry)

**Feature Components:**
- EventCard
- PhotoGrid
- MapMarker
- MapPopup
- UploadZone
- FaceSearch

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Week 1)

1. **Configure Tailwind CSS**
   - Create `tailwind.config.js`
   - Set up PostCSS
   - Configure design system (colors, typography, spacing)
   - Test Tailwind classes

2. **Create Design System**
   - Define color palette
   - Choose typography
   - Set spacing scale
   - Create base components (Button, Card, Input, etc.)

3. **Update App Name**
   - Change "Event Photos" to "The Scene" in:
     - Header.tsx
     - Footer.tsx
     - package.json
     - README.md (if exists)
     - Any other references

### Phase 2: Map Implementation (Week 2)

1. **Implement Geolocation Hook**
   - Create `useGeolocation` hook
   - Get user location via browser Geolocation API
   - Handle permissions and errors
   - Provide coordinates and permission state

2. **Implement Public Events API**
   - Create `getPublicEvents` function in `src/api/events.ts`
   - Add to API calls
   - Handle query parameters (lat, lng, radius, limit)

3. **Implement Map Components**
   - Create `InteractiveMap` component with Leaflet
   - Create `EventMarker` component with custom icons
   - Create `EventMarkerPopup` component with event details
   - Create `DistanceFilter` component for radius control

4. **Integrate Map into HomePage**
   - Replace current HomePage content with map
   - Fetch public events based on user location
   - Display events on map with markers
   - Handle marker clicks to navigate to event page

### Phase 3: UI/UX Improvements (Week 3-4)

1. **Redesign HomePage**
   - Full-screen map
   - Top bar with branding and search
   - Bottom sheet for event details
   - Radius filter overlay

2. **Redesign Header**
   - New branding ("The Scene")
   - Modern navigation
   - User menu
   - Responsive design

3. **Redesign EventPage**
   - Hero section with cover photo
   - Photo gallery with lazy loading
   - Face detection badges
   - Upload and search buttons

4. **Redesign CreateEventPage**
   - Form wizard (steps)
   - Location picker (map integration)
   - Date picker
   - Permission toggles
   - Preview section

5. **Redesign MyEventsPage**
   - Modern event cards
   - Grid layout
   - Hover effects
   - Quick actions

6. **Redesign UploadPage**
   - Drag & drop zone
   - File preview
   - Upload progress
   - Batch upload support

7. **Redesign SearchFacePage**
   - Selfie upload
   - Face search results
   - Similar faces grouping
   - Photo grid

### Phase 4: Feature Completion (Week 5-6)

1. **Implement Photo Gallery**
   - Grid layout on EventPage
   - Lazy loading
   - Infinite scroll
   - Photo modal/lightbox
   - Face detection visualization

2. **Implement File Upload**
   - Drag & drop functionality
   - File preview
   - Upload progress
   - Batch upload
   - Error handling

3. **Implement Face Search**
   - Selfie upload
   - Face search API integration
   - Results display
   - Similar faces grouping
   - Photo navigation

4. **Add Missing Features**
   - QR code display for events
   - Access code input modal
   - Location picker in CreateEventPage
   - Date picker in CreateEventPage
   - Permission toggles in CreateEventPage

### Phase 5: Polish & Testing (Week 7-8)

1. **Add Loading States**
   - Skeleton loaders
   - Progress bars
   - Spinners
   - Loading animations

2. **Add Error Handling**
   - Error messages
   - Retry buttons
   - Fallback UI
   - Error boundaries

3. **Add Animations**
   - Page transitions
   - Button clicks
   - Map interactions
   - Hover effects

4. **Responsive Design**
   - Mobile-first approach
   - Tablet breakpoints
   - Desktop breakpoints
   - Touch-friendly interactions

5. **Testing**
   - User testing
   - Feedback collection
   - Bug fixes
   - Performance optimization

---

## 📋 Technical Details

### API Endpoints Used

1. **Get Public Events:**
   - `GET /api/v1/events/public?latitude={lat}&longitude={lng}&radius={km}&limit={limit}`
   - Returns array of public events with location data

2. **Get Event:**
   - `GET /api/v1/events/{event_id}`
   - Returns event details

3. **Get Event Media:**
   - `GET /api/v1/media/events/{event_id}/media?limit={limit}&offset={offset}`
   - Returns array of media items

4. **Get Faces in Media:**
   - `GET /api/v1/media/{media_id}/faces`
   - Returns array of detected faces

5. **Search Faces:**
   - `POST /api/v1/faces/search`
   - Returns similar faces

### Dependencies Already Installed

- ✅ Leaflet 1.9.4 (map library)
- ✅ React Leaflet 4.2.1 (React wrapper for Leaflet)
- ✅ Tailwind CSS 4.1.17 (styling)
- ✅ geolib 3.3.4 (geolocation utilities)
- ✅ React Dropzone 14.2.0 (file upload)
- ✅ qrcode.react 3.1.0 (QR code generation)
- ✅ React Query 5.0.0 (data fetching)
- ✅ Firebase 10.7.0 (authentication)
- ✅ Axios 1.6.0 (HTTP client)

### Dependencies to Add (Optional)

- 🤔 Framer Motion (animations)
- 🤔 React Date Picker (date picker)
- 🤔 React Leaflet Cluster (map clustering)
- 🤔 React Hot Toast (notifications)
- 🤔 React Hook Form (form handling)
- 🤔 Zod (validation)

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Map displays on homepage
- ✅ Events show on map within 1 mile radius
- ✅ User can click event markers to see details
- ✅ User can navigate to event page from map
- ✅ All pages have modern, clean design
- ✅ App name changed to "The Scene"
- ✅ Responsive design works on mobile, tablet, desktop

### Non-Functional Requirements
- ✅ Fast page load times (< 3 seconds)
- ✅ Smooth animations and transitions
- ✅ Accessible (WCAG AA compliance)
- ✅ Mobile-friendly (touch-friendly interactions)
- ✅ Error handling and loading states
- ✅ Consistent design system

---

## 📚 Documentation

### Research Documents Created

1. **RESEARCH_UI_UX_IMPROVEMENTS.md**
   - Comprehensive analysis of current state
   - Architecture overview
   - Implementation priorities
   - Code patterns to follow

2. **DESIGN_INSPIRATION.md**
   - Design inspiration sources
   - Color palettes and typography
   - UI/UX best practices
   - Design patterns to implement

3. **RESEARCH_SUMMARY.md** (this document)
   - Executive summary
   - Current state analysis
   - Implementation plan
   - Success criteria

### Additional Resources

- **API_ENDPOINTS.md** - Backend API documentation
- **endpoints.json** - OpenAPI specification
- **TypeScript types** - `src/types/index.ts`

---

## 🚨 Known Issues & Considerations

### Current Issues
1. **No Tailwind CSS configuration** - Need to create config file
2. **No environment variables file** - Need to create `.env` for API URL
3. **No error boundaries** - Need to add error handling
4. **No loading states** - Need to add loading indicators
5. **No responsive design** - Need to add breakpoints
6. **No animations** - Need to add transitions

### Considerations
1. **Map performance** - May need clustering for many events
2. **Image optimization** - Need lazy loading and thumbnails
3. **Geolocation permissions** - Need to handle denied permissions
4. **API rate limiting** - Need to handle API errors
5. **Browser compatibility** - Need to test on different browsers
6. **Mobile performance** - Need to optimize for mobile devices

---

## 🎯 Next Steps

1. **Review Research Documents**
   - Read RESEARCH_UI_UX_IMPROVEMENTS.md
   - Read DESIGN_INSPIRATION.md
   - Review API_ENDPOINTS.md

2. **Plan Implementation**
   - Review implementation plan
   - Prioritize features
   - Estimate timeline
   - Assign tasks

3. **Start Implementation**
   - Phase 1: Foundation
   - Phase 2: Map Implementation
   - Phase 3: UI/UX Improvements
   - Phase 4: Feature Completion
   - Phase 5: Polish & Testing

---

## 📝 Notes

- All research documents are in the `docs/` folder
- Current codebase is in the `src/` folder
- API documentation is in `docs/API_ENDPOINTS.md`
- Type definitions are in `src/types/index.ts`

---

**Research Date:** 2024  
**Status:** Complete - Ready for implementation  
**Next Action:** Review research documents and start Phase 1 (Foundation)

