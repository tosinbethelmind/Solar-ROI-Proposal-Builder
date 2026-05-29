import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Retrieve user session dynamically (safe call)
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAdminRoute = path.startsWith('/admin') || path.startsWith('/api/admin')
  const isProtected =
    path.startsWith('/workspace') ||
    path.startsWith('/proposals') ||
    path.startsWith('/settings') ||
    path.startsWith('/pricing') ||
    path.startsWith('/history') ||
    (path.startsWith('/api/') && !path.startsWith('/api/auth/'))

  // 1. Guard for all protected routes (must be logged in)
  if ((isProtected || isAdminRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (isAdminRoute) {
      url.searchParams.set('error', 'unauthorized')
    } else {
      url.searchParams.set('next', request.nextUrl.pathname)
    }
    return NextResponse.redirect(url)
  }

  // 2. Extra checks if the user is authenticated
  if (user) {
    // Check if the user is suspended or deactivated (active = false)
    if (isProtected || isAdminRoute) {
      try {
        const { data: member } = await supabase
          .from('company_members')
          .select('active, company:companies(suspended)')
          .eq('user_id', user.id)
          .single()

        if (member) {
          const isSuspended = (member.company as any)?.suspended === true
          const isDeactivated = member.active === false

          if (isSuspended || isDeactivated) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            url.searchParams.set('error', isSuspended ? 'suspended' : 'deactivated')
            const redirectResponse = NextResponse.redirect(url)
            redirectResponse.cookies.delete('sb-access-token')
            redirectResponse.cookies.delete('sb-refresh-token')
            return redirectResponse
          }
        }
      } catch (err) {
        console.error('Middleware database check exception:', err)
      }
    }

    // 3. Super Admin Gate Check for /admin or /api/admin
    if (isAdminRoute) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@solarpro.com'
      let isSuperAdmin = user.email === adminEmail

      if (!isSuperAdmin) {
        try {
          const { data: adminCheck } = await supabase
            .from('platform_admins')
            .select('is_superadmin')
            .eq('user_id', user.id)
            .single()

          if (adminCheck?.is_superadmin) {
            isSuperAdmin = true
          }
        } catch (err) {
          console.error('Admin middleware query error:', err)
        }
      }

      if (!isSuperAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
