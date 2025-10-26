import React from 'react'
import { Media } from '../../types'
import DownloadButton from './DownloadButton'

interface MediaGridProps {
  items: Media[]
  loading?: boolean
  onItemClick?: (item: Media) => void
  selectable?: boolean
}

const MediaGrid: React.FC<MediaGridProps> = ({ items, loading, onItemClick, selectable = false }) => {
  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(new Set())

  const toggleSelection = (item: Media, event: React.MouseEvent) => {
    event.stopPropagation()
    const newSelected = new Set(selectedItems)
    if (newSelected.has(item.media_id)) {
      newSelected.delete(item.media_id)
    } else {
      newSelected.add(item.media_id)
    }
    setSelectedItems(newSelected)
  }

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

  const selectedMedia = items.filter(item => selectedItems.has(item.media_id))

  return (
    <div>
      {selectable && selectedMedia.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <DownloadButton media={selectedMedia} />
        </div>
      )}
      
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
              {selectable && (
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.media_id)}
                  onChange={(e) => toggleSelection(item, e as any)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ margin: 0 }}
                />
              )}
            </div>
            {!selectable && (
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <DownloadButton media={item} variant="icon" size="small" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MediaGrid