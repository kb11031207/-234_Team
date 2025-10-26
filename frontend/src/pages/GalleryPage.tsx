import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEventMedia } from '../api/media'
import MediaGrid from '../components/media/MediaGrid'
import { Media } from '../types'

const GalleryPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ['eventMedia', eventId],
    queryFn: () => getEventMedia(eventId!),
    enabled: !!eventId,
  })

  const [selectionMode, setSelectionMode] = useState(false)

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Event Gallery</h1>
        <button
          onClick={() => setSelectionMode(!selectionMode)}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            background: selectionMode ? '#007bff' : 'white',
            color: selectionMode ? 'white' : 'black',
            cursor: 'pointer',
          }}
        >
          {selectionMode ? 'Cancel Selection' : 'Select Photos'}
        </button>
      </div>
      <MediaGrid 
        items={mediaItems} 
        loading={isLoading} 
        selectable={selectionMode}
      />
    </div>
  )
}

export default GalleryPage