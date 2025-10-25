import React, { useState } from 'react'
import { apiClient } from '../../lib/api'
import { DetectedFace, Media } from '../../types'

interface FaceRecognitionUIProps {
  media: Media
  onFaceSelect?: (face: DetectedFace) => void
}

interface FaceBoxProps {
  face: DetectedFace
  selected?: boolean
  onSelect?: () => void
}

const FaceBox: React.FC<FaceBoxProps> = ({ face, selected, onSelect }) => {
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${face.bbox_x * 100}%`,
    top: `${face.bbox_y * 100}%`,
    width: `${face.bbox_width * 100}%`,
    height: `${face.bbox_height * 100}%`,
    border: `2px solid ${selected ? '#00ff00' : '#ff0000'}`,
    cursor: 'pointer',
    backgroundColor: selected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
  }

  return (
    <div style={boxStyle} onClick={onSelect}>
      <div
        style={{
          position: 'absolute',
          bottom: '-20px',
          left: '0',
          backgroundColor: selected ? '#00ff00' : '#ff0000',
          color: 'white',
          padding: '2px 4px',
          fontSize: '10px',
          borderRadius: '2px',
        }}
      >
        {Math.round(face.confidence * 100)}%
      </div>
    </div>
  )
}

const FaceRecognitionUI: React.FC<FaceRecognitionUIProps> = ({ media, onFaceSelect }) => {
  const [faces, setFaces] = useState<DetectedFace[]>([])
  const [selectedFace, setSelectedFace] = useState<DetectedFace | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch faces when the media prop changes
  React.useEffect(() => {
    const loadFaces = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get<DetectedFace[]>(`/api/media/${media.media_id}/faces`)
        setFaces(response.data)
      } catch (error) {
        console.error('Error loading faces:', error)
      } finally {
        setLoading(false)
      }
    }

    if (media && media.face_detection_status === 'completed') {
      loadFaces()
    }
  }, [media])

  const handleFaceSelect = (face: DetectedFace) => {
    setSelectedFace(face)
    if (onFaceSelect) {
      onFaceSelect(face)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src={media.blob_url}
        alt=""
        style={{ width: '100%', display: 'block' }}
      />
      {loading ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 16px',
            borderRadius: '4px',
          }}
        >
          Loading faces...
        </div>
      ) : (
        faces.map((face) => (
          <FaceBox
            key={face.face_id}
            face={face}
            selected={selectedFace?.face_id === face.face_id}
            onSelect={() => handleFaceSelect(face)}
          />
        ))
      )}
    </div>
  )
}

export default FaceRecognitionUI