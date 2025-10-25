import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../api/events'

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId,
  })

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading...</div>
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error loading event</div>
  if (!event) return <div style={{ padding: '2rem' }}>Event not found</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{event.title}</h1>
      {event.description && <p>{event.description}</p>}
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <p><strong>Access Code:</strong> {event.access_code}</p>
        <p><strong>Public:</strong> {event.is_public ? 'Yes' : 'No'}</p>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link to={`/events/${eventId}/upload`}>
          <button style={{ padding: '1rem 2rem', cursor: 'pointer' }}>Upload Photos</button>
        </Link>
        <Link to={`/events/${eventId}/search`}>
          <button style={{ padding: '1rem 2rem', cursor: 'pointer' }}>Find My Photos</button>
        </Link>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2>Gallery</h2>
        <p>Photo gallery will appear here...</p>
        {/* TODO: Implement photo grid */}
      </div>
    </div>
  )
}

export default EventPage

