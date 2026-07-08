'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'
import { getCourseCode } from '@/lib/utils/listings'
import SafeSwapMap from '@/components/listings/SafeSwapMap'
// Bypassed CheckoutModal for P2P Handoff Guard

interface Thread {
  other_user_id: string
  other_user_name: string
  listing_id: string
  listing_title: string
  last_message: string
  last_message_at: string
  unread_count: number
  trust_score: number
}

interface Message {
  id: string
  body: string
  sender_id: string
  recipient_id: string
  listing_id: string
  created_at: string
  offer_amount?: number | null
  offer_status?: 'pending' | 'accepted' | 'declined' | null
}

interface EscrowTransaction {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: 'pending_payment' | 'locked' | 'released' | 'disputed' | 'refunded'
  verification_code: string
  dispute_reason: string | null
}

// ─── Relative time ─────────────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ChatContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)

  // Active conversation state
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Contact sharing state
  const [iSharedContact, setISharedContact] = useState(false)
  const [theySharedContact, setTheySharedContact] = useState(false)
  const [otherUserPhone, setOtherUserPhone] = useState<string | null>(null)
  const [sharingLoading, setSharingLoading] = useState(false)

  // Escrow state
  const [escrowTx, setEscrowTx] = useState<EscrowTransaction | null>(null)
  const [listingDetails, setListingDetails] = useState<{ price: number; seller_id: string; title: string } | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showMapInChat, setShowMapInChat] = useState(false)
  const [submittedReview, setSubmittedReview] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [offerInputOpen, setOfferInputOpen] = useState(false)
  const [offerValue, setOfferValue] = useState('')
  const [offerLoading, setOfferLoading] = useState(false)

  // Realtime channel ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    initChat()
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If navigated from a listing's "Message Seller" button
  useEffect(() => {
    const listingId = searchParams.get('listing')
    const sellerId = searchParams.get('seller')
    const variantVal = searchParams.get('variant')
    if (listingId && sellerId && currentUserId && threads.length >= 0) {
      const existing = threads.find(
        (t) => t.listing_id === listingId && t.other_user_id === sellerId
      )
      if (existing) {
        openThread(existing)
        if (variantVal) {
          setNewMessage(`Hi! I'm interested in the variant: "${variantVal}". Is it still available?`)
        }
      } else {
        bootstrapThread(listingId, sellerId)
        if (variantVal) {
          setNewMessage(`Hi! I'm interested in the variant: "${variantVal}". Is it still available?`)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentUserId, threads])

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUserId(user.id)
    await loadThreads(user.id)
  }

  const loadThreads = async (userId: string) => {
    setLoadingThreads(true)
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, body, sender_id, recipient_id, listing_id, created_at,
        listings (title),
        sender:profiles!messages_sender_id_fkey (full_name, business_name, trust_score),
        recipient:profiles!messages_recipient_id_fkey (full_name, business_name, trust_score)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error && data) {
      const threadMap = new Map<string, Thread>()
      for (const msg of data as any[]) {
        const isMe = msg.sender_id === userId
        const otherId = isMe ? msg.recipient_id : msg.sender_id
        const otherProfile = isMe ? msg.recipient : msg.sender
        const key = `${msg.listing_id}:${otherId}`
        if (!threadMap.has(key)) {
          const otherName =
            otherProfile?.full_name || otherProfile?.business_name || 'Student'
          threadMap.set(key, {
            other_user_id: otherId,
            other_user_name: otherName,
            listing_id: msg.listing_id,
            listing_title: msg.listings?.title || 'Listing',
            last_message: msg.body,
            last_message_at: msg.created_at,
            unread_count: 0,
            trust_score: otherProfile?.trust_score ?? 50,
          })
        }
      }
      setThreads(Array.from(threadMap.values()))
    }
    setLoadingThreads(false)
  }

  const bootstrapThread = async (listingId: string, sellerId: string) => {
    const [{ data: listing }, { data: sellerProfile }] = await Promise.all([
      supabase.from('listings').select('title, price, seller_id').eq('id', listingId).single(),
      supabase.from('profiles').select('full_name, business_name, trust_score').eq('user_id', sellerId).single(),
    ])
    const thread: Thread = {
      other_user_id: sellerId,
      other_user_name: sellerProfile?.full_name || sellerProfile?.business_name || 'Seller',
      listing_id: listingId,
      listing_title: listing?.title || 'Listing',
      last_message: '',
      last_message_at: '',
      unread_count: 0,
      trust_score: sellerProfile?.trust_score ?? 50,
    }
    setActiveThread(thread)
    if (listing) {
      setListingDetails({
        price: Number(listing.price),
        seller_id: listing.seller_id,
        title: listing.title,
      })
    }
  }

  const checkContactSharing = async (thread: Thread, userId: string) => {
    setISharedContact(false)
    setTheySharedContact(false)
    setOtherUserPhone(null)

    const { data: myShare } = await supabase
      .from('contact_sharing')
      .select('id')
      .eq('listing_id', thread.listing_id)
      .eq('user_id', userId)
      .eq('shared_with_id', thread.other_user_id)
      .maybeSingle()

    const { data: theirShare } = await supabase
      .from('contact_sharing')
      .select('id')
      .eq('listing_id', thread.listing_id)
      .eq('user_id', thread.other_user_id)
      .eq('shared_with_id', userId)
      .maybeSingle()

    setISharedContact(!!myShare)
    setTheySharedContact(!!theirShare)

    if (theirShare) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('user_id', thread.other_user_id)
        .single()
      setOtherUserPhone(profile?.phone_number || 'No phone provided')
    }
  }

  const checkEscrowStatus = async (thread: Thread, userId: string) => {
    setEscrowTx(null)
    const { data } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('listing_id', thread.listing_id)
      .or(`and(buyer_id.eq.${userId},seller_id.eq.${thread.other_user_id}),and(buyer_id.eq.${thread.other_user_id},seller_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      setEscrowTx(data)
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('listing_id', data.listing_id)
        .eq('reviewer_id', userId)
        .maybeSingle()
      setSubmittedReview(!!existingReview)
    }
  }

  const fetchListingDetails = async (listingId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('price, seller_id, title')
      .eq('id', listingId)
      .single()
    if (data) {
      setListingDetails({
        price: Number(data.price),
        seller_id: data.seller_id,
        title: data.title,
      })
    }
  }

  const openThread = async (thread: Thread) => {
    setActiveThread(thread)
    setOtpInput('')
    setOtpError(null)
    await loadMessages(thread)
    if (currentUserId) {
      await checkContactSharing(thread, currentUserId)
      await checkEscrowStatus(thread, currentUserId)
      await fetchListingDetails(thread.listing_id)
    }
    subscribeToEvents(thread)
  }

  const loadMessages = async (thread: Thread) => {
    if (!currentUserId) return
    const { data } = await supabase
      .from('messages')
      .select('id, body, sender_id, recipient_id, listing_id, created_at, offer_amount, offer_status')
      .eq('listing_id', thread.listing_id)
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${thread.other_user_id}),and(sender_id.eq.${thread.other_user_id},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])
  }

  const subscribeToEvents = (thread: Thread) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`chat:${thread.listing_id}:${thread.other_user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${thread.listing_id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as Message
            const isFromOrToMe =
              (msg.sender_id === currentUserId && msg.recipient_id === thread.other_user_id) ||
              (msg.sender_id === thread.other_user_id && msg.recipient_id === currentUserId)

            if (isFromOrToMe) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev
                return [...prev, msg]
              })

              if (msg.body.includes('System: Shared contact details.')) {
                if (currentUserId) {
                  checkContactSharing(thread, currentUserId)
                }
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Message
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escrow_transactions',
          filter: `listing_id=eq.${thread.listing_id}`,
        },
        (payload) => {
          const tx = payload.new as EscrowTransaction
          if (tx) {
            const isMyConversation =
              (tx.buyer_id === currentUserId && tx.seller_id === thread.other_user_id) ||
              (tx.buyer_id === thread.other_user_id && tx.seller_id === currentUserId)

            if (isMyConversation) {
              setEscrowTx(tx)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeThread || !currentUserId) return
    setSendingMessage(true)
    const body = newMessage.trim()
    setNewMessage('')
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      recipient_id: activeThread.other_user_id,
      listing_id: activeThread.listing_id,
      body,
    })
    if (error) {
      setNewMessage(body)
    } else {
      if (currentUserId) loadThreads(currentUserId)
    }
    setSendingMessage(false)
  }

  const handleShareContact = async () => {
    if (!activeThread || !currentUserId) return
    setSharingLoading(true)
    try {
      const { error } = await supabase
        .from('contact_sharing')
        .insert({
          listing_id: activeThread.listing_id,
          user_id: currentUserId,
          shared_with_id: activeThread.other_user_id,
        })
      if (error) throw error

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: 'System: Shared contact details.',
      })

      await checkContactSharing(activeThread, currentUserId)
      loadThreads(currentUserId)
    } catch (e: any) {
      alert(e.message || 'Failed to share contact.')
    } finally {
      setSharingLoading(false)
    }
  }

  const handleInitiateMeetup = async () => {
    if (!activeThread || !currentUserId || !listingDetails) return
    setActionLoading('initiate')
    try {
      const code = Math.floor(1000 + Math.random() * 9000).toString()
      
      // Look for the latest accepted offer
      const acceptedOffer = messages.slice().reverse().find(
        (m) => m.offer_amount != null && m.offer_status === 'accepted'
      )
      const amountToLock = acceptedOffer?.offer_amount ?? listingDetails.price

      const { data, error } = await supabase
        .from('escrow_transactions')
        .insert({
          listing_id: activeThread.listing_id,
          buyer_id: currentUserId,
          seller_id: listingDetails.seller_id,
          amount: amountToLock,
          status: 'locked',
          verification_code: code,
        })
        .select('*')
        .single()

      if (error) throw error

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: 'System: P2P Swap initiated. Meetup verification code generated securely.',
      })

      setEscrowTx(data)
      loadThreads(currentUserId)
    } catch (e: any) {
      alert(e.message || 'Failed to initiate meetup.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReleaseEscrow = async () => {
    if (!escrowTx || !currentUserId || !activeThread) return
    setOtpError(null)
    setActionLoading('release')
    try {
      const { data, error: rpcError } = await supabase.rpc('complete_handoff_code', {
        transaction_uuid: escrowTx.id,
        input_code: otpInput,
      })

      if (rpcError) throw rpcError

      const result = data as { success: boolean; message: string }
      if (!result.success) {
        setOtpError(result.message)
        return
      }

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: 'System: Meetup verification code matched. P2P Swap completed successfully.',
      })

      await checkEscrowStatus(activeThread, currentUserId)
      setOtpInput('')
    } catch (e: any) {
      alert(e.message || 'Failed to verify handoff code.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisputeEscrow = async () => {
    if (!escrowTx || !currentUserId || !activeThread || !disputeReason.trim()) return
    setActionLoading('dispute')
    try {
      const { error: escrowError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'disputed',
          dispute_reason: disputeReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowTx.id)

      if (escrowError) throw escrowError

      await supabase.from('trust_events').insert({
        user_id: escrowTx.seller_id,
        event_type: 'escrow_disputed',
        weight: -5,
      })

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: `System: Escrow transaction disputed by buyer. Reason: "${disputeReason.trim()}". Locked pending moderation review.`,
      })

      setDisputeModalOpen(false)
      setDisputeReason('')
    } catch (e: any) {
      alert(e.message || 'Failed to dispute escrow.')
    } finally {
      setActionLoading(null)
    }
  }

  const sendCounterOffer = async () => {
    if (!offerValue || isNaN(Number(offerValue)) || !activeThread || !currentUserId || !listingDetails) return
    setOfferLoading(true)
    const amount = Number(offerValue)
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: `Counter-Offer: ₦${amount.toLocaleString()}`,
        offer_amount: amount,
        offer_status: 'pending',
      })
      if (error) throw error

      setOfferValue('')
      setOfferInputOpen(false)
      if (currentUserId) loadThreads(currentUserId)
    } catch (e: any) {
      alert(e.message || 'Failed to send offer.')
    } finally {
      setOfferLoading(false)
    }
  }

  const handleAcceptOffer = async (msg: Message) => {
    if (!currentUserId || !activeThread) return
    setActionLoading(`offer-${msg.id}`)
    try {
      const { error: msgError } = await supabase
        .from('messages')
        .update({ offer_status: 'accepted' })
        .eq('id', msg.id)
      if (msgError) throw msgError

      if (escrowTx) {
        const { error: escrowError } = await supabase
          .from('escrow_transactions')
          .update({ amount: msg.offer_amount })
          .eq('id', escrowTx.id)
        if (escrowError) throw escrowError
      }

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: `System: Counter-offer of ₦${msg.offer_amount?.toLocaleString()} accepted.`,
      })

      await loadMessages(activeThread)
      await checkEscrowStatus(activeThread, currentUserId)
    } catch (e: any) {
      alert(e.message || 'Failed to accept offer.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineOffer = async (msg: Message) => {
    if (!currentUserId || !activeThread) return
    setActionLoading(`offer-${msg.id}`)
    try {
      const { error: msgError } = await supabase
        .from('messages')
        .update({ offer_status: 'declined' })
        .eq('id', msg.id)
      if (msgError) throw msgError

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: `System: Counter-offer of ₦${msg.offer_amount?.toLocaleString()} declined.`,
      })

      await loadMessages(activeThread)
    } catch (e: any) {
      alert(e.message || 'Failed to decline offer.')
    } finally {
      setActionLoading(null)
    }
  }

  const submitTradeReview = async () => {
    if (!escrowTx || !currentUserId || !activeThread) return
    setReviewLoading(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        listing_id: escrowTx.listing_id,
        reviewer_id: currentUserId,
        reviewed_user_id: escrowTx.seller_id,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
        is_verified: true,
      })

      if (error) throw error

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        recipient_id: activeThread.other_user_id,
        listing_id: activeThread.listing_id,
        body: `System: Verified buyer rated this swap ★ ${reviewRating}.`,
      })

      setSubmittedReview(true)
      setReviewComment('')
    } catch (e: any) {
      alert(e.message || 'Failed to submit review.')
    } finally {
      setReviewLoading(false)
    }
  }

  const trustColor = (score: number) =>
    score >= 90 ? '#00e59b' : score >= 70 ? '#f59e0b' : '#ef4444'

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Messages</h1>
          <p className="text-sm text-muted mt-0.5">Your conversations with buyers and sellers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* ── Thread list ── */}
        <div className="lg:col-span-1 overflow-y-auto scrollbar-none space-y-2 pr-1">
          {loadingThreads ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-surface-low border border-border/40 animate-pulse" />
            ))
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-low border border-border/80 flex items-center justify-center text-muted shadow-inner">
                <svg className="w-6 h-6 text-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-muted">No conversations yet.</p>
              <Link href="/listings" className="text-xs font-mono font-bold text-brand-indigo hover:underline uppercase">
                Browse listings to start one
              </Link>
            </div>
          ) : (
            threads.map((thread) => {
              const code = getCourseCode(thread.listing_id, thread.listing_title)
              return (
                <motion.button
                  key={`${thread.listing_id}:${thread.other_user_id}`}
                  onClick={() => openThread(thread)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    activeThread?.listing_id === thread.listing_id &&
                    activeThread?.other_user_id === thread.other_user_id
                      ? 'border-brand-indigo/50 bg-brand-indigo/10 shadow-[0_0_15px_rgba(91,77,255,0.15)]'
                      : 'border-border bg-surface hover:border-brand-indigo/30 hover:bg-surface-high'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Warm Glowing Avatar */}
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-brand-indigo to-brand-mint p-[1.5px] shadow-md shrink-0">
                      <div className="w-full h-full rounded-full bg-surface-low flex items-center justify-center text-xs font-bold text-primary">
                        {thread.other_user_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold truncate text-primary">{thread.other_user_name}</p>
                        {thread.last_message_at && (
                          <span className="text-[9px] font-mono text-subtle shrink-0">{relativeTime(thread.last_message_at)}</span>
                        )}
                      </div>
                      
                      {/* Monospace course code tag */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-surface-high border border-border text-brand-indigo rounded-sm uppercase tracking-wider">
                          {code}
                        </span>
                        <p className="text-[10px] text-muted truncate">
                          {thread.listing_title}
                        </p>
                      </div>
                      
                      {thread.last_message && (
                        <p className="text-xs text-subtle mt-1.5 truncate leading-normal">{thread.last_message}</p>
                      )}
                    </div>
                    {thread.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-indigo flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                        {thread.unread_count}
                      </span>
                    )}
                  </div>
                </motion.button>
              )
            })
          )}
        </div>

        {/* ── Conversation pane ── */}
        <div className="lg:col-span-2 glass rounded-xl border border-border flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {!activeThread ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8"
              >
                <div className="w-14 h-14 rounded-full bg-surface-low border border-border/80 flex items-center justify-center text-muted shadow-inner">
                  <svg className="w-7 h-7 text-subtle" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-display font-bold">Select a conversation</p>
                <p className="text-sm text-muted max-w-xs">
                  Choose a thread from the left list, or launch messaging from a listing details page.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeThread.listing_id}:${activeThread.other_user_id}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-indigo to-brand-mint flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {activeThread.other_user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{activeThread.other_user_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[8px] px-1 py-0.2 bg-surface-high border border-border text-subtle rounded-sm uppercase tracking-wider">
                        {getCourseCode(activeThread.listing_id, activeThread.listing_title)}
                      </span>
                      <p className="text-[10px] text-muted truncate">{activeThread.listing_title}</p>
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-1 rounded-sm border flex items-center gap-1 shrink-0"
                    style={{ color: trustColor(activeThread.trust_score), borderColor: `${trustColor(activeThread.trust_score)}30` }}
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {activeThread.trust_score}
                  </span>
                  {!iSharedContact && (
                    <button
                      onClick={handleShareContact}
                      disabled={sharingLoading}
                      className="text-[9px] font-semibold bg-brand-indigo/15 hover:bg-brand-indigo/35 text-brand-indigo px-2.5 py-1.5 rounded-xl border border-brand-indigo/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer font-mono uppercase tracking-wider"
                    >
                      <svg className="w-3.5 h-3.5 text-brand-indigo shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {sharingLoading ? 'Sharing...' : 'Share Contact'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowMapInChat(!showMapInChat)}
                    className={`text-[9px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer font-mono uppercase tracking-wider ${
                      showMapInChat
                        ? 'bg-brand-mint/15 border-brand-mint text-brand-mint'
                        : 'bg-surface-high border-border text-subtle hover:text-primary hover:border-brand-indigo/30'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    {showMapInChat ? 'Hide Map' : 'Campus Map'}
                  </button>
                  <Link
                    href={`/listings/${activeThread.listing_id}`}
                    className="text-[10px] font-mono font-bold text-brand-indigo hover:underline shrink-0 uppercase tracking-wider"
                  >
                    View Listing
                  </Link>
                </div>

                <div className="flex-1 flex overflow-hidden min-h-0 relative">
                  {/* Messages Feed */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Contact Sharing Banner */}
                {iSharedContact && theySharedContact ? (
                  <div className="mx-5 my-2 px-4 py-2.5 rounded-xl bg-brand-mint/10 border border-brand-mint/30 text-xs text-brand-mint flex items-center justify-between gap-3 shadow-md">
                    <span className="flex items-center gap-2 font-mono">
                      <svg className="w-3.5 h-3.5 text-brand-mint shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Verified Contact:
                      <strong className="tracking-wider select-all font-mono font-bold text-white bg-black/30 px-2 py-0.5 rounded">
                        {otherUserPhone}
                      </strong>
                    </span>
                    <a
                      href={`tel:${otherUserPhone}`}
                      className="text-[9px] font-mono font-bold px-3 py-1.5 bg-brand-mint text-black rounded-xl hover:brightness-110 active:scale-95 transition-all shrink-0 uppercase tracking-wider"
                    >
                      Call Now
                    </a>
                  </div>
                ) : (iSharedContact || theySharedContact) ? (
                  <div className="mx-5 my-2 px-4 py-2.5 rounded-xl bg-brand-amber/10 border border-brand-amber/30 text-xs text-brand-amber flex items-center justify-between gap-3 shadow-md">
                    <span className="flex items-center gap-2 font-medium">
                      <svg className="w-3.5 h-3.5 text-brand-amber shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {iSharedContact
                        ? 'You shared your contact details. Waiting for them to share back.'
                        : `${activeThread.other_user_name} shared their contact details with you.`}
                    </span>
                    {!iSharedContact && (
                      <button
                        onClick={handleShareContact}
                        disabled={sharingLoading}
                        className="text-[9px] font-mono font-bold px-3 py-1.5 bg-brand-amber text-black rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shrink-0 cursor-pointer uppercase tracking-wider"
                      >
                        {sharingLoading ? 'Sharing...' : 'Share Contact'}
                      </button>
                    )}
                  </div>
                ) : null}

                {/* 🛡️ BataSwap Handoff Guard */}
                {listingDetails && (
                  <div className="mx-5 my-2 p-4 bg-surface-low border border-border/60 rounded-xl font-mono text-xs space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="font-bold text-brand-indigo flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                        <svg className="w-3.5 h-3.5 text-brand-indigo shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        BataSwap Handoff Guard
                      </span>
                      <span className="text-[8px] uppercase font-bold text-subtle px-1.5 py-0.5 border border-border rounded-xl bg-surface">
                        {escrowTx ? `STATUS: ${escrowTx.status.toUpperCase()}` : 'STATUS: INACTIVE'}
                      </span>
                    </div>

                    {/* CASE 1: No Transaction created */}
                    {!escrowTx && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div>
                          <p className="text-primary font-bold">Secure P2P Swap Meetup</p>
                          <p className="text-[10px] text-subtle mt-0.5 leading-relaxed">Lock item swap status and generate meetup handoff codes to verify exchanges securely.</p>
                        </div>
                        {currentUserId !== listingDetails.seller_id ? (
                          <button
                            onClick={handleInitiateMeetup}
                            disabled={actionLoading === 'initiate'}
                            className="shrink-0 px-4 py-2 bg-brand-indigo text-white font-bold hover:brightness-110 rounded-xl active:scale-95 transition-all border border-brand-indigo/20 uppercase text-[9px] cursor-pointer tracking-wider"
                          >
                            {actionLoading === 'initiate' ? 'Initiating...' : 'Initiate Meetup'}
                          </button>
                        ) : (
                          <span className="text-[9px] text-muted italic uppercase tracking-wider">Waiting for buyer to initiate meetup...</span>
                        )}
                      </div>
                    )}

                    {/* CASE 2: Meetup Code Generated & Locked */}
                    {escrowTx && escrowTx.status === 'locked' && (
                      <div className="space-y-3 pt-1">
                        {currentUserId === escrowTx.buyer_id ? (
                          // Buyer View: Input OTP
                          <div className="space-y-3">
                            <p className="text-[10px] text-subtle leading-relaxed">
                              Meetup is locked. Inspect the item physically. Ask the seller for the 4-digit handoff code, then enter it here to verify:
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <input
                                type="text"
                                placeholder="4-digit code"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-primary font-bold tracking-widest text-center w-full sm:w-40 font-mono focus:border-brand-mint transition-colors outline-none"
                              />
                              <div className="flex gap-2 flex-1">
                                <button
                                  onClick={handleReleaseEscrow}
                                  disabled={otpInput.length !== 4 || actionLoading === 'release'}
                                  className="flex-1 px-4 py-2 bg-brand-mint text-canvas font-bold hover:brightness-110 rounded-xl active:scale-95 transition-all disabled:opacity-50 uppercase text-[9px] tracking-wider cursor-pointer"
                                >
                                  {actionLoading === 'release' ? 'Verifying...' : 'Verify Handoff'}
                                </button>
                                <button
                                  onClick={() => setDisputeModalOpen(true)}
                                  className="px-4 py-2 border border-error/40 hover:bg-error/15 text-error font-bold rounded-xl active:scale-95 transition-all uppercase text-[9px] tracking-wider cursor-pointer"
                                >
                                  Dispute
                                </button>
                              </div>
                            </div>
                            {otpError && <p className="text-[9px] text-error uppercase tracking-wider">{otpError}</p>}
                          </div>
                        ) : (
                          // Seller View: Display OTP
                          <div className="space-y-2">
                            <p className="text-primary font-bold uppercase text-[9px] tracking-wider">Meetup verification code</p>
                            <p className="text-[10px] text-subtle leading-relaxed">
                              Buyer has locked the swap. Meet them, hand over the item, and share this code to complete the verification:
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="bg-surface border border-brand-mint/40 rounded-xl px-4 py-2 text-base font-bold text-brand-mint tracking-widest font-mono shadow-inner select-all">
                                {escrowTx.verification_code}
                              </div>
                              <p className="text-[9px] text-subtle uppercase tracking-wider leading-relaxed">
                                Provide this OTP *ONLY* after<br/>the buyer has inspected and accepted the swap.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 3: Handoff Verified */}
                    {escrowTx && escrowTx.status === 'released' && (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-mint/10 border border-brand-mint/30 flex items-center justify-center text-brand-mint shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-primary font-bold uppercase text-[9px] tracking-wider">Swap verified successfully</p>
                            <p className="text-[10px] text-subtle mt-0.5 leading-relaxed">The handoff has been completed. Stock has been managed, and reputation trust score boosted (+5 points)!</p>
                          </div>
                        </div>

                        {/* Inline Review Form for Buyer */}
                        {currentUserId === escrowTx.buyer_id && !submittedReview && (
                          <div className="border-t border-border/40 pt-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-brand-indigo uppercase tracking-wider">
                                Rate your meetup with {activeThread.other_user_name}:
                              </span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className={`text-sm hover:scale-110 active:scale-90 transition-transform cursor-pointer ${
                                      star <= reviewRating ? 'text-brand-mint' : 'text-subtle/40'
                                    }`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a comment about the swap (optional)…"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="flex-1 bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-primary placeholder:text-subtle/50 outline-none focus:border-brand-mint transition-colors font-sans"
                              />
                              <button
                                onClick={submitTradeReview}
                                disabled={reviewLoading}
                                className="px-4 py-1.5 bg-brand-mint text-canvas font-bold hover:brightness-110 rounded-xl active:scale-95 disabled:opacity-50 transition-all uppercase text-[9px] tracking-wider cursor-pointer shrink-0 font-mono"
                              >
                                {reviewLoading ? 'Submit…' : 'Submit Review'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CASE 4: Disputed */}
                    {escrowTx && escrowTx.status === 'disputed' && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-brand-amber/10 border border-brand-amber/30 flex items-center justify-center text-brand-amber shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-brand-amber font-bold uppercase text-[9px] tracking-wider">Swap dispute opened</p>
                          <p className="text-[10px] text-subtle mt-0.5 leading-relaxed">The swap verification is locked. A campus moderator is reviewing: &quot;{escrowTx.dispute_reason}&quot;</p>
                        </div>
                      </div>
                    )}

                    {/* CASE 5: Refunded */}
                    {escrowTx && escrowTx.status === 'refunded' && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-8 h-8 rounded-full bg-brand-indigo/10 border border-brand-indigo/30 flex items-center justify-center text-brand-indigo shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-6m0 0l-3 3m3-3l3 3M10 9v6m0 0l-3-3m3 3l3-3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-brand-indigo font-bold uppercase text-[9px] tracking-wider">Buyer refunded</p>
                          <p className="text-[10px] text-subtle mt-0.5 leading-relaxed">The moderator resolved the dispute and refunded the swap status.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center opacity-60">
                      <p className="text-sm text-muted">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSystem = msg.body.startsWith('System:')
                      if (isSystem) {
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center my-2"
                          >
                            <div className="bg-surface-low border border-border/60 text-muted px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider text-center max-w-[90%] shadow-inner">
                              {msg.body.replace('System: ', '')}
                              <span className="block text-[8px] text-subtle mt-0.5 font-normal">
                                {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </motion.div>
                        )
                      }

                      if (msg.offer_amount != null) {
                        const isPending = msg.offer_status === 'pending'
                        const isAccepted = msg.offer_status === 'accepted'
                        const isMe = msg.sender_id === currentUserId
                        const isReceiver = msg.recipient_id === currentUserId

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-2`}
                          >
                            <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-low overflow-hidden shadow-lg">
                              <div className="p-4 bg-surface-high border-b border-border/40 flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold text-brand-indigo uppercase tracking-wider flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Counter Offer
                                </span>
                                <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isPending ? 'bg-brand-amber/15 text-brand-amber' :
                                  isAccepted ? 'bg-brand-mint/15 text-brand-mint' :
                                  'bg-error/15 text-error'
                                }`}>
                                  {msg.offer_status}
                                </span>
                              </div>
                              <div className="p-4 space-y-3">
                                <div className="text-center py-2">
                                  <span className="text-2xl font-bold font-display text-primary">
                                    ₦{msg.offer_amount?.toLocaleString()}
                                  </span>
                                  <p className="text-[10px] text-subtle mt-1">
                                    {isMe ? 'You proposed this price' : `${activeThread.other_user_name} proposed this price`}
                                  </p>
                                </div>

                                {isPending && isReceiver && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDeclineOffer(msg)}
                                      disabled={actionLoading === `offer-${msg.id}`}
                                      className="flex-1 py-2 border border-error/30 hover:bg-error/10 text-error font-bold rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                    <button
                                      onClick={() => handleAcceptOffer(msg)}
                                      disabled={actionLoading === `offer-${msg.id}`}
                                      className="flex-1 py-2 bg-brand-mint hover:brightness-110 text-canvas font-bold rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="px-4 py-1.5 bg-surface border-t border-border/30 flex justify-between items-center text-[8px] font-mono text-subtle">
                                <span>{new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>{relativeTime(msg.created_at)}</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      }

                      const isMe = msg.sender_id === currentUserId
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 shadow-md ${
                              isMe
                                ? 'bg-brand-indigo text-white rounded-2xl rounded-br-sm shadow-[0_0_15px_rgba(91,77,255,0.15)]'
                                : 'bg-surface-high text-primary rounded-2xl rounded-bl-sm border border-border/40'
                            }`}
                          >
                            <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.body}</p>
                            <p className={`text-[9px] mt-1 text-right font-mono ${isMe ? 'text-white/60' : 'text-subtle'}`}>
                              {relativeTime(msg.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Safety tip */}
                <div className="mx-5 mb-2 px-3 py-2 rounded-xl bg-brand-amber/5 border border-brand-amber/15 text-[9px] text-subtle leading-relaxed flex items-center gap-1.5 font-mono uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-brand-amber shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Swap Safety: Meet in a Safe-Swap zone. Inspect items before OTP verification release.
                </div>

                {/* Offer Input Area */}
                {offerInputOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mx-5 mb-3 p-3 bg-surface-low border border-border/80 rounded-xl flex items-center gap-3 shadow-inner font-mono text-xs"
                  >
                    <span className="text-[10px] font-mono font-bold text-brand-indigo uppercase tracking-wider shrink-0">
                      Offer Price (₦):
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 5000"
                      value={offerValue}
                      onChange={(e) => setOfferValue(e.target.value.replace(/\D/g, ''))}
                      className="bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-primary font-bold font-mono focus:border-brand-indigo transition-colors outline-none flex-1"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setOfferInputOpen(false)}
                        className="px-3 py-1.5 border border-border hover:bg-surface-high text-subtle font-bold rounded-xl text-[9px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendCounterOffer}
                        disabled={!offerValue || offerLoading}
                        className="px-3 py-1.5 bg-brand-indigo hover:brightness-110 text-white font-bold rounded-xl text-[9px] font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {offerLoading ? 'Sending...' : 'Send Offer'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Input */}
                <div className="px-5 pb-5 flex gap-2">
                  {currentUserId !== listingDetails?.seller_id && !offerInputOpen && (
                    <button
                      onClick={() => setOfferInputOpen(true)}
                      className="px-3.5 rounded-xl border border-brand-indigo/30 bg-brand-indigo/5 text-brand-indigo hover:bg-brand-indigo/15 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                      title="Make a Counter Offer"
                    >
                      <svg className="w-4 h-4 text-brand-indigo" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Type a message…"
                    className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-subtle/60 input-glow focus:border-brand-indigo/60 outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-mint text-white font-semibold text-sm hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer font-mono uppercase tracking-wider"
                  >
                    {sendingMessage ? '…' : 'Send'}
                  </button>
                </div>
              </div>

              {/* Sidebar Map Panel */}
              {showMapInChat && (
                <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-border bg-surface-low p-4 overflow-y-auto scrollbar-none flex flex-col gap-4 shrink-0 absolute sm:relative inset-0 sm:inset-auto z-30 sm:z-auto">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-wider">Safe-Swap Locations</h4>
                    <button onClick={() => setShowMapInChat(false)} className="text-muted hover:text-primary">✕</button>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden bg-canvas p-1">
                    <SafeSwapMap />
                  </div>
                  <p className="text-[10px] text-subtle leading-relaxed font-mono">
                    Select a location marker on the map to inspect safety hours, security score, and lighting conditions. Agree on the meetup location with your counterparty.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dispute Reason Modal */}
      <AnimatePresence>
        {disputeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border w-full max-w-md p-6 rounded-xl space-y-4 shadow-2xl font-mono text-xs"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-bold text-brand-amber uppercase tracking-wider">Open Dispute Request</h3>
                <button onClick={() => setDisputeModalOpen(false)} className="text-muted hover:text-primary">✕</button>
              </div>
              <p className="text-subtle leading-relaxed">
                Provide details about why you are disputing this transaction. Lock custody status pending campus review.
              </p>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-subtle uppercase tracking-wider">Dispute Details</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g. Item condition does not match description, or seller did not show up..."
                  rows={4}
                  className="w-full bg-canvas border border-border rounded-xl px-3 py-2.5 text-xs text-primary placeholder:text-subtle/50 resize-none input-glow focus:border-brand-indigo/60 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDisputeModalOpen(false)}
                  className="flex-1 py-2 border border-border hover:bg-surface-high font-bold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisputeEscrow}
                  disabled={!disputeReason.trim() || actionLoading === 'dispute'}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 border-red-500 text-white font-bold rounded-xl uppercase tracking-wider text-[10px] disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading === 'dispute' ? 'Submitting...' : 'Confirm Dispute'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal Bypassed */}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex items-center justify-center h-[calc(100vh-220px)]">
        <div className="text-muted text-sm animate-pulse">Loading chat...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
