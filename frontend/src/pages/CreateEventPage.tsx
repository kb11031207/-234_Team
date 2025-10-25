import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '../api/events'
import { CreateEventData } from '../types'

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6v0jrm4VTGaZvlpfWoBVrledwilza2Ls'

interface Location {
  lat: number;
  lng: number;
}

const CreateEventPage = () => {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    is_public: false,
    can_add: 'code_holders',
    event_date: '',
    location_text: '',
    latitude: undefined,
    longitude: undefined,
  })

  // Load Google Maps script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.onload = () => setMapLoaded(true)
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
      })

      // Add click listener to set location
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          setSelectedLocation({ lat, lng })
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }))

          // Clear existing markers and add new one
          if (window.marker) {
            window.marker.setMap(null)
          }
          window.marker = new google.maps.Marker({
            position: { lat, lng },
            map,
          })
        }
      })
    }
  }, [mapLoaded])

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      navigate(`/events/${data.event_id}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      alert('Please enter an event title')
      return
    }

    if (!formData.latitude || !formData.longitude) {
      alert('Please select a location on the map')
      return
    }

    try {
      await mutation.mutateAsync(formData)
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Event</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Event Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', minHeight: '100px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div>
          <label htmlFor="event_date" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Event Date and Time
          </label>
          <input
            id="event_date"
            type="datetime-local"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label htmlFor="location_text" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Location Description *
          </label>
          <input
            id="location_text"
            type="text"
            required
            placeholder="e.g., Central Park, NYC"
            value={formData.location_text}
            onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Click to Set Event Location *
          </label>
          <div
            ref={mapRef}
            style={{ width: '100%', height: '300px', borderRadius: '4px', marginBottom: '1rem' }}
          >
            {!mapLoaded && <span style={{ color: '#888' }}>[Loading map...]</span>}
          </div>
          {selectedLocation && (
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="can_add" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Who can upload photos?
          </label>
          <select
            id="can_add"
            value={formData.can_add}
            onChange={(e) => setFormData({ ...formData, can_add: e.target.value as 'owner_only' | 'code_holders' | 'public' })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="owner_only">Only me (Event Owner)</option>
            <option value="code_holders">People with access code</option>
            <option value="public">Anyone (Public)</option>
          </select>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              style={{ marginRight: '0.75rem' }}
            />
            Public Event (anyone can view)
          </label>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            style={{ 
              width: '100%',
              padding: '1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            {mutation.isPending ? 'Creating...' : 'Create Event'}
          </button>
        </div>

        {mutation.isError && (
          <p style={{ color: 'red', marginTop: '1rem' }}>
            Error creating event. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}

export default CreateEventPage

