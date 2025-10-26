import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../api/events'
import { getEventMedia } from '../api/media'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: event, isLoading: loadingEvent, error: eventError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId,
  })

  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['event-media', eventId],
    queryFn: () => getEventMedia(eventId!),
    enabled: !!eventId,
  })

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-light to-white flex items-center justify-center">
        <Card className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-subtitle text-text-primary">loading event...</p>
        </Card>
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-light to-white flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-subtitle text-text-primary mb-2">event not found</h2>
          <p className="text-body text-text-secondary mb-6">
            this event doesn't exist or you don't have access
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            back to home
          </Button>
        </Card>
      </div>
    )
  }

  const copyAccessCode = () => {
    navigator.clipboard.writeText(event.access_code)
    alert('Access code copied to clipboard!')
  }

  const shareEvent = async () => {
    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on EventMemory! Access code: ${event.access_code}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      copyAccessCode()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light to-white overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        {/* Hero Section */}
        <Card className="mb-8 relative overflow-hidden">
          {/* Cover Photo Background */}
          {event.cover_photo_url && (
            <div className="absolute inset-0 opacity-10">
              <img
                src={event.cover_photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-body text-text-secondary mb-4">
              <Link to="/" className="hover:text-accent transition-colors">
                home
              </Link>
              <span>/</span>
              <span className="text-text-primary">{event.title}</span>
            </div>

            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-title text-text-primary mb-3">
                  {event.title}
                </h1>
                {event.description && (
                  <p className="text-subtitle text-text-secondary max-w-2xl">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Event Status Badge */}
              <div className="flex-shrink-0">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  event.is_public ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <span className="text-xl">{event.is_public ? '🌍' : '🔒'}</span>
                  <span className="font-semibold text-sm">
                    {event.is_public ? 'public event' : 'private event'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {event.event_date && (
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                  <span className="text-2xl">📅</span>
                  <div>
                    <p className="text-label uppercase text-text-secondary">date</p>
                    <p className="text-body text-text-primary font-medium">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}

              {event.location_text && (
                <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="text-label uppercase text-text-secondary">location</p>
                    <p className="text-body text-text-primary font-medium">
                      {event.location_text}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="text-label uppercase text-text-secondary">photos</p>
                  <p className="text-body text-text-primary font-medium">
                    {media.length} {media.length === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Access Code Section */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-4 bg-accent/10 border-2 border-accent/20 rounded-xl">
              <div className="flex-1">
                <p className="text-label uppercase text-text-secondary mb-1">access code</p>
                <p className="text-2xl font-bold text-accent tracking-wider">
                  {event.access_code}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copyAccessCode} className="flex-1 sm:flex-none">
                  📋 copy
                </Button>
                {event.qr_code_url && (
                  <Button variant="secondary" onClick={() => setShowQRModal(true)} className="flex-1 sm:flex-none">
                    📱 qr code
                  </Button>
                )}
                <Button variant="secondary" onClick={shareEvent} className="flex-1 sm:flex-none">
                  🔗 share
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate(`/events/${eventId}/upload`)}>
            <div className="flex items-center gap-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">📸</div>
              <div className="flex-1">
                <h3 className="text-subtitle font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  upload photos
                </h3>
                <p className="text-body text-text-secondary">
                  add your memories to the event gallery
                </p>
              </div>
              <span className="text-2xl text-accent">→</span>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-all group cursor-pointer" onClick={() => navigate(`/events/${eventId}/search`)}>
            <div className="flex items-center gap-4">
              <div className="text-5xl group-hover:scale-110 transition-transform">🔍</div>
              <div className="flex-1">
                <h3 className="text-subtitle font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                  find my photos
                </h3>
                <p className="text-body text-text-secondary">
                  search for photos with your face
                </p>
              </div>
              <span className="text-2xl text-accent">→</span>
            </div>
          </Card>
        </div>

        {/* Gallery Section */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-subtitle font-semibold text-text-primary">
              📷 gallery ({media.length})
            </h2>
            {media.length > 0 && (
              <Button variant="secondary" className="text-sm">
                download all
              </Button>
            )}
          </div>

          {loadingMedia && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-pulse">📸</div>
              <p className="text-subtitle text-text-secondary">loading photos...</p>
            </div>
          )}

          {!loadingMedia && media.length === 0 && (
            <div className="text-center py-16 bg-neutral-light rounded-xl">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-subtitle text-text-primary mb-2">no photos yet</h3>
              <p className="text-body text-text-secondary mb-6 max-w-md mx-auto">
                be the first to capture memories from this event!
              </p>
              <Button variant="primary" onClick={() => navigate(`/events/${eventId}/upload`)}>
                upload first photo
              </Button>
            </div>
          )}

          {media.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.media_id}
                  className="group relative aspect-square bg-neutral-light rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedImage(item.blob_url)}
                >
                  <img
                    src={item.thumbnail_url || item.blob_url}
                    alt={item.filename || 'Event photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                  
                  {/* Face count badge */}
                  {item.face_count > 0 && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <span className="text-sm">👤</span>
                      <span className="text-label font-semibold text-text-primary">
                        {item.face_count}
                      </span>
                    </div>
                  )}

                  {/* Processing badge */}
                  {item.face_detection_status === 'processing' && (
                    <div className="absolute bottom-2 left-2 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-label font-semibold">
                      🔄 processing
                    </div>
                  )}

                  {/* Expand icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                      <span className="text-2xl">🔍</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* QR Code Modal */}
      {event.qr_code_url && (
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="qr code">
          <div className="text-center space-y-4">
            <p className="text-body text-text-secondary">
              scan this code to quickly access the event
            </p>
            <div className="bg-white p-6 rounded-xl inline-block">
              <img
                src={event.qr_code_url}
                alt="Event QR Code"
                className="w-64 h-64 mx-auto"
              />
            </div>
            <div className="p-4 bg-neutral-light rounded-xl">
              <p className="text-label uppercase text-text-secondary mb-1">access code</p>
              <p className="text-2xl font-bold text-accent tracking-wider">
                {event.access_code}
              </p>
            </div>
            <Button variant="secondary" fullWidth onClick={() => setShowQRModal(false)}>
              close
            </Button>
          </div>
        </Modal>
      )}

      {/* Image Lightbox Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title=""
      >
        <div className="relative">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
          <div className="flex gap-3 mt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => selectedImage && window.open(selectedImage, '_blank')}
            >
              open in new tab
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setSelectedImage(null)}
            >
              close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EventPage
