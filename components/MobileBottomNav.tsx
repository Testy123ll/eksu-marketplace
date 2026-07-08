'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    href: '/listings',
    label: 'Browse',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: '/listings/new',
    label: 'Sell',
    icon: (_active: boolean) => (
      <div className="w-10 h-10 -mt-5 rounded-full bg-gradient-to-br from-brand-indigo to-brand-mint flex items-center justify-center shadow-[0_0_20px_rgba(91,77,255,0.5)] border-2 border-canvas">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
  },
  {
    href: '/chat',
    label: 'Chat',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/[0.06] px-2 pb-safe">
      <div className="flex items-end justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/listings'
              ? pathname === '/listings'
              : pathname.startsWith(item.href)

          if (item.href === '/listings/new') {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-end pb-2 gap-0.5 flex-1"
              >
                {item.icon(isActive)}
                <span className="text-[9px] font-semibold text-muted mt-1">Sell</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center pb-2 gap-1 flex-1 transition-colors duration-200 ${
                isActive ? 'text-brand-mint' : 'text-muted hover:text-primary'
              }`}
            >
              {item.icon(isActive)}
              <span className={`text-[9px] font-semibold tracking-wide ${isActive ? 'text-brand-mint' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-mint shadow-[0_0_4px_rgba(0,229,155,0.8)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
