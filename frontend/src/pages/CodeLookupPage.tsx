import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateAccessCode } from '../api/events'

const CodeLookupPage: React.FC = () => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code.trim()) {
      setError('Please enter an access code')
      return
    }
    setLoading(true)
    try {
      const res = await validateAccessCode(code.trim())
      // Expecting { event_id, title, has_access, can_upload }
      if (res && res.event_id) {
        navigate(`/events/${res.event_id}`)
      } else {
        setError('Invalid access code')
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Enter Event Access Code</h1>
      <p>Enter the code you received at the event to view private media.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g., ABC123"
          style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem 1rem', borderRadius: '4px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  )
}

export default CodeLookupPage
