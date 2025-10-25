import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Page Not Found</h1>
      <p style={{ marginTop: '1rem' }}>The page you're looking for doesn't exist.</p>
      <Link to="/">
        <button style={{ marginTop: '2rem', padding: '1rem 2rem', cursor: 'pointer' }}>
          Go Home
        </button>
      </Link>
    </div>
  )
}

export default NotFoundPage

