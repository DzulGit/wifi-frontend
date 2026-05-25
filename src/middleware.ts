import { NextRequest, NextResponse } from 'next/server'

// ── Next.js Middleware — Server-side Route Guard ─────────────────────────────
// SECURITY FIX (MED-6): Enforce authentication at middleware level for protected
// routes to prevent brief rendering of protected pages before client-side redirects.

const AUTH_COOKIE_NAME = 'authToken'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ambil token dari cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // 1. PENGECUALIAN (Bypass) buat halaman login
  // Biar orang tetep bisa buka form login tanpa ditendang balik
  if (pathname === '/login' || pathname === '/admin/login') {
    // Opsional: Kalau udah login malah buka /login lagi, bisa lu tendang ke dashboard.
    // Tapi sementara kita biarin lewat aja biar aman.
    return NextResponse.next()
  }

  // 2. PROTEKSI AREA ADMIN
  // Kalau URL depannya /admin (tapi bukan /admin/login) dan ga ada token -> tendang ke /admin/login
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // 3. PROTEKSI AREA USER
  // Kalau URL depannya /dashboard dan ga ada token -> tendang ke /login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  // 4. SETTING CACHE HEADER (Biar gak disimpen di riwayat browser)
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
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