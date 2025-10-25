import { useParams } from 'react-router-dom'

const SearchFacePage = () => {
  const { eventId } = useParams()

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Find Your Photos</h1>
      <p>Event ID: {eventId}</p>

      <div style={{ marginTop: '2rem' }}>
        <p>Upload a selfie to find all photos of yourself in this event</p>
        
        <div style={{ marginTop: '2rem', padding: '3rem', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
          <p>Upload selfie or take a photo</p>
          <p style={{ color: '#666', marginTop: '1rem' }}>Face search feature coming soon...</p>
          {/* TODO: Implement face search */}
        </div>
      </div>
    </div>
  )
}

export default SearchFacePage

