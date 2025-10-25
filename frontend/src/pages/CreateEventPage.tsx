import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { createEvent } from '../api/events'
import { CreateEventData } from '../types'

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
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Create New Event</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Event Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{ width: '100%', padding: '0.5rem', minHeight: '100px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              style={{ marginRight: '0.5rem' }}
            />
            Public Event (anyone can view)
          </label>
        </div>

        <button 
          type="submit" 
          disabled={mutation.isPending}
          style={{ padding: '1rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          {mutation.isPending ? 'Creating...' : 'Create Event'}
        </button>

        {mutation.isError && (
          <p style={{ color: 'red', marginTop: '1rem' }}>
            Error creating event. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}

export default CreateEventPage

