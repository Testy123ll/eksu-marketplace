import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary relative">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-tight gradient-brand-text">
            BataMarket
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-brand-mint animate-pulse shadow-[0_0_8px_rgba(0,229,155,0.8)]" />
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-sm font-medium">
          <Link
            href="#features"
            className="px-4 py-2 rounded-md text-muted hover:text-primary hover:bg-surface-high transition-all duration-200"
          >
            Features
          </Link>
          <Link
            href="#safety"
            className="px-4 py-2 rounded-md text-muted hover:text-primary hover:bg-surface-high transition-all duration-200"
          >
            Safety
          </Link>
          <Link
            href="#help"
            className="px-4 py-2 rounded-md text-muted hover:text-primary hover:bg-surface-high transition-all duration-200"
          >
            Help Center
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-sm">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" className="text-sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-surface-lowest py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold gradient-brand-text">BataMarket</span>
            <span className="text-subtle text-xs">© {new Date().getFullYear()} Built by Bluestark.</span>
          </div>
          <div className="flex gap-6 text-xs text-subtle">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
