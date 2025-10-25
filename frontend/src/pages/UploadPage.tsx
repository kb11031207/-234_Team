import { useParams } from 'react-router-dom'

const UploadPage = () => {
  const { eventId } = useParams()

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Upload Photos</h1>
      <p>Event ID: {eventId}</p>

      <div style={{ marginTop: '2rem', padding: '3rem', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
        <p>Drag & drop photos here or click to select</p>
        <p style={{ color: '#666', marginTop: '1rem' }}>Upload feature coming soon...</p>
        {/* TODO: Implement upload with react-dropzone */}
      </div>
    </div>
  )
}

export default UploadPage

