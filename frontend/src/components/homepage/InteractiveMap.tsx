import React, { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'
import { Event } from '../../types'
import EventMarkerPopup from './EventMarkerPopup'
import L from 'leaflet'

// Fix Leaflet default icon issue (only once, on mount)
if (typeof window !== 'undefined' && !(L.Icon.Default.prototype as any)._getIconUrl) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

export interface InteractiveMapProps {
  center: LatLngTuple
  zoom?: number
  events: Event[]
  onMapClick?: (lat: number, lng: number) => void
  selectedLocation?: LatLngTuple | null
  className?: string
}

// Component to handle map center updates (with debouncing to prevent flicker)
const MapController: React.FC<{ center: LatLngTuple; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap()
  const isUpdating = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Clear any pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce map updates to prevent flicker
    timeoutRef.current = setTimeout(() => {
      if (!isUpdating.current) {
        isUpdating.current = true
        try {
          if (zoom !== undefined) {
            map.setView(center, zoom, { animate: false })
          } else {
            map.setView(center, map.getZoom(), { animate: false })
          }
          // Invalidate size to ensure tiles render correctly
          map.invalidateSize()
        } catch (error) {
          console.error('Error updating map view:', error)
        }
        isUpdating.current = false
      }
    }, 100)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      isUpdating.current = false
    }
  }, [center, zoom, map])
  
  return null
}

// Component to initialize map size after mount
const MapSizeInitializer: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap()
  
  useEffect(() => {
    mapRef.current = map
    // Ensure map is properly initialized and sized
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)
    
    // Also invalidate on window resize
    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [map, mapRef])
  
  return null
}

// Component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  const map = useMap()
  
  useEffect(() => {
    if (!onMapClick) return
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    }
    
    map.on('click', handleClick)
    
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onMapClick])
  
  return null
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  zoom = 13,
  events = [],
  onMapClick,
  selectedLocation,
  className = '',
}) => {
  // Memoize filtered events to prevent unnecessary re-renders
  const validEvents = useMemo(() => {
    return events.filter((event) => event.latitude && event.longitude)
  }, [events])
  
  // Initialize map size after mount
  const mapRef = useRef<L.Map | null>(null)
  
  return (
    <div 
      className={`w-full h-full ${className}`}
      style={{ 
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={1}
        />
        
        <MapController center={center} zoom={zoom} />
        
        {/* Component to initialize map size after mount */}
        <MapSizeInitializer mapRef={mapRef} />
        
        {/* Handle map clicks for location picking */}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        
        {/* Render selected location marker (for location picker) */}
        {selectedLocation && (
          <Marker
            position={selectedLocation}
            key="selected-location"
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-gray-800">Selected Location</p>
                <p className="text-sm text-gray-600">
                  {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Render event markers (only if not in location picker mode) */}
        {!onMapClick && validEvents.map((event) => {
          const position: LatLngTuple = [event.latitude!, event.longitude!]
          
          return (
            <Marker
              key={event.event_id}
              position={position}
            >
              <Popup>
                <EventMarkerPopup event={event} />
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default React.memo(InteractiveMap)

