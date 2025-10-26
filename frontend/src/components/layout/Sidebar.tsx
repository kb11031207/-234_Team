import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

interface SidebarProps {
  onShowMap?: () => void
  onOpenJoinModal?: () => void
  currentPage?: string
}

export default function Sidebar({ onShowMap, onOpenJoinModal, currentPage }: SidebarProps) {
  const { user, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="w-72 h-screen bg-neutral-light border-r border-neutral-dark/10 flex flex-col relative" style={{ zIndex: 100 }}>
      {/* Header */}
      <div className="px-6 py-8 border-b border-neutral-dark/10">
        <Link to="/">
          <h1 className="text-3xl font-title text-text-primary">
            event<span className="text-accent">memory</span>
          </h1>
        </Link>
        <p className="text-label text-text-secondary mt-2">
          photo sharing app
        </p>
      </div>

      {/* Primary Actions */}
      <div className="px-6 py-6 space-y-3 border-b border-neutral-dark/10">
        <Button 
          variant="primary" 
          fullWidth
          onClick={onOpenJoinModal}
          className="justify-center"
        >
          <span className="mr-2">🔑</span>
          enter event code
        </Button>
        
        <Button 
          variant="secondary" 
          fullWidth
          onClick={onShowMap}
          className="justify-center"
        >
          <span className="mr-2">🗺️</span>
          nearby events
        </Button>

        {user && (
          <Button 
            variant="secondary" 
            fullWidth
            onClick={() => navigate('/create')}
            className="justify-center"
          >
            <span className="mr-2">➕</span>
            create event
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
        <div className="text-label text-text-secondary mb-3 px-2">
          NAVIGATION
        </div>

        <button
          onClick={() => navigate('/profile')}
          className={`w-full text-left px-4 py-3 rounded-lg text-body transition-all
            ${currentPage === '/profile' 
              ? 'bg-primary text-text-primary shadow-sm' 
              : 'text-text-secondary hover:bg-primary/30 hover:text-text-primary'
            }`}
        >
          <span className="mr-3 text-lg">👤</span>
          Profile
        </button>

        <button
          onClick={() => navigate('/gallery')}
          className={`w-full text-left px-4 py-3 rounded-lg text-body transition-all
            ${currentPage === '/gallery' 
              ? 'bg-primary text-text-primary shadow-sm' 
              : 'text-text-secondary hover:bg-primary/30 hover:text-text-primary'
            }`}
        >
          <span className="mr-3 text-lg">🖼️</span>
          Gallery
        </button>

        <button
          onClick={() => navigate('/my-events')}
          className={`w-full text-left px-4 py-3 rounded-lg text-body transition-all
            ${currentPage === '/my-events' 
              ? 'bg-primary text-text-primary shadow-sm' 
              : 'text-text-secondary hover:bg-primary/30 hover:text-text-primary'
            }`}
        >
          <span className="mr-3 text-lg">📅</span>
          My Events
        </button>
      </nav>

      {/* User Section */}
      <div className="px-6 py-6 border-t border-neutral-dark/10">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-12 h-12 rounded-full ring-2 ring-accent/20"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-text-primary truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-label text-text-secondary truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full text-body text-text-secondary hover:text-text-primary text-center py-2 hover:bg-primary/20 rounded-lg transition-colors"
            >
              sign out
            </button>
          </div>
        ) : (
          <Button variant="primary" fullWidth onClick={signInWithGoogle}>
            <span className="mr-2">🔐</span>
            sign in with google
          </Button>
        )}
      </div>
    </div>
  )
}

