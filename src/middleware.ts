import { NextRequest, NextResponse } from 'next/server'

// ── Next.js Middleware — Server-side Route Guard ─────────────────────────────
// SECURITY FIX (MED-6): Enforce authentication at middleware level for protected
// routes to prevent brief rendering of protected pages before client-side redirects.
//
// This middleware:
// 1. Checks for auth token in cookies (set during login)
// 2. Validates access to protected routes (/dashboard, /admin)
// 3. Redirects unauthenticated users to /login immediately
// 4. Sets cache-control headers for protected resources
//
// CATATAN: Token validation (JWT verification) happens at backend. This is a
// defense-in-depth layer preventing unauthorized access at the routing level.

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin']
const AUTH_COOKIE_NAME = 'authToken'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Extract auth token from cookie (set during login)
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Check if current path is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  )

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  // ZAP Finding: Re-examine Cache-control Directives
  // Halaman dashboard user & admin tidak boleh di-cache oleh browser/CDN
  if (isProtectedRoute) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path KECUALI:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - file gambar (svg, png, jpg, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
