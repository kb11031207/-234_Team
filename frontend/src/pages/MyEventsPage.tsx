import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMyEvents } from '../api/events'
import { useAuth } from '../context/AuthContext'

const MyEventsPage = () => {
  const { user } = useAuth()

  const { data: events, isLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: getMyEvents,
    enabled: !!user,
  })

  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Please sign in to view your events</p>
      </div>
    )
  }

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>My Events</h1>

      {events && events.length > 0 ? (
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {events.map((event) => (
            <Link 
              key={event.event_id} 
              to={`/events/${event.event_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
                <h3>{event.title}</h3>
                {event.description && <p style={{ marginTop: '0.5rem', color: '#666' }}>{event.description}</p>}
                <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <strong>Code:</strong> {event.access_code}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: '2rem' }}>
          <p>You haven't created any events yet.</p>
          <Link to="/create">
            <button style={{ marginTop: '1rem', padding: '1rem 2rem', cursor: 'pointer' }}>
              Create Your First Event
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default MyEventsPage

