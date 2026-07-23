import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-primary relative font-sans">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            Bata<span className="text-emerald-400">Market</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-muted">
          <Link
            href="/"
            className="px-4 py-2 rounded-full hover:text-white hover:bg-surface-high/60 transition-all"
          >
            Home
          </Link>
          <Link
            href="/#categories"
            className="px-4 py-2 rounded-full hover:text-white hover:bg-surface-high/60 transition-all"
          >
            Categories
          </Link>
          <Link
            href="/listings"
            className="px-4 py-2 rounded-full hover:text-white hover:bg-surface-high/60 transition-all"
          >
            Browse Ads
          </Link>
          <Link
            href="/verify"
            className="px-4 py-2 rounded-full hover:text-white hover:bg-surface-high/60 transition-all"
          >
            NIN Verification
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="ghost" className="px-4 py-2 text-xs font-semibold">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" className="px-5 py-2 text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]">Post Your Ad</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-surface-lowest/90 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="font-display font-extrabold text-base text-white">
              Bata<span className="text-emerald-400">Market</span>
            </span>
            <span className="text-muted text-xs">
              © {new Date().getFullYear()} BataMarket. Student-focused, Campus-first.
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted font-medium">
            <Link href="/listings" className="hover:text-white transition-colors">Listings</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
