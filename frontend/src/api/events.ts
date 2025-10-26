import apiClient from '../lib/api'
import { Event, CreateEventData } from '../types'

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

export const validateAccessCode = async (accessCode: string): Promise<any> => {
  const response = await apiClient.post('/api/v1/events/validate-access', {
    access_code: accessCode,
  })
  return response.data
}

export const getPublicEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get('/api/v1/events/public')
  return response.data
}

export const updateEvent = async (eventId: string, data: Partial<CreateEventData>): Promise<Event> => {
  const response = await apiClient.put(`/api/v1/events/${eventId}`, data)
  return response.data
}

export const deleteEvent = async (eventId: string): Promise<void> => {
  await apiClient.delete(`/api/v1/events/${eventId}`)
}

