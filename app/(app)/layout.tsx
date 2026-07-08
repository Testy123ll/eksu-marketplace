import type { Metadata } from 'next'
import React from 'react'
import AppNavbar from '@/components/AppNavbar'
import MobileBottomNav from '@/components/MobileBottomNav'

export const metadata: Metadata = {
  title: {
    default: 'Campus Marketplace',
    template: '%s | BataMarket',
  },
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-primary">
      <AppNavbar />
      <main className="flex-1 flex flex-col pt-14 md:pt-0 md:pl-64 pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
