import React from 'react'
import Button from './Button'

export interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      {/* Error Icon */}
      <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-error-100">
        <svg
          className="w-8 h-8 text-error-600"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold text-error-800 mb-2">
          {title}
        </h3>
      )}

      {/* Message */}
      <p className="text-base text-error-700 mb-4 max-w-md">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}

export default ErrorMessage



