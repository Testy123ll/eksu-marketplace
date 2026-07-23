import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  glass?: boolean
}

export const Card = ({
  className = '',
  hoverable = false,
  glass = true,
  children,
  ...props
}: CardProps) => {
  const base = 'rounded-2xl border transition-all duration-300'

  const style = glass
    ? 'glass'
    : 'bg-surface-low border-white/10 shadow-xl'

  const hover = hoverable
    ? 'glass-hover'
    : ''

  return (
    <div
      className={`${base} ${style} ${hover} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
