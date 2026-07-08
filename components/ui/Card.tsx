import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  glass?: boolean
}

export const Card = ({
  className = '',
  hoverable = false,
  glass = false,
  children,
  ...props
}: CardProps) => {
  const base = 'rounded-xl border transition-all duration-300'

  const style = glass
    ? 'bg-white/[0.04] backdrop-blur-2xl border-white/[0.08]'
    : 'bg-surface border-border/60'

  const hover = hoverable
    ? glass
      ? 'hover:bg-white/[0.06] hover:border-brand-indigo/30 hover:shadow-[0_0_30px_rgba(91,77,255,0.15)]'
      : 'hover:border-brand-indigo/40 hover:shadow-lg hover:shadow-brand-indigo/10'
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
