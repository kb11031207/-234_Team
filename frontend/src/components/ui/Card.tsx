import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  clickable?: boolean
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`px-6 py-4 border-b border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 ${className}`} {...props}>
      {children}
    </div>
  )
}

const CardComponent: React.FC<CardProps> = ({
  children,
  hover = false,
  clickable = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-lg shadow-md border border-neutral-200'
  const hoverStyles = hover ? 'transition-shadow hover:shadow-lg' : ''
  const clickableStyles = clickable ? 'cursor-pointer transition-transform hover:scale-[1.02]' : ''

  const combinedClassName = `${baseStyles} ${hoverStyles} ${clickableStyles} ${className}`

  return (
    <div className={combinedClassName} {...props}>
      {children}
    </div>
  )
}

// Create compound component with proper typing
const Card = CardComponent as typeof CardComponent & {
  Header: typeof CardHeader
  Body: typeof CardBody
  Footer: typeof CardFooter
}

// Attach subcomponents to Card
Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
