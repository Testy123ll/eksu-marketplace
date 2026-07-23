'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { User } from '@supabase/supabase-js'
import { useSpring, animated } from 'react-spring'
import CheckoutModal from '@/components/listings/CheckoutModal'

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '050', name: 'Sterling Bank' },
  { code: '058', name: 'GTBank (Guaranty Trust Bank)' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'UBA (United Bank for Africa)' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '035', name: 'Wema Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '219', name: 'Stanbic IBTC Bank' },
  { code: '50515', name: 'Moniepoint MFB' },
  { code: '999992', name: 'OPay' },
  { code: '50211', name: 'Kuda Bank' }
]

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  user_id: string
  account_type: 'student' | 'vendor'
  full_name: string | null
  business_name: string | null
  department: string | null
  level: number | null
  phone_number: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  trust_score: number
  created_at: string
  listings_used_free: number
  subscription_status: 'trialing' | 'active' | 'paused' | null
  subscription_started_at: string | null
  next_billing_date: string | null
  wallet_balance: number
  virtual_account_number: string | null
  virtual_bank_name: string | null
  virtual_account_name: string | null
  payout_bank_code: string | null
  payout_account_number: string | null
  payout_account_name: string | null
}

interface MyListing {
  id: string
  title: string
  price: number
  type: string
  status: string
  created_at: string
  is_boosted?: boolean
  boost_expires_at?: string | null
  listing_fee_paid?: boolean
  listing_fee_amount?: number | null
}

interface EscrowTransaction {
  id: string
  amount: number
  status: 'pending_payment' | 'locked' | 'released' | 'disputed' | 'refunded'
  created_at: string
  listing_id: string
  buyer_id: string
  seller_id: string
  dispute_reason: string | null
  listings: {
    title: string
  } | null
}

// ─── Trust Ring ───────────────────────────────────────────────────────────────
function TrustRing({ score }: { score: number }) {
  const color = score >= 90 ? '#00e59b' : score >= 70 ? '#f59e0b' : '#ef4444'
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - score / 100)

  // React Spring for trust score count-up
  const { val } = useSpring({
    from: { val: 0 },
    to: { val: score },
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  })

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#464556" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-mono font-bold" style={{ color }}>
          <animated.span>
            {val.to((n) => Math.floor(n))}
          </animated.span>
        </span>
        <span className="text-[8px] text-subtle font-mono tracking-widest">TRUST_VAL</span>
      </div>
    </div>
  )
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  product: (
    <svg className="w-4 h-4 text-brand-indigo shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  service: (
    <svg className="w-4 h-4 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  accommodation: (
    <svg className="w-4 h-4 text-brand-amber shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myListings, setMyListings] = useState<MyListing[]>([])
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  // Payment triggers
  const [boostModalOpen, setBoostModalOpen] = useState(false)
  const [selectedListingForBoost, setSelectedListingForBoost] = useState<MyListing | null>(null)

  const [feeModalOpen, setFeeModalOpen] = useState(false)
  const [selectedListingForFee, setSelectedListingForFee] = useState<MyListing | null>(null)

  const [updatingPayout, setUpdatingPayout] = useState(false)
  const [payoutBank, setPayoutBank] = useState('')
  const [payoutAcc, setPayoutAcc] = useState('')
  const [payoutError, setPayoutError] = useState<string | null>(null)

  const [subModalOpen, setSubModalOpen] = useState(false)

  // Simulation feedback
  const [simMessage, setSimMessage] = useState<string | null>(null)

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setProfile(profileData)

    // Fetch listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select('id, title, price, type, status, created_at, is_boosted, boost_expires_at, listing_fee_paid, listing_fee_amount')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15)
    setMyListings((listingsData as MyListing[]) || [])

    // Fetch escrow transactions
    const { data: escrowData } = await supabase
      .from('escrow_transactions')
      .select(`
        id, amount, status, created_at, listing_id, buyer_id, seller_id, dispute_reason,
        listings (title)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
    
    setEscrowTransactions((escrowData as any[]) || [])

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey (full_name, business_name)
      `)
      .eq('reviewed_user_id', user.id)
      .order('created_at', { ascending: false })
    
    setReviews(reviewsData || [])
    if (reviewsData && reviewsData.length > 0) {
      const avg = reviewsData.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsData.length
      setAverageRating(avg)
    } else {
      setAverageRating(null)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdatePayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!payoutBank || payoutAcc.length !== 10) {
      setPayoutError('Please select a bank and enter a 10-digit account number.')
      return
    }
    setPayoutError(null)
    try {
      const bankName = NIGERIAN_BANKS.find(b => b.code === payoutBank)?.name || 'Unknown Bank'
      const { error } = await supabase
        .from('profiles')
        .update({
          payout_bank_code: payoutBank,
          payout_account_number: payoutAcc,
          payout_account_name: bankName,
        })
        .eq('user_id', user.id)

      if (error) throw error
      setUpdatingPayout(false)
      setPayoutBank('')
      setPayoutAcc('')
      fetchData()
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to update bank details.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Developer simulation triggers
  const handleSimulate = async (action: string) => {
    if (!user) return
    setSimMessage("Processing simulation...")
    try {
      if (action === 'reset_student_free') {
        await supabase.from('profiles').update({
          account_type: 'student',
          listings_used_free: 1,
          subscription_status: null
        }).eq('user_id', user.id)
        setSimMessage("Successfully set account type to Student with 2 free listings left!")
      } else if (action === 'exhaust_student_paid') {
        await supabase.from('profiles').update({
          account_type: 'student',
          listings_used_free: 3,
          subscription_status: null
        }).eq('user_id', user.id)
        setSimMessage("Successfully set Student free allowance to exhausted. Publication fee now applies!")
      } else if (action === 'set_vendor_trial') {
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 30)
        await supabase.from('profiles').update({
          account_type: 'vendor',
          subscription_status: 'trialing',
          subscription_started_at: new Date().toISOString(),
          next_billing_date: nextMonth.toISOString()
        }).eq('user_id', user.id)
        setSimMessage("Successfully set Vendor account with active Free Trial (Month 1)!")
      } else if (action === 'set_vendor_trial_ending') {
        const inTwoDays = new Date()
        inTwoDays.setDate(inTwoDays.getDate() + 2)
        await supabase.from('profiles').update({
          account_type: 'vendor',
          subscription_status: 'active',
          next_billing_date: inTwoDays.toISOString()
        }).eq('user_id', user.id)
        setSimMessage("Successfully simulated trial ending. In-app billing reminder active!")
      } else if (action === 'set_vendor_paused') {
        await supabase.from('profiles').update({
          account_type: 'vendor',
          subscription_status: 'paused',
          next_billing_date: new Date().toISOString()
        }).eq('user_id', user.id)
        setSimMessage("Successfully simulated missed payment! Subscription is paused, listings are hidden.")
      } else if (action === 'reactivate_vendor') {
        const nextMonth = new Date()
        nextMonth.setDate(nextMonth.getDate() + 30)
        await supabase.from('profiles').update({
          account_type: 'vendor',
          subscription_status: 'active',
          next_billing_date: nextMonth.toISOString()
        }).eq('user_id', user.id)
        setSimMessage("Successfully simulated subscription payment. Account reactivated!")
      }
      await fetchData()
      setTimeout(() => setSimMessage(null), 4000)
    } catch (e: any) {
      setSimMessage(`Error: ${e.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent"
        />
      </div>
    )
  }

  const displayName = profile?.full_name || profile?.business_name || user?.email?.split('@')[0] || 'Student'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const trustScore = profile?.trust_score ?? 50

  const TRUST_STEPS = [
    { done: !!profile, text: 'Complete registration onboarding profile' },
    { done: profile?.verification_status === 'approved', text: 'Obtain team verification approval status' },
    { done: myListings.length > 0, text: 'Publish primary catalog marketplace listing' },
    { done: escrowTransactions.some((t) => t.status === 'released'), text: 'Execute secure BataEscrow meetup swap transaction' },
  ]

  // Billing variables
  const isVendor = profile?.account_type === 'vendor'
  const isStudent = profile?.account_type === 'student'
  const isSubPaused = isVendor && profile?.subscription_status === 'paused'
  
  // Calculate next billing date diff
  const billingDiffDays = profile?.next_billing_date 
    ? Math.ceil((new Date(profile.next_billing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/40 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-primary">Console Profile</h1>
          <p className="text-xs font-mono uppercase tracking-wider text-subtle">USER_REGISTRY_NODE: {user?.id.slice(0, 18)}</p>
        </div>
        {profile?.verification_status !== 'approved' && (
          <Link href="/verify">
            <Button variant="secondary" className="text-xs rounded-sm font-mono uppercase tracking-wider">
              Verify Onboarding Documents
            </Button>
          </Link>
        )}
      </div>

      {/* Monetization Notifications / Warnings */}
      {isVendor && profile?.subscription_status === 'trialing' && (
        <div className="p-4 rounded-sm bg-brand-mint/10 border border-brand-mint/30 text-xs font-mono text-brand-mint flex items-center justify-between gap-3 shadow-md">
          <span className="flex items-center gap-2 uppercase tracking-wide text-[10px]">
            <svg className="w-4 h-4 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            [SYSTEM_NOTICE]: Free Trial active. Posting limit is currently unrestricted.
          </span>
          {profile?.next_billing_date && (
            <span className="font-bold text-white bg-brand-mint/20 border border-brand-mint/30 px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider">
              First bill: {new Date(profile.next_billing_date).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {isVendor && profile?.subscription_status === 'active' && billingDiffDays <= 5 && billingDiffDays > 0 && (
        <div className="p-4 rounded-sm bg-brand-amber/10 border border-brand-amber/30 text-xs font-mono text-brand-amber flex items-center justify-between gap-3 shadow-md animate-pulse">
          <span className="flex items-center gap-2 uppercase tracking-wide text-[10px]">
            <svg className="w-4 h-4 text-brand-amber shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            [ALERT]: Subscription charge of ₦1,000 auto-debits in {billingDiffDays} days.
          </span>
        </div>
      )}

      {isSubPaused && (
        <div className="p-4 rounded-sm bg-red-500/10 border border-red-500/30 text-xs font-mono text-error flex items-center justify-between gap-3 shadow-md">
          <span className="flex items-center gap-2 uppercase tracking-wide text-[10px]">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            [LOCKDOWN]: Sub suspended due to missed payment. Catalog listings deactivated.
          </span>
          <button
            onClick={() => setSubModalOpen(true)}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 border border-red-500/40 text-white font-bold text-[9px] rounded-sm active:scale-95 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
          >
            Pay ₦1,000
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Asymmetric Identity Card (Structural/Monospace style) ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="border-2 border-border bg-surface-low p-6 space-y-6 text-center rounded-sm relative shadow-2xl font-mono text-xs">
            <div className="absolute top-0 left-0 px-2 py-0.5 bg-brand-indigo/15 text-brand-indigo border-r border-b border-border/60 text-[8px] uppercase font-bold tracking-wider rounded-br-sm">
              IDENTITY_CARD
            </div>

            {/* Avatar block with glow */}
            <div className="flex flex-col items-center gap-4 pt-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-indigo to-brand-mint p-[2px] shadow-[0_0_25px_rgba(91,77,255,0.25)] shrink-0">
                <div className="w-full h-full rounded-full bg-surface-low flex items-center justify-center text-white font-display font-black text-2xl">
                  {initials}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-primary truncate max-w-[220px]">{displayName}</h2>
                <p className="text-[10px] text-subtle mt-0.5 truncate max-w-[220px]">{user?.email}</p>
                {averageRating !== null && (
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold font-mono text-brand-mint">
                    <span>★ {averageRating.toFixed(1)}</span>
                    <span className="text-subtle font-normal font-sans">({reviews.length} reviews)</span>
                  </div>
                )}
                {profile?.account_type && (
                  <span className="inline-block mt-2 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border border-border bg-surface rounded-sm text-subtle">
                    TYPE: {profile.account_type.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Trust ring */}
            <div className="flex flex-col items-center gap-2 border-y border-border/40 py-5">
              <TrustRing score={trustScore} />
              <p className="text-[9px] uppercase tracking-wider text-muted font-bold">Verification Rating</p>
            </div>

            {/* Verification Status */}
            {profile?.verification_status && (
              <div className="space-y-1 text-left bg-surface border border-border/60 p-3 rounded-sm">
                <span className="text-[8px] font-bold text-subtle uppercase tracking-widest">STATUS_VERIFICATION</span>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    profile.verification_status === 'approved'
                      ? 'text-brand-mint'
                      : profile.verification_status === 'rejected'
                      ? 'text-red-400'
                      : 'text-brand-amber'
                  }`}>
                    {profile.verification_status}
                  </span>
                  <span className="text-[8px] text-subtle font-mono">
                    {profile.verification_status === 'approved' ? 'SECURE' : 'RESTRICTED'}
                  </span>
                </div>
              </div>
            )}

            <Button variant="danger" className="w-full rounded-sm font-mono text-[9px] uppercase tracking-wider h-10 mt-2" onClick={handleSignOut}>
              Terminal Sign Out
            </Button>
          </div>
        </motion.div>

        {/* ── Right: Ledgers & Tables ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Billing & Profile details */}
          <div className="glass rounded-2xl p-6 text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-emerald-400 text-xs">Account Information</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">VERIFIED STUDENT</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-subtle text-[10px] uppercase tracking-wider">
                    <th className="py-2 pr-4 font-semibold">Account Detail</th>
                    <th className="py-2 font-semibold">Information</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-muted">
                  <tr>
                    <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Full Name</td>
                    <td className="py-2.5 text-primary font-medium">{profile?.full_name || profile?.business_name || '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Department</td>
                    <td className="py-2.5 text-primary font-medium">{profile?.department || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Level</td>
                    <td className="py-2.5 text-primary font-medium">{profile?.level ? `${profile.level} Level` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Phone Number</td>
                    <td className="py-2.5 text-primary font-medium">{profile?.phone_number || '—'}</td>
                  </tr>
                  {isStudent && (
                    <tr>
                      <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Listing Allowance</td>
                      <td className="py-2.5 text-primary font-medium">{profile?.listings_used_free ?? 0} / 3 free listings used</td>
                    </tr>
                  )}
                  {isVendor && (
                    <>
                      <tr>
                        <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Subscription Status</td>
                        <td className="py-2.5 text-primary font-medium capitalize">{profile?.subscription_status || 'inactive'}</td>
                      </tr>
                      {profile?.next_billing_date && (
                        <tr>
                          <td className="py-2.5 pr-4 text-xs font-medium text-subtle">Next Billing Date</td>
                          <td className="py-2.5 text-primary font-medium">{new Date(profile.next_billing_date).toLocaleDateString()}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monnify Wallet & Payout Settings */}
          <div className="glass rounded-2xl p-6 text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-emerald-400 text-xs">Wallet &amp; Payout Settings</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">ACTIVE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wallet Balance and Virtual account info */}
              <div className="space-y-3 bg-surface-low/60 border border-white/10 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-semibold text-subtle">Available Wallet Balance</span>
                  <p className="text-2xl font-display font-black text-emerald-400 mt-1">₦{profile?.wallet_balance?.toLocaleString() || '0.00'}</p>
                </div>

                <div className="border-t border-white/10 pt-2.5 space-y-1">
                  <span className="text-[10px] font-semibold text-subtle">Dedicated Funding Account</span>
                  {profile?.virtual_account_number ? (
                    <div className="text-xs text-primary leading-normal space-y-0.5">
                      <div>Bank: <span className="font-bold text-white">{profile.virtual_bank_name}</span></div>
                      <div>Acc No: <span className="font-bold text-white tracking-widest">{profile.virtual_account_number}</span></div>
                      <div>Name: <span className="text-muted">{profile.virtual_account_name}</span></div>
                    </div>
                  ) : (
                    <p className="text-xs text-subtle italic">Virtual account creating... Complete verification to view details.</p>
                  )}
                  <p className="text-[10px] text-subtle leading-normal mt-1">Transfer funds to this account number to credit your wallet balance for purchase escrows.</p>
                </div>
              </div>

              {/* Personal Bank Payout details */}
              <div className="space-y-3 bg-surface-low/60 border border-white/10 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-subtle">Your Bank Payout Destination</span>
                  {profile?.payout_account_number ? (
                    <div className="text-xs text-primary mt-1 space-y-0.5">
                      <div>Bank: <span className="font-bold text-white">{profile.payout_account_name}</span></div>
                      <div>Acc No: <span className="font-bold text-white tracking-widest">{profile.payout_account_number}</span></div>
                    </div>
                  ) : (
                    <p className="text-xs text-subtle italic mt-1">No payout account linked.</p>
                  )}
                  <p className="text-[10px] text-subtle leading-normal mt-1">This is where your marketplace earnings will be disbursed when escrow payments are released.</p>
                </div>

                <div>
                  {updatingPayout ? (
                    <form onSubmit={handleUpdatePayout} className="space-y-2 mt-2">
                      {payoutError && (
                        <p className="text-[10px] text-error font-bold">{payoutError}</p>
                      )}
                      <select
                        className="w-full px-3 py-1.5 bg-canvas border border-white/10 rounded-xl text-xs text-primary outline-none focus:border-emerald-400"
                        value={payoutBank}
                        onChange={(e) => setPayoutBank(e.target.value)}
                      >
                        <option value="">-- Select Bank --</option>
                        {NIGERIAN_BANKS.map((b) => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="10-digit Account Number"
                        className="w-full px-3 py-1.5 bg-canvas border border-white/10 rounded-xl text-xs text-primary outline-none focus:border-emerald-400"
                        value={payoutAcc}
                        onChange={(e) => setPayoutAcc(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                      <div className="flex gap-2 pt-1">
                        <button type="submit" className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-full hover:brightness-110">Save</button>
                        <button type="button" onClick={() => setUpdatingPayout(false)} className="px-3 py-1.5 bg-surface border border-white/10 text-subtle text-xs font-medium rounded-full">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setPayoutBank(profile?.payout_bank_code || '')
                        setPayoutAcc(profile?.payout_account_number || '')
                        setUpdatingPayout(true)
                      }}
                      className="w-full py-2 border border-dashed border-white/20 text-xs font-semibold hover:border-emerald-400 hover:text-emerald-400 transition-colors rounded-full"
                    >
                      Update Payout Destination
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Transactions Log */}
          <div className="glass rounded-2xl p-6 text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-emerald-400 text-xs">Escrow Swap Transactions</span>
              <span className="text-[10px] text-muted font-medium">REALTIME SYNC</span>
            </div>

            {escrowTransactions.length === 0 ? (
              <div className="py-8 text-center text-subtle space-y-2">
                <svg className="w-8 h-8 text-subtle/50 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs">No active escrow records discovered in registry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/40 text-subtle text-[9px] uppercase tracking-wider">
                      <th className="py-2 font-bold">TX_ID</th>
                      <th className="py-2 font-bold">ITEM_TITLE</th>
                      <th className="py-2 font-bold">ROLE</th>
                      <th className="py-2 font-bold">AMOUNT</th>
                      <th className="py-2 font-bold">STATUS</th>
                      <th className="py-2 font-bold">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-muted">
                    {escrowTransactions.map((tx) => {
                      const isBuyer = tx.buyer_id === user?.id
                      const roleLabel = isBuyer ? 'BUYER' : 'SELLER'
                      const statusColors: Record<string, string> = {
                        locked: 'text-brand-indigo',
                        released: 'text-brand-mint',
                        disputed: 'text-brand-amber',
                        refunded: 'text-brand-indigo opacity-70',
                        pending_payment: 'text-subtle',
                      }

                      return (
                        <tr key={tx.id} className="hover:bg-surface/40 transition-colors">
                          <td className="py-2.5 font-bold text-[9px] uppercase text-primary">
                            {tx.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-2.5 text-primary max-w-[150px] truncate pr-2">
                            {tx.listings?.title || 'Unknown Listing'}
                          </td>
                          <td className="py-2.5 text-[10px] font-bold text-subtle">
                            {roleLabel}
                          </td>
                          <td className="py-2.5 text-primary">
                            ₦{tx.amount.toLocaleString()}
                          </td>
                          <td className={`py-2.5 text-[9px] font-bold uppercase ${statusColors[tx.status] || 'text-primary'}`}>
                            {tx.status}
                          </td>
                          <td className="py-2.5 text-[9px] text-subtle">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Listings Catalog */}
          <div className="border border-border bg-surface p-5 rounded-sm relative space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <h3 className="text-sm font-display font-black uppercase tracking-tight text-primary">Catalog Publications</h3>
              <button
                onClick={() => router.push('/listings/new')}
                className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-indigo hover:text-brand-mint transition-colors cursor-pointer"
              >
                + Publish New Listing
              </button>
            </div>

            {myListings.length === 0 ? (
              <div className="py-8 text-center space-y-3 font-mono text-xs text-subtle">
                <svg className="w-8 h-8 text-subtle mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0l-1.08 7.56a1.5 1.5 0 001.488 1.71h15.184a1.5 1.5 0 001.488-1.71l-1.08-7.56m-16.128 0A3 3 0 0020.25 12V4.5a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 4.5V12a3 3 0 001.128 2.368z" />
                </svg>
                <p className="uppercase tracking-wider">No catalog items published by this profile node.</p>
                <button
                  onClick={() => router.push('/listings/new')}
                  className="text-[9px] font-bold text-brand-indigo hover:underline cursor-pointer uppercase tracking-widest"
                >
                  [ Initialize First listing ]
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs">
                {myListings.map((l) => {
                  const isDraft = l.status === 'inactive' && !l.listing_fee_paid
                  const draftFee = isDraft ? Math.min(1000, Math.max(50, Math.floor(l.price * 0.02))) : 0

                  return (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 rounded-sm bg-surface-low border border-border hover:border-brand-indigo/40 transition-colors cursor-pointer"
                      onClick={() => router.push(`/listings/${l.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {TYPE_ICONS[l.type]}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate text-primary leading-tight">{l.title}</p>
                          <p className="text-[10px] text-brand-mint font-bold mt-0.5">₦{l.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                          isDraft 
                            ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/30' 
                            : l.status === 'active'
                            ? 'bg-brand-mint/10 text-brand-mint border-brand-mint/30'
                            : l.status === 'sold'
                            ? 'bg-muted/10 text-subtle border-border/40 line-through'
                            : 'bg-surface-high text-subtle border-border/20'
                        }`}>
                          {isDraft ? 'draft' : l.status}
                        </span>

                        {isDraft && isStudent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedListingForFee(l)
                              setFeeModalOpen(true)
                            }}
                            className="px-2 py-0.5 rounded-sm bg-brand-amber text-canvas text-[9px] font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                          >
                            Pay Fee (₦{draftFee})
                          </button>
                        )}

                        {l.status === 'active' && (
                          l.is_boosted ? (
                            <span className="text-[8px] font-bold text-brand-amber tracking-wide flex items-center gap-0.5 border border-brand-amber/30 bg-brand-amber/10 px-1.5 py-0.5 rounded-sm">
                              Featured
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedListingForBoost(l)
                                setBoostModalOpen(true)
                              }}
                              className="px-2 py-0.5 rounded-sm bg-brand-amber text-canvas text-[9px] font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                            >
                              Boost
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Trust score steps guidelines */}
          <div className="border border-brand-indigo/20 p-5 rounded-sm relative font-mono text-xs space-y-3" style={{ background: 'rgba(91,77,255,0.02)' }}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-indigo">SECURITY_TRUST_ACCELERATOR_PROTOCOL</h3>
            <ul className="space-y-2 text-[10px] text-muted">
              {TRUST_STEPS.map(({ done, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <span className={`text-xs leading-none font-bold ${done ? 'text-brand-mint' : 'text-subtle'}`}>
                    {done ? '[✓]' : '[ ]'}
                  </span>
                  <span className={done ? 'text-primary line-through opacity-60' : ''}>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Verified Trade Reviews */}
          <div className="border border-border bg-surface-low/80 p-5 rounded-sm relative font-mono text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="font-bold text-brand-indigo uppercase tracking-widest text-[9px]">SYS_VERIFIED_TRADE_REVIEWS</span>
              <span className="text-[8px] text-brand-mint uppercase font-bold">TRUST_INDEX</span>
            </div>

            {reviews.length === 0 ? (
              <div className="py-8 text-center text-subtle space-y-2">
                <svg className="w-8 h-8 text-subtle/50 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c-.107-.218-.284-.365-.5-.365-.218 0-.395.147-.502.365L8.783 7.828l-4.78.694c-.24.035-.427.203-.497.433a.58.58 0 00.163.567l3.46 3.37-.817 4.75a.578.578 0 00.237.586.586.586 0 00.613.018L10.5 16.038l4.272 2.247a.586.586 0 00.613-.018.578.578 0 00.237-.586l-.817-4.75 3.46-3.37a.58.58 0 00.163-.567c-.07-.23-.257-.398-.497-.433l-4.78-.694-1.693-4.329z" />
                </svg>
                <p className="text-[10px] uppercase tracking-wider">No reviews logged yet.</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-border/20 max-h-[300px] overflow-y-auto scrollbar-none">
                {reviews.map((rev) => {
                  const revName = rev.reviewer?.full_name || rev.reviewer?.business_name || 'Student'
                  return (
                    <div key={rev.id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-primary">{revName}</span>
                        <span className="text-brand-mint font-bold font-mono">★ {rev.rating}</span>
                      </div>
                      {rev.comment && (
                        <p className="text-subtle text-[11px] font-sans leading-relaxed">{rev.comment}</p>
                      )}
                      <div className="text-[8px] text-subtle font-mono">
                        LOGGED_AT: {new Date(rev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Dev simulation console ── */}
      <div className="border border-border/80 bg-surface-low/30 p-6 rounded-sm space-y-4 font-mono text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <h3 className="text-[10px] font-black text-brand-indigo tracking-widest uppercase">
            DEV_SIMULATION_SANDBOX_PANEL
          </h3>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-brand-indigo/15 border border-brand-indigo/30 text-brand-indigo">
            DEBUG_MODE
          </span>
        </div>
        <p className="text-[10px] text-subtle leading-relaxed">
          Manipulate database states instantly to evaluate student listing fee checkpoints or vendor subscription trials/cycles.
        </p>

        {simMessage && (
          <div className="p-3 rounded-sm bg-brand-mint/15 border border-brand-mint/30 text-brand-mint text-[10px] uppercase font-bold tracking-wide">
            &gt;&gt; {simMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          <button
            onClick={() => handleSimulate('reset_student_free')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Student: 2 Free Left ]
          </button>
          <button
            onClick={() => handleSimulate('exhaust_student_paid')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Student: 0 Free Left ]
          </button>
          <button
            onClick={() => handleSimulate('set_vendor_trial')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Vendor: Active Trial ]
          </button>
          <button
            onClick={() => handleSimulate('set_vendor_trial_ending')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Vendor: Sub Alert ]
          </button>
          <button
            onClick={() => handleSimulate('set_vendor_paused')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Vendor: Missed Pay ]
          </button>
          <button
            onClick={() => handleSimulate('reactivate_vendor')}
            className="px-3 py-2 text-left rounded-sm bg-surface hover:bg-surface-high border border-border text-[9px] font-bold hover:border-brand-indigo/40 active:scale-95 transition-all text-primary uppercase"
          >
            [ Vendor: Sub Active ]
          </button>
        </div>
      </div>

      {/* Checkout Modals */}
      {selectedListingForBoost && (
        <CheckoutModal
          isOpen={boostModalOpen}
          onClose={() => {
            setBoostModalOpen(false)
            setSelectedListingForBoost(null)
          }}
          onSuccess={() => {
            setBoostModalOpen(false)
            setSelectedListingForBoost(null)
            fetchData()
          }}
          listingId={selectedListingForBoost.id}
          listingTitle={selectedListingForBoost.title}
          price={500}
          paymentType="boost"
        />
      )}

      {selectedListingForFee && (
        <CheckoutModal
          isOpen={feeModalOpen}
          onClose={() => {
            setFeeModalOpen(false)
            setSelectedListingForFee(null)
          }}
          onSuccess={() => {
            setFeeModalOpen(false)
            setSelectedListingForFee(null)
            fetchData()
          }}
          listingId={selectedListingForFee.id}
          listingTitle={selectedListingForFee.title}
          price={Math.min(1000, Math.max(50, Math.floor(selectedListingForFee.price * 0.02)))}
          paymentType="listing_fee"
        />
      )}

      {subModalOpen && (
        <CheckoutModal
          isOpen={subModalOpen}
          onClose={() => setSubModalOpen(false)}
          onSuccess={() => {
            setSubModalOpen(false)
            fetchData()
          }}
          price={1000}
          paymentType="vendor_subscription"
        />
      )}
    </div>
  )
}
