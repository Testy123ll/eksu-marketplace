'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { motion } from 'motion/react'

const FEATURED_ITEMS = [
  {
    id: 'demo-1',
    title: 'Apple MacBook Air M1',
    price: '₦380,000',
    category: 'Electronics',
    seller: 'Sarah M.',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'demo-2',
    title: 'Chemistry & Lab Textbook (200L)',
    price: '₦8,500',
    category: 'Books',
    seller: 'David K.',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'demo-3',
    title: 'Self-Contain Room near EKSU Gate',
    price: '₦120,000/yr',
    category: 'Accommodation',
    seller: 'Bayo O.',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'demo-4',
    title: 'Graphic Design & Printing Service',
    price: '₦3,000',
    category: 'Services',
    seller: 'Bluestark Studio',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80',
  },
]

const CATEGORY_TILES = [
  {
    title: 'Textbooks & Books',
    description: 'Course materials, manuals & study guides',
    href: '/listings?category=Textbooks',
    icon: (
      <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Tech & Electronics',
    description: 'Laptops, phones, chargers & accessories',
    href: '/listings?category=Electronics',
    icon: (
      <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Hostel & Housing',
    description: 'Self-contain rooms & shared student flats',
    href: '/listings?category=Accommodation',
    icon: (
      <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Student Services',
    description: 'Tutoring, assignments, graphics & repair',
    href: '/listings?category=Services',
    icon: (
      <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
]

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-canvas text-primary overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[75%] h-[60%] rounded-full bg-emerald-500/10 blur-[180px]" />
        <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 blur-[160px]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 pt-16 pb-20 text-center z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium text-emerald-400 border border-white/10"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          Ekiti State University Campus Hub
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]"
        >
          BataMarket: Student Essentials,<br />
          <span className="gradient-brand-text">Made Simple.</span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-xl text-muted leading-relaxed max-w-2xl mx-auto"
        >
          Buy textbooks, sell gadgets, find accommodation, and trade safely with verified EKSU students.
        </motion.p>

        {/* Quick Category Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-2.5 pt-2 max-w-3xl mx-auto"
        >
          <Link href="/listings?category=Textbooks">
            <span className="px-5 py-2.5 rounded-full text-xs font-semibold glass hover:border-emerald-400/40 hover:text-white transition-all">
              Books
            </span>
          </Link>
          <Link href="/listings?category=Electronics">
            <span className="px-5 py-2.5 rounded-full text-xs font-semibold glass hover:border-emerald-400/40 hover:text-white transition-all">
              Electronics
            </span>
          </Link>
          <Link href="/listings?category=Clothes">
            <span className="px-5 py-2.5 rounded-full text-xs font-semibold glass hover:border-emerald-400/40 hover:text-white transition-all">
              Apparel
            </span>
          </Link>
          <Link href="/listings?category=Services">
            <span className="px-5 py-2.5 rounded-full text-xs font-semibold glass hover:border-emerald-400/40 hover:text-white transition-all">
              Services
            </span>
          </Link>
          <Link href="/listings?category=Accommodation">
            <span className="px-5 py-2.5 rounded-full text-xs font-semibold glass hover:border-emerald-400/40 hover:text-white transition-all">
              Accommodation
            </span>
          </Link>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full sm:w-56 h-12 text-sm font-bold shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
            >
              Start Trading Now
            </Button>
          </Link>
          <Link href="/listings" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-48 h-12 text-sm font-bold">
              Browse All Ads
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* FEATURED ITEMS SHOWCASE GRID */}
      <section className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 z-10 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-display font-bold">Featured Marketplace Ads</h2>
          <Link href="/listings" className="text-xs font-bold text-emerald-400 hover:underline">
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_ITEMS.map((item) => (
            <div
              key={item.id}
              className="glass rounded-3xl p-4 flex flex-col justify-between space-y-4 group hover:border-emerald-400/30 transition-all duration-300 shadow-xl"
            >
              <div className="space-y-3">
                <div className="h-44 w-full rounded-2xl overflow-hidden bg-surface-low relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 text-emerald-400 border border-white/10 backdrop-blur-md">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-primary line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-lg font-black text-emerald-400 mt-1">{item.price}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <span>{item.seller}</span>
                  <span className="text-amber-400 font-bold">★ {item.rating}</span>
                </div>
                <Link href="/listings">
                  <Button variant="secondary" className="px-4 py-1.5 text-xs font-bold rounded-full">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE CATEGORIES GRID SECTION */}
      <section id="categories" className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-16 z-10 space-y-8 border-t border-white/10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Explore Marketplace Categories</h2>
          <p className="text-xs sm:text-sm text-muted">Find exactly what you need on the EKSU campus.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_TILES.map((cat) => (
            <Link key={cat.title} href={cat.href}>
              <div className="glass glass-hover rounded-3xl p-8 flex flex-col items-center text-center space-y-4 cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-surface-high/80 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  {cat.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-primary group-hover:text-emerald-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SAFE-SWAP & TRUST CALLOUT */}
      <section className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 mb-20 z-10">
        <div className="glass rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.4)] text-slate-950 font-black">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-display font-bold text-xl sm:text-2xl">
              Safe Campus Trading Guaranteed
            </h2>
            <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-xl">
              NIN document identity verification, designated safe meetup spots on campus, and Monnify escrow protection ensure every transaction is 100% safe.
            </p>
          </div>
          <div className="sm:ml-auto shrink-0 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto h-12 text-xs font-bold">
                Join EKSU Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
