import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import EmptyState from '../components/ui/EmptyState'
import { useGeolocation } from '../hooks/useGeolocation'
import { getPublicEvents } from '../api/events'
import { useQuery } from '@tanstack/react-query'
import { isWithinRadius } from '../utils/distance'
import { filterEventsByTimeWindow } from '../utils/eventFilter'
import InteractiveMap from '../components/homepage/InteractiveMap'

const HomePage = () => {
  // Test geolocation hook
  const { coordinates, error, loading } = useGeolocation()
  
  // Default center (New York City) - used when location is not available
  const defaultCenter: [number, number] = [40.7128, -74.0060]
  const mapCenter: [number, number] = coordinates
    ? [coordinates.latitude, coordinates.longitude]
    : defaultCenter
  
  // Fetch public events API
  const { data: publicEvents, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['publicEvents', coordinates?.latitude, coordinates?.longitude],
    queryFn: () => getPublicEvents({
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      radius: 50, // 50 km (backend doesn't filter by radius yet)
      limit: 50,
    }),
    enabled: !!coordinates?.latitude && !!coordinates?.longitude,
  })

  // Filter events by time window (24 hours before/after event date) and distance (1 mile radius)
  let filteredEvents = publicEvents || []
  
  // First, filter by time window (24 hours)
  filteredEvents = filterEventsByTimeWindow(filteredEvents, 24)
  
  // Then, filter by distance (1 mile radius) if coordinates are available
  if (coordinates) {
    filteredEvents = filteredEvents.filter((event) => {
      if (!event.latitude || !event.longitude) return false
      return isWithinRadius(
        { latitude: coordinates.latitude, longitude: coordinates.longitude },
        { latitude: event.latitude, longitude: event.longitude },
        1 // 1 mile radius
      )
    })
  }
  
  return (
    <div className="w-full h-full">
      {/* Map Section - Fits within Layout (respects header/footer) */}
      <div 
        className="w-full relative"
        style={{ 
          height: 'var(--content-height)',
          minHeight: '500px',
          maxHeight: 'calc(100vh - 180px)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full bg-neutral-50">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Getting your location...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-neutral-50">
            <div className="text-center max-w-md p-6">
              <ErrorMessage
                title="Location Error"
                message={error.message || 'Unable to get your location. Please enable location services to see events on the map.'}
              />
            </div>
          </div>
        ) : eventsLoading ? (
          <div className="flex items-center justify-center h-full bg-neutral-50">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading events...</p>
            </div>
          </div>
        ) : eventsError ? (
          <div className="flex items-center justify-center h-full bg-neutral-50">
            <div className="text-center max-w-md p-6">
              <ErrorMessage
                title="Error Loading Events"
                message={eventsError instanceof Error ? eventsError.message : 'Failed to load events. Please try again.'}
              />
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-neutral-50">
            <div className="text-center max-w-md p-6">
              <EmptyState
                title="No events nearby"
                message="There are no public events within 1 mile of your location that are happening soon or happened in the last 24 hours. Check back later or create your own event!"
              />
            </div>
          </div>
        ) : (
          <InteractiveMap
            center={mapCenter}
            zoom={coordinates ? 13 : 10}
            events={filteredEvents}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
