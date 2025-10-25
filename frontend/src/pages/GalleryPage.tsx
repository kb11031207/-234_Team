import React from 'react'
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

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Event Gallery</h1>
      <MediaGrid items={mediaItems} loading={isLoading} />
    </div>
  )
}

export default GalleryPage