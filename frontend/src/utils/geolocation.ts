// Geolocation utilities

export interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  error: GeolocationPositionError | null;
}

/**
 * Get current position (one-time)
 */
export const getCurrentPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    )
  })
}

/**
 * Watch position (continuous updates)
 * Returns watch ID that can be used to clear the watch
 */
export const watchPosition = (
  onSuccess: (position: GeolocationPosition) => void,
  onError?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number => {
  if (!navigator.geolocation) {
    if (onError) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
    }
    return 0
  }

  return navigator.geolocation.watchPosition(
    onSuccess,
    onError || (() => {}),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }
  )
}

/**
 * Clear position watch
 */
export const clearWatch = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId)
  }
}