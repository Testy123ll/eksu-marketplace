'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { CONDITION_LABELS } from '@/lib/validation/listings'
import type { Condition, ListingType } from '@/lib/validation/listings'
import useEmblaCarousel from 'embla-carousel-react'
import { useSpring, animated } from 'react-spring'
import { getCourseCode } from '@/lib/utils/listings'
import SafeSwapMap from '@/components/listings/SafeSwapMap'

// ─── Types ────────────────────────────────────────────────────────────────────
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
  room_type?: string
  location?: string
  available_from?: string
  quantity?: number
  variants?: string[]
  is_catalog_item?: boolean
  profiles: {
    full_name: string | null
    business_name: string | null
    trust_score: number
    level: number | null
    verification_status: string
  } | null
}

const TYPE_ICONS: Record<ListingType, React.ReactNode> = {
  product: (
    <svg className="w-16 h-16 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  service: (
    <svg className="w-16 h-16 text-brand-mint" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  accommodation: (
    <svg className="w-16 h-16 text-brand-amber" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
}

// ─── Trust Meter ──────────────────────────────────────────────────────────────
function TrustMeter({ score }: { score: number }) {
  const color = score >= 90 ? 'var(--color-brand-mint)' : score >= 70 ? 'var(--color-brand-amber)' : 'var(--color-error)'
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  // React Spring physics-based count-up
  const { val } = useSpring({
    from: { val: 0 },
    to: { val: score },
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  })

  return (
    <div className="flex items-center gap-4">
      {/* Animated Circular Trust Ring */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
          <circle
            className="text-surface-high"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="22"
            cy="22"
          />
          <motion.circle
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke={color}
            fill="transparent"
            r={radius}
            cx="22"
            cy="22"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <span className="absolute text-[10px] font-bold font-mono text-primary">
          <animated.span>
            {val.to((n) => Math.floor(n))}
          </animated.span>
        </span>
      </div>

      {/* Trust bar */}
      <div className="flex-1 space-y-1">
        <div className="h-2 bg-surface-high rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <p className="text-[9px] text-subtle font-mono uppercase tracking-wider">
          Trust Score Verified Range
        </p>
      </div>
    </div>
  )
}

// ─── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, type }: { images: string[]; type: ListingType }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setActive(emblaApi.selectedScrollSnap())
    }
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi])

  if (!images || images.length === 0) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface-low to-surface-high h-72 flex items-center justify-center">
        {TYPE_ICONS[type]}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-surface-low border border-border" ref={emblaRef}>
        <div className="flex h-72">
          {images.map((img, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`listing-${i}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 justify-center">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                i === active ? 'border-brand-indigo' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 animate-pulse">
      <div className="h-4 w-40 bg-surface-high rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-4">
          <div className="h-72 bg-surface-high rounded-2xl" />
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-surface-high rounded-full" />
              <div className="h-6 w-24 bg-surface-high rounded-full" />
            </div>
            <div className="h-8 w-3/4 bg-surface-high rounded" />
            <div className="h-4 w-full bg-surface-high rounded" />
            <div className="h-4 w-2/3 bg-surface-high rounded" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-64 bg-surface-high rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState('')
  const [sellerRating, setSellerRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

  // Report Modal states
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('Fake / Scam Listing')
  const [reportDetails, setReportDetails] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportSuccess, setReportSuccess] = useState(false)

  useEffect(() => {
    fetchListing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchListing = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id, type, title, description, price, category, condition,
          status, images, is_boosted, created_at, seller_id,
          room_type, location, available_from, quantity, variants, is_catalog_item,
          profiles (full_name, business_name, trust_score, level, verification_status)
        `)
        .eq('id', params.id as string)
        .single()

      if (error) throw error
      const rawListing = data as any
      const profilesData = Array.isArray(rawListing.profiles)
        ? rawListing.profiles[0]
        : (rawListing.profiles || null)
      
      const formattedListing: Listing = {
        ...rawListing,
        profiles: profilesData
      }
      setListing(formattedListing)

      if (rawListing.seller_id) {
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewed_user_id', rawListing.seller_id)
        if (reviewData && reviewData.length > 0) {
          const total = reviewData.reduce((acc, r) => acc + r.rating, 0)
          setSellerRating(total / reviewData.length)
          setReviewCount(reviewData.length)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Listing not found')
    } finally {
      setLoading(false)
    }
  }

  const handleMessageSeller = async () => {
    if (!listing) return
    const variantQuery = selectedVariant ? `&variant=${encodeURIComponent(selectedVariant)}` : ''
    router.push(`/chat?listing=${listing.id}&seller=${listing.seller_id}${variantQuery}`)
  }

  const handleSubmitReport = async () => {
    if (!listing || !currentUserId) return
    setSubmittingReport(true)
    setReportError(null)
    try {
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          reporter_id: currentUserId,
          reported_user_id: listing.seller_id,
          listing_id: listing.id,
          reason: `${reportReason}: ${reportDetails}`,
          status: 'open',
        })
      if (insertError) throw insertError
      setReportSuccess(true)
      setTimeout(() => {
        setReportModalOpen(false)
        setReportSuccess(false)
        setReportDetails('')
      }, 2000)
    } catch (e: any) {
      setReportError(e.message || 'Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (error || !listing) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-surface-low border border-border flex items-center justify-center text-muted mb-4 shadow-inner">
          <svg className="w-8 h-8 text-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Listing not found</h2>
        <p className="text-muted text-sm mb-6">This listing may have been removed or sold.</p>
        <Button onClick={() => router.push('/listings')}>Back to Listings</Button>
      </div>
    )
  }

  const sellerName =
    listing.profiles?.full_name || listing.profiles?.business_name || 'Student'
  const sellerLevel = listing.profiles?.level
  const trustScore = listing.profiles?.trust_score ?? 50
  const isVerified = listing.profiles?.verification_status === 'approved'
  const isOwnListing = currentUserId === listing.seller_id

  const courseCode = getCourseCode(listing.id, listing.category, listing.type)

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
      {/* Breadcrumb & Code Tag */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
        <nav className="flex items-center gap-2 text-xs text-muted">
          <Link href="/listings" className="hover:text-primary transition-colors">Listings</Link>
          <span>/</span>
          <span className="text-primary font-medium truncate max-w-[150px] sm:max-w-[200px]">{listing.title}</span>
        </nav>
        <span className="text-[10px] font-bold bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo px-3 py-1 rounded-full uppercase tracking-wider">
          {courseCode}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Image + details */}
        <div className="lg:col-span-3 space-y-6">
          <ImageGallery images={listing.images} type={listing.type} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {/* Boosted Notice */}
              {listing.is_boosted && (
                <div className="flex items-center gap-2 p-3 bg-brand-amber/5 border border-brand-amber/20 rounded-xl text-brand-amber text-xs">
                  <svg className="w-4 h-4 shrink-0 text-brand-amber animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Featured Listing — Promoted by BataMarket</span>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-display font-black leading-tight text-primary">
                {listing.title}
              </h1>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>

              {/* Product Specifications */}
              <div className="border border-border/60 bg-surface-low rounded-xl overflow-hidden mt-6 shadow-md">
                <div className="bg-surface px-4 py-3 border-b border-border/60">
                  <span className="text-xs font-bold text-subtle uppercase tracking-wider">
                    Listing Specifications
                  </span>
                </div>
                <table className="w-full border-collapse text-xs text-left">
                  <tbody>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3 text-subtle font-semibold bg-surface/30 w-1/3">Item Code</td>
                      <td className="px-4 py-3 text-brand-indigo font-bold">{courseCode}</td>
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Category</td>
                      <td className="px-4 py-3 text-primary">{listing.category}</td>
                    </tr>
                    <tr className="border-b border-border/40">
                      <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Listing Type</td>
                      <td className="px-4 py-3 text-primary capitalize">{listing.type}</td>
                    </tr>
                    {listing.condition && (
                      <tr className="border-b border-border/40">
                        <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Condition</td>
                        <td className="px-4 py-3 text-primary">{CONDITION_LABELS[listing.condition]}</td>
                      </tr>
                    )}
                    {listing.type === 'accommodation' && (
                      <>
                        {listing.room_type && (
                          <tr className="border-b border-border/40">
                            <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Room Type</td>
                            <td className="px-4 py-3 text-primary">{listing.room_type}</td>
                          </tr>
                        )}
                        {listing.location && (
                          <tr className="border-b border-border/40">
                            <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Campus Zone</td>
                            <td className="px-4 py-3 text-primary">{listing.location}</td>
                          </tr>
                        )}
                        {listing.available_from && (
                          <tr className="border-b border-border/40">
                            <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Availability</td>
                            <td className="px-4 py-3 text-primary">
                              {new Date(listing.available_from).toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    <tr>
                      <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Date Posted</td>
                      <td className="px-4 py-3 text-primary">
                        {new Date(listing.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                    {listing.quantity !== undefined && (
                      <tr className="border-t border-border/40">
                        <td className="px-4 py-3 text-subtle font-semibold bg-surface/30">Availability</td>
                        <td className="px-4 py-3 text-primary font-medium">
                          {listing.is_catalog_item ? (
                            <span className="inline-flex items-center gap-1.5 text-brand-mint font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
                              Always in stock
                            </span>
                          ) : (listing.quantity ?? 0) > 0 ? (
                            <span className="text-brand-indigo font-bold">{listing.quantity} items left</span>
                          ) : (
                            <span className="text-error font-bold">Out of stock</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <SafeSwapMap className="mt-6" />
            </div>
          </motion.div>
        </div>

        {/* Right: Purchase panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-5"
        >
          <Card className="space-y-5 p-5 bg-surface/40 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl relative overflow-hidden">
            {/* Price Tag Box */}
            <div className="bg-surface-low border border-border/80 rounded-xl p-4 text-center">
              <p className="text-[10px] text-subtle font-bold uppercase tracking-wider mb-1">
                {listing.type === 'service' ? 'Service Rate' : listing.type === 'accommodation' ? 'Monthly Rent' : 'Asking Price'}
              </p>
              <p className="text-3xl font-bold text-brand-mint">
                ₦{listing.price.toLocaleString()}
                {listing.type === 'service' && (
                  <span className="text-sm font-normal text-subtle">/hr</span>
                )}
              </p>
            </div>

            {/* Seller Info (Human Split) */}
            <div className="border-t border-border/40 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold text-subtle uppercase tracking-widest">
                  Authorized Publisher
                </span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-mint/10 border border-brand-mint/20 text-brand-mint">
                    VERIFIED
                  </span>
                )}
              </div>

              {/* Warm Profile Box */}
              <div className="flex items-center gap-3 bg-surface-low/50 p-3 rounded-lg border border-border/40">
                {/* Glowing Profile Initials */}
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-brand-indigo via-brand-indigo/80 to-brand-mint p-[1.5px] shadow-[0_0_15px_rgba(91,77,255,0.5)] flex-shrink-0">
                  <div className="w-full h-full rounded-full bg-surface-low flex items-center justify-center text-base font-bold text-primary">
                    {sellerName.charAt(0).toUpperCase()}
                  </div>
                  {/* Trust glow ring indicator */}
                  <div 
                    className="absolute inset-0 rounded-full border border-brand-mint opacity-60 animate-pulse pointer-events-none"
                    style={{
                      borderColor: trustScore >= 90 ? 'var(--color-brand-mint)' : trustScore >= 70 ? 'var(--color-brand-amber)' : 'var(--color-error)'
                    }}
                  />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate text-primary">{sellerName}</p>
                    {isVerified && (
                      <svg className="w-3.5 h-3.5 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {sellerLevel ? `${sellerLevel}L Undergraduate` : 'EKSU Student Seller'}
                  </p>
                  {sellerRating !== null && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-brand-mint font-bold font-mono">
                      <span>★ {sellerRating.toFixed(1)}</span>
                      <span className="text-subtle font-normal font-sans">({reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Score & React Spring Animated Ring */}
              <div className="bg-surface-low/30 p-3 rounded-lg border border-border/20 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted font-medium font-mono uppercase tracking-wider text-[10px]">BataTrust score</span>
                  <span className="font-mono font-bold" style={{ color: trustScore >= 90 ? 'var(--color-brand-mint)' : trustScore >= 70 ? 'var(--color-brand-amber)' : 'var(--color-error)' }}>
                    {trustScore}/100
                  </span>
                </div>
                <TrustMeter score={trustScore} />
              </div>
            </div>

            {listing.variants && listing.variants.length > 0 && (
              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <label className="block text-[10px] font-bold text-subtle uppercase tracking-wider">
                  Select Option / Variant
                </label>
                <div className="relative">
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full h-11 bg-surface-low border border-border/80 rounded-xl px-4 text-xs text-primary transition-all input-glow appearance-none cursor-pointer"
                  >
                    <option value="">Choose a variant…</option>
                    {listing.variants.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-subtle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 pt-1 border-t border-border/40">
              {isOwnListing ? (
                <div className="text-center p-3 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-xs font-mono font-bold uppercase tracking-wider">
                  This is your listing
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full h-12 shadow-[0_0_20px_rgba(91,77,255,0.3)] flex items-center justify-center gap-1.5 rounded-xl"
                  onClick={handleMessageSeller}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Seller
                </Button>
              )}
              <p className="text-center text-[10px] text-muted leading-relaxed">
                Always meet in a Safe-Swap zone. BataMarket does not process or hold payments between users.
              </p>
            </div>
          </Card>

          {/* Safe-Swap Spots */}
          <Card className="p-4 space-y-2 border-brand-indigo/20 rounded-xl" style={{ background: 'rgba(79,70,229,0.04)' }}>
            <p className="text-xs font-bold text-brand-indigo flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-indigo shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Designated EKSU Safe-Swap Zones
            </p>
            <p className="text-[11px] text-muted leading-relaxed">
              We recommend meeting at one of these highly visible, public campus locations:
            </p>
            <ul className="text-[10px] text-muted space-y-1 list-disc list-inside">
              <li>EKSU Main Library entrance frontage</li>
              <li>Student Union Building (SUB) common area</li>
              <li>Faculty of Science departmental common room</li>
            </ul>
          </Card>

          {/* Safety tip */}
          <Card className="p-4 space-y-1.5 border-brand-mint/20 rounded-xl" style={{ background: 'rgba(0,229,155,0.04)' }}>
            <p className="text-xs font-bold text-brand-mint flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Safety Reminder
            </p>
            <p className="text-xs text-muted leading-relaxed">
              BataMarket does not process payments. All transactions must be completed in-person at designated Safe-Swap zones. Never pay online or send bank transfers before inspecting the item.
            </p>
          </Card>

          {/* Report Button */}
          {!isOwnListing && currentUserId && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="w-full text-center text-xs text-red-500 hover:text-red-400 hover:underline pt-2 font-medium flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Report this listing or seller
            </button>
          )}
        </motion.div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border w-full max-w-md p-6 rounded-2xl space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold">Report Listing</h3>
                <button onClick={() => setReportModalOpen(false)} className="text-muted hover:text-primary">✕</button>
              </div>
              
              {reportSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-mint/10 border border-brand-mint/30 flex items-center justify-center mx-auto text-brand-mint mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold">Report Submitted</h4>
                  <p className="text-xs text-muted">Thank you! We will review this report within 24 hours.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted font-normal leading-relaxed">
                    Help keep BataMarket safe. Let us know why you are reporting this listing.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Reason</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full h-11 bg-canvas border border-border/80 rounded-lg px-4 text-sm text-primary transition-all input-glow"
                      >
                        <option value="Fake / Scam Listing">Fake / Scam Listing</option>
                        <option value="Inappropriate Content">Inappropriate Content</option>
                        <option value="Incorrect Category / Price">Incorrect Category / Price</option>
                        <option value="Harassment / Abuse">Harassment / Abuse</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Details (Optional)</label>
                      <textarea
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        placeholder="Provide details about the issue..."
                        rows={3}
                        className="w-full bg-canvas border border-border/80 rounded-lg px-4 py-3 text-sm text-primary placeholder:text-subtle/60 transition-all resize-none input-glow"
                      />
                    </div>
                  </div>
                  {reportError && <p className="text-xs text-error">{reportError}</p>}
                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                    <Button
                      variant="primary"
                      className="flex-1 bg-red-600 hover:bg-red-500 border-red-500 text-white"
                      loading={submittingReport}
                      onClick={handleSubmitReport}
                    >
                      Submit Report
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
