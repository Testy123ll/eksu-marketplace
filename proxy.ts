import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  let user = null

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

    const supabase = createServerClient(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()
    user = data?.user || null

    if (user) {
      // If logged in, prevent accessing login/register pages
      if (pathname === '/login' || pathname === '/register') {
        return NextResponse.redirect(new URL('/verify', request.url))
      }

      // Protect core marketplace routes from unverified/pending users
      const isCoreRoute =
        pathname.startsWith('/listings') ||
        pathname.startsWith('/services') ||
        pathname.startsWith('/accommodation') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/reviewer')

      if (isCoreRoute) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('user_id', user.id)
          .single()

        if (!profile || profile.verification_status !== 'approved') {
          // Force redirect to onboarding verify screen
          return NextResponse.redirect(new URL('/verify', request.url))
        }
      }
    } else {
      // If not logged in, block access to all app routes
      const isAppRoute =
        pathname.startsWith('/verify') ||
        pathname.startsWith('/listings') ||
        pathname.startsWith('/services') ||
        pathname.startsWith('/accommodation') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/reviewer')

      if (isAppRoute) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  } catch (error) {
    console.warn('Supabase authentication check failed in proxy:', error)
    
    // Fallback: If not logged in or DB offline, block access to all app routes
    const isAppRoute =
      pathname.startsWith('/verify') ||
      pathname.startsWith('/listings') ||
      pathname.startsWith('/services') ||
      pathname.startsWith('/accommodation') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/reviewer')

    if (isAppRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any image or asset files (svg, png, jpg, webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
