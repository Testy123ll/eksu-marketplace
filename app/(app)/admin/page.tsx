'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'

interface UserProfile {
  user_id: string
  account_type: 'student' | 'vendor'
  full_name: string | null
  business_name: string | null
  department: string | null
  level: number | null
  phone_number: string | null
  verification_status: string
  trust_score: number
  is_admin: boolean
  created_at: string
}

interface ListingItem {
  id: string
  seller_id: string
  type: 'product' | 'service' | 'accommodation'
  title: string
  price: number
  category: string
  status: 'active' | 'sold' | 'inactive' | 'pending'
  is_boosted: boolean
  created_at: string
  seller_name?: string
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'listings'>('users')
  const [userQuery, setUserQuery] = useState('')
  const [listingQuery, setListingQuery] = useState('')

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalVendors: 0,
    totalListings: 0,
    releasedTrades: 0,
    tradeVolume: 0,
  })

  const [users, setUsers] = useState<UserProfile[]>([])
  const [listings, setListings] = useState<ListingItem[]>([])

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

    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    if (data?.is_admin) {
      setIsAdmin(true)
      await loadAdminDashboardData()
    } else {
      setIsAdmin(false)
    }
    setLoading(false)
  }

  const loadAdminDashboardData = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('user_id, account_type')
    const { data: listingsData } = await supabase.from('listings').select('id, title, price, status, type, category, seller_id, is_boosted, created_at')
    const { data: escrowData } = await supabase.from('escrow_transactions').select('amount, status')

    const userCount = profilesData?.length || 0
    const studentCount = profilesData?.filter((p) => p.account_type === 'student').length || 0
    const vendorCount = profilesData?.filter((p) => p.account_type === 'vendor').length || 0
    const listingCount = listingsData?.length || 0

    const releasedEscrows = escrowData?.filter((e) => e.status === 'released') || []
    const releasedCount = releasedEscrows.length
    const totalVolume = releasedEscrows.reduce((sum, e) => sum + Number(e.amount), 0)

    setStats({
      totalUsers: userCount,
      totalStudents: studentCount,
      totalVendors: vendorCount,
      totalListings: listingCount,
      releasedTrades: releasedCount,
      tradeVolume: totalVolume,
    })

    const { data: allUsers } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    setUsers((allUsers as UserProfile[]) || [])

    if (listingsData) {
      const userMap: Record<string, string> = {}
      profilesData?.forEach((p: any) => {
        userMap[p.user_id] = p.full_name || p.business_name || 'Anonymous User'
      })

      const formattedListings = (listingsData as any[]).map((l) => ({
        id: l.id,
        seller_id: l.seller_id,
        type: l.type,
        title: l.title,
        price: Number(l.price),
        category: l.category,
        status: l.status,
        is_boosted: l.is_boosted,
        created_at: l.created_at,
        seller_name: userMap[l.seller_id] || 'Unknown Seller',
      }))
      setListings(formattedListings)
    }
  }

  const handleToggleAdmin = async (userId: string, currentAdminVal: boolean) => {
    setActionLoading(`admin:${userId}`)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentAdminVal })
        .eq('user_id', userId)

      if (error) throw error
      
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, is_admin: !currentAdminVal } : u))
      )
      alert(`Admin role updated successfully for this user.`)
    } catch (e: any) {
      alert(e.message || 'Failed to update admin role.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleVerifyDirect = async (userId: string, status: 'approved' | 'rejected') => {
    setActionLoading(`verify:${userId}`)
    try {
      const rpcName = status === 'approved' ? 'approve_profile' : 'reject_profile'
      const { error } = await supabase.rpc(rpcName, { target_user_id: userId })
      
      if (error) throw error

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, verification_status: status } : u))
      )
      alert(`User profile verification status updated to ${status}.`)
    } catch (e: any) {
      alert(e.message || 'Failed to verify profile.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing permanently?')) return
    setActionLoading(`delete_listing:${listingId}`)
    try {
      const { error } = await supabase.from('listings').delete().eq('id', listingId)
      if (error) throw error

      setListings((prev) => prev.filter((l) => l.id !== listingId))
      alert('Listing deleted successfully.')
    } catch (e: any) {
      alert(e.message || 'Failed to delete listing.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleBoostListing = async (listingId: string, currentBoost: boolean) => {
    setActionLoading(`boost:${listingId}`)
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_boosted: !currentBoost })
        .eq('id', listingId)

      if (error) throw error

      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, is_boosted: !currentBoost } : l))
      )
      alert(`Listing boost toggled successfully.`)
    } catch (e: any) {
      alert(e.message || 'Failed to toggle listing boost.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBecomeAdminDirect = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.rpc('make_me_admin')
      if (error) throw error
      setIsAdmin(true)
      await loadAdminDashboardData()
      alert('Successfully granted admin privilege to your local account.')
    } catch (e: any) {
      alert(e.message || 'Failed to claim admin status.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-subtle">Authenticating admin profile ledger...</span>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[500px]">
        <Card className="max-w-md p-8 text-center space-y-6 relative overflow-hidden border-red-500/20" style={{ background: 'rgba(239,68,68,0.02)' }}>
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-red-400">Access Denied</h2>
            <p className="text-xs text-subtle font-mono leading-relaxed">
              Your account lacks the root security certificates required to inspect the platform operations dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            {process.env.NODE_ENV === 'development' && (
              <Button variant="secondary" onClick={handleBecomeAdminDirect} className="text-xs font-mono">
                [DEBUG]: Claim Admin Role
              </Button>
            )}
            <Link href="/listings" className="text-xs font-mono text-brand-indigo hover:underline">
              ← Return to Campus Marketplace
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const filteredUsers = users.filter((u) => {
    const displayName = (u.full_name || u.business_name || '').toLowerCase()
    return displayName.includes(userQuery.toLowerCase()) || u.user_id.includes(userQuery)
  })

  const filteredListings = listings.filter((l) =>
    l.title.toLowerCase().includes(listingQuery.toLowerCase()) || l.id.includes(listingQuery)
  )

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-brand-indigo/10 blur-[150px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-mint/5 blur-[150px]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">
            Platform Operations <span className="gradient-brand-text">Console</span>
          </h1>
          <p className="text-xs text-subtle font-mono mt-1">
            Root supervisor status: <span className="text-brand-mint font-bold uppercase">Active</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reviewer">
            <Button variant="secondary" className="text-xs font-mono uppercase tracking-wider">
              Reviewer Portal
            </Button>
          </Link>
          <Link href="/listings">
            <Button variant="ghost" className="text-xs font-mono">
              ← Marketplace
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(91,77,255,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Total Users</span>
          <span className="text-2xl font-bold font-mono tracking-tight mt-1">{stats.totalUsers}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(91,77,255,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Students</span>
          <span className="text-2xl font-bold font-mono tracking-tight mt-1">{stats.totalStudents}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(91,77,255,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Vendors</span>
          <span className="text-2xl font-bold font-mono tracking-tight mt-1">{stats.totalVendors}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(91,77,255,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Active Listings</span>
          <span className="text-2xl font-bold font-mono tracking-tight mt-1">{stats.totalListings}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(0,229,155,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Verified Swaps</span>
          <span className="text-2xl font-bold font-mono tracking-tight mt-1">{stats.releasedTrades}</span>
        </Card>
        <Card className="p-4 flex flex-col justify-between" style={{ background: 'rgba(0,229,155,0.01)' }}>
          <span className="text-[10px] font-mono text-subtle uppercase tracking-wider">Total Volume</span>
          <span className="text-xl font-bold font-mono tracking-tight mt-1.5 truncate">₦{stats.tradeVolume.toLocaleString()}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 space-y-4 bg-surface-low/50">
            <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest border-b border-border/40 pb-2">
              Console Control Modules
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-mono text-xs transition-all flex items-center justify-between ${
                  activeTab === 'users'
                    ? 'bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo'
                    : 'bg-transparent hover:bg-surface-high border border-transparent text-muted'
                }`}
              >
                <span>👤 User Directory</span>
                <span className="text-[9px] bg-canvas px-1.5 py-0.5 rounded border border-border/30">
                  {users.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-mono text-xs transition-all flex items-center justify-between ${
                  activeTab === 'listings'
                    ? 'bg-brand-indigo/10 border border-brand-indigo/30 text-brand-indigo'
                    : 'bg-transparent hover:bg-surface-high border border-transparent text-muted'
                }`}
              >
                <span>📦 Listing Moderation</span>
                <span className="text-[9px] bg-canvas px-1.5 py-0.5 rounded border border-border/30">
                  {listings.length}
                </span>
              </button>
            </div>
            
            <div className="border-t border-border/40 pt-4 space-y-2">
              <h4 className="font-mono text-[9px] font-bold text-subtle uppercase tracking-widest">Local Debug Helpers</h4>
              <Button
                variant="secondary"
                onClick={handleBecomeAdminDirect}
                className="w-full text-[10px] font-mono py-2"
              >
                Reset My Admin Privilege
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-6 min-h-[400px] bg-surface-low/20">
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <motion.div
                  key="users-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold font-display">User Accounts Directory</h2>
                      <p className="text-[10px] text-subtle font-mono">Verify profiles, manage roles, and review security scores</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search user name or ID…"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-primary placeholder:text-subtle/50 outline-none w-full sm:w-60 focus:border-brand-indigo/60"
                    />
                  </div>

                  <div className="overflow-x-auto border border-border/40 rounded-xl bg-canvas/30">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 bg-surface-high/30 text-[10px] text-subtle uppercase tracking-wider">
                          <th className="p-3">User / Type</th>
                          <th className="p-3">Verification</th>
                          <th className="p-3">Reputation</th>
                          <th className="p-3">Admin</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-subtle">
                              No user records matching the filter settings found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const displayName = u.full_name || u.business_name || 'Anonymous User'
                            const isMe = u.user_id === currentUserId
                            return (
                              <tr key={u.user_id} className="border-b border-border/20 hover:bg-surface-high/10 transition-colors">
                                <td className="p-3 max-w-[200px] truncate">
                                  <div className="font-semibold text-primary">{displayName}</div>
                                  <div className="text-[9px] text-subtle truncate max-w-[180px]">{u.user_id}</div>
                                  <div className="text-[9px] mt-0.5 inline-block px-1.5 py-0.2 rounded bg-surface border border-border/40 text-muted uppercase">
                                    {u.account_type}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      u.verification_status === 'approved'
                                        ? 'bg-brand-mint/10 text-brand-mint border border-brand-mint/20'
                                        : u.verification_status === 'rejected'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                    }`}
                                  >
                                    {u.verification_status}
                                  </span>
                                </td>
                                <td className="p-3 font-semibold text-brand-indigo">
                                  {u.trust_score} pts
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      u.is_admin ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-transparent text-subtle'
                                    }`}
                                  >
                                    {u.is_admin ? 'ADMIN' : 'USER'}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  {u.verification_status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleVerifyDirect(u.user_id, 'approved')}
                                        disabled={!!actionLoading}
                                        className="px-2 py-1 rounded bg-brand-mint/20 hover:bg-brand-mint/30 text-brand-mint border border-brand-mint/30 text-[9px] uppercase font-bold"
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => handleVerifyDirect(u.user_id, 'rejected')}
                                        disabled={!!actionLoading}
                                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[9px] uppercase font-bold"
                                      >
                                        ✗ Reject
                                      </button>
                                    </>
                                  )}
                                  
                                  {!isMe && (
                                    <button
                                      onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                                      disabled={!!actionLoading}
                                      className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 text-[9px]"
                                    >
                                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="listings-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold font-display">Listing Moderation Panel</h2>
                      <p className="text-[10px] text-subtle font-mono">Deactivate listings, toggle catalog status, and feature listings</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Search listing title or ID…"
                      value={listingQuery}
                      onChange={(e) => setListingQuery(e.target.value)}
                      className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-primary placeholder:text-subtle/50 outline-none w-full sm:w-60 focus:border-brand-indigo/60"
                    />
                  </div>

                  <div className="overflow-x-auto border border-border/40 rounded-xl bg-canvas/30">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 bg-surface-high/30 text-[10px] text-subtle uppercase tracking-wider">
                          <th className="p-3">Listing Details</th>
                          <th className="p-3">Seller</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Moderation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredListings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-subtle">
                              No listings found matching filter parameters.
                            </td>
                          </tr>
                        ) : (
                          filteredListings.map((l) => (
                            <tr key={l.id} className="border-b border-border/20 hover:bg-surface-high/10 transition-colors">
                              <td className="p-3 max-w-[220px]">
                                <div className="font-semibold text-primary truncate">{l.title}</div>
                                <div className="text-[9px] text-subtle truncate">{l.id}</div>
                                <div className="text-brand-mint font-bold mt-0.5">₦{l.price.toLocaleString()}</div>
                              </td>
                              <td className="p-3 max-w-[150px] truncate">
                                <div className="font-semibold">{l.seller_name}</div>
                                <div className="text-[9px] text-subtle truncate">{l.seller_id}</div>
                              </td>
                              <td className="p-3 uppercase text-[10px] text-muted">
                                {l.type}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    l.status === 'active'
                                      ? 'bg-brand-mint/10 text-brand-mint border border-brand-mint/20'
                                      : l.status === 'sold'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-subtle/10 text-subtle border border-border/40'
                                  }`}
                                >
                                  {l.status}
                                </span>
                                {l.is_boosted && (
                                  <div className="text-[9px] text-brand-indigo font-bold mt-1 uppercase flex items-center gap-1">
                                    ★ Featured
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleBoostListing(l.id, l.is_boosted)}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 rounded bg-brand-indigo/20 hover:bg-brand-indigo/30 text-brand-indigo border border-brand-indigo/30 text-[9px]"
                                >
                                  {l.is_boosted ? 'Unfeature' : 'Feature Listing'}
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(l.id)}
                                  disabled={!!actionLoading}
                                  className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[9px]"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

      </div>
    </div>
  )
}
