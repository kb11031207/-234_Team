import React from 'react'
import { Media } from '../../types'

interface MediaGridProps {
  items: Media[]
  loading?: boolean
  onItemClick?: (item: Media) => void
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, loading, onItemClick }) => {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              aspectRatio: '1',
              background: '#f0f0f0',
              borderRadius: '8px',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No media items found</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {items.map((item) => (
        <div
          key={item.media_id}
          style={{
            position: 'relative',
            aspectRatio: '1',
            borderRadius: '8px',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => onItemClick?.(item)}
        >
          <img
            src={item.thumbnail_url || item.blob_url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              fontSize: '0.8rem',
            }}
          >
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
}

export default MediaGrid