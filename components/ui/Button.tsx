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
    'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold border border-emerald-400/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:brightness-110 px-6 py-3 text-sm',
    secondary:
      'bg-surface-low border border-white/15 text-primary hover:bg-surface-high hover:border-white/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.4)] px-6 py-3 text-sm',
    ghost:
      'bg-transparent text-muted hover:text-primary hover:bg-surface-high px-5 py-2.5 text-sm',
    danger:
      'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 px-6 py-3 text-sm',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin shrink-0"
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
