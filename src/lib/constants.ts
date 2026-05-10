export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wifi-backend-978253671723.asia-southeast2.run.app'

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  ACTIVATE: '/activate',

  // User
  USER_DASHBOARD: '/dashboard',
  USER_TAGIHAN: '/tagihan',
  USER_PEMBAYARAN: '/pembayaran',
  USER_PAKET: '/paket',
  USER_TIKET: '/tiket',
  USER_PROFIL: '/profil',
  USER_NOTIFIKASI: '/notifikasi',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PELANGGAN: '/admin/pelanggan',
  ADMIN_PENDAFTAR: '/admin/pendaftar',
  ADMIN_PAKET: '/admin/paket',
  ADMIN_TAGIHAN: '/admin/tagihan',
  ADMIN_PEMBAYARAN: '/admin/pembayaran',
  ADMIN_TIKET: '/admin/tiket',
  ADMIN_LAPORAN: '/admin/laporan',
  ADMIN_PENGATURAN: '/admin/pengaturan',
} as const