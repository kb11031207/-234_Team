import { useParams, useNavigate } from 'react-router-dom'
import { useCallback, useState, useEffect, useMemo } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CameraCapture from '../components/camera/CameraCapture'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { getUploadUrl, uploadToBlob, confirmUpload } from '../api/media'

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
}

interface FileValidationError {
  fileName: string
  error: string
}

interface UploadProgress {
  fileName: string
  status: 'pending' | 'uploading' | 'confirming' | 'completed' | 'error'
  progress: number // 0-100
  error?: string
  mediaId?: string
}

const UploadPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([])
  const [uploadProgress, setUploadProgress] = useState<Map<number, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Validate a single file
  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      return `File type not supported. Please use: JPG, PNG, GIF, or WebP.`
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
      return `File is too large (${fileSizeMB} MB). Maximum size is ${maxSizeMB} MB.`
    }

    return null
  }, [])

  // Handle accepted files
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Clear previous errors
    setValidationErrors([])

    // Validate each file
    const errors: FileValidationError[] = []
    const validFiles: File[] = []

    acceptedFiles.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        errors.push({ fileName: file.name, error })
      } else {
        validFiles.push(file)
      }
    })

    // Add valid files to selection
    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles])
      console.log('Files selected:', validFiles.map(f => f.name))
    }

    // Show errors if any
    if (errors.length > 0) {
      setValidationErrors(errors)
    }
  }, [validateFile])

  // Handle rejected files
  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const errors: FileValidationError[] = []

    fileRejections.forEach(({ file, errors: rejectionErrors }) => {
      rejectionErrors.forEach((error) => {
        let errorMessage = ''
        if (error.code === 'file-invalid-type') {
          errorMessage = `File type not supported. Please use: JPG, PNG, GIF, or WebP.`
        } else if (error.code === 'file-too-large') {
          const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0)
          errorMessage = `File is too large. Maximum size is ${maxSizeMB} MB.`
        } else if (error.code === 'file-too-small') {
          errorMessage = `File is too small.`
        } else {
          errorMessage = error.message || 'File validation failed.'
        }
        errors.push({ fileName: file.name, error: errorMessage })
      })
    })

    setValidationErrors((prev) => [...prev, ...errors])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
  })

  // Handle camera capture
  const handleCameraCapture = useCallback((file: File) => {
    // Validate camera-captured file
    const error = validateFile(file)
    if (error) {
      setValidationErrors((prev) => [...prev, { fileName: file.name, error }])
    } else {
      setSelectedFiles((prev) => [...prev, file])
      console.log('Photo captured from camera:', file.name)
    }
  }, [validateFile])

  // Create preview URLs for files
  const previewUrls = useMemo(() => {
    return selectedFiles.map((file) => URL.createObjectURL(file))
  }, [selectedFiles])

  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  // Clear all selected files
  const handleClearFiles = useCallback(() => {
    // Revoke all preview URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setSelectedFiles([])
    setValidationErrors([])
  }, [previewUrls])

  // Dismiss validation errors
  const handleDismissErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  // Remove a specific file
  const handleRemoveFile = useCallback((indexToRemove: number) => {
    // Revoke the preview URL before removing
    if (previewUrls[indexToRemove]) {
      URL.revokeObjectURL(previewUrls[indexToRemove])
    }
    setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove))
  }, [previewUrls])

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || !eventId || isUploading) return

    setIsUploading(true)
    setUploadError(null)

    // Initialize upload progress for all files
    const initialProgress = new Map<number, UploadProgress>()
    selectedFiles.forEach((file, index) => {
      initialProgress.set(index, {
        fileName: file.name,
        status: 'pending',
        progress: 0,
      })
    })
    setUploadProgress(initialProgress)

    try {
      let completedCount = 0
      let errorCount = 0

      // Upload each file sequentially
      for (let index = 0; index < selectedFiles.length; index++) {
        const file = selectedFiles[index]

        try {
          // Step 1: Get presigned URL
          setUploadProgress((prev) => {
            const updated = new Map(prev)
            updated.set(index, {
              ...updated.get(index)!,
              status: 'uploading',
              progress: 10,
            })
            return updated
          })

          const uploadRequest = {
            event_id: eventId,
            filename: file.name,
            content_type: file.type,
            file_size: file.size,
            // uploader_id is optional, can be added later if needed
          }

          const { upload_url, media_id } = await getUploadUrl(uploadRequest)

          // Step 2: Upload file to Azure Blob Storage
          setUploadProgress((prev) => {
            const updated = new Map(prev)
            updated.set(index, {
              ...updated.get(index)!,
              progress: 30,
            })
            return updated
          })

          await uploadToBlob(upload_url, file)

          setUploadProgress((prev) => {
            const updated = new Map(prev)
            updated.set(index, {
              ...updated.get(index)!,
              progress: 80,
              status: 'confirming',
            })
            return updated
          })

          // Step 3: Confirm upload
          await confirmUpload(media_id)

          // Mark as completed
          setUploadProgress((prev) => {
            const updated = new Map(prev)
            updated.set(index, {
              ...updated.get(index)!,
              status: 'completed',
              progress: 100,
              mediaId: media_id,
            })
            return updated
          })
          completedCount++
        } catch (error) {
          // Handle error for this specific file
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          setUploadProgress((prev) => {
            const updated = new Map(prev)
            updated.set(index, {
              ...updated.get(index)!,
              status: 'error',
              error: errorMessage,
            })
            return updated
          })
          errorCount++
        }
      }

      // Navigate to event page if all uploads completed successfully
      if (completedCount === selectedFiles.length && errorCount === 0) {
        setTimeout(() => {
          navigate(`/events/${eventId}`)
        }, 1500)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, eventId, isUploading, navigate])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Upload Photos</h1>
        {eventId && (
          <p className="text-neutral-600">Event ID: {eventId}</p>
        )}
      </div>

      <Card>
        <Card.Body>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-4xl">📸</div>
              {isDragActive ? (
                <p className="text-lg font-semibold text-primary-600">
                  Drop the photos here...
                </p>
              ) : (
                <>
                  <p className="text-lg font-semibold text-neutral-700">
                    Drag & drop photos here, or click to select
                  </p>
                  <p className="text-sm text-neutral-500">
                    Supports: JPG, PNG, GIF, WebP (Max 10MB per file)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-6 p-4 bg-error-50 border border-error-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-error-800">
                  {validationErrors.length} file{validationErrors.length !== 1 ? 's' : ''} rejected
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDismissErrors}
                >
                  Dismiss
                </Button>
              </div>
              <ul className="space-y-2">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-error-700">
                    <span className="font-medium">{error.fileName}:</span> {error.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => setIsCameraOpen(true)}
            >
              📷 Take Photo
            </Button>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-neutral-700">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearFiles}
                  >
                    Clear All
                  </Button>
                </div>
                {/* Photo Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => {
                    const progress = uploadProgress.get(index)
                    const isUploadingFile = progress && progress.status !== 'pending' && progress.status !== 'completed' && progress.status !== 'error'
                    const isCompleted = progress?.status === 'completed'
                    const hasError = progress?.status === 'error'

                    return (
                      <div
                        key={index}
                        className={`relative group bg-white rounded-lg border overflow-hidden transition-shadow ${
                          isCompleted
                            ? 'border-success-300 shadow-md'
                            : hasError
                            ? 'border-error-300'
                            : 'border-neutral-200 hover:shadow-md'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="aspect-square bg-neutral-100 relative">
                          <img
                            src={previewUrls[index]}
                            alt={file.name}
                            className={`w-full h-full object-cover ${isUploadingFile ? 'opacity-50' : ''}`}
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center text-neutral-400">
                                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                `
                              }
                            }}
                          />
                          {/* Upload Progress Overlay */}
                          {isUploadingFile && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-center text-white">
                                <LoadingSpinner size="md" />
                                <p className="text-xs mt-2">{progress?.progress}%</p>
                              </div>
                            </div>
                          )}
                          {/* Success/Error Indicators */}
                          {isCompleted && (
                            <div className="absolute top-2 left-2 bg-success-500 text-white rounded-full p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          {hasError && (
                            <div className="absolute top-2 left-2 bg-error-500 text-white rounded-full p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                          {/* Remove button overlay (only show when not uploading) */}
                          {!isUploading && !isUploadingFile && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRemoveFile(index)}
                                className="shadow-lg"
                              >
                                ✕
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* File info */}
                        <div className="p-2">
                          <p className="text-xs text-neutral-600 truncate" title={file.name}>
                            {file.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-neutral-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {progress && (
                              <span className={`text-xs font-medium ${
                                isCompleted ? 'text-success-600' : hasError ? 'text-error-600' : 'text-primary-600'
                              }`}>
                                {progress.status === 'uploading' && 'Uploading...'}
                                {progress.status === 'confirming' && 'Confirming...'}
                                {progress.status === 'completed' && '✓ Done'}
                                {progress.status === 'error' && '✗ Error'}
                              </span>
                            )}
                          </div>
                          {/* Progress Bar */}
                          {progress && (progress.status === 'uploading' || progress.status === 'confirming') && (
                            <div className="mt-2 w-full bg-neutral-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all bg-primary-500"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          )}
                          {/* Error Message */}
                          {hasError && progress.error && (
                            <p className="text-xs text-error-600 mt-1 truncate" title={progress.error}>
                              {progress.error}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4">
                  <ErrorMessage
                    title="Upload Error"
                    message={uploadError}
                    onRetry={() => {
                      setUploadError(null)
                      handleUpload()
                    }}
                  />
                </div>
              )}

              {/* Upload Button */}
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                  isLoading={isUploading}
                >
                  {isUploading
                    ? 'Uploading...'
                    : `Upload ${selectedFiles.length} Photo${selectedFiles.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}

export default UploadPage

