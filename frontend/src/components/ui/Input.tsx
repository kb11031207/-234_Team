import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const hasError = !!error

  // Base input styles
  const baseStyles = 'w-full px-4 py-2 text-base border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1'
  
  // Error styles
  const errorStyles = hasError
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
  
  // Disabled styles
  const disabledStyles = props.disabled
    ? 'bg-neutral-100 cursor-not-allowed opacity-60'
    : 'bg-white'

  const combinedInputClassName = `${baseStyles} ${errorStyles} ${disabledStyles} ${className}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-1.5 ${
            hasError ? 'text-error-700' : 'text-neutral-700'
          }`}
        >
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        className={combinedInputClassName}
        aria-invalid={hasError}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1.5 text-sm text-error-600"
          role="alert"
        >
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p
          id={`${inputId}-helper`}
          className="mt-1.5 text-sm text-neutral-500"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Input

