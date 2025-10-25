import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HomePage = () => {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Event Photo Sharing</h1>
      <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
        Share and discover memories from your events with AI-powered face detection
      </p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        {user ? (
          <>
            <Link to="/create">
              <button style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>
                Create New Event
              </button>
            </Link>
            <Link to="/my-events">
              <button style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}>
                View My Events
              </button>
            </Link>
          </>
        ) : (
          <p>Please sign in to create events and upload photos</p>
        )}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2>Features</h2>
        <ul style={{ fontSize: '1.1rem', lineHeight: '2' }}>
          <li>📸 Easy photo uploads with drag & drop</li>
          <li>🔐 Secure access codes for private events</li>
          <li>🧠 AI-powered face detection and grouping</li>
          <li>🔍 Find all photos of yourself instantly</li>
          <li>🌍 Public and private event options</li>
        </ul>
      </div>
    </div>
  )
}

export default HomePage

