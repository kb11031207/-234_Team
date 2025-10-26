/**
 * Mock Data for Frontend Development
 * 
 * TODO: Replace with actual backend API calls when backend is ready
 * 
 * This file provides fake data to develop the UI without a backend.
 * All data types match the expected backend response schemas.
 */

export interface Event {
  event_id: string
  owner_id: string
  title: string
  description: string
  access_code: string
  qr_code_url?: string
  is_public: boolean
  can_add: 'owner_only' | 'code_holders' | 'public'
  event_date?: string
  location_text?: string
  latitude?: number
  longitude?: number
  cover_photo_url?: string
  created_at: string
  updated_at: string
}

export interface Media {
  media_id: string
  event_id: string
  uploader_id?: string
  blob_url: string
  thumbnail_url?: string
  filename: string
  content_type: string
  file_size: number
  width?: number
  height?: number
  media_type: 'photo' | 'video'
  face_detection_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  face_count: number
  created_at: string
}

export interface DetectedFace {
  face_id: string
  media_id: string
  bbox_x: number
  bbox_y: number
  bbox_width: number
  bbox_height: number
  confidence: number
}

export interface FaceCluster {
  cluster_id: string
  event_id: string
  representative_face_id?: string
  face_count: number
  identified_user_id?: string
  thumbnail_url?: string
}

// Mock Events
export const mockEvents: Event[] = [
  {
    event_id: '1',
    owner_id: 'user-1',
    title: 'Sarah\'s Wedding',
    description: 'Beautiful wedding ceremony and reception',
    access_code: 'WEDDING123',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WEDDING123',
    is_public: true,
    can_add: 'code_holders',
    event_date: '2024-12-20T14:00:00Z',
    location_text: 'Grand Ballroom, Downtown',
    latitude: 34.0522,
    longitude: -118.2437,
    cover_photo_url: 'https://picsum.photos/seed/wedding/800/600',
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-10-01T10:00:00Z',
  },
  {
    event_id: '2',
    owner_id: 'user-1',
    title: 'Tech Conference 2024',
    description: 'Annual technology conference and networking event',
    access_code: 'TECH2024',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TECH2024',
    is_public: false,
    can_add: 'public',
    event_date: '2024-11-15T09:00:00Z',
    location_text: 'Convention Center',
    latitude: 34.0555,
    longitude: -118.2565,
    cover_photo_url: 'https://picsum.photos/seed/conference/800/600',
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2024-09-15T10:00:00Z',
  },
  {
    event_id: '3',
    owner_id: 'user-2',
    title: 'Summer Beach Party',
    description: 'Fun in the sun with friends',
    access_code: 'BEACH2024',
    is_public: true,
    can_add: 'code_holders',
    event_date: '2024-08-15T16:00:00Z',
    location_text: 'Santa Monica Beach',
    latitude: 34.0195,
    longitude: -118.4912,
    cover_photo_url: 'https://picsum.photos/seed/beach/800/600',
    created_at: '2024-08-01T10:00:00Z',
    updated_at: '2024-08-01T10:00:00Z',
  },
]

// Mock Media
export const mockMedia: Media[] = [
  {
    media_id: '1',
    event_id: '1',
    uploader_id: 'user-1',
    blob_url: 'https://picsum.photos/seed/photo1/1200/800',
    thumbnail_url: 'https://picsum.photos/seed/photo1/400/300',
    filename: 'IMG_001.jpg',
    content_type: 'image/jpeg',
    file_size: 2048000,
    width: 1200,
    height: 800,
    media_type: 'photo',
    face_detection_status: 'completed',
    face_count: 3,
    created_at: '2024-10-25T10:30:00Z',
  },
  {
    media_id: '2',
    event_id: '1',
    blob_url: 'https://picsum.photos/seed/photo2/1200/800',
    thumbnail_url: 'https://picsum.photos/seed/photo2/400/300',
    filename: 'IMG_002.jpg',
    content_type: 'image/jpeg',
    file_size: 1824000,
    width: 1200,
    height: 800,
    media_type: 'photo',
    face_detection_status: 'completed',
    face_count: 2,
    created_at: '2024-10-25T11:00:00Z',
  },
  {
    media_id: '3',
    event_id: '1',
    blob_url: 'https://picsum.photos/seed/photo3/1200/800',
    thumbnail_url: 'https://picsum.photos/seed/photo3/400/300',
    filename: 'IMG_003.jpg',
    content_type: 'image/jpeg',
    file_size: 2156000,
    width: 1200,
    height: 800,
    media_type: 'photo',
    face_detection_status: 'completed',
    face_count: 5,
    created_at: '2024-10-25T11:30:00Z',
  },
  {
    media_id: '4',
    event_id: '1',
    blob_url: 'https://picsum.photos/seed/photo4/1200/800',
    thumbnail_url: 'https://picsum.photos/seed/photo4/400/300',
    filename: 'IMG_004.jpg',
    content_type: 'image/jpeg',
    file_size: 1956000,
    width: 1200,
    height: 800,
    media_type: 'photo',
    face_detection_status: 'completed',
    face_count: 1,
    created_at: '2024-10-25T12:00:00Z',
  },
]

// Mock Face Clusters
export const mockFaceClusters: FaceCluster[] = [
  {
    cluster_id: '1',
    event_id: '1',
    face_count: 8,
    thumbnail_url: 'https://picsum.photos/seed/face1/200/200',
  },
  {
    cluster_id: '2',
    event_id: '1',
    face_count: 5,
    thumbnail_url: 'https://picsum.photos/seed/face2/200/200',
  },
  {
    cluster_id: '3',
    event_id: '1',
    face_count: 3,
    thumbnail_url: 'https://picsum.photos/seed/face3/200/200',
  },
]

// Helper: Get event by access code
export const getEventByAccessCode = (accessCode: string): Event | undefined => {
  return mockEvents.find(
    (event) => event.access_code.toUpperCase() === accessCode.toUpperCase()
  )
}

// Helper: Get media by event ID
export const getMediaByEventId = (eventId: string): Media[] => {
  return mockMedia.filter((media) => media.event_id === eventId)
}

// Helper: Get user's events
export const getUserEvents = (userId: string): Event[] => {
  return mockEvents.filter((event) => event.owner_id === userId)
}

// Helper: Get face clusters by event ID
export const getFaceClustersByEventId = (eventId: string): FaceCluster[] => {
  return mockFaceClusters.filter((cluster) => cluster.event_id === eventId)
}

