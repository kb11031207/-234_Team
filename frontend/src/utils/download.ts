import { Media } from '../types'

/**
 * Download a single image from a URL
 * @param url Image URL
 * @param filename Optional filename (defaults to extracted filename from URL or 'photo.jpg')
 */
export const downloadImage = async (url: string, filename?: string): Promise<void> => {
  try {
    // Fetch the image
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()

    // Determine filename
    let finalFilename = filename
    if (!finalFilename) {
      // Try to extract filename from URL
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/')
        const urlFilename = pathParts[pathParts.length - 1]
        if (urlFilename && urlFilename.includes('.')) {
          finalFilename = urlFilename
        } else {
          // Default filename based on content type
          const extension = blob.type.split('/')[1] || 'jpg'
          finalFilename = `photo.${extension}`
        }
      } catch {
        // If URL parsing fails, use default
        const extension = blob.type.split('/')[1] || 'jpg'
        finalFilename = `photo.${extension}`
      }
    }

    // Create download link
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = finalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Error downloading image:', error)
    throw error
  }
}

/**
 * Download multiple images in batch
 * @param mediaArray Array of Media objects to download
 * @param onProgress Optional progress callback (current, total)
 */
export const downloadImagesBatch = async (
  mediaArray: Media[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const total = mediaArray.length
  let current = 0

  for (const media of mediaArray) {
    try {
      // Use blob_url (full quality) instead of thumbnail_url
      const url = media.blob_url
      const filename = media.filename || `photo-${media.media_id.substring(0, 8)}.jpg`

      await downloadImage(url, filename)
      current++

      if (onProgress) {
        onProgress(current, total)
      }

      // Small delay between downloads to avoid overwhelming the browser
      if (current < total) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    } catch (error) {
      console.error(`Error downloading ${media.filename || media.media_id}:`, error)
      // Continue with next image even if one fails
      current++
      if (onProgress) {
        onProgress(current, total)
      }
    }
  }
}

