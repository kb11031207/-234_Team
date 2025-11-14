import apiClient from '../lib/api'
import { Media } from '../types'

/**
 * Face bounding box (normalized coordinates 0-1)
 */
export interface FaceBbox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Face cluster information
 */
export interface FaceClusterInfo {
  cluster_id: string
  face_count: number
  identified_user_id?: string | null
}

/**
 * Face data from API
 */
export interface FaceData {
  face_id: string
  bbox: FaceBbox
  confidence: number
  cluster: FaceClusterInfo | null // Can be null if face hasn't been assigned to a cluster yet
}

/**
 * Response from getMediaFaces API
 */
export interface MediaFacesResponse {
  media_id: string
  faces: FaceData[]
  total_faces: number
}

/**
 * Response from searchBySelfie API
 */
export interface SearchBySelfieResponse {
  matches: Media[]
  total: number
  faces_matched: number
  message: string
}

/**
 * Response from searchByFaceId API
 */
export interface SearchByFaceIdResponse {
  cluster_id: string
  face_count: number
  media: Media[]
}

/**
 * Get all faces in a media item
 * @param mediaId Media UUID
 * @returns Promise with faces data
 */
export const getMediaFaces = async (mediaId: string): Promise<MediaFacesResponse> => {
  const response = await apiClient.get(`/api/v1/faces/media/${mediaId}/faces`)
  return response.data
}

/**
 * Search for photos by selfie upload
 * @param eventId Event UUID
 * @param file Image file (selfie)
 * @param tolerance Face matching tolerance (0.0-1.0, default: 0.6)
 * @returns Promise with matching media
 */
export const searchBySelfie = async (
  eventId: string,
  file: File,
  tolerance: number = 0.6
): Promise<SearchBySelfieResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  // Don't set Content-Type header - browser will set it automatically with boundary
  // The API client interceptor will handle removing the default Content-Type for FormData
  const response = await apiClient.post(
    `/api/v1/faces/search-by-selfie?event_id=${eventId}&tolerance=${tolerance}`,
    formData
  )
  return response.data
}

/**
 * Search for photos by face ID (find similar faces)
 * @param faceId Face UUID
 * @param limit Maximum number of photos to return (default: 50)
 * @returns Promise with matching media
 */
export const searchByFaceId = async (
  faceId: string,
  limit: number = 50
): Promise<SearchByFaceIdResponse> => {
  const response = await apiClient.post(`/api/v1/faces/search-by-face/${faceId}?limit=${limit}`)
  return response.data
}

