'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { motion } from 'motion/react'

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    title: 'Buy & Sell Items',
    description: 'Trade textbooks, gadgets, clothes, and more with fellow students.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-brand-mint" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Student Services',
    description: 'Book tutors, graphic designers, coders, and other campus gigs.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'Find Accommodation',
    description: 'Discover hostels and off-campus rooms trusted by EKSU students.',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Secure Messaging',
    description: 'Chat directly with verified peers in a safe, built-in inbox.',
  },
]

const STATS = [
  { value: '100%', label: 'Verified Students' },
  { value: 'Safe-Swap', label: 'Meetup Spots' },
  { value: '0%', label: 'P2P Commission' },
]

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-canvas text-primary overflow-hidden">
      {/* Background orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-[35%] -left-[20%] w-[70%] h-[70%] rounded-full bg-brand-indigo/20 blur-[180px]" />
        <div className="absolute top-[30%] right-[-10%] w-[55%] h-[55%] rounded-full bg-brand-mint/10 blur-[160px]" />
        <div className="absolute bottom-[-15%] left-[10%] w-[60%] h-[60%] rounded-full bg-brand-indigo/10 blur-[180px]" />
      </div>

      {/* HERO SECTION */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6 py-20 lg:py-32 gap-16 z-10">
        <div className="flex-1 text-left space-y-8 max-w-2xl">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-brand-mint border border-brand-mint/20"
          >
            <span className="h-2 w-2 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(0,229,155,0.8)] animate-pulse" />
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
            safely with verified peers on campus. No scams, no commissions.
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
                className="w-full sm:w-56 h-12 text-sm font-bold shadow-[0_0_40px_rgba(91,77,255,0.25)] hover:brightness-110"
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
            className="flex flex-wrap gap-4 pt-6 border-t border-border/20"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col min-w-[120px]"
              >
                <span className="font-display font-extrabold text-2xl text-primary leading-tight">
                  {s.value}
                </span>
                <span className="text-[10px] text-subtle font-mono uppercase tracking-wider font-semibold mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero visual representation: A premium clinical dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative"
        >
          <div className="glass rounded-xl border border-border bg-surface-lowest/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono text-xs text-muted space-y-4">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-indigo/40" />
                <span className="w-3 h-3 rounded-full bg-brand-mint/40" />
                <span className="w-3 h-3 rounded-full bg-brand-amber/40" />
              </div>
              <span className="text-[9px] uppercase tracking-wider text-subtle font-bold">BATAMARKET_CONSOLE // V2.0</span>
            </div>

            {/* Mock details */}
            <div className="space-y-3">
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-subtle font-bold uppercase text-[9px]">Ledger Node</span>
                <span className="text-primary font-bold">EKSU-MAIN-GATE // SYS_ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-subtle font-bold uppercase text-[9px]">Safe spots</span>
                <span className="text-brand-mint font-bold">SUB, FRONT_LIBRARY, PORTAL_COMPLEX</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-2">
                <span className="text-subtle font-bold uppercase text-[9px]">Integrity Check</span>
                <span className="text-primary font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(0,229,155,0.8)] animate-pulse" />
                  100% IDENTITY_SECURE
                </span>
              </div>
            </div>

            {/* Mock listing preview */}
            <div className="border border-border/60 bg-canvas rounded-lg p-3 space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="px-1.5 py-0.5 rounded-sm bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo text-[8px] font-bold">PRODUCT</span>
                <span className="text-[9px] text-brand-mint font-bold">₦15,000</span>
              </div>
              <p className="text-primary font-bold text-xs">Calculus textbook + Physics lab manual (100L)</p>
              <div className="flex justify-between text-[9px] border-t border-border/20 pt-2 text-subtle">
                <span>SELLER: Isaac O. (500L)</span>
                <span className="text-brand-mint">TRUST_SCORE: 98%</span>
              </div>
            </div>

            {/* Decorative block */}
            <div className="h-2 bg-gradient-to-r from-brand-indigo via-brand-mint to-brand-amber rounded-full opacity-60 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="features"
        className="relative z-10 px-6 py-24 max-w-7xl mx-auto w-full border-t border-border/20"
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
            Beautifully redesigned and configured specifically for how Ekiti State University students trade and connect.
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
              className="glass glass-hover rounded-xl p-6 flex flex-col gap-4 cursor-default group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-display font-bold text-base group-hover:text-brand-indigo transition-colors duration-200">
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
          className="glass rounded-xl p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-8 border-brand-indigo/20"
          style={{ borderColor: 'rgba(91,77,255,0.2)' }}
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-indigo to-brand-mint flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(91,77,255,0.3)]">
            <svg className="w-7 h-7 text-canvas" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="font-display font-bold text-xl sm:text-2xl">
              Safe-Swap Meetup Zones
            </h2>
            <p className="text-muted text-xs leading-relaxed max-w-xl">
              Every deal is secure. Connect directly with peer reviews, designated safe-swap zones 
              on campus, and our locked escrow payment system to guarantee safe delivery of items.
            </p>
          </div>
          <div className="sm:ml-auto shrink-0 w-full sm:w-auto">
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto h-11 text-xs font-bold shadow-[0_0_20px_rgba(91,77,255,0.2)]">
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
