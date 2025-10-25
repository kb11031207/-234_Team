import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEventMedia } from '../api/media'
import { searchByFaceId } from '../api/faces'
import { DetectedFace, Media } from '../types'
import MediaGrid from '../components/media/MediaGrid'
import FaceRecognitionUI from '../components/face/FaceRecognitionUI'

const SearchFacePage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Media[]>([])

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ['eventMedia', eventId],
    queryFn: () => getEventMedia(eventId!),
    enabled: !!eventId,
  })

  const handleFaceSelect = async (face: DetectedFace) => {
    if (!eventId) return

    try {
      setSearching(true)
      const matches = await searchByFaceId(eventId, face.face_id)
      setSearchResults(matches)
    } catch (error) {
      console.error('Error searching faces:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Find Your Photos</h1>

      <div style={{ marginTop: '2rem', display: 'grid', gap: '2rem', gridTemplateColumns: selectedMedia ? '1fr 1fr' : '1fr' }}>
        <div>
          <h2>Select a Photo</h2>
          <p>Click on a photo to detect faces</p>
          <div style={{ marginTop: '1rem' }}>
            <MediaGrid
              items={mediaItems.filter(m => m.face_detection_status === 'completed')}
              loading={isLoading}
              onItemClick={setSelectedMedia}
            />
          </div>
        </div>

        {selectedMedia && (
          <div>
            <h2>Detect Faces</h2>
            <p>Click on a face to find similar photos</p>
            <div style={{ marginTop: '1rem' }}>
              <FaceRecognitionUI media={selectedMedia} onFaceSelect={handleFaceSelect} />
            </div>

            {searching && (
              <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', marginBottom: '1rem' }}>🔍</div>
                <p>Searching for similar faces...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h2>Found {searchResults.length} matching photos</h2>
                <div style={{ 
                  marginTop: '1rem',
                  background: '#f5f5f5', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  maxHeight: '600px',
                  overflowY: 'auto'
                }}>
                  <MediaGrid items={searchResults} />
                </div>
              </div>
            )}
            
            {!searching && searchResults.length === 0 && selectedMedia && (
              <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <p>Click on a detected face to find similar photos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchFacePage

