import React, { useEffect, useState } from 'react'
import { Media } from '../../types'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import FaceOverlay from '../face/FaceOverlay'
import { downloadImage } from '../../utils/download'

export interface PhotoViewerProps {
  photos: Media[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
  onPrevious?: () => void
  onFaceClick?: (faceId: string) => void
  showFaceOverlays?: boolean
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onFaceClick,
  showFaceOverlays = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const currentPhoto = photos[currentIndex]

  // Reset image state when photo changes
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [currentIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle download
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentPhoto || isDownloading) return

    try {
      setIsDownloading(true)
      await downloadImage(currentPhoto.blob_url, currentPhoto.filename)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (!isOpen || !currentPhoto) return null

  const hasNext = currentIndex < photos.length - 1
  const hasPrevious = currentIndex > 0
  const imageUrl = currentPhoto.blob_url

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close photo viewer"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous Button */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrevious()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous photo"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next Button */}
      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next photo"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="absolute top-4 left-4 z-10 p-2 text-white hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Download photo"
        title="Download photo"
      >
        {isDownloading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
      </button>

      {/* Photo Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-white text-sm font-medium mb-1">
            {currentPhoto.filename || `Photo ${currentIndex + 1}`}
          </p>
          {currentPhoto.face_count > 0 && (
            <p className="text-white/80 text-xs">
              👤 {currentPhoto.face_count} face{currentPhoto.face_count !== 1 ? 's' : ''} detected
            </p>
          )}
          <p className="text-white/60 text-xs mt-2">
            {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </div>

      {/* Image */}
      <div
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {imageError ? (
          <div className="text-center text-white">
            <p className="text-lg mb-2">Failed to load image</p>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <FaceOverlay
              mediaId={currentPhoto.media_id}
              imageUrl={imageUrl}
              imageWidth={currentPhoto.width}
              imageHeight={currentPhoto.height}
              onFaceClick={onFaceClick}
              showOverlay={showFaceOverlays && currentPhoto.face_detection_status === 'completed'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {/* Load a hidden image to track when image is ready */}
            <img
              src={imageUrl}
              alt=""
              className="hidden"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoViewer

