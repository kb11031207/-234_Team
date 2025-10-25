import { apiClient } from '../lib/api'
import { Media } from '../types'

export const searchByFaceId = async (eventId: string, faceId: string): Promise<Media[]> => {
  const response = await apiClient.post<{ matches: Media[]; total: number }>(`/api/faces/search`, {
    event_id: eventId,
    face_id: faceId,
  })
  return response.data.matches
}

export const getMediaFaces = async (mediaId: string) => {
  const response = await apiClient.get(`/api/media/${mediaId}/faces`)
  return response.data
}

export default {
  searchByFaceId,
  getMediaFaces,
}