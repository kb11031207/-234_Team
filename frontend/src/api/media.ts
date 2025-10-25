import apiClient from '../lib/api'
import axios from 'axios'
import { Media, UploadRequest, PresignedUploadResponse } from '../types'

export const getUploadUrl = async (data: UploadRequest): Promise<PresignedUploadResponse> => {
  const response = await apiClient.post('/api/v1/media/upload-url', data)
  return response.data
}

export const uploadToBlob = async (uploadUrl: string, file: File): Promise<void> => {
  // Upload directly to Azure Blob Storage
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
      'x-ms-blob-type': 'BlockBlob',
    },
  })
}

export const confirmUpload = async (mediaId: string): Promise<void> => {
  await apiClient.post(`/api/v1/media/${mediaId}/confirm`)
}

export const getEventMedia = async (eventId: string): Promise<Media[]> => {
  const response = await apiClient.get(`/api/v1/media/events/${eventId}/media`)
  return response.data
}

