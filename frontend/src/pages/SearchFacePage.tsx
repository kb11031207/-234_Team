import { useParams, Link } from 'react-router-dom'
import { useState, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { searchBySelfie } from '../api/faces'
import { Media } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import EmptyState from '../components/ui/EmptyState'
import PhotoGrid from '../components/media/PhotoGrid'
import PhotoViewer from '../components/media/PhotoViewer'
import CameraCapture from '../components/camera/CameraCapture'
import { useQuery } from '@tanstack/react-query'
import { getEvent } from '../api/events'

const SearchFacePage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [tolerance, setTolerance] = useState<number>(0.6)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId,
  })

  // Face search mutation - use function to get current tolerance value
  const {
    mutate: searchFaces,
    data: searchResults,
    isPending: isSearching,
    error: searchError,
    reset: resetSearch,
  } = useMutation({
    mutationFn: ({ file, tolerance }: { file: File; tolerance: number }) =>
      searchBySelfie(eventId!, file, tolerance),
  })

  // Handle file selection (shared for both file and camera inputs)
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file')
          return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB')
          return
        }

        setSelectedFile(file)
        resetSearch()

        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }

      // Reset input value so same file can be selected again
      e.target.value = ''
    },
    [resetSearch, previewUrl]
  )

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        if (file.size > 10 * 1024 * 1024) {
          alert('File size must be less than 10MB')
          return
        }

        setSelectedFile(file)
        resetSearch()

        // Clean up previous preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    },
    [resetSearch, previewUrl]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Handle camera button click - open camera modal
  const handleCameraClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsCameraOpen(true)
    },
    []
  )

  // Handle camera capture
  const handleCameraCapture = useCallback(
    (file: File) => {
      setSelectedFile(file)
      resetSearch()

      // Clean up previous preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    },
    [resetSearch, previewUrl]
  )

  // Handle file upload button click
  const handleFileUploadClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      fileInputRef.current?.click()
    },
    []
  )

  // Handle search - pass current tolerance value
  const handleSearch = useCallback(() => {
    if (selectedFile) {
      searchFaces({ file: selectedFile, tolerance })
    }
  }, [selectedFile, tolerance, searchFaces])

  // Handle photo click
  const handlePhotoClick = useCallback((_photo: Media, index: number) => {
    setSelectedPhotoIndex(index)
  }, [])

  const handleCloseViewer = useCallback(() => {
    setSelectedPhotoIndex(null)
  }, [])

  const handleNextPhoto = useCallback(() => {
    if (searchResults?.matches && selectedPhotoIndex !== null && selectedPhotoIndex < searchResults.matches.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }, [searchResults, selectedPhotoIndex])

  const handlePreviousPhoto = useCallback(() => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    }
  }, [selectedPhotoIndex])

  // Get photos from search results
  const photos = searchResults?.matches || []

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/events/${eventId}`} className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Back to Event
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Find Your Photos</h1>
          {event && (
            <p className="text-gray-600">
              Upload a selfie to find all photos of yourself in <strong>{event.title}</strong>
            </p>
          )}
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <Card.Header>
            <h2 className="text-xl font-bold text-gray-800">Upload Selfie</h2>
            <p className="text-gray-600 mt-1 text-sm">
              Upload a clear photo of your face. We'll search for all photos in this event where you appear.
            </p>
          </Card.Header>

          <Card.Body>
            {/* Upload Options Buttons */}
            <div className="flex gap-4 mb-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCameraClick}
                className="flex-1"
              >
                📷 Take Photo
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleFileUploadClick}
                className="flex-1"
              >
                📁 Choose File
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* File Upload Area / Preview */}
            {previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg object-contain"
                  />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{selectedFile?.name}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                        }
                        setPreviewUrl(null)
                        resetSearch()
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                onClick={handleFileUploadClick}
              >
                <div>
                  <div className="text-6xl mb-4">📸</div>
                  <p className="text-gray-700 font-medium mb-2">Drag and drop your selfie here</p>
                  <p className="text-sm text-gray-500">Or use the buttons above to take a photo or choose a file</p>
                  <p className="text-sm text-gray-500 mt-1">Supported formats: JPG, PNG, WebP (max 10MB)</p>
                </div>
              </div>
            )}

            {/* Tolerance Slider */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Sensitivity: {tolerance.toFixed(1)}
                <span className="text-xs text-gray-500 ml-2">
                  (Lower = stricter, Higher = more matches)
                </span>
              </label>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Strict</span>
                <span>Loose</span>
              </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSearch}
                disabled={!selectedFile || isSearching}
                isLoading={isSearching}
                className="w-full"
              >
                {isSearching ? 'Searching...' : '🔍 Find My Photos'}
              </Button>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="mt-4">
                <ErrorMessage
                  title="Search Failed"
                  message={
                    searchError instanceof Error
                      ? searchError.message
                      : 'Failed to search for photos. Please try again.'
                  }
                />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Search Results */}
        {searchResults && (
          <Card>
            <Card.Header>
              <h2 className="text-xl font-bold text-gray-800">Search Results</h2>
              <p className="text-gray-600 mt-1 text-sm">
                {searchResults.message || `Found ${searchResults.total} photo(s) with ${searchResults.faces_matched} face match(es)`}
              </p>
            </Card.Header>

            <Card.Body>
              {photos.length === 0 ? (
                <EmptyState
                  title="No Matches Found"
                  message="We couldn't find any photos matching your selfie. Try adjusting the sensitivity or upload a different photo."
                />
              ) : (
                <PhotoGrid
                  media={photos}
                  onPhotoClick={handlePhotoClick}
                  isLoading={false}
                  enableSelection={true}
                />
              )}
            </Card.Body>
          </Card>
        )}

        {/* Photo Viewer */}
        {selectedPhotoIndex !== null && photos.length > 0 && (
          <PhotoViewer
            photos={photos}
            currentIndex={selectedPhotoIndex}
            isOpen={selectedPhotoIndex !== null}
            onClose={handleCloseViewer}
            onNext={handleNextPhoto}
            onPrevious={handlePreviousPhoto}
            showFaceOverlays={true}
          />
        )}

        {/* Camera Capture Modal */}
        <CameraCapture
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handleCameraCapture}
          onError={(error) => {
            console.error('Camera error:', error)
            // Error is handled in the CameraCapture component
          }}
        />
      </div>
    </div>
  )
}

export default SearchFacePage
