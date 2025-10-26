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
import { mockApi } from './mock-api'
export const api = mockApi

// TODO: When backend is ready, comment out above and uncomment below:
// import { backendApi } from './backend-api'
// export const api = backendApi

// Also export types
export type { Event, Media, FaceCluster } from '../lib/mockData'

