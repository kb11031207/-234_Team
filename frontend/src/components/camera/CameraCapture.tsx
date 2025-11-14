import React, { useState, useRef, useEffect, useCallback } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import LoadingSpinner from '../ui/LoadingSpinner'
import ErrorMessage from '../ui/ErrorMessage'

export interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
  onError?: (error: Error) => void
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Check if MediaDevices API is available
  const isMediaDevicesSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia

  // Start camera stream
  const startCamera = useCallback(async () => {
    if (!videoRef.current || !isMediaDevicesSupported) {
      setError('Camera is not supported in this browser. Please use the file upload option.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(null)
            }
          }
        })
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Error accessing camera:', err)
      let errorMessage = 'Failed to access camera. Please make sure your camera is connected and permissions are granted.'
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please connect a camera or use the file upload option.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application. Please close other apps and try again.'
        } else {
          errorMessage = err.message || errorMessage
        }
      }
      
      setError(errorMessage)
      setIsLoading(false)

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }, [facingMode, onError, isMediaDevicesSupported])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to capture photo')
          return
        }

        // Create File from blob
        const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })

        // Stop camera
        stopCamera()

        // Call onCapture callback
        onCapture(file)

        // Close modal
        onClose()
      },
      'image/jpeg',
      0.95
    )
  }, [onCapture, onClose, stopCamera])

  // Switch camera (front/back) - the useEffect will restart camera when facingMode changes
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }, [])

  // Start camera when modal opens or facing mode changes
  useEffect(() => {
    if (!isOpen) {
      // Stop camera when modal closes
      stopCamera()
      return
    }

    if (!isMediaDevicesSupported) {
      setError('Camera is not supported in this browser. Please use the file upload option.')
      return
    }

    // Small delay to ensure modal is rendered
    const timer = setTimeout(() => {
      startCamera()
    }, 100)

    // Cleanup: stop camera and clear timeout
    return () => {
      clearTimeout(timer)
      stopCamera()
    }
  }, [isOpen, facingMode, isMediaDevicesSupported, startCamera, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleClose = useCallback(() => {
    stopCamera()
    onClose()
  }, [stopCamera, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Take Photo"
      size="lg"
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        {error ? (
          <div className="space-y-4">
            <ErrorMessage title="Camera Error" message={error} />
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              {isMediaDevicesSupported && (
                <Button variant="primary" onClick={startCamera}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : !isMediaDevicesSupported ? (
          <div className="space-y-4 text-center py-8">
            <p className="text-gray-600">
              Camera is not supported in this browser. Please use the file upload option instead.
            </p>
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-white">Starting camera...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                style={{ display: isLoading ? 'none' : 'block' }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Camera Controls */}
            <div className="flex gap-4 justify-center">
              {/* Switch Camera Button (only show if multiple cameras available) */}
              <Button
                variant="secondary"
                size="lg"
                onClick={switchCamera}
                disabled={isLoading}
              >
                {facingMode === 'user' ? '🔄 Switch to Back Camera' : '🔄 Switch to Front Camera'}
              </Button>

              {/* Capture Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={capturePhoto}
                disabled={isLoading || !videoRef.current}
              >
                📸 Capture Photo
              </Button>

              {/* Cancel Button */}
              <Button
                variant="secondary"
                size="lg"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>

            {/* Instructions */}
            <p className="text-sm text-gray-500 text-center">
              Position your face in the frame and click "Capture Photo"
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default CameraCapture

