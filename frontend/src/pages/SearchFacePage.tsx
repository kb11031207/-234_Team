import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { searchFacesBySelfie } from '../api/faces'
import { Media } from '../types'

const SearchFacePage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<{ matches: Media[]; total: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const handleFileSelect = async (file: File) => {
    if (!eventId) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Search
    setSearching(true)
    setError(null)
    setResults(null)

    try {
      const result = await searchFacesBySelfie(eventId, file)
      setResults(result)
      
      if (result.total === 0) {
        setError(result.message || "you don't appear in any photos yet")
      }
    } catch (err: any) {
      console.error('Search failed:', err)
      setError(err.response?.data?.detail || err.message || 'search failed. please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      setCameraActive(true)
      setError(null)
    } catch (err) {
      setError('failed to access camera. please check permissions.')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
    setCameraActive(false)
  }

  const captureAndSearch = async () => {
    if (!videoRef.current || !eventId) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(videoRef.current, 0, 0)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      stopCamera()
      await handleFileSelect(file)
    }, 'image/jpeg', 0.9)
  }

  const reset = () => {
    setResults(null)
    setError(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/events/${eventId}`)}
            className="mb-4"
          >
            ← back to event
          </Button>
          
          <h1 className="text-4xl font-title text-text-primary mb-2">
            find yourself
          </h1>
          <p className="text-lg text-text-secondary">
            upload a selfie to see all photos you appear in
          </p>
        </div>

        {!results && !searching && (
          <Card className="p-8">
            {/* Upload Section */}
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-primary rounded-xl p-12 text-center cursor-pointer hover:bg-neutral-light/50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">📸</div>
                <p className="text-xl font-medium text-text-primary mb-2">
                  click to upload selfie
                </p>
                <p className="text-text-secondary">
                  or drag and drop your photo here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Camera Option */}
              <div className="text-center">
                <p className="text-text-secondary mb-4">or</p>
                {!cameraActive ? (
                  <Button variant="secondary" onClick={startCamera} className="w-full sm:w-auto">
                    📷 use camera
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      className="w-full max-w-md mx-auto rounded-xl shadow-lg"
                    />
                    <div className="flex gap-4 justify-center">
                      <Button variant="primary" onClick={captureAndSearch}>
                        📸 capture & search
                      </Button>
                      <Button variant="secondary" onClick={stopCamera}>
                        cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="mt-8 p-6 bg-accent/10 rounded-xl">
              <h3 className="font-semibold text-text-primary mb-3">💡 tips for best results</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• use a clear, well-lit photo of your face</li>
                <li>• face the camera directly</li>
                <li>• remove sunglasses or face coverings</li>
                <li>• only one person should be in the selfie</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Searching State */}
        {searching && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">
              searching for you...
            </h2>
            <p className="text-text-secondary">
              analyzing faces in event photos
            </p>
            {preview && (
              <img 
                src={preview} 
                alt="Your selfie" 
                className="mt-6 max-w-xs mx-auto rounded-xl shadow-lg"
              />
            )}
          </Card>
        )}

        {/* Error State */}
        {error && !results && (
          <Card className="p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                {error.includes('No face detected') ? 'no face detected' : 'oops!'}
              </h2>
              <p className="text-text-secondary mb-6">{error}</p>
              <Button variant="primary" onClick={reset}>
                try again
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {results && results.total > 0 && (
          <div className="space-y-6">
            <Card className="p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-semibold text-text-primary mb-2">
                  {results.message}
                </h2>
                <p className="text-text-secondary mb-6">
                  {results.faces_matched && results.faces_matched > results.total 
                    ? `found ${results.faces_matched} instances of your face across ${results.total} photos`
                    : `you appear in ${results.total} photo${results.total > 1 ? 's' : ''}`
                  }
                </p>
                <Button variant="secondary" onClick={reset}>
                  search again
                </Button>
              </div>
            </Card>

            {/* Photo Grid */}
            <Card className="p-6">
              <h3 className="text-2xl font-semibold text-text-primary mb-6">
                your photos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.matches.map((photo) => (
                  <div 
                    key={photo.media_id}
                    className="relative group cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-xl transition"
                    onClick={() => {
                      // Open photo in modal or navigate to detail view
                      window.open(photo.blob_url, '_blank')
                    }}
                  >
                    <img
                      src={photo.thumbnail_url || photo.blob_url}
                      alt="Photo with you"
                      className="w-full h-64 object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-sm">
                          {photo.face_count > 1 ? `${photo.face_count} people` : '1 person'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">
                    want to download these photos?
                  </h4>
                  <p className="text-sm text-text-secondary">
                    click on any photo to view full size
                  </p>
                </div>
                <Button 
                  variant="primary"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  back to gallery
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchFacePage

