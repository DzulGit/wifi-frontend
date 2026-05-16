'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Bell, CreditCard, UserPlus, Ticket, AlertTriangle,
  CheckCircle, RefreshCw, ClipboardList, Package,
  MapPin, XOctagon, Zap, Info, ChevronRight, BellOff
} from 'lucide-react'
import api from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────
interface AdminNotif {
  id: string
  title: string
  message: string
  category: 'FINANCE' | 'SUPPORT' | 'SYSTEM' | 'ACCOUNT' | 'BILLING'
  link: string | null
  isUrgent: boolean
  isRead: boolean
  metadata: Record<string, any>
  createdAt: string
}

interface GroupedNotifs {
  label: string
  items: AdminNotif[]
}

// ── Helpers ────────────────────────────────────────────────────
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} mnt lalu`
  if (h < 24) return `${h} jam lalu`
  return `${d} hari lalu`
}

const groupByDate = (notifs: AdminNotif[]): GroupedNotifs[] => {
  const groups: Record<string, AdminNotif[]> = {}
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  for (const n of notifs) {
    const d = new Date(n.createdAt)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Hari ini'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Kemarin'
    else label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })

    if (!groups[label]) groups[label] = []
    groups[label].push(n)
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

// ── Icon + color resolver berdasarkan category + title ─────────
const getNotifStyle = (notif: AdminNotif) => {
  const t = notif.title

  // SYSTEM — request user
  if (t.includes('Ganti Paket'))
    return { icon: Package, bg: 'bg-blue-100', color: 'text-blue-600', dot: 'bg-blue-500' }
  if (t.includes('Pindah Alamat'))
    return { icon: MapPin, bg: 'bg-emerald-100', color: 'text-emerald-600', dot: 'bg-emerald-500' }
  if (t.includes('Putus Berlangganan'))
    return { icon: XOctagon, bg: 'bg-red-100', color: 'text-red-600', dot: 'bg-red-500' }
  if (t.includes('Permintaan'))
    return { icon: ClipboardList, bg: 'bg-purple-100', color: 'text-purple-600', dot: 'bg-purple-500' }

  // FINANCE
  if (notif.category === 'FINANCE') {
    if (t.includes('Masuk') || t.includes('Pending'))
      return { icon: CreditCard, bg: 'bg-amber-100', color: 'text-amber-600', dot: 'bg-amber-500' }
    if (t.includes('Disetujui'))
      return { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600', dot: 'bg-green-500' }
    return { icon: CreditCard, bg: 'bg-blue-100', color: 'text-blue-600', dot: 'bg-blue-500' }
  }

  // SUPPORT (ticket)
  if (notif.category === 'SUPPORT')
    return { icon: Ticket, bg: 'bg-purple-100', color: 'text-purple-600', dot: 'bg-purple-500' }

  // BILLING
  if (notif.category === 'BILLING') {
    if (t.includes('Terlambat') || t.includes('Overdue'))
      return { icon: AlertTriangle, bg: 'bg-red-100', color: 'text-red-500', dot: 'bg-red-500' }
    return { icon: Zap, bg: 'bg-amber-100', color: 'text-amber-600', dot: 'bg-amber-500' }
  }

  // ACCOUNT
  if (notif.category === 'ACCOUNT')
    return { icon: UserPlus, bg: 'bg-green-100', color: 'text-green-600', dot: 'bg-green-500' }

  // default
  return { icon: Info, bg: 'bg-gray-100', color: 'text-gray-500', dot: 'bg-gray-400' }
}

// ── Resolve link yang benar ────────────────────────────────────
// Backend mengirim link dengan ID path. Kita pastikan route dynamic sudah terbentuk dengan benar.
// Struktur: /admin/(authenticated)/[resource]/[id]
const resolveLink = (notif: AdminNotif): string | null => {
  const raw = notif.link
  const meta = notif.metadata ?? {}

  // Kalau tidak ada link sama sekali
  if (!raw) {
    // Fallback berdasarkan category
    if (notif.category === 'FINANCE') return '/admin/pembayaran'
    if (notif.category === 'SUPPORT') return '/admin/tiket'
    if (notif.category === 'BILLING') return '/admin/tagihan'
    if (notif.category === 'ACCOUNT') return '/admin/pelanggan'
    if (notif.category === 'SYSTEM') return '/admin/permintaan'
    return null
  }

  // Match dynamic routes dengan ID:
  // Format: /admin/[resource]/[id] -> valid sekarang karena sudah dibuat [id] routes
  
  // Tiket — /admin/tiket/[id] sudah valid ✓
  if (raw.match(/^\/admin\/tiket\/[a-zA-Z0-9_-]+$/)) return raw

  // Pembayaran — /admin/pembayaran/[id] sudah valid ✓
  if (raw.match(/^\/admin\/pembayaran\/[a-zA-Z0-9_-]+$/)) return raw

  // Tagihan — /admin/tagihan/[id] sudah valid ✓
  if (raw.match(/^\/admin\/tagihan\/[a-zA-Z0-9_-]+$/)) return raw

  // Pelanggan — arahkan ke list (detail inline)
  if (raw.match(/^\/admin\/pelanggan\/.+/)) return '/admin/pelanggan'

  // Pendaftar — arahkan ke list (detail inline)
  if (raw.match(/^\/admin\/pendaftar\/.+/)) return '/admin/pendaftar'

  // Permintaan — arahkan ke halaman permintaan
  if (raw === '/admin/permintaan' || raw.includes('permintaan')) return '/admin/permintaan'

  // Link yang sudah valid (/admin/xxx tanpa ID path)
  if (raw.match(/^\/admin\/[a-z]+$/)) return raw

  // Fallback: kembalikan raw jika format tidak dikenal
  return raw || null
}

// ── Filter tabs ────────────────────────────────────────────────
type FilterTab = 'all' | 'unread' | 'FINANCE' | 'SUPPORT' | 'SYSTEM' | 'BILLING' | 'ACCOUNT'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'all', label: 'Semua' },
  { key: 'FINANCE', label: 'Keuangan' },
  { key: 'SUPPORT', label: 'Tiket' },
  { key: 'SYSTEM', label: 'Permintaan' },
  { key: 'BILLING', label: 'Tagihan' },
]

// ── Komponen Item Notifikasi ───────────────────────────────────
function NotifItem({
  notif,
  onClick,
}: {
  notif: AdminNotif
  onClick: (notif: AdminNotif) => void
}) {
  const style = getNotifStyle(notif)
  const Icon = style.icon
  const link = resolveLink(notif)

  return (
    <button
      onClick={() => onClick(notif)}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-all hover:bg-gray-50 group relative ${
        !notif.isRead ? 'bg-blue-50/40' : ''
      } ${!link ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
        <Icon className={`w-4 h-4 ${style.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {notif.title}
          </p>
          {notif.isUrgent && (
            <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
              URGENT
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</span>
          {link && (
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${style.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
              Buka <ChevronRight className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Main Sidebar Component ─────────────────────────────────────
interface NotificationSidebarProps {
  open: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export default function NotificationSidebar({ open, onClose, onUnreadChange }: NotificationSidebarProps) {
  const router = useRouter()
  const [notifs, setNotifs] = useState<AdminNotif[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('unread')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      // Ambil langsung dari AdminNotification table — data sudah clean + punya link
      const { data } = await api.get('/admin/notifications?limit=100')
      const items: AdminNotif[] = data.notifications ?? []

      // Sort terbaru dulu
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setNotifs(items)
      const unread = items.filter(n => !n.isRead).length
      onUnreadChange?.(unread)
    } catch (e) {
      console.warn('[NotificationSidebar] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [onUnreadChange])

  // Fetch saat sidebar dibuka
  useEffect(() => {
    if (open) fetchNotifs()
  }, [open, fetchNotifs])

  // Polling 30 detik
  useEffect(() => {
    fetchNotifs()
    intervalRef.current = setInterval(fetchNotifs, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchNotifs])

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/admin/notifications/${id}/read`)
      setNotifs(prev => {
        const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        onUnreadChange?.(updated.filter(n => !n.isRead).length)
        return updated
      })
    } catch { /* silent */ }
  }

  const markAllRead = async () => {
    try {
      await api.post('/admin/notifications/read/all')
      setNotifs(prev => {
        const updated = prev.map(n => ({ ...n, isRead: true }))
        onUnreadChange?.(0)
        return updated
      })
    } catch { /* silent */ }
  }

  const handleClick = async (notif: AdminNotif) => {
    // Mark as read dulu (fire and forget)
    if (!notif.isRead) markAsRead(notif.id)

    const link = resolveLink(notif)
    if (link) {
      onClose()
      router.push(link)
    }
  }

  // Filter displayed
  const displayed = notifs.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'all') return true
    return n.category === filter
  })

  const grouped = groupByDate(displayed)
  const unreadCount = notifs.filter(n => !n.isRead).length
  const urgentCount = notifs.filter(n => n.isUrgent && !n.isRead).length

  // Category counts untuk badge tabs
  const countByFilter = (f: FilterTab) => {
    if (f === 'unread') return unreadCount
    if (f === 'all') return notifs.length
    return notifs.filter(n => n.category === f && !n.isRead).length
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          open ? 'bg-black/30 backdrop-blur-[2px] pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="bg-[#1A1A1A] flex-shrink-0">
          {/* Top bar */}
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#F5A623]" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center px-1">
                    <span className="text-white text-[9px] font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-none">Notifikasi</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                  {urgentCount > 0 && ` · ${urgentCount} urgent`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={fetchNotifs}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  title="Tandai semua dibaca"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-white/60" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Urgent banner */}
          {urgentCount > 0 && (
            <div className="mx-5 mb-3 bg-red-500/15 border border-red-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-xs font-medium">
                {urgentCount} notifikasi urgent butuh perhatian segera
              </p>
            </div>
          )}

          {/* Filter tabs — horizontal scroll */}
          <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const count = countByFilter(tab.key)
              const isActive = filter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#F5A623] text-black'
                      : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      isActive ? 'bg-black/20 text-black' : 'bg-red-500 text-white'
                    }`}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifs.length === 0 ? (
            // Loading skeleton
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-gray-100 rounded-full w-2/3" />
                    <div className="h-3 bg-gray-100 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-4 pb-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="text-gray-600 font-semibold">
                  {filter === 'unread' ? 'Tidak ada notifikasi baru' : 'Tidak ada notifikasi'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {filter === 'unread'
                    ? 'Semua notifikasi sudah dibaca'
                    : 'Belum ada aktivitas di kategori ini'}
                </p>
              </div>
              {filter === 'unread' && notifs.length > 0 && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-sm text-[#F5A623] font-semibold hover:underline"
                >
                  Lihat semua notifikasi
                </button>
              )}
            </div>
          ) : (
            // Grouped list
            <div className="pb-4">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  {/* Date separator */}
                  <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-5 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-50">
                    {items.map(notif => (
                      <NotifItem key={notif.id} notif={notif} onClick={handleClick} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {notifs.length} notifikasi · diperbarui setiap 30 detik
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-semibold text-[#F5A623] hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}