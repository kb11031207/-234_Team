import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Event } from '../../types'
import { Coordinates, calculateDistance, formatDistance } from '../../lib/geolocation'
import Button from '../ui/Button'

// Fix Leaflet default icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Custom icon for user location (blue dot)
const UserIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="8" fill="#3973ff" stroke="white" stroke-width="3"/>
      <circle cx="15" cy="15" r="12" fill="none" stroke="#3973ff" stroke-width="1" opacity="0.3"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

interface EventMapProps {
  events: Event[]
  userLocation: Coordinates
  onEventClick?: (event: Event) => void
  className?: string
}

// Component to recenter map when user location changes
function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function EventMap({
  events,
  userLocation,
  onEventClick,
  className = '',
}: EventMapProps) {
  const center: LatLngExpression = [userLocation.latitude, userLocation.longitude]

  // Filter events that have coordinates
  const eventsWithCoords = events.filter(
    (event) => event.latitude && event.longitude
  )

  // Calculate distances and sort by proximity
  const eventsWithDistance = eventsWithCoords
    .map((event) => ({
      ...event,
      distance: calculateDistance(userLocation, {
        latitude: event.latitude!,
        longitude: event.longitude!,
      }),
    }))
    .sort((a, b) => a.distance - b.distance) // Closest first

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full rounded-lg"
        scrollWheelZoom={true}
        style={{ minHeight: '400px' }}
      >
        <RecenterMap center={center} />
        
        {/* Map tiles - using light/vintage CartoDB style */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* User location marker (blue dot) */}
        <Marker position={center} icon={UserIcon}>
          <Popup>
            <div className="text-center p-2">
              <p className="text-subtitle font-semibold text-blue-600">📍 You are here</p>
            </div>
          </Popup>
        </Marker>

        {/* Event markers */}
        {eventsWithDistance.map((event) => (
          <Marker
            key={event.event_id}
            position={[event.latitude!, event.longitude!]}
          >
            <Popup maxWidth={280}>
              <div className="p-2 min-w-[240px]">
                {/* Event image */}
                {event.cover_photo_url && (
                  <img 
                    src={event.cover_photo_url} 
                    alt={event.title}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                )}
                
                {/* Event title */}
                <h3 className="text-subtitle font-semibold mb-2 text-text-primary">
                  {event.title}
                </h3>
                
                {/* Description */}
                {event.description && (
                  <p className="text-body text-text-secondary mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                {/* Distance and location */}
                <div className="flex items-center gap-2 mb-3 text-text-secondary">
                  <span className="text-label font-semibold text-accent">
                    📍 {formatDistance(event.distance)}
                  </span>
                  {event.location_text && (
                    <span className="text-label">
                      • {event.location_text}
                    </span>
                  )}
                </div>
                
                {/* Date */}
                {event.event_date && (
                  <p className="text-label text-text-secondary mb-3">
                    📅 {new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
                
                {/* Action button */}
                {onEventClick && (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onEventClick(event)}
                    className="text-sm"
                  >
                    view event
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

