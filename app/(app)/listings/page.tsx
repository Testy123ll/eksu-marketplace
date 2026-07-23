'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { getCourseCode } from '@/lib/utils/listings'

// ─── Types ────────────────────────────────────────────────────────────────────
type ListingType = 'product' | 'service' | 'accommodation'
type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'used'

interface Listing {
  id: string
  type: ListingType
  title: string
  description: string
  price: number
  category: string
  condition?: Condition
  status: string
  images: string[]
  is_boosted: boolean
  created_at: string
  seller_id: string
  profiles: {
    full_name: string | null
    business_name: string | null
    trust_score: number
    level: number | null
  } | null
}

const CATEGORIES: { label: string; value: string; icon?: React.ReactNode }[] = [
  { label: 'All Categories', value: '' },
  { 
    label: 'Textbooks', 
    value: 'Textbooks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    label: 'Electronics', 
    value: 'Electronics',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    label: 'Shoes', 
    value: 'Shoes',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-2-2h-5L9.5 9.5 6 8H3a1 1 0 00-1 1v7a2 2 0 002 2h15a2 2 0 002-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 16v-2M10 16v-1.5M14 16v-2M18 16v-1.5" />
      </svg>
    )
  },
  { 
    label: 'Clothes', 
    value: 'Clothes',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a3 3 0 00-3 3v1h6V7a3 3 0 00-3-3zM5 8h14l1 4-2 1-1-4H7L6 13 4 12l1-4zm1 5v6a2 2 0 002 2h8a2 2 0 002-2v-6H6z" />
      </svg>
    )
  },
  { 
    label: 'Perfumes', 
    value: 'Perfumes & Cosmetics',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-7-8h8a1 1 0 011 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V9a1 1 0 011-1zm3-4h4V2H9v2z" />
      </svg>
    )
  },
  { 
    label: 'Academic Services', 
    value: 'Academic Services',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
      </svg>
    )
  },
  { 
    label: 'Accommodation', 
    value: 'Accommodation',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    label: 'Creative Services', 
    value: 'Creative Services',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  },
]

const TYPE_LABELS: Record<ListingType, string> = {
  product: 'Item',
  service: 'Service',
  accommodation: 'Room',
}

const CONDITION_LABELS: Record<Condition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  used: 'Used',
}

// ─── Trust Badge ──────────────────────────────────────────────────────────────
function TrustBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? '#00e59b' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color }}>
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {score}
    </span>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="h-40 bg-surface-high" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-surface-high rounded-full" />
          <div className="h-4 w-20 bg-surface-high rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-surface-high rounded" />
        <div className="h-3 w-full bg-surface-high rounded" />
        <div className="h-3 w-2/3 bg-surface-high rounded" />
        <div className="flex justify-between pt-1">
          <div className="h-5 w-20 bg-surface-high rounded" />
          <div className="h-4 w-16 bg-surface-high rounded" />
        </div>
      </div>
    </div>
  )
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, index }: { listing: Listing; index: number }) {
  const courseCode = getCourseCode(listing.id, listing.category, listing.type)

  const typeColor: Record<ListingType, string> = {
    product: 'border-brand-indigo/30 text-brand-indigo bg-brand-indigo/10',
    service: 'border-brand-mint/30 text-brand-mint bg-brand-mint/10',
    accommodation: 'border-brand-amber/30 text-brand-amber bg-brand-amber/10',
  }

  const typeIcons: Record<ListingType, React.ReactNode> = {
    product: (
      <svg className="w-10 h-10 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    service: (
      <svg className="w-10 h-10 text-brand-mint" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    accommodation: (
      <svg className="w-10 h-10 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  }

  const sellerName =
    listing.profiles?.full_name ||
    listing.profiles?.business_name ||
    'Student'

  const trustScore = listing.profiles?.trust_score ?? 50
  const sellerLevel = listing.profiles?.level

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/listings/${listing.id}`}>
        <div className="relative group rounded-2xl glass glass-hover overflow-hidden cursor-pointer">
          {/* Boosted badge */}
          {listing.is_boosted && (
            <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold shadow-lg backdrop-blur-md uppercase tracking-wider">
              <svg className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Featured
            </div>
          )}

          {/* Image / placeholder */}
          {listing.images && listing.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="h-44 w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 border-b border-white/10"
            />
          ) : (
            <div className="h-44 bg-gradient-to-br from-surface-low to-surface-high flex items-center justify-center select-none border-b border-white/10">
              {typeIcons[listing.type]}
            </div>
          )}

          {/* Content */}
          <div className="p-5 space-y-3.5">
            {/* Category Line */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                {courseCode}
              </span>
              <span className={`text-[9px] font-semibold uppercase px-2.5 py-0.5 border rounded-full ${typeColor[listing.type]}`}>
                {TYPE_LABELS[listing.type]}
              </span>
              <span className="text-[10px] text-muted font-medium truncate max-w-[90px]">
                {listing.category}
              </span>
              {listing.condition && (
                <span className="ml-auto text-[9px] border border-white/10 px-2.5 py-0.5 rounded-full bg-surface-high/60 text-muted uppercase">
                  {CONDITION_LABELS[listing.condition]}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-primary leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors duration-200">
                {listing.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed line-clamp-2 h-8">
                {listing.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/10">
              {/* Pill price tag */}
              <div className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full font-bold text-sm text-emerald-400">
                ₦{listing.price.toLocaleString()}
                {listing.type === 'service' && (
                  <span className="text-[9px] font-normal text-muted">/hr</span>
                )}
              </div>
              
              {/* Seller Info Block */}
              <div className="flex items-center gap-2.5 group/seller">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-primary font-semibold group-hover/seller:text-emerald-400 transition-colors duration-200">
                    {sellerName}
                  </span>
                  <div className="flex items-center gap-1">
                    {sellerLevel && (
                      <span className="text-[9px] text-muted font-medium bg-surface-high px-1.5 rounded-full font-mono">
                        {sellerLevel}L
                      </span>
                    )}
                    <TrustBadge score={trustScore} />
                  </div>
                </div>
                {/* Glowing avatar */}
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-[1.5px] shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover/seller:scale-105">
                  <div className="w-full h-full rounded-full bg-surface-low flex items-center justify-center text-[10px] font-bold text-primary">
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchListings = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, type, title, description, price, category, condition,
          status, images, is_boosted, created_at, seller_id,
          profiles (full_name, business_name, trust_score, level)
        `)
        .eq('status', 'active')
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      const formattedListings = (data as any[] || []).map((item) => {
        const profileObj = Array.isArray(item.profiles)
          ? item.profiles[0]
          : (item.profiles || null)
        return {
          ...item,
          profiles: profileObj,
        }
      })
      setListings(formattedListings as unknown as Listing[])
    } catch (err: any) {
      setError(err.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase()) ||
        (l.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.profiles?.business_name || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !activeCategory || l.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [listings, search, activeCategory])

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-display font-bold">
          Campus Marketplace
        </h1>
        <p className="text-sm text-muted">
          Browse verified listings from EKSU students and sellers
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings, sellers…"
          className="w-full h-12 bg-surface-low border border-white/10 rounded-2xl pl-11 pr-4 text-sm text-primary placeholder:text-subtle/50 input-glow transition-all"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-semibold border transition-all duration-300 flex items-center gap-2 cursor-pointer ${
              activeCategory === cat.value
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400/30 text-slate-950 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'glass text-muted hover:border-white/20 hover:text-primary'
            }`}
          >
            {cat.icon && <span className="opacity-80">{cat.icon}</span>}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted font-medium">
          {loading ? 'Loading…' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`}
        </span>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Post a Listing
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-error/20 bg-error/10 text-error text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
          <button onClick={fetchListings} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Listings grid */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : filtered.length > 0 ? (
          <motion.div
            key="grid"
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-surface-low border border-border/80 flex items-center justify-center text-muted mb-2 shadow-inner">
              <svg className="w-8 h-8 text-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-bold">No listings found</h3>
            <p className="text-sm text-muted max-w-xs">
              {search || activeCategory
                ? 'Try adjusting your search or clearing the category filter.'
                : 'Be the first to post a listing on BataMarket!'}
            </p>
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(''); setActiveCategory('') }}
                className="mt-2 px-4 py-2 rounded-sm bg-surface border border-border text-sm text-muted hover:text-primary hover:border-brand-indigo/40 transition-all cursor-pointer font-mono text-xs uppercase"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
