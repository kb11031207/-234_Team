import { useParams } from 'react-router-dom'
import { Alert } from 'react-bootstrap'
import UploadZone from '../components/media/UploadZone'

const UploadPage = () => {
  const { eventId } = useParams()

  if (!eventId) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <Alert variant="danger">
          No event ID provided. Please select an event to upload photos to.
        </Alert>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Upload Photos</h1>
      <p>Event: {eventId}</p>
      
      <UploadZone
        eventId={eventId}
        onUploadComplete={(mediaId) => {
          console.log('Upload completed:', mediaId)
        }}
        onUploadError={(error) => {
          console.error('Upload failed:', error)
        }}
      />
    </div>
  )
}

export default UploadPage
