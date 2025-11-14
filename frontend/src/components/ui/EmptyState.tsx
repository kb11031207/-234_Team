import React from 'react'
import Button from './Button'

export interface EmptyStateProps {
  title: string
  message?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  className = '',
}) => {
  // Default icon if none provided
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-neutral-400"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      {/* Icon */}
      <div className="mb-4 flex items-center justify-center text-neutral-400">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-neutral-800 mb-2">
        {title}
      </h3>

      {/* Message */}
      {message && (
        <p className="text-base text-neutral-600 mb-6 max-w-md">
          {message}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="md"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState



