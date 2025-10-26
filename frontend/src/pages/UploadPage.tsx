import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { getUploadUrl, uploadToBlob, confirmUpload } from '../api/media'

interface FileWithPreview extends File {
  preview?: string
}

interface UploadProgress {
  file: FileWithPreview
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const UploadPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Create preview URLs for images
    const filesWithPreviews: FileWithPreview[] = acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )

    // Initialize upload progress for each file
    const newUploads: UploadProgress[] = filesWithPreviews.map(file => ({
      file,
      status: 'pending',
      progress: 0
    }))

    setUploads(prev => [...prev, ...newUploads])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    disabled: isUploading
  })

  const uploadFile = async (upload: UploadProgress, index: number) => {
    try {
      // Update status to uploading
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, status: 'uploading', progress: 10 } : u
      ))

      // Step 1: Get presigned URL from backend
      const uploadData = await getUploadUrl({
        event_id: eventId!,
        filename: upload.file.name,
        content_type: upload.file.type,
        file_size: upload.file.size,
      })

      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, progress: 30 } : u
      ))

      // Step 2: Upload directly to Azure Blob Storage
      await uploadToBlob(uploadData.upload_url, upload.file)

      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, progress: 70 } : u
      ))

      // Step 3: Confirm upload to trigger face detection
      await confirmUpload(uploadData.media_id)

      // Success!
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, status: 'success', progress: 100 } : u
      ))

    } catch (error) {
      console.error('Upload failed:', error)
      setUploads(prev => prev.map((u, i) => 
        i === index ? { 
          ...u, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        } : u
      ))
    }
  }

  const handleUploadAll = async () => {
    setIsUploading(true)

    // Upload all pending files sequentially
    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status === 'pending') {
        await uploadFile(uploads[i], i)
      }
    }

    setIsUploading(false)
  }

  const handleClear = () => {
    // Revoke preview URLs to avoid memory leaks
    uploads.forEach(upload => {
      if (upload.file.preview) {
        URL.revokeObjectURL(upload.file.preview)
      }
    })
    setUploads([])
  }

  const handleViewGallery = () => {
    navigate(`/events/${eventId}`)
  }

  const successCount = uploads.filter(u => u.status === 'success').length
  const errorCount = uploads.filter(u => u.status === 'error').length
  const allComplete = uploads.length > 0 && uploads.every(u => u.status === 'success' || u.status === 'error')

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Upload Photos</h1>
        <p style={{ color: '#666' }}>
          Add photos to this event. They'll be processed for face detection automatically.
        </p>
      </div>

      {/* Dropzone */}
      {!allComplete && (
        <div
          {...getRootProps()}
          style={{
            padding: '3rem',
            border: isDragActive ? '3px dashed #4CAF50' : '2px dashed #ccc',
            borderRadius: '12px',
            textAlign: 'center',
            backgroundColor: isDragActive ? '#f0f9ff' : '#fafafa',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '2rem'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
          {isDragActive ? (
            <p style={{ fontSize: '1.2rem', color: '#4CAF50' }}>Drop photos here...</p>
          ) : (
            <>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Drag & drop photos here, or click to select
              </p>
              <p style={{ color: '#999', fontSize: '0.9rem' }}>
                Supports: JPG, PNG, GIF, WebP
              </p>
            </>
          )}
        </div>
      )}

      {/* Upload List */}
      {uploads.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>
            Photos ({uploads.length})
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {uploads.map((upload, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: 'white'
                }}
              >
                {/* Thumbnail */}
                {upload.file.preview && (
                  <img
                    src={upload.file.preview}
                    alt={upload.file.name}
                    style={{
                      width: '80px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '6px'
                    }}
                  />
                )}

                {/* File Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: '500', 
                    marginBottom: '0.5rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {upload.file.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>

                  {/* Progress Bar */}
                  {upload.status === 'uploading' && (
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${upload.progress}%`,
                        height: '100%',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  )}

                  {/* Status Messages */}
                  {upload.status === 'success' && (
                    <div style={{ color: '#4CAF50', fontSize: '0.9rem' }}>
                      ✓ Uploaded successfully
                    </div>
                  )}
                  {upload.status === 'error' && (
                    <div style={{ color: '#f44336', fontSize: '0.9rem' }}>
                      ✗ {upload.error || 'Upload failed'}
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div style={{ fontSize: '1.5rem' }}>
                  {upload.status === 'pending' && '⏳'}
                  {upload.status === 'uploading' && '⏫'}
                  {upload.status === 'success' && '✅'}
                  {upload.status === 'error' && '❌'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {uploads.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!allComplete ? (
            <>
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  backgroundColor: isUploading ? '#ccc' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {isUploading ? 'Uploading...' : `Upload ${uploads.filter(u => u.status === 'pending').length} Photo(s)`}
              </button>
              <button
                onClick={handleClear}
                disabled={isUploading}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Clear All
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ 
                padding: '2rem',
                backgroundColor: successCount > 0 ? '#f0f9ff' : '#fff3e0',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {successCount > 0 && errorCount === 0 ? '🎉' : '⚠️'}
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                  Upload Complete!
                </h3>
                <p style={{ color: '#666' }}>
                  {successCount > 0 && `${successCount} photo(s) uploaded successfully. `}
                  {errorCount > 0 && `${errorCount} photo(s) failed.`}
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Face detection is processing in the background...
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={handleViewGallery}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  View Gallery
                </button>
                <button
                  onClick={handleClear}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    backgroundColor: 'white',
                    color: '#666',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Upload More
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UploadPage

