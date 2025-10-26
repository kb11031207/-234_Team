/**
 * API Service Layer
 * 
 * This is the main API entry point for the application.
 * 
 * 🔄 Switch between mock and real API here:
 * - Development without backend: Use mockApi
 * - Development with backend: Use backendApi
 * 
 * Change the export below to switch:
 */

// Use mock API for now (no backend required)
/**
 * API Layer Index
 * 
 * This file exports all API functions for the app.
 * Import what you need: import { createEvent, getMyEvents } from '../api'
 */

// Export all API functions (modern approach)
export * from './events'
export * from './media'
export * from './faces'

// Export mock API
export { mockApi } from './mock-api'

// For backward compatibility with pages not yet updated
// This allows old code like: import { api } from '../api'
import { mockApi } from './mock-api'
export const api = mockApi

// Also export types
export type { Event, Media, FaceCluster } from '../lib/mockData'

