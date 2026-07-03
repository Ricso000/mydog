import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse = NextResponse.next({ request })
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isPartnerPage = path.startsWith('/partner')
  const isAuthPage = path === '/partner/login' || path === '/partner/register'

  if (isPartnerPage && !isAuthPage && !user) {
    const redirectUrl = new URL('/partner/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/partner/:path*'],
}
