'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  {
    href: '/listings',
    label: 'Browse Catalog',
    shortLabel: 'Browse',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: '/listings/new',
    label: 'Create Listing',
    shortLabel: 'Publish',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Chat Messages',
    shortLabel: 'Chat',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Console Profile',
    shortLabel: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-surface-low border-r border-border flex-col justify-between py-6 px-4 z-30 font-mono text-xs">
        <div className="space-y-8">
          {/* Logo segment */}
          <Link href="/listings" className="flex items-center gap-2 px-2">
            <span className="font-display font-black text-lg uppercase tracking-tight gradient-brand-text">
              BataMarket
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-mint shadow-[0_0_8px_rgba(0,229,155,0.8)] animate-pulse" />
          </Link>

          {/* Navigation link group */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-[8px] font-bold text-subtle tracking-widest px-2 mb-1">NAVIGATION_LINKS</span>
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/listings' && pathname.startsWith(link.href))

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm border transition-all duration-200 uppercase text-[10px] font-bold tracking-wider ${
                    isActive
                      ? 'bg-brand-indigo/10 border-brand-indigo/50 text-white shadow-[0_0_15px_rgba(91,77,255,0.08)]'
                      : 'border-transparent text-muted hover:border-border/60 hover:bg-surface-high/50 hover:text-primary'
                  }`}
                >
                  <span className={isActive ? 'text-brand-indigo' : 'text-subtle'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </Link>
              )
            })}

            {/* Moderator dashboard links if admin */}
            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm border transition-all duration-200 uppercase text-[10px] font-bold tracking-wider ${
                    pathname.startsWith('/admin')
                      ? 'bg-brand-indigo/10 border-brand-indigo/50 text-white shadow-[0_0_15px_rgba(91,77,255,0.08)]'
                      : 'border-transparent text-muted hover:border-border/60 hover:bg-surface-high/50 hover:text-primary'
                  }`}
                >
                  <svg className="w-4 h-4 text-brand-indigo shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Operations Console</span>
                </Link>
                <Link
                  href="/reviewer"
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm border transition-all duration-200 uppercase text-[10px] font-bold tracking-wider ${
                    pathname.startsWith('/reviewer')
                      ? 'bg-brand-amber/10 border-brand-amber/50 text-white shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                      : 'border-transparent text-muted hover:border-border/60 hover:bg-surface-high/50 hover:text-primary'
                  }`}
                >
                  <svg className="w-4 h-4 text-brand-amber shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Reviewer Admin</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Bottom profile / status segment */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          {/* Connection status display */}
          <div className="bg-canvas border border-border/60 p-3 rounded-sm text-[8px] text-subtle space-y-1 select-none">
            <div className="flex justify-between">
              <span>NET_STATUS:</span>
              <span className="text-brand-mint font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span>AUTH_MODE:</span>
              <span className="text-brand-indigo font-bold">SECURE_RLS</span>
            </div>
          </div>

          {/* User profile block */}
          {userEmail && (
            <div className="flex items-center justify-between bg-surface border border-border/60 p-2.5 rounded-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-sm bg-gradient-to-br from-brand-indigo to-brand-mint p-[1px] shrink-0">
                  <div className="w-full h-full bg-surface-low rounded-sm flex items-center justify-center font-display font-black text-[9px] text-white">
                    {profileInitials}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-primary truncate max-w-[120px]">{userEmail.split('@')[0]}</p>
                  <p className="text-[8px] text-subtle uppercase">Logged In</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1 rounded-sm text-subtle hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                title="Disconnect Session"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MOBILE TOP BAR COLLAPSE ─── */}
      <header className="md:hidden fixed top-0 left-0 w-full h-14 bg-canvas/80 backdrop-blur-md border-b border-border z-40 px-4 flex items-center justify-between">
        <Link href="/listings" className="flex items-center gap-1.5">
          <span className="font-display font-black text-base uppercase tracking-tight gradient-brand-text">
            BataMarket
          </span>
          <span className="h-1 w-1 rounded-full bg-brand-mint animate-pulse" />
        </Link>

        {/* Right side quick tools */}
        <div className="flex items-center gap-2">
          {/* Quick moderator portal links if admin */}
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className={`p-1.5 rounded-sm border ${
                  pathname.startsWith('/admin')
                    ? 'border-brand-indigo/40 bg-brand-indigo/15 text-brand-indigo'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
                title="Operations Console"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <Link
                href="/reviewer"
                className={`p-1.5 rounded-sm border ${
                  pathname.startsWith('/reviewer')
                    ? 'border-brand-amber/40 bg-brand-amber/15 text-brand-amber'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
                title="Reviewer Admin"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-sm border border-transparent text-muted hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
            title="Disconnect"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>
    </>
  )
}
