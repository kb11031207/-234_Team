import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EventMap from '../components/map/EventMap'
import { getPublicEvents, validateAccessCode } from '../api'
import { Event } from '../types'
import { getCurrentPosition, Coordinates, calculateDistance, formatDistance } from '../lib/geolocation'

const HomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  
  // Map state
  const [showMap, setShowMap] = useState(false)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [publicEvents, setPublicEvents] = useState<Event[]>([])
  const [loadingLocation, setLoadingLocation] = useState(false)
  
  // Nearby events list modal
  const [showNearbyModal, setShowNearbyModal] = useState(false)
  const [nearbyEvents, setNearbyEvents] = useState<(Event & { distance: number })[]>([])

  // Check if join modal should open from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('join') === 'true') {
      setIsJoinModalOpen(true)
      // Clean up URL
      navigate('/', { replace: true })
    }
  }, [location, navigate])

  const handleJoinEvent = () => {
    if (accessCode.trim()) {
      navigate(`/events/${accessCode}`)
      setIsJoinModalOpen(false)
      setAccessCode('')
    }
  }

  const handleShowNearbyEvents = async () => {
    setLoadingLocation(true)
    setLocationError(null)

    try {
      // Get user location
      const position = await getCurrentPosition()
      setUserLocation(position)

      // Fetch public events from backend
      const events = await getPublicEvents()
      const publicEventsWithCoords = events.filter(
        (event) => event.latitude && event.longitude
      )
      setPublicEvents(publicEventsWithCoords)

      // Calculate distances and filter within 50 miles (80.47 km)
      const eventsWithDistance = publicEventsWithCoords.map((event) => ({
        ...event,
        distance: calculateDistance(position, {
          latitude: event.latitude!,
          longitude: event.longitude!,
        }),
      }))

      // Filter events within 50 miles and sort by distance
      const nearby = eventsWithDistance
        .filter((event) => event.distance <= 80.47) // 50 miles in km
        .sort((a, b) => a.distance - b.distance)

      setNearbyEvents(nearby)
      setShowNearbyModal(true)

      // Show map
      setShowMap(true)
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError(
        error instanceof Error ? error.message : 'Unable to get your location. Please enable location services.'
      )
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleEventClick = (event: Event) => {
    navigate(`/events/${event.event_id}`)
  }

  // Auto-load map on mount
  useEffect(() => {
    if (!userLocation && !loadingLocation && !locationError) {
      handleShowNearbyEvents()
    }
  }, [])

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        onShowMap={handleShowNearbyEvents}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
        currentPage="/" 
      />

      {/* Main Content Area - Single unified scrollable section */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-neutral-light to-white">
        <div className="max-w-7xl mx-auto p-8">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-title text-text-primary mb-3">
              welcome to eventmemory
            </h2>
            <p className="text-subtitle text-text-secondary max-w-2xl mx-auto">
              share and discover memories from your events with ai-powered face detection
            </p>
          </div>

          {/* Map Section - Now part of the scrollable content */}
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subtitle">🗺️ discovering nearby events</h3>
              {!loadingLocation && !locationError && (
                <Button 
                  variant="secondary" 
                  onClick={handleShowNearbyEvents}
                  className="text-sm"
                >
                  refresh location
                </Button>
              )}
            </div>

            <div className="h-[500px] rounded-lg overflow-hidden relative bg-neutral-light">
              {loadingLocation && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-light/95 z-10">
                  <div className="text-center">
                    <div className="inline-block bg-white px-8 py-4 rounded-lg shadow-card">
                      <p className="text-subtitle text-text-primary mb-2">
                        🌍 finding your location...
                      </p>
                      <p className="text-body text-text-secondary">
                        please allow location access
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {locationError && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-light/95 z-10">
                  <div className="text-center">
                    <div className="inline-block bg-red-50 border-2 border-red-200 px-8 py-4 rounded-lg shadow-card">
                      <p className="text-subtitle text-red-700 mb-2">
                        📍 location unavailable
                      </p>
                      <p className="text-body text-red-600 mb-4">
                        {locationError}
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleShowNearbyEvents}
                      >
                        try again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {userLocation && publicEvents.length > 0 ? (
                <EventMap
                  events={publicEvents}
                  userLocation={userLocation}
                  onEventClick={handleEventClick}
                  className="h-full"
                />
              ) : (
                !loadingLocation && !locationError && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🗺️</div>
                      <p className="text-subtitle text-text-secondary mb-2">
                        loading map...
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Stats Bar */}
            {publicEvents.length > 0 && (
              <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-neutral-dark/10">
                <div className="text-center">
                  <p className="text-3xl font-title text-accent">{publicEvents.length}</p>
                  <p className="text-label text-text-secondary">nearby events</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-title text-accent">
                    {nearbyEvents.length}
                  </p>
                  <p className="text-label text-text-secondary">within 50 miles</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-title text-accent">
                    {publicEvents.filter(e => e.is_public).length}
                  </p>
                  <p className="text-label text-text-secondary">public events</p>
                </div>
              </div>
            )}
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="space-y-2 hover:shadow-lg transition-shadow text-center">
              <div className="text-3xl">📸</div>
              <h3 className="text-subtitle">easy uploads</h3>
              <p className="text-body text-text-secondary text-sm">
                drag & drop photos
              </p>
            </Card>

            <Card className="space-y-2 hover:shadow-lg transition-shadow text-center">
              <div className="text-3xl">🔐</div>
              <h3 className="text-subtitle">secure access</h3>
              <p className="text-body text-text-secondary text-sm">
                private event codes
              </p>
            </Card>

            <Card className="space-y-2 hover:shadow-lg transition-shadow text-center">
              <div className="text-3xl">🧠</div>
              <h3 className="text-subtitle">ai detection</h3>
              <p className="text-body text-text-secondary text-sm">
                group photos by person
              </p>
            </Card>

            <Card className="space-y-2 hover:shadow-lg transition-shadow text-center">
              <div className="text-3xl">🔍</div>
              <h3 className="text-subtitle">find yourself</h3>
              <p className="text-body text-text-secondary text-sm">
                instant photo search
              </p>
            </Card>
          </div>

          {/* Getting Started */}
          <div className="text-center">
            <Card className="inline-block max-w-2xl">
              <h3 className="text-subtitle mb-4">getting started</h3>
              <div className="grid md:grid-cols-2 gap-4 text-body text-text-secondary text-left">
                <div>
                  <p className="mb-2">📍 <strong>Nearby Events:</strong> shown on map above</p>
                  <p className="mb-2">🔑 <strong>Join Event:</strong> use sidebar button</p>
                </div>
                <div>
                  <p className="mb-2">➕ <strong>Create Event:</strong> sign in first</p>
                  <p className="mb-2">🗺️ <strong>Explore:</strong> click markers to view events</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tagline */}
          <div className="text-center mt-8 mb-4">
            <p className="text-label text-text-secondary">
              nostalgic • refined • elegant
            </p>
          </div>
        </div>
      </div>

      {/* Join Event Modal */}
      <Modal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)}
        title="join event"
      >
        <div className="space-y-4">
          <Input
            label="access code"
            placeholder="enter event code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinEvent()}
            className="uppercase"
          />
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              fullWidth
              onClick={handleJoinEvent}
              disabled={!accessCode.trim()}
            >
              join
            </Button>
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => setIsJoinModalOpen(false)}
            >
              cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nearby Events List Modal */}
      <Modal
        isOpen={showNearbyModal}
        onClose={() => setShowNearbyModal(false)}
        title="nearby events"
      >
        <div className="space-y-4">
          {loadingLocation ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌍</div>
              <p className="text-subtitle text-text-secondary">finding nearby events...</p>
            </div>
          ) : nearbyEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-subtitle mb-2">no nearby events</h3>
              <p className="text-body text-text-secondary max-w-md mx-auto">
                there are no public events within 50 miles of your location
              </p>
            </div>
          ) : (
            <>
              <p className="text-body text-text-secondary mb-2">
                found {nearbyEvents.length} event{nearbyEvents.length !== 1 ? 's' : ''} within 50 miles
              </p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {nearbyEvents.map((event) => (
                  <Card
                    key={event.event_id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      navigate(`/events/${event.event_id}`)
                      setShowNearbyModal(false)
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-accent/20 rounded-lg overflow-hidden">
                        {event.cover_photo_url ? (
                          <img
                            src={event.cover_photo_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎉
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-subtitle font-semibold truncate">
                            {event.title}
                          </h3>
                          <span className="flex-shrink-0 text-body text-accent font-medium">
                            {formatDistance(event.distance)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-body text-text-secondary line-clamp-2 mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-label text-text-secondary">
                          {event.event_date && (
                            <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                          )}
                          {event.location_text && (
                            <span className="truncate">📍 {event.location_text}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="pt-2 border-t border-neutral-dark/10">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowNearbyModal(false)}
                >
                  close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default HomePage

