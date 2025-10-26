import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { getUploadUrl, uploadToBlob, confirmUpload } from '../../api/media'

interface UploadZoneProps {
  eventId: string
  onUploadComplete?: (mediaId: string) => void
  onUploadError?: (error: Error) => void
  maxFiles?: number
}

interface UploadingFile {
  file: File
  progress: number
  status: 'preparing' | 'uploading' | 'completing' | 'completed' | 'error'
  error?: string
}

const UploadZone: React.FC<UploadZoneProps> = ({
  eventId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())

  const handleUpload = async (file: File) => {
    const key = `${file.name}-${Date.now()}`
    try {
      // Add file to uploading list
      setUploadingFiles(files => new Map(files).set(key, {
        file,
        progress: 0,
        status: 'preparing'
      }))

      // Get upload URL
      const uploadRequest = {
        event_id: eventId,
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      }
      const { upload_url, media_id } = await getUploadUrl(uploadRequest)

      // Upload to blob storage
      setUploadingFiles(files => new Map(files).set(key, {
        file,
        progress: 10,
        status: 'uploading'
      }))

      await uploadToBlob(upload_url, file)

      // Confirm upload
      setUploadingFiles(files => new Map(files).set(key, {
        file,
        progress: 90,
        status: 'completing'
      }))

      await confirmUpload(media_id)

      // Update status
      setUploadingFiles(files => new Map(files).set(key, {
        file,
        progress: 100,
        status: 'completed'
      }))

      onUploadComplete?.(media_id)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadingFiles(files => new Map(files).set(key, {
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      }))
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'))
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Process each file
    acceptedFiles.forEach(handleUpload)
  }, [eventId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          padding: '2rem',
          border: `2px dashed ${isDragActive ? '#007bff' : '#ccc'}`,
          borderRadius: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(0,123,255,0.1)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the photos here ...</p>
        ) : (
          <div>
            <p>Drag & drop photos here, or click to select</p>
            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Accepts JPG, PNG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div style={{ marginTop: '1rem' }}>
          {Array.from(uploadingFiles.entries()).map(([key, { file, progress, status, error }]) => (
            <div
              key={key}
              style={{
                marginBottom: '0.5rem',
                padding: '0.5rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.25rem' }}>{file.name}</div>
                <div
                  style={{
                    height: '4px',
                    background: '#e9ecef',
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: status === 'error' ? '#dc3545' : '#007bff',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
              <div style={{ minWidth: '100px', textAlign: 'right' }}>
                {status === 'preparing' && 'Preparing...'}
                {status === 'uploading' && 'Uploading...'}
                {status === 'completing' && 'Processing...'}
                {status === 'completed' && '✓ Complete'}
                {status === 'error' && (
                  <span style={{ color: '#dc3545' }}>
                    Error: {error}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UploadZone