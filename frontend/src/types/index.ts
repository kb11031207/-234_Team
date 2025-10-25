// Type definitions for the application

export interface User {
  user_id: string
  firebase_uid: string
  email?: string
  display_name?: string
  photo_url?: string
  created_at: string
}

export interface Event {
  event_id: string
  owner_id: string
  title: string
  description?: string
  access_code: string
  qr_code_url?: string
  is_public: boolean
  can_add: 'owner_only' | 'code_holders' | 'public'
  event_date?: string
  location_text?: string
  latitude?: number
  longitude?: number
  cover_photo_url?: string
  created_at: string
  updated_at: string
}

export interface Media {
  media_id: string
  event_id: string
  uploader_id?: string
  blob_url: string
  thumbnail_url?: string
  filename?: string
  content_type?: string
  file_size?: number
  width?: number
  height?: number
  media_type: 'photo' | 'video'
  face_detection_status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  face_count: number
  created_at: string
}

export interface DetectedFace {
  face_id: string
  media_id: string
  bbox_x: number
  bbox_y: number
  bbox_width: number
  bbox_height: number
  confidence: number
  created_at: string
}

export interface FaceCluster {
  cluster_id: string
  event_id: string
  representative_face_id?: string
  face_count: number
  identified_user_id?: string
  identified_at?: string
  created_at: string
}

export interface CreateEventData {
  title: string
  description?: string
  is_public: boolean
  can_add: 'owner_only' | 'code_holders' | 'public'
  event_date?: string
  location_text?: string
  latitude?: number
  longitude?: number
}

export interface UploadRequest {
  event_id: string
  filename: string
  content_type: string
  file_size: number
  uploader_id?: string
}

export interface PresignedUploadResponse {
  upload_url: string
  media_id: string
  blob_url: string
}

