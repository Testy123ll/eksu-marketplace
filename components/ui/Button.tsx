import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export const Button = ({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-brand-indigo to-brand-mint text-white border border-brand-mint/30 hover:shadow-[0_0_30px_rgba(91,77,255,0.4)] hover:brightness-110 px-5 py-2.5',
    secondary:
      'bg-transparent border border-brand-indigo/60 text-primary hover:bg-brand-indigo/10 hover:border-brand-indigo hover:shadow-[0_0_20px_rgba(91,77,255,0.2)] px-5 py-2.5',
    ghost:
      'bg-transparent text-muted hover:text-primary hover:bg-surface-high px-4 py-2',
    danger:
      'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-5 py-2.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
