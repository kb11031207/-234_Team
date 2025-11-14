import { useState, useEffect } from 'react'
import { GeolocationState } from '../utils/geolocation'

export const useGeolocation = (): GeolocationState & { loading: boolean } => {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      setPermission('denied')
      setLoading(false)
      return
    }

    // Check permission status (if available)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'prompt')
      })
    }

    // Get current position
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoordinates(position.coords)
        setPermission('granted')
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        if (err.code === err.PERMISSION_DENIED) {
          setPermission('denied')
        } else {
          setPermission('prompt')
        }
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Cleanup: clear watch on unmount
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  return {
    coordinates,
    permission,
    error,
    loading,
  }
}
