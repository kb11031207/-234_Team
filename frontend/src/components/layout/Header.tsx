import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

const Header = () => {
  const { user, signInWithGoogle, signOut } = useAuth()

  return (
    <header className="bg-neutral-800 text-white shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white hover:text-primary-400 transition-colors">
          The Scene
        </Link>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="text-white hover:text-primary-400 transition-colors font-medium"
          >
            Home
          </Link>
          <Link 
            to="/access-code" 
            className="text-white hover:text-primary-400 transition-colors font-medium"
          >
            Access Code
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/my-events" 
                className="text-white hover:text-primary-400 transition-colors font-medium"
              >
                My Events
              </Link>
              <Link 
                to="/create" 
                className="text-white hover:text-primary-400 transition-colors font-medium"
              >
                Create Event
              </Link>
              <span className="text-white text-sm">{user.displayName || user.email}</span>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={signOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={signInWithGoogle}
            >
              Sign In with Google
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header

