import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-label">
          {label}
        </label>
      )}
      <input 
        className={`input-field ${className}`}
        {...props}
      />
      {error && (
        <span className="text-label text-red-600">{error}</span>
      )}
    </div>
  )
}

