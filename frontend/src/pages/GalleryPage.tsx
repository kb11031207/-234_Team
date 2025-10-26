import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { api } from '../api'
import { Event, Media } from '../lib/mockData'

export default function GalleryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedImage, setSelectedImage] = useState<Media | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Access code state for non-signed-in users
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessCodeError, setAccessCodeError] = useState('')
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  
  // Photos state
  const [photos, setPhotos] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load photos on mount
  useEffect(() => {
    loadGalleryPhotos()
  }, [user])

  const loadGalleryPhotos = async () => {
    setIsLoading(true)
    try {
      if (user) {
        // Signed in: Get most recent event
        const events = await api.events.getAll()
        const userEvents = events.filter(e => e.owner_id === 'user-1')
        
        if (userEvents.length > 0) {
          // Sort by creation date and get most recent
          const mostRecent = userEvents.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          
          setCurrentEvent(mostRecent)
          
          // Load photos from that event
          const eventMedia = await api.media.getByEventId(mostRecent.event_id)
          setPhotos(eventMedia)
        } else {
          setPhotos([])
        }
      } else {
        // Not signed in: Show access code prompt
        setShowAccessCodeModal(true)
      }
    } catch (error) {
      console.error('Error loading gallery:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessCodeSubmit = async () => {
    setAccessCodeError('')
    
    if (!accessCode.trim()) {
      setAccessCodeError('Please enter an access code')
      return
    }

    try {
      // Try to find event by access code
      const event = await api.events.getById(accessCode.toUpperCase())
      
      if (!event) {
        setAccessCodeError('Invalid access code. Please try again.')
        return
      }

      setCurrentEvent(event)
      
      // Load photos from that event
      const eventMedia = await api.media.getByEventId(event.event_id)
      setPhotos(eventMedia)
      
      setShowAccessCodeModal(false)
      setAccessCode('')
    } catch (error) {
      console.error('Error validating access code:', error)
      setAccessCodeError('Invalid access code. Please try again.')
    }
  }

  const handleChangeEvent = () => {
    setAccessCode('')
    setAccessCodeError('')
    setShowAccessCodeModal(true)
  }

  // Duplicate photos for demo purposes
  const recentPhotos = photos.length > 0 
    ? [...photos, ...photos].slice(0, 12)
    : []

  if (isLoading) {
    return (
      <div className="flex h-screen bg-white overflow-hidden">
        <Sidebar currentPage="/gallery" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-subtitle text-text-secondary">loading gallery...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar currentPage="/gallery" />
      
      <div className="flex-1 overflow-auto bg-gradient-to-br from-neutral-light to-white">
        <div className="max-w-7xl mx-auto p-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-5xl font-title text-text-primary mb-2">gallery</h1>
              <p className="text-subtitle text-text-secondary">
                {currentEvent ? `photos from ${currentEvent.title}` : 'browse all your event photos'}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!user && currentEvent && (
                <Button 
                  variant="secondary"
                  onClick={handleChangeEvent}
                >
                  change event
                </Button>
              )}
              <Button 
                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('grid')}
              >
                🔲 grid
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                onClick={() => setViewMode('list')}
              >
                📋 list
              </Button>
            </div>
          </div>

          {/* Event Info Banner */}
          {currentEvent && (
            <Card className="mb-6 bg-accent/10 border-2 border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🎉</div>
                  <div>
                    <h3 className="text-subtitle font-semibold">{currentEvent.title}</h3>
                    <p className="text-body text-text-secondary">
                      {currentEvent.description || 'No description'}
                    </p>
                    {currentEvent.event_date && (
                      <p className="text-label text-text-secondary mt-1">
                        📅 {new Date(currentEvent.event_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="primary" onClick={() => navigate(`/events/${currentEvent.event_id}`)}>
                  view event page
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <p className="text-3xl font-title text-accent mb-1">{recentPhotos.length}</p>
              <p className="text-label text-text-secondary">total photos</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-title text-accent mb-1">3</p>
              <p className="text-label text-text-secondary">events</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-title text-accent mb-1">45</p>
              <p className="text-label text-text-secondary">faces detected</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-title text-accent mb-1">2.3 GB</p>
              <p className="text-label text-text-secondary">storage used</p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex gap-4 items-center flex-wrap">
              <span className="text-body text-text-secondary">filter by:</span>
              <Button variant="primary">all photos</Button>
              <Button variant="secondary">with faces</Button>
              <Button variant="secondary">recent</Button>
              <Button variant="secondary">favorites</Button>
            </div>
          </Card>

          {/* Empty State */}
          {recentPhotos.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-7xl mb-4">🖼️</div>
              <h2 className="text-title mb-3">no photos yet</h2>
              <p className="text-body text-text-secondary mb-6 max-w-md mx-auto">
                {user 
                  ? 'Upload photos to your events to see them here'
                  : 'Enter an event access code to view photos'}
              </p>
              {!user && (
                <Button variant="primary" onClick={() => setShowAccessCodeModal(true)}>
                  enter access code
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* Gallery Grid */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentPhotos.map((photo, index) => (
                <div
                  key={`${photo.media_id}-${index}`}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedImage(photo)}
                >
                  <img
                    src={photo.thumbnail_url || photo.blob_url}
                    alt={photo.filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                      <p className="text-sm font-semibold">
                        {photo.face_count} {photo.face_count === 1 ? 'face' : 'faces'}
                      </p>
                      <p className="text-xs">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Face Count Badge */}
                  {photo.face_count > 0 && (
                    <div className="absolute top-2 right-2 bg-accent text-text-primary text-xs px-2 py-1 rounded-full shadow-card">
                      👤 {photo.face_count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {recentPhotos.map((photo, index) => (
                <Card
                  key={`${photo.media_id}-${index}`}
                  className="flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedImage(photo)}
                >
                  <img
                    src={photo.thumbnail_url || photo.blob_url}
                    alt={photo.filename}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-subtitle mb-1">{photo.filename}</h3>
                    <p className="text-body text-text-secondary mb-2">
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                    <div className="flex gap-4 text-label text-text-secondary">
                      <span>👤 {photo.face_count} faces</span>
                      <span>📏 {photo.width}x{photo.height}</span>
                      <span>💾 {(photo.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="primary">view</Button>
                    <Button variant="secondary">download</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-8">
            <Button variant="secondary" className="px-12">
              load more photos
            </Button>
          </div>
        </>
      )}
        </div>
      </div>

      {/* Access Code Modal */}
      <Modal
        isOpen={showAccessCodeModal}
        onClose={() => {
          if (!user && !currentEvent) {
            // Don't allow closing if not signed in and no event loaded
            return
          }
          setShowAccessCodeModal(false)
          setAccessCode('')
          setAccessCodeError('')
        }}
        title="enter event code"
      >
        <div className="space-y-4">
          <p className="text-body text-text-secondary">
            enter the access code for the event you want to view photos from
          </p>
          <Input
            label="access code"
            placeholder="e.g., WEDDING123"
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value.toUpperCase())
              setAccessCodeError('')
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleAccessCodeSubmit()}
            error={accessCodeError}
            className="uppercase"
          />
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              fullWidth
              onClick={handleAccessCodeSubmit}
              disabled={!accessCode.trim()}
            >
              view photos
            </Button>
            {(user || currentEvent) && (
              <Button 
                variant="secondary" 
                fullWidth
                onClick={() => {
                  setShowAccessCodeModal(false)
                  setAccessCode('')
                  setAccessCodeError('')
                }}
              >
                cancel
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Image Detail Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title="photo details"
      >
        {selectedImage && (
          <div className="space-y-4">
            <img
              src={selectedImage.blob_url}
              alt={selectedImage.filename}
              className="w-full rounded-lg"
            />
            <div className="space-y-2">
              <p className="text-body">
                <strong>Filename:</strong> {selectedImage.filename}
              </p>
              <p className="text-body">
                <strong>Faces detected:</strong> {selectedImage.face_count}
              </p>
              <p className="text-body">
                <strong>Resolution:</strong> {selectedImage.width}x{selectedImage.height}
              </p>
              <p className="text-body">
                <strong>Size:</strong> {(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-body">
                <strong>Uploaded:</strong> {new Date(selectedImage.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="primary" fullWidth>
                download
              </Button>
              <Button variant="secondary" fullWidth>
                share
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

