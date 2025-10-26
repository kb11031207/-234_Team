import apiClient from '../lib/api'
import { FaceCluster, Media } from '../types'

export const getFaceClusters = async (eventId: string): Promise<FaceCluster[]> => {
  const response = await apiClient.get(`/api/v1/faces/events/${eventId}/clusters`)
  return response.data.clusters || []
}

export const searchFacesBySelfie = async (eventId: string, imageFile: File): Promise<{
  matches: Media[]
  total: number
  faces_matched?: number
  message: string
}> => {
  const formData = new FormData()
  formData.append('file', imageFile)

  const response = await apiClient.post(`/api/v1/faces/search-by-selfie?event_id=${eventId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const searchFacesByFaceId = async (faceId: string): Promise<{
  cluster_id: string | null
  face_count: number
  media: Media[]
}> => {
  const response = await apiClient.post(`/api/v1/faces/search-by-face/${faceId}`)
  return response.data
}

export const getMediaFaces = async (mediaId: string): Promise<{
  media_id: string
  faces: Array<{
    face_id: string
    bbox: { x: number; y: number; width: number; height: number }
    confidence: number
    cluster?: {
      cluster_id: string
      face_count: number
      identified_user_id: string | null
    }
  }>
  total_faces: number
}> => {
  const response = await apiClient.get(`/api/v1/faces/media/${mediaId}/faces`)
  return response.data
}

export const identifyCluster = async (clusterId: string): Promise<any> => {
  const response = await apiClient.post(`/api/v1/faces/clusters/${clusterId}/identify`)
  return response.data
}

export const triggerClustering = async (eventId: string, tolerance = 0.6): Promise<any> => {
  const response = await apiClient.post(`/api/v1/faces/events/${eventId}/trigger-clustering?tolerance=${tolerance}`)
  return response.data
}

