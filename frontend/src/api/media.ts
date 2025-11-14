import apiClient from '../lib/api'
import axios from 'axios'
import { Media, PresignedUploadResponse, UploadRequest } from '../types'

/**
 * Get all media for an event
 * @param eventId Event UUID
 * @param limit Maximum number of results (default: 50)
 * @param offset Pagination offset (default: 0)
 * @returns Promise with Media array
 */
export const getEventMedia = async (
  eventId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Media[]> => {
  const response = await apiClient.get(`/api/v1/media/events/${eventId}/media`, {
    params: {
      limit,
      offset,
    },
  })
  return response.data
}

/**
 * Get a single media item by ID
 * @param mediaId Media UUID
 * @returns Promise with Media object
 */
export const getMedia = async (mediaId: string): Promise<Media> => {
  const response = await apiClient.get(`/api/v1/media/${mediaId}`)
  return response.data
}

/**
 * Get presigned URL for uploading media
 * @param data Upload request data
 * @returns Promise with presigned URL and media ID
 */
export const getUploadUrl = async (data: UploadRequest): Promise<PresignedUploadResponse> => {
  const response = await apiClient.post('/api/v1/media/upload-url', data)
  return response.data
}

/**
 * Confirm media upload and trigger face detection
 * @param mediaId Media UUID
 * @returns Promise with confirmation status
 */
export const confirmUpload = async (mediaId: string): Promise<{ status: string; media_id: string }> => {
  const response = await apiClient.post(`/api/v1/media/${mediaId}/confirm`)
  return response.data
}

/**
 * Upload file directly to Azure Blob Storage using presigned URL
 * @param uploadUrl Presigned URL from getUploadUrl
 * @param file File to upload
 * @returns Promise that resolves when upload is complete
 */
export const uploadToBlob = async (uploadUrl: string, file: File): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
      'x-ms-blob-type': 'BlockBlob',
    },
  })
}

/**
 * Delete media
 * @param mediaId Media UUID
 * @returns Promise with deletion confirmation
 */
export const deleteMedia = async (mediaId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/api/v1/media/${mediaId}`)
  return response.data
}
