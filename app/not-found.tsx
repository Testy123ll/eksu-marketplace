'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-indigo/15 blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-brand-mint/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center space-y-6 max-w-md"
      >
        {/* Big 404 */}
        <div className="font-display font-extrabold text-[8rem] leading-none gradient-brand-text opacity-20 select-none">
          404
        </div>

        <div className="-mt-8 space-y-3">
          <h1 className="text-3xl font-display font-bold">Page not found</h1>
          <p className="text-muted text-base leading-relaxed">
            This page doesn&apos;t exist or may have been moved. Head back to the marketplace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/listings">
            <Button variant="primary" className="w-full sm:w-auto">
              Browse Listings
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              Go Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
