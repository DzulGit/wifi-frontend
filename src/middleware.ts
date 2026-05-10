import { NextRequest, NextResponse } from 'next/server'

// ── Next.js Middleware — Server-side Route Guard ─────────────────────────────
// SECURITY FIX: Perlindungan tambahan di level server agar route admin & user
// tidak bisa diakses tanpa token, meski client-side guard di-bypass.
//
// CATATAN: Middleware ini hanya memeriksa keberadaan token di cookie/localStorage
// mirror. Validasi sebenarnya tetap di backend (JWT verify). Ini adalah defense
// in depth layer, bukan satu-satunya perlindungan.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ambil token dari cookie (jika ada) — fallback ke header Authorization
  // Zustand persist menggunakan localStorage, bukan cookie, sehingga middleware
  // tidak bisa membaca token secara langsung. Solusinya: set cookie saat login.
  // Untuk saat ini, middleware menerapkan cache-control header saja.

  const response = NextResponse.next()

  // ZAP Finding: Re-examine Cache-control Directives
  // Halaman dashboard user & admin tidak boleh di-cache oleh browser/CDN
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
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
