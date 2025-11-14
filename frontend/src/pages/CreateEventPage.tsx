import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent, updateEvent } from '../api/events'
import { getUploadUrl, uploadToBlob, confirmUpload } from '../api/media'
import { CreateEventData } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'
import { useGeolocation } from '../hooks/useGeolocation'
import InteractiveMap from '../components/homepage/InteractiveMap'
import { LatLngTuple } from 'leaflet'
import { geocodeAddress, reverseGeocode, GeocodingResult } from '../utils/geocoding'

const CreateEventPage = () => {
  const navigate = useNavigate()
  const { coordinates } = useGeolocation()
  
  // Default center (New York City) - used when location is not available
  const defaultCenter: [number, number] = [40.7128, -74.0060]
  const mapCenter: LatLngTuple = coordinates
    ? [coordinates.latitude, coordinates.longitude]
    : defaultCenter
  
  const [selectedLocation, setSelectedLocation] = useState<LatLngTuple | null>(
    coordinates ? [coordinates.latitude, coordinates.longitude] : null
  )
  
  const [locationSearch, setLocationSearch] = useState('')
  const [locationSearchResults, setLocationSearchResults] = useState<GeocodingResult[]>([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null)
  const [showLocationResults, setShowLocationResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Cover photo state
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null)
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null)
  const [isUploadingCoverPhoto, setIsUploadingCoverPhoto] = useState(false)
  
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    is_public: true, // Default to public so events show on map
    can_add: 'code_holders',
    event_date: '',
    location_text: '',
    latitude: selectedLocation?.[0],
    longitude: selectedLocation?.[1],
    cover_photo_url: undefined,
  })
  
  // Note: Reverse geocoding is handled in handleMapClick to avoid infinite loops

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: async (eventData) => {
      // If cover photo exists, upload it after event creation
      if (coverPhoto) {
        try {
          setIsUploadingCoverPhoto(true)
          
          // Step 1: Get presigned URL
          const uploadUrlResponse = await getUploadUrl({
            event_id: eventData.event_id,
            filename: coverPhoto.name,
            content_type: coverPhoto.type,
            file_size: coverPhoto.size,
          })
          
          // Step 2: Upload file to Azure Blob Storage
          await uploadToBlob(uploadUrlResponse.upload_url, coverPhoto)
          
          // Step 3: Confirm upload
          await confirmUpload(uploadUrlResponse.media_id)
          
          // Step 4: Update event with cover photo URL
          await updateEvent(eventData.event_id, {
            cover_photo_url: uploadUrlResponse.blob_url,
          })
        } catch (error) {
          console.error('Error uploading cover photo:', error)
          // Don't block navigation - event is created, cover photo upload failed
          // User can update it later if needed
        } finally {
          setIsUploadingCoverPhoto(false)
        }
      }
      
      // Navigate to event page
      navigate(`/events/${eventData.event_id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prepare event data - don't include cover_photo_url yet (we'll upload it after event creation)
    const eventData: CreateEventData = {
      title: formData.title,
      description: formData.description || undefined,
      is_public: formData.is_public,
      can_add: formData.can_add,
      event_date: formData.event_date || undefined,
      location_text: formData.location_text || undefined,
      latitude: selectedLocation?.[0],
      longitude: selectedLocation?.[1],
      // Note: cover_photo_url will be set after upload in onSuccess
    }
    
    // Clean up the data: remove empty strings and undefined values
    const cleanEventData: CreateEventData = {
      title: eventData.title,
      is_public: eventData.is_public,
      can_add: eventData.can_add,
      ...(eventData.description && { description: eventData.description }),
      ...(eventData.event_date && { event_date: eventData.event_date }),
      ...(eventData.location_text && { location_text: eventData.location_text }),
      ...(eventData.latitude !== undefined && { latitude: eventData.latitude }),
      ...(eventData.longitude !== undefined && { longitude: eventData.longitude }),
    }
    
    mutation.mutate(cleanEventData)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng])
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }))
    setShowLocationResults(false)
    setLocationSearchError(null)
    
    // Reverse geocode to get address when clicking on map
    reverseGeocode(lat, lng)
      .then((address) => {
        setFormData((prev) => ({
          ...prev,
          location_text: address,
        }))
        setLocationSearch(address)
      })
      .catch((error) => {
        console.error('Error reverse geocoding:', error)
        // Fallback to coordinates if reverse geocoding fails
        setLocationSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      })
  }

  const handleLocationSearch = (query: string) => {
    setLocationSearch(query)
    setLocationSearchError(null)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (!query.trim()) {
      setLocationSearchResults([])
      setShowLocationResults(false)
      setIsSearchingLocation(false)
      return
    }

    // Debounce search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLocation(true)
      try {
        const results = await geocodeAddress(query)
        setLocationSearchResults(results)
        setShowLocationResults(results.length > 0)
      } catch (error) {
        setLocationSearchError(
          error instanceof Error ? error.message : 'Failed to search location'
        )
        setLocationSearchResults([])
        setShowLocationResults(false)
      } finally {
        setIsSearchingLocation(false)
      }
    }, 500) // 500ms debounce
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSelectLocationResult = (result: GeocodingResult) => {
    setSelectedLocation([result.lat, result.lon])
    setFormData((prev) => ({
      ...prev,
      latitude: result.lat,
      longitude: result.lon,
      location_text: result.display_name,
    }))
    setLocationSearch(result.display_name)
    setShowLocationResults(false)
    setLocationSearchError(null)
    // Map will update center via selectedLocation prop
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <Card.Header>
            <h1 className="text-3xl font-bold text-gray-800">Create New Event</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details below to create a new event. Make it public to show on the map!
            </p>
          </Card.Header>
          
          <Card.Body>
            {mutation.isError && (
              <div className="mb-6">
                <ErrorMessage
                  title="Error Creating Event"
                  message={
                    mutation.error instanceof Error
                      ? mutation.error.message
                      : 'Failed to create event. Please try again.'
                  }
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <Input
                label="Event Title"
                placeholder="e.g., Sarah's Wedding, Company Picnic, etc."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your event..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Event Date */}
              <div>
                <Input
                  label="Event Start Date & Time"
                  type="datetime-local"
                  value={formData.event_date || ''}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Events don't have an end date. They remain active until you delete them.
                </p>
              </div>

              {/* Cover Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Photo (Optional)
                </label>
                <div className="space-y-3">
                  {coverPhotoPreview ? (
                    <div className="relative">
                      <img
                        src={coverPhotoPreview}
                        alt="Cover photo preview"
                        className="w-full h-64 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverPhoto(null)
                          setCoverPhotoPreview(null)
                          setFormData((prev) => ({ ...prev, cover_photo_url: undefined }))
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        aria-label="Remove cover photo"
                      >
                        <svg
                          className="w-5 h-5"
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
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('cover-photo-input')?.click()}
                    >
                      <input
                        id="cover-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
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
                            setCoverPhoto(file)
                            // Create preview URL
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setCoverPhotoPreview(reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                      />
                      <p className="text-gray-700 font-medium mb-2">Click to upload cover photo</p>
                      <p className="text-sm text-gray-500">JPG, PNG, or WebP (max 10MB)</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  A cover photo helps your event stand out on the map and event page.
                </p>
              </div>

              {/* Location Search */}
              <div className="relative location-search-container">
                <Input
                  label="Search Location"
                  placeholder="e.g., Central Park, NYC or click on map below"
                  value={locationSearch}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  helperText="Type an address or location name to search, or click on the map below to set location"
                />
                {isSearchingLocation && (
                  <div className="absolute right-3 top-10">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
                {locationSearchError && (
                  <p className="text-sm text-error-600 mt-1">{locationSearchError}</p>
                )}
                {showLocationResults && locationSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {locationSearchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectLocationResult(result)}
                        className="w-full text-left px-4 py-2 hover:bg-primary-50 hover:text-primary-700 border-b border-gray-200 last:border-b-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800">{result.display_name}</p>
                        <p className="text-xs text-gray-500">
                          {result.lat.toFixed(6)}, {result.lon.toFixed(6)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Picker (Map) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Location (Click on map to set)
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <InteractiveMap
                    center={selectedLocation || mapCenter}
                    zoom={selectedLocation ? 15 : (coordinates ? 13 : 10)}
                    events={[]}
                    onMapClick={handleMapClick}
                    selectedLocation={selectedLocation}
                    className="w-full h-full"
                  />
                </div>
                <div className="mt-2 flex items-start gap-2">
                  {selectedLocation && (
                    <>
                      <div className="flex-1 p-3 bg-success-50 border border-success-200 rounded-lg">
                        <p className="text-sm text-success-800">
                          ✅ <strong>Location set:</strong> {selectedLocation[0].toFixed(6)}, {selectedLocation[1].toFixed(6)}
                        </p>
                        {formData.location_text && (
                          <p className="text-xs text-success-700 mt-1">{formData.location_text}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedLocation(null)
                          setLocationSearch('')
                          setFormData((prev) => ({
                            ...prev,
                            latitude: undefined,
                            longitude: undefined,
                            location_text: '',
                          }))
                        }}
                      >
                        Clear
                      </Button>
                    </>
                  )}
                  {!selectedLocation && (
                    <p className="text-sm text-gray-500">
                      ℹ️ Search for a location above or click on the map to set the event location
                    </p>
                  )}
                </div>
                {formData.is_public && !selectedLocation && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>Note:</strong> Public events without a location won't appear on the map. Search for a location above or click on the map to set a location.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Setting a location helps people find your event on the map. You can search for an address or click directly on the map. If you don't set a location, the event won't appear on the map.
                </p>
              </div>

              {/* Public/Private */}
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_public" className="text-sm font-medium text-gray-700">
                  Public Event (anyone can view on the map)
                </label>
              </div>

              {/* Upload Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who can upload photos?
                </label>
                <select
                  value={formData.can_add}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_add: e.target.value as 'owner_only' | 'code_holders' | 'public',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="owner_only">Only me (event owner)</option>
                  <option value="code_holders">Anyone with access code</option>
                  <option value="public">Anyone (public events only)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.can_add === 'owner_only' && 'Only you can upload photos to this event.'}
                  {formData.can_add === 'code_holders' &&
                    'Anyone with the access code can upload photos.'}
                  {formData.can_add === 'public' &&
                    'Anyone can upload photos (only works for public events).'}
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={mutation.isPending || isUploadingCoverPhoto}
                  disabled={mutation.isPending || isUploadingCoverPhoto || !formData.title.trim()}
                >
                  {mutation.isPending
                    ? 'Creating Event...'
                    : isUploadingCoverPhoto
                    ? 'Uploading Cover Photo...'
                    : 'Create Event'}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default CreateEventPage
