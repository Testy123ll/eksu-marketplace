'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[BataMarket Error]', error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0d1c] text-[#dfe1f6] flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl">⚠️</div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-[#c7c4d9] leading-relaxed">
              An unexpected error occurred. Please try again or refresh the page.
            </p>
            {error.digest && (
              <p className="text-[10px] text-[#918fa2] mt-2 font-mono">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="secondary" onClick={() => window.location.href = '/listings'}>
              Go to Listings
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
