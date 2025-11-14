import React, { useState } from 'react'
import { Media } from '../../types'
import LoadingSpinner from '../ui/LoadingSpinner'
import Button from '../ui/Button'
import { downloadImagesBatch } from '../../utils/download'

export interface PhotoGridProps {
  media: Media[]
  onPhotoClick?: (media: Media, index: number) => void
  isLoading?: boolean
  className?: string
  enableSelection?: boolean // Enable batch selection mode
  onSelectionChange?: (selectedIds: Set<string>) => void // Callback when selection changes
}

const PhotoGrid: React.FC<PhotoGridProps> = ({
  media,
  onPhotoClick,
  isLoading = false,
  className = '',
  enableSelection = false,
  onSelectionChange,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)

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

  // Handle selection toggle
  const handleSelectionToggle = (e: React.MouseEvent, mediaId: string) => {
    e.stopPropagation()
    if (!enableSelection) return

    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(mediaId)) {
        next.delete(mediaId)
      } else {
        next.add(mediaId)
      }
      if (onSelectionChange) {
        onSelectionChange(next)
      }
      return next
    })
  }

  // Handle select all / deselect all
  const handleSelectAll = () => {
    const allIds = new Set(photos.map((p) => p.media_id))
    setSelectedIds(allIds)
    if (onSelectionChange) {
      onSelectionChange(allIds)
    }
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
    if (onSelectionChange) {
      onSelectionChange(new Set())
    }
  }

  // Handle batch download
  const handleBatchDownload = async () => {
    if (selectedIds.size === 0 || isDownloading) return

    const selectedPhotos = photos.filter((p) => selectedIds.has(p.media_id))

    try {
      setIsDownloading(true)
      setDownloadProgress({ current: 0, total: selectedPhotos.length })

      await downloadImagesBatch(selectedPhotos, (current, total) => {
        setDownloadProgress({ current, total })
      })

      setDownloadProgress(null)
      // Optionally clear selection after download
      // handleDeselectAll()
    } catch (error) {
      console.error('Error downloading images:', error)
      alert('Failed to download some images. Please try again.')
      setDownloadProgress(null)
    } finally {
      setIsDownloading(false)
    }
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
    <div className={className}>
      {/* Batch Download Controls */}
      {enableSelection && photos.length > 0 && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {selectedIds.size > 0
                ? `${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} selected`
                : 'Select photos to download'}
            </span>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Select All
                </button>
              </>
            )}
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleBatchDownload}
              disabled={isDownloading}
              isLoading={isDownloading}
            >
              {isDownloading && downloadProgress
                ? `Downloading ${downloadProgress.current}/${downloadProgress.total}...`
                : `📥 Download ${selectedIds.size} Photo${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2`}>
      {photos.map((photo, index) => {
        const imageUrl = photo.thumbnail_url || photo.blob_url
        const isLoaded = loadedImages.has(photo.media_id)
        const hasError = imageErrors.has(photo.media_id)

        const isSelected = enableSelection && selectedIds.has(photo.media_id)

        return (
          <div
            key={photo.media_id}
            className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group ${
              isSelected ? 'ring-4 ring-primary-500 ring-offset-2' : ''
            }`}
            onClick={(e) => {
              // If clicking on the checkbox, don't open the viewer
              if ((e.target as HTMLElement).closest('.selection-checkbox')) {
                return
              }
              // Always allow opening the viewer, even in selection mode
              onPhotoClick?.(photo, index)
            }}
          >
            {/* Selection Checkbox */}
            {enableSelection && (
              <div
                className={`selection-checkbox absolute top-2 left-2 z-20 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer hover:scale-110 ${
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-white/90 border-white hover:bg-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectionToggle(e, photo.media_id)
                }}
                title={isSelected ? 'Deselect photo' : 'Select photo'}
              >
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )}
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
    </div>
  )
}

export default PhotoGrid

