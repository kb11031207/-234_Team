import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'

export default function ProfilePage() {
  const { user, signInWithGoogle } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')

  if (!user) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar currentPage="/profile" />
        
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-neutral-light to-white">
          <Card className="max-w-md text-center">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-title mb-3">sign in required</h2>
            <p className="text-body text-text-secondary mb-6">
              please sign in to view your profile
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

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar currentPage="/profile" />
      
      <div className="flex-1 overflow-auto bg-gradient-to-br from-neutral-light to-white">
        <div className="max-w-4xl mx-auto p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-title text-text-primary mb-2">profile</h1>
            <p className="text-subtitle text-text-secondary">
              manage your account and preferences
            </p>
          </div>

          {/* Profile Card */}
          <Card className="mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-32 h-32 rounded-full ring-4 ring-accent/30"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-5xl">👤</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-title text-text-primary mb-2">
                  {user.displayName || 'User'}
                </h2>
                <p className="text-body text-text-secondary mb-4">
                  {user.email}
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    variant="primary"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    edit profile
                  </Button>
                  <Button variant="secondary">
                    account settings
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="text-center">
              <p className="text-4xl font-title text-accent mb-2">5</p>
              <p className="text-body text-text-secondary">events created</p>
            </Card>
            <Card className="text-center">
              <p className="text-4xl font-title text-accent mb-2">127</p>
              <p className="text-body text-text-secondary">photos uploaded</p>
            </Card>
            <Card className="text-center">
              <p className="text-4xl font-title text-accent mb-2">23</p>
              <p className="text-body text-text-secondary">events joined</p>
            </Card>
          </div>

          {/* Account Info */}
          <Card className="mb-6">
            <h3 className="text-title mb-4">account information</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-neutral-dark/10">
                <span className="text-body text-text-secondary">user id</span>
                <span className="text-body text-text-primary font-mono text-sm">
                  {user.uid.substring(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-neutral-dark/10">
                <span className="text-body text-text-secondary">email verified</span>
                <span className="text-body text-text-primary">
                  {user.emailVerified ? '✅ yes' : '❌ no'}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-neutral-dark/10">
                <span className="text-body text-text-secondary">member since</span>
                <span className="text-body text-text-primary">
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-body text-text-secondary">last sign in</span>
                <span className="text-body text-text-primary">
                  {user.metadata.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card>
            <h3 className="text-title mb-4">preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-neutral-dark/10">
                <div>
                  <p className="text-body text-text-primary mb-1">email notifications</p>
                  <p className="text-label text-text-secondary">
                    receive updates about your events
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex justify-between items-center py-3 border-b border-neutral-dark/10">
                <div>
                  <p className="text-body text-text-primary mb-1">face detection</p>
                  <p className="text-label text-text-secondary">
                    automatically detect faces in photos
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-body text-text-primary mb-1">public profile</p>
                  <p className="text-label text-text-secondary">
                    allow others to find you
                  </p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <div className="mt-8 pt-8 border-t border-neutral-dark/10">
            <h3 className="text-title text-red-600 mb-4">danger zone</h3>
            <Card className="bg-red-50 border-2 border-red-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-body text-red-800 mb-1 font-semibold">
                    delete account
                  </p>
                  <p className="text-label text-red-600">
                    permanently delete your account and all data
                  </p>
                </div>
                <Button variant="secondary" className="bg-red-600 text-white hover:bg-red-700">
                  delete
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="edit profile"
      >
        <div className="space-y-4">
          <Input
            label="display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />
          <Input
            label="email"
            value={user.email || ''}
            disabled
            className="opacity-50"
          />
          <p className="text-label text-text-secondary">
            Email cannot be changed
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="primary" fullWidth>
              save changes
            </Button>
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => setIsEditModalOpen(false)}
            >
              cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

