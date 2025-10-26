import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { api } from '../api'
import { useEffect, useState } from 'react'
import { Event } from '../lib/mockData'

export default function MyEventsPage() {
  const { user, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      if (user) {
        try {
          const allEvents = await api.events.getAll()
          // Filter to show user's events (mock: filter by owner_id = 'user-1')
          const myEvents = allEvents.filter(e => e.owner_id === 'user-1')
          setEvents(myEvents)
        } catch (error) {
          console.error('Error loading events:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }
    loadEvents()
  }, [user])

  if (!user) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar currentPage="/my-events" />
        
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-neutral-light to-white">
          <Card className="max-w-md text-center">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-title mb-3">sign in required</h2>
            <p className="text-body text-text-secondary mb-6">
              please sign in to view your events
            </p>
            <Button variant="primary" fullWidth onClick={signInWithGoogle}>
              <span className="mr-2">🔐</span>
              sign in with google
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar currentPage="/my-events" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-subtitle text-text-secondary">loading your events...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar currentPage="/my-events" />
      
      <div className="flex-1 overflow-auto bg-gradient-to-br from-neutral-light to-white">
        <div className="max-w-7xl mx-auto p-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-title text-text-primary mb-2">my events</h1>
              <p className="text-subtitle text-text-secondary">
                events you've created and manage
              </p>
            </div>
            <Button 
              variant="primary"
              onClick={() => navigate('/create')}
              className="px-6"
            >
              <span className="mr-2">➕</span>
              create new event
            </Button>
          </div>

          {/* Stats */}
          {events.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="text-center">
                <p className="text-4xl font-title text-accent mb-2">{events.length}</p>
                <p className="text-body text-text-secondary">total events</p>
              </Card>
              <Card className="text-center">
                <p className="text-4xl font-title text-accent mb-2">
                  {events.filter(e => e.is_public).length}
                </p>
                <p className="text-body text-text-secondary">public events</p>
              </Card>
              <Card className="text-center">
                <p className="text-4xl font-title text-accent mb-2">
                  {events.filter(e => !e.is_public).length}
                </p>
                <p className="text-body text-text-secondary">private events</p>
              </Card>
            </div>
          )}

          {/* Events Grid */}
          {events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.event_id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/events/${event.event_id}`)}
                >
                  {/* Cover Image */}
                  {event.cover_photo_url && (
                    <img
                      src={event.cover_photo_url}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-lg mb-4 -mt-6 -mx-6"
                    />
                  )}

                  {/* Event Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-subtitle font-semibold mb-1">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-body text-text-secondary line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="space-y-2 text-label text-text-secondary">
                      <div className="flex items-center gap-2">
                        <span>🔑</span>
                        <span className="font-mono bg-neutral-light px-2 py-1 rounded">
                          {event.access_code}
                        </span>
                      </div>
                      
                      {event.event_date && (
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {event.location_text && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span className="truncate">{event.location_text}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>{event.is_public ? '🌍' : '🔒'}</span>
                        <span>{event.is_public ? 'public' : 'private'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-neutral-dark/10">
                      <Button 
                        variant="primary" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/events/${event.event_id}`)
                        }}
                      >
                        view
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/events/${event.event_id}/upload`)
                        }}
                      >
                        upload
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            // Empty State
            <Card className="text-center py-12">
              <div className="text-7xl mb-4">📅</div>
              <h2 className="text-title mb-3">no events yet</h2>
              <p className="text-body text-text-secondary mb-6 max-w-md mx-auto">
                create your first event to start sharing photos and memories with friends and family
              </p>
              <Button 
                variant="primary"
                onClick={() => navigate('/create')}
                className="px-8"
              >
                <span className="mr-2">➕</span>
                create your first event
              </Button>
            </Card>
          )}

          {/* Tips */}
          {events.length > 0 && (
            <Card className="mt-8 bg-accent/10 border-2 border-accent/20">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="text-subtitle mb-2">quick tips</h3>
                  <ul className="text-body text-text-secondary space-y-1">
                    <li>• Share the access code or QR code with attendees</li>
                    <li>• Click on an event to view photos and manage settings</li>
                    <li>• Toggle privacy settings anytime from event page</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

