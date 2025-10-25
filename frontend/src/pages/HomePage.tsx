import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyEvents } from '../api/events'
import { Event } from '../types'

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6v0jrm4VTGaZvlpfWoBVrledwilza2Ls' // <-- Replace with your actual API key

const HomePage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [events, setEvents] = useState<Event[]>([])

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

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          // Default to a fallback location (e.g., center of US)
          setUserLocation({ lat: 39.8283, lng: -98.5795 })
        }
      )
    } else {
      setUserLocation({ lat: 39.8283, lng: -98.5795 })
    }
  }, [])

  // Fetch events for markers
  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getMyEvents()
        setEvents(data)
      } catch (err) {
        // fallback: no events
        setEvents([])
      }
    }
    fetchEvents()
  }, [])

  // Initialize map and add markers
  useEffect(() => {
    if (mapLoaded && userLocation && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 13,
      })
      // Add marker for user location
      new window.google.maps.Marker({
        position: userLocation,
        map,
        title: 'Your Location',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      })
      // Add event markers
      events.forEach((event) => {
        if (event.latitude && event.longitude) {
          const marker = new window.google.maps.Marker({
            position: { lat: event.latitude, lng: event.longitude },
            map,
            title: event.title,
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            },
          })
          // Info window for event
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div><strong>${event.title}</strong><br/>${event.location_text || ''}</div>`
          })
          marker.addListener('click', () => {
            infoWindow.open(map, marker)
          })
        }
      })
    }
  }, [mapLoaded, userLocation, events])

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Navigation */}
      <aside style={{ width: '250px', background: '#f5f5f5', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2>Navigation</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <Link to="/profile" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Profile</button>
          </Link>
          <Link to="/code" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Enter Event Code</button>
          </Link>
          <Link to="/gallery" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Gallery</button>
          </Link>
          <Link to="/my-events" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Recent Events</button>
          </Link>
          <Link to="/create" style={{ textDecoration: 'none', width: '100%' }}>
            <button style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}>Create Event</button>
          </Link>
        </div>
      </aside>
      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1>Live Event Map</h1>
        <div
          ref={mapRef}
          style={{ width: '80%', height: '60vh', background: '#e0e0e0', borderRadius: '8px' }}
        >
          {!mapLoaded && <span style={{ color: '#888' }}>[Loading map...]</span>}
        </div>
      </main>
    </div>
  )
}

export default HomePage

