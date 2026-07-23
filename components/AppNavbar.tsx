'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  {
    href: '/listings',
    label: 'Browse Ads',
    shortLabel: 'Browse',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: '/listings/new',
    label: 'Post an Ad',
    shortLabel: 'Sell',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Messages',
    shortLabel: 'Messages',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'My Account',
    shortLabel: 'Account',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function AppNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function getSession() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || null)
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .single()
        if (profile?.is_admin) {
          setIsAdmin(true)
        }
      }
    }
    getSession()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const profileInitials = userEmail 
    ? userEmail.slice(0, 2).toUpperCase() 
    : 'U'

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 glass border-r border-white/10 flex-col justify-between py-6 px-4 z-30 font-sans">
        <div className="space-y-8">
          {/* Logo segment */}
          <Link href="/listings" className="flex items-center gap-2 px-2">
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              Bata<span className="text-emerald-400">Market</span>
            </span>
          </Link>

          {/* Navigation link group */}
          <nav className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider px-3 mb-1">Menu</span>
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/listings' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'text-muted hover:text-white hover:bg-surface-high/60'
                  }`}
                >
                  <span className={isActive ? 'text-slate-950' : 'text-emerald-400'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              )
            })}

            {/* Admin Portal link if admin */}
            {isAdmin && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider px-3">Admin Portal</span>
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                    pathname.startsWith('/admin')
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold'
                      : 'text-muted hover:text-white hover:bg-surface-high/60'
                  }`}
                >
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  href="/reviewer"
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold transition-all duration-300 ${
                    pathname.startsWith('/reviewer')
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold'
                      : 'text-muted hover:text-white hover:bg-surface-high/60'
                  }`}
                >
                  <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                  </svg>
                  <span>Verify Submissions</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User profile block */}
        <div className="pt-4 border-t border-white/10">
          {userEmail && (
            <div className="flex items-center justify-between bg-surface-low/80 border border-white/10 p-3 rounded-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-[1.5px] shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-xs text-white">
                    {profileInitials}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary truncate max-w-[110px]">{userEmail.split('@')[0]}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Verified Student</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-full text-subtle hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR ─── */}
      <header className="md:hidden fixed top-0 left-0 w-full h-14 glass border-b border-white/10 z-40 px-4 flex items-center justify-between">
        <Link href="/listings" className="flex items-center gap-2">
          <span className="font-display font-extrabold text-base tracking-tight text-white">
            Bata<span className="text-emerald-400">Market</span>
          </span>
        </Link>

        {/* Mobile controls */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin" className="text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              Admin
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="p-1.5 text-xs text-muted hover:text-red-400"
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </header>
    </>
  )
}
