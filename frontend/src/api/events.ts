import apiClient from '../lib/api'
import { Event, CreateEventData } from '../types'

export const createEvent = async (data: CreateEventData): Promise<Event> => {
  const response = await apiClient.post('/api/v1/events', data)
  return response.data as Event
}

export const getEvent = async (eventId: string): Promise<Event> => {
  const response = await apiClient.get(`/api/v1/events/${eventId}`)
  return response.data as Event
}

export const getMyEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get('/api/v1/events/me/events')
  return response.data as Event[]
}

export const validateAccessCode = async (accessCode: string): Promise<any> => {
  const response = await apiClient.post('/api/v1/events/validate-access', {
    access_code: accessCode,
  })
  return response.data
}

