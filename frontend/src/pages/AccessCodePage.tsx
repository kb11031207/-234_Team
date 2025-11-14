import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { validateAccessCode } from '../api/events'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorMessage from '../components/ui/ErrorMessage'

const AccessCodePage = () => {
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const validateMutation = useMutation({
    mutationFn: (code: string) => validateAccessCode(code),
    onSuccess: (data) => {
      // Navigate to the event page on successful validation
      if (data.event_id) {
        navigate(`/events/${data.event_id}`)
      } else {
        setError('Invalid response from server. Please try again.')
      }
    },
    onError: (err: any) => {
      // Handle error response
      if (err?.response?.status === 404) {
        setError('Access code not found. Please check the code and try again.')
      } else if (err?.response?.status === 403) {
        setError('Access denied. This code does not grant access to this event.')
      } else {
        setError(err?.response?.data?.detail || err?.message || 'Failed to validate access code. Please try again.')
      }
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    // Trim whitespace from access code
    const trimmedCode = accessCode.trim()
    
    if (!trimmedCode) {
      setError('Please enter an access code.')
      return
    }

    validateMutation.mutate(trimmedCode)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <Card.Header>
            <h1 className="text-3xl font-bold text-gray-800">Enter Access Code</h1>
            <p className="text-gray-600 mt-2">
              Use an access code to view private events or events that are no longer visible on the map.
            </p>
          </Card.Header>

          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Access Code"
                type="text"
                value={accessCode}
                onChange={(e) => {
                  // Convert to uppercase and remove spaces
                  const upperValue = e.target.value.toUpperCase().replace(/\s/g, '')
                  setAccessCode(upperValue)
                  setError(null) // Clear error when user types
                }}
                placeholder="Enter event access code"
                required
                autoFocus
                disabled={validateMutation.isPending}
                error={error || undefined}
                helperText="Enter the code provided by the event organizer"
                className="text-lg font-mono tracking-wider"
                style={{ textTransform: 'uppercase' }}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={validateMutation.isPending}
                  disabled={!accessCode.trim() || validateMutation.isPending}
                  className="flex-1"
                >
                  {validateMutation.isPending ? 'Validating...' : 'Access Event'}
                </Button>
              </div>
            </form>

            {validateMutation.isPending && (
              <div className="mt-6 flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Additional Info Card */}
        <Card className="mt-6">
          <Card.Body>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="font-semibold text-gray-700">Private Events</p>
                  <p>Access private events that aren't visible on the public map.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-semibold text-gray-700">Past Events</p>
                  <p>View events that have passed and are no longer shown on the map.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-semibold text-gray-700">Distant Events</p>
                  <p>Access events that are outside your current location radius.</p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default AccessCodePage

