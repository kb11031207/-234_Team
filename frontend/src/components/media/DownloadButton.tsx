import React, { useState } from 'react'
import { Media } from '../../types'

interface DownloadButtonProps {
  media: Media | Media[]
  variant?: 'icon' | 'button'
  size?: 'small' | 'medium' | 'large'
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  media, 
  variant = 'button',
  size = 'medium'
}) => {
  const [downloading, setDownloading] = useState(false)

  const downloadSingle = async (item: Media) => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a')
      link.href = item.blob_url
      link.download = item.filename || `photo-${item.media_id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const downloadMultiple = async (items: Media[]) => {
    try {
      setDownloading(true)
      // Download each file sequentially to avoid overwhelming the browser
      for (const item of items) {
        await downloadSingle(item)
        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error('Error downloading files:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleClick = () => {
    const items = Array.isArray(media) ? media : [media]
    if (items.length === 1) {
      downloadSingle(items[0])
    } else {
      downloadMultiple(items)
    }
  }

  // Style configurations
  const sizes = {
    small: { padding: '4px 8px', fontSize: '12px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' },
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={downloading}
        style={{
          background: 'none',
          border: 'none',
          padding: sizes[size].padding,
          cursor: downloading ? 'wait' : 'pointer',
          opacity: downloading ? 0.7 : 1,
        }}
        title="Download photo"
      >
        📥
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={downloading}
      style={{
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: sizes[size].padding,
        fontSize: sizes[size].fontSize,
        cursor: downloading ? 'wait' : 'pointer',
        opacity: downloading ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span>📥</span>
      <span>
        {downloading
          ? 'Downloading...'
          : Array.isArray(media)
          ? `Download ${media.length} photos`
          : 'Download photo'}
      </span>
    </button>
  )
}

export default DownloadButton