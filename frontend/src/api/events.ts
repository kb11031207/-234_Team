import apiClient from '../lib/api'
import { Event, CreateEventData } from '../types'

export interface GetPublicEventsParams {
  latitude?: number
  longitude?: number
  radius?: number // Radius in km (default: 50)
  limit?: number // Max results (default: 50)
}

export const createEvent = async (data: CreateEventData): Promise<Event> => {
  const response = await apiClient.post('/api/v1/events', data)
  return response.data
}

export const getEvent = async (eventId: string): Promise<Event> => {
  const response = await apiClient.get(`/api/v1/events/${eventId}`)
  return response.data
}

export const getMyEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get('/api/v1/events/me/events')
  return response.data
}

export const getPublicEvents = async (params?: GetPublicEventsParams): Promise<Event[]> => {
  const queryParams = new URLSearchParams()
  
  if (params?.latitude !== undefined) {
    queryParams.append('latitude', params.latitude.toString())
  }
  if (params?.longitude !== undefined) {
    queryParams.append('longitude', params.longitude.toString())
  }
  if (params?.radius !== undefined) {
    // Round radius to integer since API expects integer
    queryParams.append('radius', Math.round(params.radius).toString())
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString())
  }
  
  const queryString = queryParams.toString()
  const url = `/api/v1/events/public${queryString ? `?${queryString}` : ''}`
  
  const response = await apiClient.get(url)
  return response.data
}

export const validateAccessCode = async (accessCode: string): Promise<any> => {
  const response = await apiClient.post('/api/v1/events/validate-access', {
    access_code: accessCode,
  })
  return response.data
}

/**
 * Update an event
 * @param eventId Event UUID
 * @param data Partial event data to update (all fields optional)
 * @returns Promise with updated Event
 */
export const updateEvent = async (
  eventId: string,
  data: Partial<CreateEventData>
): Promise<Event> => {
  const response = await apiClient.put(`/api/v1/events/${eventId}`, data)
  return response.data
}

