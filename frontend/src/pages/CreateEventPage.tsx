import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '../api/events'
import { CreateEventData } from '../types'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { getCurrentPosition } from '../lib/geolocation'

const CreateEventPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    is_public: false,
    can_add: 'code_holders',
  })
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (data) => {
      navigate(`/events/${data.event_id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleGetLocation = async () => {
    setLocationLoading(true)
    setLocationError(null)
    try {
      const position = await getCurrentPosition()
      setFormData({
        ...formData,
        latitude: position.latitude,
        longitude: position.longitude,
      })
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : 'Unable to get location'
      )
    } finally {
      setLocationLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-light to-white overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-title text-text-primary mb-3">
            create new event
          </h1>
          <p className="text-subtitle text-text-secondary">
            set up your photo sharing event with custom access code
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <Input
              label="event title *"
              placeholder="e.g., sarah's wedding, beach party 2024"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-label uppercase text-text-secondary">
                description
              </label>
              <textarea
                placeholder="tell guests what this event is about..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-input-bg border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary resize-none"
                rows={4}
              />
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <label className="block text-label uppercase text-text-secondary">
                event date
              </label>
              <input
                type="datetime-local"
                value={
                  formData.event_date
                    ? new Date(formData.event_date).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_date: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className="w-full px-4 py-3 bg-input-bg border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary"
              />
            </div>

            {/* Location */}
            <div className="space-y-3">
              <label className="block text-label uppercase text-text-secondary">
                location
              </label>
              
              <Input
                placeholder="e.g., central park, new york"
                value={formData.location_text || ''}
                onChange={(e) =>
                  setFormData({ ...formData, location_text: e.target.value })
                }
              />

              {/* Get Current Location Button */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="text-sm"
                >
                  {locationLoading ? '📍 getting location...' : '📍 use current location'}
                </Button>
                
                {formData.latitude && formData.longitude && (
                  <span className="text-body text-accent">
                    ✓ location set ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                  </span>
                )}
              </div>

              {locationError && (
                <p className="text-body text-red-600 text-sm">
                  {locationError}
                </p>
              )}

              <p className="text-label text-text-secondary">
                location helps others find your event on the map
              </p>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4 p-4 bg-neutral-light rounded-xl">
              <h3 className="text-subtitle font-semibold text-text-primary">
                privacy settings
              </h3>

              {/* Public Event Toggle */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) =>
                    setFormData({ ...formData, is_public: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-2 border-neutral-dark/20 checked:bg-accent checked:border-accent focus:ring-2 focus:ring-accent/50 transition-all cursor-pointer"
                />
                <div>
                  <p className="text-body text-text-primary font-medium group-hover:text-accent transition-colors">
                    public event
                  </p>
                  <p className="text-label text-text-secondary">
                    anyone can view this event without an access code
                  </p>
                </div>
              </label>

              {/* Who Can Upload Dropdown */}
              <div className="space-y-2">
                <label className="block text-label uppercase text-text-secondary">
                  who can upload photos?
                </label>
                <select
                  value={formData.can_add}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_add: e.target.value as 'owner_only' | 'code_holders' | 'public',
                    })
                  }
                  className="w-full px-4 py-3 bg-input-bg border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-text-primary cursor-pointer"
                >
                  <option value="owner_only">only me (event owner)</option>
                  <option value="code_holders">anyone with access code</option>
                  <option value="public">anyone (public)</option>
                </select>
                <p className="text-label text-text-secondary">
                  {formData.can_add === 'owner_only' &&
                    'only you can upload photos to this event'}
                  {formData.can_add === 'code_holders' &&
                    'people with the access code can upload photos'}
                  {formData.can_add === 'public' &&
                    'anyone can upload photos without a code (use with caution)'}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-subtitle text-red-700">
                  ⚠️ error creating event
                </p>
                <p className="text-body text-red-600 mt-1">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'please try again'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={mutation.isPending || !formData.title.trim()}
              >
                {mutation.isPending ? 'creating event...' : 'create event'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => navigate(-1)}
                disabled={mutation.isPending}
              >
                cancel
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-neutral-dark/10">
              <p className="text-body text-text-secondary">
                after creating, you'll receive a unique{' '}
                <span className="font-semibold text-accent">access code</span> and{' '}
                <span className="font-semibold text-accent">QR code</span> to share
              </p>
            </div>
          </form>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="text-center space-y-2">
            <div className="text-3xl">🔐</div>
            <p className="text-subtitle">secure access</p>
            <p className="text-body text-text-secondary text-sm">
              unique code for each event
            </p>
          </Card>

          <Card className="text-center space-y-2">
            <div className="text-3xl">📸</div>
            <p className="text-subtitle">easy sharing</p>
            <p className="text-body text-text-secondary text-sm">
              qr code for quick access
            </p>
          </Card>

          <Card className="text-center space-y-2">
            <div className="text-3xl">🧠</div>
            <p className="text-subtitle">ai powered</p>
            <p className="text-body text-text-secondary text-sm">
              automatic face detection
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateEventPage
