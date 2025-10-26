import { ReactNode } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
}

export default function Panel({ children, className = '' }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      {children}
    </div>
  )
}

