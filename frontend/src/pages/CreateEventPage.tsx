import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '../api/events'
import { CreateEventData } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Card from '../components/ui/Card'

const CreateEventPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    is_public: false,
    can_add: 'code_holders',
  })

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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create New Event</h1>
          <p className="text-lg text-gray-600">
            Set up your event and get a unique access code to share with attendees
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Title */}
            <Input
              label="Event Title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Sarah's Wedding, Tech Conference 2024"
            />

            {/* Description */}
            <Textarea
              label="Description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event (optional)"
              rows={4}
            />

            {/* Event Date */}
            <Input
              label="Event Date"
              type="datetime-local"
              value={formData.event_date || ''}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />

            {/* Location */}
            <Input
              label="Location"
              type="text"
              value={formData.location_text || ''}
              onChange={(e) => setFormData({ ...formData, location_text: e.target.value })}
              placeholder="e.g., Central Park, New York"
            />

            {/* Privacy Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>

              {/* Public/Private Toggle */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">Make event public</span>
                    <p className="text-sm text-gray-600">
                      Anyone can discover and view this event. Access code still required for uploads.
                    </p>
                  </div>
                </label>
              </div>

              {/* Upload Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Who can upload photos?
                </label>
                <div className="space-y-3">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      value="owner_only"
                      checked={formData.can_add === 'owner_only'}
                      onChange={(e) => setFormData({ ...formData, can_add: e.target.value as any })}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Owner only</span>
                      <p className="text-sm text-gray-600">Only you can upload photos</p>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      value="code_holders"
                      checked={formData.can_add === 'code_holders'}
                      onChange={(e) => setFormData({ ...formData, can_add: e.target.value as any })}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Anyone with access code</span>
                      <p className="text-sm text-gray-600">Recommended for most events</p>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      value="public"
                      checked={formData.can_add === 'public'}
                      onChange={(e) => setFormData({ ...formData, can_add: e.target.value as any })}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900">Anyone (no code required)</span>
                      <p className="text-sm text-gray-600">For fully public events</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Error creating event. Please try again.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={mutation.isPending}
                fullWidth
                size="lg"
              >
                {mutation.isPending ? 'Creating Event...' : 'Create Event'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="w-32"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Info Box */}
        <div className="mt-6 bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-primary-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-900">What happens next?</p>
              <p className="text-sm text-primary-700 mt-1">
                You'll receive a unique access code and QR code that you can share with your attendees.
                They can use it to upload and view event photos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateEventPage
