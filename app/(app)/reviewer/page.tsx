'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { motion, AnimatePresence } from 'motion/react'

interface PendingProfile {
  user_id: string
  account_type: 'student' | 'vendor'
  full_name: string | null
  business_name: string | null
  department: string | null
  level: number | null
  phone_number: string | null
  business_address: string | null
  id_photo_url: string | null
  selfie_url: string | null
  verification_status: string
  trust_score: number
  created_at: string
  business_type?: string | null
  cac_photo_url?: string | null
  shopfront_photo_url?: string | null
  referral_vendor_code?: string | null
}

interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  listing_id: string | null
  reason: string
  status: 'open' | 'reviewed' | 'dismissed'
  created_at: string
  reporter_name?: string
  reported_name?: string
  listing_title?: string
}

interface DisputedEscrow {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: string
  dispute_reason: string | null
  created_at: string
  buyer_name: string
  seller_name: string
  listing_title: string
}

export default function ReviewerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Admin checking
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<'verifications' | 'reports' | 'disputes'>('verifications')

  // Lists
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [disputes, setDisputes] = useState<DisputedEscrow[]>([])

  useEffect(() => {
    checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAdmin = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUserId(user.id)

    // Query profiles to see if caller is admin
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setIsAdmin(!!data.is_admin)
      if (data.is_admin) {
        await loadData()
      }
    } else {
      setIsAdmin(false)
    }
    setLoading(false)
  }

  const loadData = async () => {
    // 1. Fetch pending profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .or('full_name.not.is.null,business_name.not.is.null')
      .order('created_at', { ascending: true })

    setPendingProfiles((profilesData as PendingProfile[]) || [])

    // 2. Fetch open reports
    const { data: reportsData } = await supabase
      .from('reports')
      .select(`
        id, reporter_id, reported_user_id, listing_id, reason, status, created_at,
        listings(title),
        reporter:profiles!reports_reporter_id_fkey(full_name, business_name),
        reported:profiles!reports_reported_user_id_fkey(full_name, business_name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: true })

    if (reportsData) {
      const formattedReports = (reportsData as any[]).map((r) => {
        const reporterName = r.reporter?.full_name || r.reporter?.business_name || 'Reporter'
        const reportedName = r.reported?.full_name || r.reported?.business_name || 'Reported Seller'
        return {
          id: r.id,
          reporter_id: r.reporter_id,
          reported_user_id: r.reported_user_id,
          listing_id: r.listing_id,
          reason: r.reason,
          status: r.status,
          created_at: r.created_at,
          reporter_name: reporterName,
          reported_name: reportedName,
          listing_title: r.listings?.title || 'Listing Removed',
        }
      })
      setReports(formattedReports)
    }

    // 3. Fetch disputed escrow transactions
    const { data: escrows, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*, listings(title)')
      .eq('status', 'disputed')
      .order('created_at', { ascending: true })

    if (!escrowError && escrows) {
      const userIds = Array.from(
        new Set(
          escrows.flatMap((e: any) => [e.buyer_id, e.seller_id]).filter(Boolean)
        )
      )

      let profileMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, business_name')
          .in('user_id', userIds)
        
        if (profiles) {
          profiles.forEach((p: any) => {
            profileMap[p.user_id] = p.full_name || p.business_name || 'Student'
          })
        }
      }

      const formatted = escrows.map((e: any) => ({
        ...e,
        buyer_name: profileMap[e.buyer_id] || 'Buyer',
        seller_name: profileMap[e.seller_id] || 'Seller',
        listing_title: e.listings?.title || 'Listing',
      }))

      setDisputes(formatted)
    }
  }

  const handleBecomeAdmin = async () => {
    if (!currentUserId) return
    setLoading(true)
    try {
      const { error } = await supabase.rpc('make_me_admin')
      if (error) throw error
      setIsAdmin(true)
      await loadData()
    } catch (e: any) {
      alert(e.message || 'Failed to grant admin access.')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    setActionLoading(`approve:${userId}`)
    try {
      const { error } = await supabase.rpc('approve_profile', { target_user_id: userId })
      if (error) throw error
      setPendingProfiles((prev) => prev.filter((p) => p.user_id !== userId))
    } catch (e: any) {
      alert(e.message || 'Failed to approve profile.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    setActionLoading(`reject:${userId}`)
    try {
      const { error } = await supabase.rpc('reject_profile', { target_user_id: userId })
      if (error) throw error
      setPendingProfiles((prev) => prev.filter((p) => p.user_id !== userId))
    } catch (e: any) {
      alert(e.message || 'Failed to reject profile.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismissReport = async (reportId: string) => {
    setActionLoading(`dismiss:${reportId}`)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId)

      if (error) throw error
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (e: any) {
      alert(e.message || 'Failed to dismiss report.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleTakeActionReport = async (reportId: string, reportedUserId: string, listingId: string | null) => {
    setActionLoading(`action:${reportId}`)
    try {
      // 1. Mark report as reviewed
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: 'reviewed' })
        .eq('id', reportId)
      if (reportError) throw reportError

      // 2. Penalize the reported seller trust score by inserting a negative trust event (-20)
      const { error: trustError } = await supabase
        .from('trust_events')
        .insert({
          user_id: reportedUserId,
          event_type: 'report_confirmed',
          weight: -20,
        })
      if (trustError) throw trustError

      // 3. Deactivate listing if present
      if (listingId) {
        const { error: listingError } = await supabase
          .from('listings')
          .update({ status: 'inactive' })
          .eq('id', listingId)
        if (listingError) throw listingError
      }

      setReports((prev) => prev.filter((r) => r.id !== reportId))
      alert('Action completed: Seller trust score penalized and listing deactivated.')
    } catch (e: any) {
      alert(e.message || 'Failed to process action.')
    } finally {
      setActionLoading(null)
    }
  }

  // --- Escrow Dispute Actions ---
  const handleResolveEscrowDispute = async (dispute: DisputedEscrow, resolution: 'release' | 'refund') => {
    setActionLoading(`resolve:${dispute.id}`)
    try {
      const targetStatus = resolution === 'release' ? 'released' : 'refunded'
      
      // 1. Update escrow transaction status
      const { error: escrowError } = await supabase
        .from('escrow_transactions')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispute.id)

      if (escrowError) throw escrowError

      // 2. Insert chat thread message notifications
      const sysBody = resolution === 'release'
        ? 'System: Campus moderator resolved dispute. Locked deposit released to seller.'
        : 'System: Campus moderator resolved dispute. Locked deposit refunded to buyer.'
      
      await supabase.from('messages').insert({
        sender_id: dispute.buyer_id, // Simulate inside buyer-seller message pool context
        recipient_id: dispute.seller_id,
        listing_id: dispute.listing_id,
        body: sysBody,
      })

      // 3. Apply side-effects (listing status updates + trust score events)
      if (resolution === 'release') {
        await Promise.all([
          supabase.from('listings').update({ status: 'sold' }).eq('id', dispute.listing_id),
          supabase.from('trust_events').insert({
            user_id: dispute.seller_id,
            event_type: 'escrow_completed',
            weight: 10,
          })
        ])
      } else {
        await Promise.all([
          supabase.from('listings').update({ status: 'active' }).eq('id', dispute.listing_id),
          supabase.from('trust_events').insert({
            user_id: dispute.seller_id,
            event_type: 'dispute_refunded',
            weight: -15,
          })
        ])
      }

      setDisputes((prev) => prev.filter((d) => d.id !== dispute.id))
      alert(`Dispute resolved successfully: funds ${targetStatus === 'released' ? 'released to seller' : 'refunded to buyer'}.`)
    } catch (e: any) {
      alert(e.message || 'Failed to resolve dispute.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin" />
          <span className="text-xs font-mono tracking-wider text-muted uppercase">STATUS: CHECKING_ADMIN_PRIVILEGES...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-grow flex items-center justify-center bg-canvas px-6 py-12">
        <div className="max-w-md w-full text-center">
          <Card className="p-8 space-y-6 border-brand-amber/30 bg-surface-lowest relative rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-amber" />
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-amber/10 flex items-center justify-center text-brand-amber shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-display font-black uppercase tracking-tight text-primary">Access Forbidden</h2>
            <p className="text-muted text-sm leading-relaxed">
              You are currently logged in with a non-moderator profile. To test the review panel, resolve listing reports, or disburse disputed escrows, activate dev-admin level.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-4">
                <Button variant="primary" className="w-full h-12 rounded-xl text-sm" onClick={handleBecomeAdmin}>
                  Become Admin (Dev Mode)
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-primary">Moderator Registry Console</h1>
          <p className="text-[10px] text-subtle uppercase mt-1">INTERNAL_CONTROL_NODE: {currentUserId?.slice(0, 18)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 font-bold rounded-sm border transition-all cursor-pointer uppercase text-[9px] tracking-wider ${
              activeTab === 'verifications'
                ? 'bg-brand-indigo text-white border-brand-indigo shadow-[0_0_15px_rgba(91,77,255,0.25)]'
                : 'bg-surface border-border text-muted hover:border-brand-indigo/40 hover:text-primary'
            }`}
          >
            Onboardings ({pendingProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-bold rounded-sm border transition-all cursor-pointer uppercase text-[9px] tracking-wider ${
              activeTab === 'reports'
                ? 'bg-brand-indigo text-white border-brand-indigo shadow-[0_0_15px_rgba(91,77,255,0.25)]'
                : 'bg-surface border-border text-muted hover:border-brand-indigo/40 hover:text-primary'
            }`}
          >
            Abuse Reports ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-4 py-2 font-bold rounded-sm border transition-all cursor-pointer uppercase text-[9px] tracking-wider ${
              activeTab === 'disputes'
                ? 'bg-brand-indigo text-white border-brand-indigo shadow-[0_0_15px_rgba(91,77,255,0.25)]'
                : 'bg-surface border-border text-muted hover:border-brand-indigo/40 hover:text-primary'
            }`}
          >
            Escrow Disputes ({disputes.length})
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <AnimatePresence mode="wait">
        {activeTab === 'verifications' ? (
          <motion.div
            key="verifications"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {pendingProfiles.length === 0 ? (
              <div className="border border-border bg-surface-low p-12 text-center text-subtle rounded-sm">
                <svg className="w-10 h-10 text-subtle/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H8.414a1 1 0 01-.707-.293L5.293 13.293A1 1 0 004.586 13H4" />
                </svg>
                <p className="font-bold uppercase tracking-wider text-primary">Verification Queue Empty</p>
                <p className="text-[10px] mt-1">No pending student or vendor profiles require review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pendingProfiles.map((p) => (
                  <div key={p.user_id} className="border border-border bg-surface-low p-6 rounded-sm flex flex-col gap-6 shadow-lg">
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-border/40 gap-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-primary">
                            {p.account_type === 'student' ? p.full_name : p.business_name}
                          </h3>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-sm border uppercase ${
                            p.account_type === 'student' ? 'bg-brand-indigo/15 text-brand-indigo border-brand-indigo/30' : 'bg-brand-mint/15 text-brand-mint border-brand-mint/30'
                          }`}>
                            {p.account_type}
                          </span>
                        </div>
                        <p className="text-[9px] text-subtle mt-0.5">SUBMISSION_TIME: {new Date(p.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 text-[9px] px-4 rounded-sm uppercase tracking-wider border-red-500/40 text-red-400 hover:bg-red-500/10"
                          loading={actionLoading === `reject:${p.user_id}`}
                          onClick={() => handleReject(p.user_id)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          className="h-9 text-[9px] px-4 rounded-sm uppercase tracking-wider bg-brand-mint hover:bg-brand-mint/90 text-canvas border-brand-mint"
                          loading={actionLoading === `approve:${p.user_id}`}
                          onClick={() => handleApprove(p.user_id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>

                    {/* Verification details body */}
                    {p.account_type === 'student' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Student metadata */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-[10px] font-bold text-subtle uppercase tracking-widest">Metadata Registry</h4>
                          <div className="grid grid-cols-2 gap-4 bg-canvas p-4 rounded-sm border border-border/60">
                            <div>
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Department</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary truncate">{p.department || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Level</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary">{p.level ? `${p.level}L` : '—'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Phone Connection</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary">{p.phone_number || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {/* ID and Selfie images */}
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-subtle uppercase tracking-wider">NIN Document Photo</p>
                            <div className="border border-border rounded-sm overflow-hidden bg-canvas h-44 flex items-center justify-center relative">
                              {p.id_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.id_photo_url} alt="NIN Document" className="w-full h-full object-contain cursor-zoom-in" onClick={() => window.open(p.id_photo_url!)} />
                              ) : (
                                <span className="text-[9px] text-subtle uppercase">NO_DOCUMENT_LOADED</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-subtle uppercase tracking-wider">Live Biometric Selfie</p>
                            <div className="border border-border rounded-sm overflow-hidden bg-canvas h-44 flex items-center justify-center relative">
                              {p.selfie_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.selfie_url} alt="Selfie" className="w-full h-full object-contain scale-x-[-1] cursor-zoom-in" onClick={() => window.open(p.selfie_url!)} />
                              ) : (
                                <span className="text-[9px] text-subtle uppercase">NO_SELFIE_LOADED</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Vendor details
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Vendor metadata */}
                        <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-[10px] font-bold text-subtle uppercase tracking-widest">Business Details</h4>
                          <div className="grid grid-cols-1 gap-4 bg-canvas p-4 rounded-sm border border-border/60">
                            <div>
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Business Type</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary capitalize">{p.business_type || 'Physical'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Phone Connection</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary">{p.phone_number || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Physical Address</p>
                              <p className="text-xs font-semibold mt-0.5 text-primary">{p.business_address || '—'}</p>
                            </div>
                            {p.referral_vendor_code && (
                              <div>
                                <p className="text-[8px] text-subtle font-bold uppercase tracking-wider">Referral Code</p>
                                <p className="text-xs font-mono font-bold mt-0.5 text-brand-mint">{p.referral_vendor_code}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Uploaded credentials */}
                        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-subtle uppercase tracking-wider">
                              {p.business_type === 'online' ? 'Inventory / Catalog Photo' : 'Shopfront / Stall Photo'}
                            </p>
                            <div className="border border-border rounded-sm overflow-hidden bg-canvas h-44 flex items-center justify-center relative">
                              {p.shopfront_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.shopfront_photo_url} alt="Shopfront / Stock" className="w-full h-full object-contain cursor-zoom-in" onClick={() => window.open(p.shopfront_photo_url!)} />
                              ) : (
                                <span className="text-[9px] text-subtle uppercase">NO_PHOTO_LOADED</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-bold text-subtle uppercase tracking-wider">CAC Registration Document</p>
                            <div className="border border-border rounded-sm overflow-hidden bg-canvas h-44 flex items-center justify-center relative">
                              {p.cac_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.cac_photo_url} alt="CAC Document" className="w-full h-full object-contain cursor-zoom-in" onClick={() => window.open(p.cac_photo_url!)} />
                              ) : (
                                <span className="text-[9px] text-subtle uppercase">NO_CAC_DOCUMENT</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'reports' ? (
          // Reports tab
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {reports.length === 0 ? (
              <div className="border border-border bg-surface-low p-12 text-center text-subtle rounded-sm">
                <svg className="w-10 h-10 text-subtle/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="font-bold uppercase tracking-wider text-primary">Abuse Logs Empty</p>
                <p className="text-[10px] mt-1">No marketplace user complaints or safety reports discovered.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {reports.map((r) => (
                  <div key={r.id} className="border border-border bg-surface-low p-6 rounded-sm flex flex-col gap-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[8px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-sm border border-red-500/30 uppercase">
                            REPORT_OPEN
                          </span>
                          <span className="text-[9px] text-subtle uppercase">
                            DATE: {new Date(r.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold leading-tight text-primary">
                          REPORTED_SELLER: <span className="text-brand-indigo">{r.reported_name}</span>
                        </h3>
                        <p className="text-[10px] text-subtle">
                          REPORTER_NODE: <span className="font-bold text-primary">{r.reporter_name}</span>
                        </p>
                        {r.listing_id && (
                          <p className="text-[10px] text-subtle">
                            LISTING_TITLE: <span className="font-bold text-primary underline truncate max-w-[220px] inline-block align-bottom">{r.listing_title}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 text-[9px] px-3 rounded-sm uppercase tracking-wider"
                          loading={actionLoading === `dismiss:${r.id}`}
                          onClick={() => handleDismissReport(r.id)}
                        >
                          Dismiss Report
                        </Button>
                        <Button
                          variant="primary"
                          className="h-9 text-[9px] px-3 rounded-sm uppercase tracking-wider bg-red-600 hover:bg-red-500 border-red-500 text-white"
                          loading={actionLoading === `action:${r.id}`}
                          onClick={() => handleTakeActionReport(r.id, r.reported_user_id, r.listing_id)}
                        >
                          Confirm & Penalize (-20 Trust)
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-canvas border border-border/60 rounded-sm text-subtle leading-relaxed">
                      <p className="font-bold text-[8px] uppercase text-brand-indigo tracking-wider mb-1">REASON_DECLARED:</p>
                      {r.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // Escrow Disputes tab
          <motion.div
            key="disputes"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {disputes.length === 0 ? (
              <div className="border border-border bg-surface-low p-12 text-center text-subtle rounded-sm">
                <svg className="w-10 h-10 text-subtle/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="font-bold uppercase tracking-wider text-primary">Dispute Ledger Clean</p>
                <p className="text-[10px] mt-1">No locked escrow transactions are currently disputed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {disputes.map((d) => (
                  <div key={d.id} className="border border-border bg-surface-low p-6 rounded-sm flex flex-col gap-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[8px] bg-brand-amber/15 text-brand-amber font-bold px-2 py-0.5 rounded-sm border border-brand-amber/30 uppercase">
                            ESCROW_DISPUTED
                          </span>
                          <span className="text-[9px] text-subtle uppercase">
                            LOCK_ID: {d.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-[9px] text-subtle uppercase">
                            DATE: {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold leading-tight text-primary uppercase">
                          Locked Amount: <span className="text-brand-mint">₦{d.amount.toLocaleString()}</span>
                        </h3>
                        <p className="text-[10px] text-subtle">
                          BUYER_NODE : <span className="font-bold text-primary">{d.buyer_name}</span>
                        </p>
                        <p className="text-[10px] text-subtle">
                          SELLER_NODE: <span className="font-bold text-primary">{d.seller_name}</span>
                        </p>
                        <p className="text-[10px] text-subtle">
                          SWAP_ITEM  : <span className="font-bold text-primary underline">{d.listing_title}</span>
                        </p>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          className="h-9 text-[9px] px-3 rounded-sm uppercase tracking-wider border-brand-indigo/60 text-brand-indigo hover:bg-brand-indigo/10"
                          loading={actionLoading === `resolve:${d.id}`}
                          onClick={() => handleResolveEscrowDispute(d, 'refund')}
                        >
                          Refund Buyer
                        </Button>
                        <Button
                          variant="primary"
                          className="h-9 text-[9px] px-3 rounded-sm uppercase tracking-wider bg-brand-mint hover:bg-brand-mint/90 text-canvas border-brand-mint"
                          loading={actionLoading === `resolve:${d.id}`}
                          onClick={() => handleResolveEscrowDispute(d, 'release')}
                        >
                          Release to Seller
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-canvas border border-border/60 rounded-sm text-subtle leading-relaxed">
                      <p className="font-bold text-[8px] uppercase text-brand-amber tracking-wider mb-1">BUYER_DISPUTE_STATEMENT:</p>
                      &quot;{d.dispute_reason || 'No statement provided.'}&quot;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
