import React, { useEffect, useState, useRef } from 'react'
import { getMediaFaces, FaceData } from '../../api/faces'
import LoadingSpinner from '../ui/LoadingSpinner'

export interface FaceOverlayProps {
  mediaId: string
  imageUrl: string
  imageWidth?: number
  imageHeight?: number
  onFaceClick?: (faceId: string) => void
  showOverlay?: boolean
  className?: string
}

/**
 * Component to display face detection overlays (bounding boxes) on a photo
 * Bounding boxes are normalized (0-1 range) from the API, so we need to convert to pixels
 */
const FaceOverlay: React.FC<FaceOverlayProps> = ({
  mediaId,
  imageUrl,
  imageWidth,
  imageHeight,
  onFaceClick,
  showOverlay = true,
  className = '',
}) => {
  const [faces, setFaces] = useState<FaceData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Fetch faces when mediaId changes
  useEffect(() => {
    if (!mediaId || !showOverlay) {
      setFaces([])
      return
    }

    setIsLoading(true)
    setError(null)

    getMediaFaces(mediaId)
      .then((response) => {
        setFaces(response.faces || [])
      })
      .catch((err) => {
        console.error('Error fetching faces:', err)
        setError(err instanceof Error ? err.message : 'Failed to load faces')
        // Don't show error if faces are just not detected yet (this is normal)
        if (err.response?.status !== 404) {
          setError('Failed to load face data')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [mediaId, showOverlay])

  // Get image dimensions when image loads
  const handleImageLoad = () => {
    if (imageRef.current) {
      const width = imageWidth || imageRef.current.naturalWidth || imageRef.current.clientWidth
      const height = imageHeight || imageRef.current.naturalHeight || imageRef.current.clientHeight
      setImageSize({ width, height })
    }
  }

  // Convert normalized bbox (0-1) to pixel coordinates
  const getPixelBbox = (bbox: FaceData['bbox'], imgWidth: number, imgHeight: number) => {
    return {
      x: bbox.x * imgWidth,
      y: bbox.y * imgHeight,
      width: bbox.width * imgWidth,
      height: bbox.height * imgHeight,
    }
  }

  const imgWidth = imageSize?.width || imageWidth || 0
  const imgHeight = imageSize?.height || imageHeight || 0
  const hasFaces = showOverlay && faces.length > 0 && !isLoading && !error && imgWidth > 0 && imgHeight > 0

  return (
    <div className={`relative ${className}`} style={{ display: 'inline-block', width: '100%', height: '100%' }}>
      <img
        ref={imageRef}
        src={imageUrl}
        alt=""
        onLoad={handleImageLoad}
        className="block w-full h-full object-contain"
      />
      {isLoading && showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <LoadingSpinner size="sm" />
        </div>
      )}
      {error && !isLoading && showOverlay && (
        <div className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded">
          {error}
        </div>
      )}
      {hasFaces && (
        <>
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', top: 0, left: 0 }}
            viewBox={`0 0 ${imgWidth} ${imgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {faces.map((face) => {
              const pixelBbox = getPixelBbox(face.bbox, imgWidth, imgHeight)
              return (
                <g key={face.face_id}>
                  {/* Bounding box */}
                  <rect
                    x={pixelBbox.x}
                    y={pixelBbox.y}
                    width={pixelBbox.width}
                    height={pixelBbox.height}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth={Math.max(2, imgWidth / 500)}
                    className="pointer-events-auto cursor-pointer hover:stroke-blue-400 transition-colors"
                    onClick={() => onFaceClick?.(face.face_id)}
                  />
                  {/* Face count label - only show if cluster exists and has multiple faces */}
                  {face.cluster && face.cluster.face_count > 1 && (
                    <text
                      x={pixelBbox.x + 5}
                      y={pixelBbox.y - 5}
                      fill="rgba(59, 130, 246, 0.9)"
                      fontSize={Math.max(10, imgWidth / 50)}
                      fontWeight="bold"
                      className="pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      👤 {face.cluster.face_count}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
          {/* Clickable overlay areas for face interaction */}
          {onFaceClick && (
            <div
              className="absolute inset-0"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => {
                if (!imageRef.current) return
                const rect = imageRef.current.getBoundingClientRect()
                const scaleX = imgWidth / rect.width
                const scaleY = imgHeight / rect.height
                const x = (e.clientX - rect.left) * scaleX
                const y = (e.clientY - rect.top) * scaleY

                // Find clicked face
                const clickedFace = faces.find((face) => {
                  const pixelBbox = getPixelBbox(face.bbox, imgWidth, imgHeight)
                  return (
                    x >= pixelBbox.x &&
                    x <= pixelBbox.x + pixelBbox.width &&
                    y >= pixelBbox.y &&
                    y <= pixelBbox.y + pixelBbox.height
                  )
                })

                if (clickedFace) {
                  e.stopPropagation()
                  onFaceClick(clickedFace.face_id)
                }
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

export default FaceOverlay

