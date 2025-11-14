import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../api/events'
import { getEventMedia } from '../api/media'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import EmptyState from '../components/ui/EmptyState'
import PhotoGrid from '../components/media/PhotoGrid'
import PhotoViewer from '../components/media/PhotoViewer'
import { Media } from '../types'
import { reverseGeocode } from '../utils/geocoding'
import { useState, useEffect } from 'react'

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [locationAddress, setLocationAddress] = useState<string | null>(null)
  
  // Fetch event details
  const { data: event, isLoading: eventLoading, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId,
  })

  // Fetch event media
  const {
    data: media,
    isLoading: mediaLoading,
    error: mediaError,
  } = useQuery({
    queryKey: ['eventMedia', eventId],
    queryFn: () => getEventMedia(eventId!, 50, 0),
    enabled: !!eventId,
  })

  // Helper function to safely format coordinates (same as EventMarkerPopup)
  const formatCoordinate = (coord: number | string | undefined): number | null => {
    if (coord == null) return null
    try {
      const num = typeof coord === 'number' ? coord : parseFloat(String(coord))
      if (isNaN(num)) return null
      return num
    } catch {
      return null
    }
  }

  // Reverse geocode location if coordinates are available
  useEffect(() => {
    if (event?.latitude && event.longitude && !event.location_text) {
      const lat = formatCoordinate(event.latitude)
      const lng = formatCoordinate(event.longitude)
      
      if (lat && lng) {
        reverseGeocode(lat, lng)
          .then((address) => {
            setLocationAddress(address)
          })
          .catch(() => {
            // Silently handle errors - reverseGeocode already handles CORS errors gracefully
            // Just fallback to coordinates (this should rarely be called since reverseGeocode
            // handles errors internally, but keeping it as a safety net)
            setLocationAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          })
      } else {
        setLocationAddress(null)
      }
    } else {
      setLocationAddress(null)
    }
  }, [event?.latitude, event?.longitude, event?.location_text])

  const formatEventDate = (dateString: string | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const handlePhotoClick = (_photo: Media, index: number) => {
    setSelectedPhotoIndex(index)
  }

  const handleCloseViewer = () => {
    setSelectedPhotoIndex(null)
  }

  const handleNextPhoto = () => {
    if (media && selectedPhotoIndex !== null) {
      const photos = media.filter((m) => m.media_type === 'photo')
      if (selectedPhotoIndex < photos.length - 1) {
        setSelectedPhotoIndex(selectedPhotoIndex + 1)
      }
    }
  }

  const handlePreviousPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }

  const handleFaceClick = (faceId: string) => {
    // TODO: Implement face search - navigate to search results or show modal
    console.log('Face clicked:', faceId)
    // Could navigate to a face search results page or show similar photos
    // For now, just log the face ID
  }

  // Get photos only (filter out videos)
  const photos = media ? media.filter((m) => m.media_type === 'photo') : []

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading event...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <ErrorMessage
              title="Error Loading Event"
              message={
                eventError instanceof Error ? eventError.message : 'Failed to load event. Please try again.'
              }
            />
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <EmptyState title="Event Not Found" message="The event you're looking for doesn't exist." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Event Header */}
        <Card className="mb-6">
          <Card.Header>
            <h1 className="text-3xl font-bold text-gray-800">{event.title}</h1>
            {event.description && (
              <p className="text-gray-600 mt-2">{event.description}</p>
            )}
          </Card.Header>

          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Date */}
              {event.event_date && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Event Date</p>
                    <p className="text-sm text-gray-600">{formatEventDate(event.event_date)}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {(event.location_text || locationAddress) && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">📍</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-sm text-gray-600">{event.location_text || locationAddress}</p>
                  </div>
                </div>
              )}

              {/* Access Code */}
              <div className="flex items-start gap-2">
                <span className="text-gray-500">🔑</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Access Code</p>
                  <p className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded inline-block">
                    {event.access_code}
                  </p>
                </div>
              </div>

              {/* Public/Private Status */}
              <div className="flex items-start gap-2">
                <span className="text-gray-500">🌐</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">Visibility</p>
                  <p className="text-sm text-gray-600">
                    {event.is_public ? 'Public' : 'Private'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200">
              <Link to={`/events/${eventId}/upload`}>
                <Button variant="primary" size="lg">
                  📤 Upload Photos
                </Button>
              </Link>
              <Link to={`/events/${eventId}/search`}>
                <Button variant="secondary" size="lg">
                  🔍 Find My Photos
                </Button>
              </Link>
            </div>
          </Card.Body>
        </Card>

        {/* Photo Gallery */}
        <Card>
          <Card.Header>
            <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
            {media && media.length > 0 && (
              <p className="text-gray-600 mt-1">
                {media.filter((m) => m.media_type === 'photo').length} photo
                {media.filter((m) => m.media_type === 'photo').length !== 1 ? 's' : ''}
              </p>
            )}
          </Card.Header>

          <Card.Body>
            {mediaLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Loading photos...</p>
                </div>
              </div>
            ) : mediaError ? (
              <div className="flex items-center justify-center py-12">
                <ErrorMessage
                  title="Error Loading Photos"
                  message={
                    mediaError instanceof Error
                      ? mediaError.message
                      : 'Failed to load photos. Please try again.'
                  }
                />
              </div>
            ) : !media || media.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <EmptyState
                  title="No Photos Yet"
                  message="This event doesn't have any photos yet. Be the first to upload!"
                  action={{
                    label: 'Upload Photos',
                    onClick: () => {
                      window.location.href = `/events/${eventId}/upload`
                    },
                    variant: 'primary',
                  }}
                />
              </div>
            ) : (
              <PhotoGrid
                media={media}
                onPhotoClick={handlePhotoClick}
                isLoading={mediaLoading}
              />
            )}
          </Card.Body>
        </Card>

        {/* Photo Viewer/Lightbox */}
        {selectedPhotoIndex !== null && photos.length > 0 && (
          <PhotoViewer
            photos={photos}
            currentIndex={selectedPhotoIndex}
            isOpen={selectedPhotoIndex !== null}
            onClose={handleCloseViewer}
            onNext={handleNextPhoto}
            onPrevious={handlePreviousPhoto}
            onFaceClick={handleFaceClick}
            showFaceOverlays={true}
          />
        )}
      </div>
    </div>
  )
}

export default EventPage
