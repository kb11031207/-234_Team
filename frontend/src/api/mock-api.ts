/**
 * Mock API Service
 * 
 * ⚠️ PLACEHOLDER: This is a mock API for frontend development
 * 
 * TODO: Replace all these functions with real API calls to the FastAPI backend
 * 
 * When backend is ready:
 * 1. Replace mock functions with axios calls to http://localhost:8000/api/v1
 * 2. Add proper error handling
 * 3. Add authentication headers (Firebase token)
 * 4. Keep the same function signatures for easy replacement
 */

import {
  mockEvents,
  mockMedia,
  mockFaceClusters,
  getEventByAccessCode,
  getMediaByEventId,
  getUserEvents,
  getFaceClustersByEventId,
  type Event,
  type Media,
  type FaceCluster,
} from '../lib/mockData'

// Simulate API delay
const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Events API
 */
export const eventsApi = {
  // Get all events (public + user's private events)
  async getAll(): Promise<Event[]> {
    await delay()
    console.log('📡 [MOCK API] Getting all events')
    return mockEvents
  },

  // Get single event by ID or access code
  async getById(eventIdOrCode: string): Promise<Event | null> {
    await delay()
    console.log('📡 [MOCK API] Getting event:', eventIdOrCode)
    
    // Try to find by ID first
    let event = mockEvents.find((e) => e.event_id === eventIdOrCode)
    
    // If not found, try access code
    if (!event) {
      event = getEventByAccessCode(eventIdOrCode)
    }
    
    return event || null
  },

  // Get events owned by current user
  async getMyEvents(userId: string): Promise<Event[]> {
    await delay()
    console.log('📡 [MOCK API] Getting my events for user:', userId)
    return getUserEvents(userId)
  },

  // Create new event
  async create(eventData: Partial<Event>): Promise<Event> {
    await delay()
    console.log('📡 [MOCK API] Creating event:', eventData)
    
    // Generate random access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const newEvent: Event = {
      event_id: `event-${Date.now()}`,
      owner_id: eventData.owner_id || 'user-1',
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      access_code: accessCode,
      is_public: eventData.is_public ?? true,
      can_add: eventData.can_add || 'code_holders',
      event_date: eventData.event_date,
      location_text: eventData.location_text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    mockEvents.push(newEvent)
    return newEvent
  },

  // Update event
  async update(eventId: string, updates: Partial<Event>): Promise<Event> {
    await delay()
    console.log('📡 [MOCK API] Updating event:', eventId, updates)
    
    const index = mockEvents.findIndex((e) => e.event_id === eventId)
    if (index === -1) throw new Error('Event not found')
    
    mockEvents[index] = {
      ...mockEvents[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    
    return mockEvents[index]
  },

  // Delete event
  async delete(eventId: string): Promise<void> {
    await delay()
    console.log('📡 [MOCK API] Deleting event:', eventId)
    
    const index = mockEvents.findIndex((e) => e.event_id === eventId)
    if (index !== -1) {
      mockEvents.splice(index, 1)
    }
  },
}

/**
 * Media API
 */
export const mediaApi = {
  // Get all media for an event
  async getByEventId(eventId: string): Promise<Media[]> {
    await delay()
    console.log('📡 [MOCK API] Getting media for event:', eventId)
    return getMediaByEventId(eventId)
  },

  // Get single media item
  async getById(mediaId: string): Promise<Media | null> {
    await delay()
    console.log('📡 [MOCK API] Getting media:', mediaId)
    return mockMedia.find((m) => m.media_id === mediaId) || null
  },

  // Upload media (presigned URL flow)
  async getUploadUrl(eventId: string, filename: string): Promise<{ upload_url: string; media_id: string }> {
    await delay()
    console.log('📡 [MOCK API] Getting upload URL for:', filename)
    
    // TODO: Real backend will return Azure Blob presigned URL
    return {
      upload_url: 'https://mock-upload-url.azure.com/upload',
      media_id: `media-${Date.now()}`,
    }
  },

  // Confirm upload completion
  async confirmUpload(mediaId: string, eventId: string): Promise<Media> {
    await delay()
    console.log('📡 [MOCK API] Confirming upload:', mediaId)
    
    const newMedia: Media = {
      media_id: mediaId,
      event_id: eventId,
      blob_url: `https://picsum.photos/seed/${mediaId}/1200/800`,
      thumbnail_url: `https://picsum.photos/seed/${mediaId}/400/300`,
      filename: 'uploaded-image.jpg',
      content_type: 'image/jpeg',
      file_size: 2048000,
      width: 1200,
      height: 800,
      media_type: 'photo',
      face_detection_status: 'pending',
      face_count: 0,
      created_at: new Date().toISOString(),
    }
    
    mockMedia.push(newMedia)
    return newMedia
  },

  // Delete media
  async delete(mediaId: string): Promise<void> {
    await delay()
    console.log('📡 [MOCK API] Deleting media:', mediaId)
    
    const index = mockMedia.findIndex((m) => m.media_id === mediaId)
    if (index !== -1) {
      mockMedia.splice(index, 1)
    }
  },
}

/**
 * Faces API
 */
export const facesApi = {
  // Get all face clusters for an event
  async getClusters(eventId: string): Promise<FaceCluster[]> {
    await delay()
    console.log('📡 [MOCK API] Getting face clusters for event:', eventId)
    return getFaceClustersByEventId(eventId)
  },

  // Get all media containing a specific face cluster
  async getMediaByCluster(clusterId: string): Promise<Media[]> {
    await delay()
    console.log('📡 [MOCK API] Getting media for cluster:', clusterId)
    
    // TODO: Real backend will return all media with faces in this cluster
    // For now, return random subset
    return mockMedia.slice(0, 3)
  },

  // Identify a cluster as "this is me"
  async identifyCluster(clusterId: string, userId: string): Promise<FaceCluster> {
    await delay()
    console.log('📡 [MOCK API] Identifying cluster:', clusterId, 'as user:', userId)
    
    const cluster = mockFaceClusters.find((c) => c.cluster_id === clusterId)
    if (!cluster) throw new Error('Cluster not found')
    
    cluster.identified_user_id = userId
    return cluster
  },

  // Search for similar faces (upload a photo to find yourself)
  async searchSimilar(eventId: string, imageFile: File): Promise<FaceCluster[]> {
    await delay(1000) // Longer delay for "AI processing"
    console.log('📡 [MOCK API] Searching for similar faces in event:', eventId)
    
    // TODO: Real backend will:
    // 1. Upload image to Azure Blob
    // 2. Detect faces with Azure Face API
    // 3. Find similar faces in event
    // 4. Return matching clusters
    
    // For now, return mock clusters
    return getFaceClustersByEventId(eventId).slice(0, 2)
  },
}

/**
 * Combined API export
 */
export const mockApi = {
  events: eventsApi,
  media: mediaApi,
  faces: facesApi,
}

export default mockApi

