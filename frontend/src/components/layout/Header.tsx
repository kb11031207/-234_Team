import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Header = () => {
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header style={{ padding: '1rem 2rem', background: '#333', color: 'white' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Event Photos
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          
          {user ? (
            <>
              <Link to="/my-events" style={{ color: 'white', textDecoration: 'none' }}>My Events</Link>
              <Link to="/create" style={{ color: 'white', textDecoration: 'none' }}>Create Event</Link>
              <span>{user.displayName || user.email}</span>
              <button onClick={signOut} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={signInWithGoogle} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
              Sign In with Google
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header

