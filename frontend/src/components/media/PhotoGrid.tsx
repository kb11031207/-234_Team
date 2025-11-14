import React, { useState } from 'react'
import { Media } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'

export interface PhotoGridProps {
  media: Media[]
  onPhotoClick?: (media: Media, index: number) => void
  isLoading?: boolean
  className?: string
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  media,
  onPhotoClick,
  isLoading = false,
  className = '',
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageLoad = (mediaId: string) => {
    setLoadedImages((prev) => new Set(prev).add(mediaId))
  }

  const handleImageError = (mediaId: string) => {
    setImageErrors((prev) => new Set(prev).add(mediaId))
    setLoadedImages((prev) => {
      const next = new Set(prev)
      next.delete(mediaId)
      return next
    })
  }

  // Filter to only show photos (exclude videos for now)
  const photos = media.filter((item) => item.media_type === 'photo')

  if (isLoading && photos.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500">No photos available yet.</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 ${className}`}>
      {photos.map((photo, index) => {
        const imageUrl = photo.thumbnail_url || photo.blob_url
        const isLoaded = loadedImages.has(photo.media_id)
        const hasError = imageErrors.has(photo.media_id)

        return (
          <div
            key={photo.media_id}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group"
            onClick={() => onPhotoClick?.(photo, index)}
          >
            {!isLoaded && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <LoadingSpinner size="sm" />
              </div>
            )}
            {hasError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <p className="text-xs text-gray-400">Failed to load</p>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={photo.filename || `Photo ${index + 1}`}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(photo.media_id)}
                onError={() => handleImageError(photo.media_id)}
                loading="lazy"
              />
            )}
            {/* Face count badge */}
            {photo.face_count > 0 && (
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                👤 {photo.face_count}
              </div>
            )}
            {/* Face detection status badge */}
            {photo.face_detection_status === 'processing' && (
              <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Processing...
              </div>
            )}
          </div>
        )
      })}
      {isLoading && photos.length > 0 && (
        <div className="flex items-center justify-center aspect-square bg-gray-100 rounded-lg">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  )
}

export default PhotoGrid

