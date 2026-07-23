'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { motion } from 'motion/react'

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: 'Buy & Sell Items',
    description: 'Trade textbooks, gadgets, clothes, and more with fellow EKSU students.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Student Services',
    description: 'Book tutors, graphic designers, coders, and campus gigs effortlessly.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Find Accommodation',
    description: 'Discover hostels and off-campus rooms verified by EKSU students.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Secure P2P Messaging',
    description: 'Chat directly with verified peers and execute locked escrow swaps.',
  },
]

const STATS = [
  { value: '100%', label: 'NIN Verified Students' },
  { value: 'Monnify', label: 'Escrow Integration' },
  { value: '0%', label: 'Platform Fee' },
]

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-canvas text-primary overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-[30%] -left-[15%] w-[65%] h-[65%] rounded-full bg-emerald-500/10 blur-[180px]" />
        <div className="absolute top-[25%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[55%] h-[55%] rounded-full bg-teal-500/10 blur-[180px]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6 py-20 lg:py-32 gap-16 z-10">
        <div className="flex-1 text-left space-y-8 max-w-2xl">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-medium tracking-wide text-emerald-400 border border-white/10"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
            Live at Ekiti State University
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-display font-extrabold leading-[1.08] tracking-tight"
          >
            The Premium Campus
            <br />
            Marketplace{' '}
            <span className="gradient-brand-text">Built for EKSU</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-muted leading-relaxed"
          >
            Buy textbooks, swap hostel items, book student services, and connect
            safely with verified peers on campus. Escrow protected.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-2"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full sm:w-56 h-12 text-sm font-bold shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
              >
                Create Account
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-44 h-12 text-sm font-bold">
                Enter Browse mode
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex flex-wrap gap-4 pt-8 border-t border-white/10"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="glass rounded-2xl px-5 py-3 flex flex-col min-w-[130px]"
              >
                <span className="font-display font-extrabold text-2xl text-primary leading-tight">
                  {s.value}
                </span>
                <span className="text-[11px] text-muted font-medium mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero visual representation: Apple-Style Frosted Glass Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative"
        >
          <div className="glass rounded-3xl border border-white/10 bg-surface-low/90 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.6)] text-xs text-muted space-y-4">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-subtle font-mono font-bold">BATAMARKET CONSOLE v2.0</span>
            </div>

            {/* Mock details */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-subtle">Verification Standard</span>
                <span className="text-primary font-bold">NIN DOCUMENT VALIDATED</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-subtle">Payment Escrow</span>
                <span className="text-emerald-400 font-bold">MONNIFY VIRTUAL BANK</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-subtle">Safe Spots</span>
                <span className="text-primary font-bold">SUB, MAIN GATE, LIBRARY</span>
              </div>
            </div>

            {/* Mock listing preview */}
            <div className="border border-white/10 bg-surface/80 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">PRODUCT</span>
                <span className="text-sm text-emerald-400 font-extrabold">₦15,000</span>
              </div>
              <p className="text-primary font-bold text-sm">Calculus textbook + Physics lab manual (100L)</p>
              <div className="flex justify-between text-xs border-t border-white/10 pt-2 text-subtle">
                <span>SELLER: Isaac O. (500L)</span>
                <span className="text-emerald-400 font-semibold">Trust Score: 98%</span>
              </div>
            </div>

            {/* Decorative bar */}
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full opacity-70 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="relative z-10 px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/10"
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            A Premium Ecosystem
          </h2>
          <p className="text-muted max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Beautifully designed specifically for how Ekiti State University students trade and connect safely.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4 cursor-default group"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-high border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-base group-hover:text-emerald-400 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SAFETY BANNER */}
      <section
        id="safety"
        className="relative z-10 px-6 py-12 max-w-7xl mx-auto w-full mb-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8 border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <svg className="w-8 h-8 text-slate-950" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-display font-bold text-xl sm:text-2xl">
              Safe-Swap &amp; Monnify Escrow
            </h2>
            <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-xl">
              Every transaction is protected. Connect directly with peer reviews, designated safe-swap zones 
              on campus, and locked OTP escrow payments to guarantee safe exchanges.
            </p>
          </div>
          <div className="sm:ml-auto shrink-0 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto h-12 text-xs font-bold shadow-[0_10px_25px_rgba(16,185,129,0.25)]">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
