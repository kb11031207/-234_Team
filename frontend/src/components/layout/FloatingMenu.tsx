import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import Panel from '../ui/Panel'

export default function FloatingMenu() {
  const { user, signIn, signOut } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="sidebar-right">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="btn-primary w-12 h-12 flex items-center justify-center p-0"
        aria-label="Menu"
      >
        {isExpanded ? '✕' : '☰'}
      </button>

      {/* Expanded Menu */}
      {isExpanded && (
        <Panel className="animate-fade-in">
          <div className="flex flex-col gap-3 min-w-[200px]">
            {user ? (
              <>
                <div className="pb-3 border-b border-neutral-dark/20">
                  <p className="text-label mb-1">signed in as</p>
                  <p className="text-body truncate">{user.email}</p>
                </div>
                
                <Link to="/create" onClick={() => setIsExpanded(false)}>
                  <Button variant="primary" fullWidth>
                    create event
                  </Button>
                </Link>
                
                <Link to="/my-events" onClick={() => setIsExpanded(false)}>
                  <Button variant="secondary" fullWidth>
                    my events
                  </Button>
                </Link>
                
                <button 
                  onClick={() => {
                    signOut()
                    setIsExpanded(false)
                  }}
                  className="text-body text-text-secondary hover:text-text-primary transition-colors"
                >
                  sign out
                </button>
              </>
            ) : (
              <>
                <Button variant="primary" fullWidth onClick={signIn}>
                  sign in
                </Button>
                <p className="text-label text-center">
                  join an event with code
                </p>
              </>
            )}
          </div>
        </Panel>
      )}
    </div>
  )
}

