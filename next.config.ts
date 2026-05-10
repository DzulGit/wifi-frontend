import type { NextConfig } from 'next'

// ── ZAP Findings Fix: Security Headers via next.config ────────────────────────
// Next.js menambahkan header ini pada setiap response HTTP dari server
const securityHeaders = [
  // ZAP Finding: Content Security Policy (CSP) Header Not Set
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js memerlukan 'unsafe-inline' dan 'unsafe-eval' untuk dev mode;
      // di production Turbopack menghasilkan inline scripts yang perlu nonce — untuk
      // simplisitas kita gunakan strict-dynamic dengan hash, atau izinkan self
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // Izinkan gambar dari GCS (bukti pembayaran) dan data URI (preview)
      "img-src 'self' https://storage.googleapis.com data: blob:",
      // Izinkan koneksi ke backend API
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL ?? 'https://wifi-backend-978253671723.asia-southeast2.run.app'}`,
      // Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // ZAP Finding: Missing Anti-clickjacking Header (CSP layer)
      "frame-ancestors 'none'",
    ].join('; '),
  },
  // ZAP Finding: Missing Anti-clickjacking Header (HTTP layer)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // ZAP Finding: X-Content-Type-Options Header Missing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // ZAP Finding: Strict-Transport-Security Header Not Set
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // ZAP Finding: Referrer-Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions Policy — batasi akses ke fitur browser yang tidak dipakai
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
]

const nextConfig: NextConfig = {
  // ZAP Finding: Server Leaks Information via "X-Powered-By"
  poweredByHeader: false,

  headers: async () => [
    {
      // Terapkan ke semua route
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],

  images: {
    remotePatterns: [
      {
        // Izinkan gambar dari Google Cloud Storage (bukti pembayaran)
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/wifi-payments-cakrana/**',
      },
    ],
  },
}

export default nextConfig
