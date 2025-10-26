/**
 * Real Backend API Service
 * 
 * ⚠️ TODO: IMPLEMENT WHEN BACKEND IS READY
 * 
 * This file contains the actual API calls to the FastAPI backend.
 * Currently using mock data - uncomment and implement when backend is deployed.
 * 
 * Backend URL: http://localhost:8000/api/v1 (development)
 *              https://your-production-url.com/api/v1 (production)
 */

import axios from 'axios'
import type { Event, Media, FaceCluster } from '../lib/mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add Firebase auth token to requests
// TODO: Implement this when Firebase auth is fully set up
api.interceptors.request.use(async (config) => {
  // const user = auth.currentUser
  // if (user) {
  //   const token = await user.getIdToken()
  //   config.headers.Authorization = `Bearer ${token}`
  // }
  return config
})

/**
 * Events API - Backend Endpoints
 * 
 * TODO: Uncomment and test when backend is ready
 */
export const eventsApi = {
  // GET /events - Get all events (public + user's)
  async getAll(): Promise<Event[]> {
    // const response = await api.get('/events')
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // GET /events/{event_id} - Get single event
  async getById(eventId: string): Promise<Event> {
    // const response = await api.get(`/events/${eventId}`)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // GET /events/by-code/{access_code} - Get event by access code
  async getByAccessCode(accessCode: string): Promise<Event> {
    // const response = await api.get(`/events/by-code/${accessCode}`)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // GET /events/my-events - Get current user's events
  async getMyEvents(): Promise<Event[]> {
    // const response = await api.get('/events/my-events')
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // POST /events - Create new event
  async create(eventData: {
    title: string
    description?: string
    is_public?: boolean
    can_add?: 'owner_only' | 'code_holders' | 'public'
    event_date?: string
    location_text?: string
    latitude?: number
    longitude?: number
  }): Promise<Event> {
    // const response = await api.post('/events', eventData)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // PUT /events/{event_id} - Update event
  async update(eventId: string, updates: Partial<Event>): Promise<Event> {
    // const response = await api.put(`/events/${eventId}`, updates)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // DELETE /events/{event_id} - Delete event
  async delete(eventId: string): Promise<void> {
    // await api.delete(`/events/${eventId}`)
    throw new Error('Backend not implemented yet - using mock data')
  },
}

/**
 * Media API - Backend Endpoints
 * 
 * TODO: Uncomment and test when backend is ready
 */
export const mediaApi = {
  // GET /media/event/{event_id} - Get all media for event
  async getByEventId(eventId: string): Promise<Media[]> {
    // const response = await api.get(`/media/event/${eventId}`)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // POST /media/upload-url - Get presigned upload URL
  async getUploadUrl(eventId: string, filename: string, contentType: string): Promise<{
    upload_url: string
    media_id: string
    blob_url: string
  }> {
    // const response = await api.post('/media/upload-url', {
    //   event_id: eventId,
    //   filename,
    //   content_type: contentType,
    // })
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // POST /media/confirm - Confirm upload and trigger face detection
  async confirmUpload(mediaId: string): Promise<Media> {
    // const response = await api.post('/media/confirm', { media_id: mediaId })
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // DELETE /media/{media_id} - Delete media
  async delete(mediaId: string): Promise<void> {
    // await api.delete(`/media/${mediaId}`)
    throw new Error('Backend not implemented yet - using mock data')
  },
}

/**
 * Faces API - Backend Endpoints
 * 
 * TODO: Uncomment and test when backend is ready
 */
export const facesApi = {
  // GET /faces/clusters/{event_id} - Get all face clusters for event
  async getClusters(eventId: string): Promise<FaceCluster[]> {
    // const response = await api.get(`/faces/clusters/${eventId}`)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // GET /faces/cluster/{cluster_id}/media - Get media containing this face
  async getMediaByCluster(clusterId: string): Promise<Media[]> {
    // const response = await api.get(`/faces/cluster/${clusterId}/media`)
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // POST /faces/identify - Identify cluster as current user
  async identifyCluster(clusterId: string): Promise<FaceCluster> {
    // const response = await api.post('/faces/identify', { cluster_id: clusterId })
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },

  // POST /faces/search - Upload photo to find similar faces
  async searchSimilar(eventId: string, imageFile: File): Promise<FaceCluster[]> {
    // const formData = new FormData()
    // formData.append('file', imageFile)
    // formData.append('event_id', eventId)
    // 
    // const response = await api.post('/faces/search', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // })
    // return response.data
    throw new Error('Backend not implemented yet - using mock data')
  },
}

/**
 * Combined API export
 */
export const backendApi = {
  events: eventsApi,
  media: mediaApi,
  faces: facesApi,
}

export default backendApi

