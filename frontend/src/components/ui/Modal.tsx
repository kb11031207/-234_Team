import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Highest z-index */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-default"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Modal - Above everything */}
      <div 
        className="modal-center transition-modal animate-scale-in"
        style={{ zIndex: 9999 }}
      >
        {title && (
          <div className="mb-4 pb-4 border-b border-neutral-dark/20">
            <h2 className="text-title">{title}</h2>
          </div>
        )}
        {children}
      </div>
    </>
  )
}

