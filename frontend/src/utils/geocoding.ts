// Geocoding utilities using OpenStreetMap Nominatim API (free, no API key required)

export interface GeocodingResult {
  lat: number
  lon: number
  display_name: string
  place_id: number
}

export interface GeocodingResponse {
  lat: string
  lon: string
  display_name: string
  place_id: number
}

/**
 * Geocode an address/location name to coordinates
 * @param query Address or location name (e.g., "Central Park, NYC")
 * @returns Promise with geocoding results
 */
export const geocodeAddress = async (query: string): Promise<GeocodingResult[]> => {
  if (!query.trim()) {
    return []
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'The Scene Event App', // Required by Nominatim
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data: GeocodingResponse[] = await response.json()

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
      place_id: item.place_id,
    }))
  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('Failed to geocode address. Please try again or select a location on the map.')
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param lat Latitude (number or string)
 * @param lon Longitude (number or string)
 * @returns Promise with address string
 */
export const reverseGeocode = async (lat: number | string, lon: number | string): Promise<string> => {
  // Ensure lat and lon are numbers
  const latNum = typeof lat === 'number' ? lat : parseFloat(String(lat))
  const lonNum = typeof lon === 'number' ? lon : parseFloat(String(lon))
  
  // If conversion fails, return coordinates as-is
  if (isNaN(latNum) || isNaN(lonNum)) {
    return `${lat}, ${lon}`
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lonNum}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'The Scene Event App',
        },
      }
    )

    if (!response.ok) {
      // If response is not OK, silently fall back to coordinates
      // Don't throw error to avoid logging CORS/403 errors
      return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
    }

    const data = await response.json()
    return data.display_name || `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
  } catch (error) {
    // Silently handle ALL errors (CORS, network, 403, etc.) - just return coordinates
    // This prevents console spam from CORS policy errors which are expected
    // when accessing OpenStreetMap Nominatim API from a browser
    
    // Check if it's a CORS or network error - these are always silent
    const isNetworkError = 
      error instanceof TypeError ||
      (error instanceof Error && (
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('CORS')
      ))
    
    // Check if it's a 403/Forbidden error - also silent (expected with CORS)
    const isForbiddenError = 
      error instanceof Error && error.message.includes('403')
    
    // Only log if it's a truly unexpected error (very rare)
    if (!isNetworkError && !isForbiddenError && error instanceof Error) {
      // This should rarely happen, but if it does, log it
      console.warn('Unexpected reverse geocoding error:', error.message)
    }
    
    // Always return coordinates as fallback - no error logging
    return `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
  }
}

