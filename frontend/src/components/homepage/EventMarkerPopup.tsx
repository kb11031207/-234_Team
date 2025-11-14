import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Event } from '../../types'
import Button from '../ui/Button'
import { getEventTimeRemaining } from '../../utils/eventFilter'
import { reverseGeocode } from '../../utils/geocoding'

export interface EventMarkerPopupProps {
  event: Event
}

const EventMarkerPopup: React.FC<EventMarkerPopupProps> = ({ event }) => {
  const timeRemaining = getEventTimeRemaining(event)
  const [locationAddress, setLocationAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

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

  // Reverse geocode coordinates to get address when location_text is not available
  useEffect(() => {
    if (!event.location_text && event.latitude && event.longitude) {
      const lat = formatCoordinate(event.latitude)
      const lng = formatCoordinate(event.longitude)
      
      if (lat && lng) {
        setIsLoadingAddress(true)
        reverseGeocode(lat, lng)
          .then((address) => {
            setLocationAddress(address)
          })
          .catch(() => {
            // Silently handle errors - reverseGeocode already handles CORS errors gracefully
            // Fallback to coordinates if reverse geocoding fails
            setLocationAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
          })
          .finally(() => {
            setIsLoadingAddress(false)
          })
      }
    } else {
      setLocationAddress(null)
    }
  }, [event.location_text, event.latitude, event.longitude])

  return (
    <div className="p-4 min-w-[200px] max-w-[300px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
      
      {event.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
      )}
      
      {/* Location - show location_text if available, otherwise show reverse geocoded address or coordinates */}
      {(event.location_text || locationAddress) && (
        <p className="text-sm text-gray-700 mb-2 font-medium">
          📍 {event.location_text || (isLoadingAddress ? 'Loading address...' : locationAddress)}
        </p>
      )}
      
      {event.event_date && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">
            📅 {formatEventDate(event.event_date)}
          </p>
          {timeRemaining && (
            <p className={`text-xs font-medium ${timeRemaining.isPast ? 'text-orange-600' : 'text-green-600'}`}>
              {timeRemaining.isPast
                ? `⏰ ${timeRemaining.hours}h ${timeRemaining.minutes}m ago`
                : `⏰ ${timeRemaining.hours}h ${timeRemaining.minutes}m until event`}
            </p>
          )}
        </div>
      )}
      
      <div className="mt-3">
        <Link to={`/events/${event.event_id}`}>
          <Button variant="primary" size="sm" className="w-full">
            View Event
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default EventMarkerPopup
