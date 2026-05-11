import type { NextConfig } from 'next'

// ── Security Headers ───────────────────────────────────────────────────────────
const securityHeaders = [
  // Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",

      // Next.js dev mode kadang butuh unsafe-inline
      "script-src 'self' 'unsafe-inline'",

      "style-src 'self' 'unsafe-inline'",

      // Allow API backend + Cloudflare speed test
      [
        "connect-src 'self'",
        process.env.NEXT_PUBLIC_API_URL ??
        'https://wifi-backend-978253671723.asia-southeast2.run.app',
        'https://speed.cloudflare.com',
        'https://aim.cloudflare.com',
      ].join(' '),

      // Allow images from GCS + data/blob preview
      "img-src 'self' https://storage.googleapis.com data: blob:",

      // Google Fonts
      "font-src 'self' https://fonts.gstatic.com",

      // Security hardening
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },

  // Anti Clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },

  // MIME sniffing protection
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },

  // Force HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },

  // Referrer policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },

  // Browser feature permissions
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
]

const nextConfig: NextConfig = {
  // Hide X-Powered-By header
  poweredByHeader: false,

  // Cloud Run standalone build
  output: 'standalone',

  // Apply security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // External image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/wifi-payments-cakrana/**',
      },
    ],
  },
}

export default nextConfig