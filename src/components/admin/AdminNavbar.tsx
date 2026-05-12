'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell, Settings, HelpCircle, X, CreditCard, UserPlus,
  Ticket, AlertTriangle, RefreshCw, CheckCircle, MessageSquare
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

interface NotificationItem {
  id: string
  type: 'PAYMENT' | 'REGISTRATION' | 'TICKET' | 'TICKET_REPLY' | 'INVOICE'
  title: string
  message: string
  link: string
  createdAt: string
  isUrgent: boolean
}

const TYPE_CONFIG = {
  PAYMENT:      { icon: CreditCard,     color: 'text-blue-500',   bg: 'bg-blue-50',    label: 'Pembayaran'   },
  REGISTRATION: { icon: UserPlus,       color: 'text-green-500',  bg: 'bg-green-50',   label: 'Pendaftaran'  },
  TICKET:       { icon: Ticket,         color: 'text-purple-500', bg: 'bg-purple-50',  label: 'Tiket'        },
  TICKET_REPLY: { icon: MessageSquare,  color: 'text-indigo-500', bg: 'bg-indigo-50',  label: 'Balasan'      },
  INVOICE:      { icon: AlertTriangle,  color: 'text-red-500',    bg: 'bg-red-50',     label: 'Tagihan'      },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  if (h < 24) return `${h} jam lalu`
  return `${d} hari lalu`
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hari ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
}

// ── Notification Sidebar ───────────────────────────────────────
function NotificationSidebar({
  open, onClose, notifications, loading, onRefresh, totalUnread
}: {
  open: boolean
  onClose: () => void
  notifications: NotificationItem[]
  loading: boolean
  onRefresh: () => void
  totalUnread: number
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    return new Set(JSON.parse(localStorage.getItem('cakrana_notif_read') ?? '[]'))
  })

  const markRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('cakrana_notif_read', JSON.stringify([...next]))
      return next
    })
  }

  const markAllRead = () => {
    const all = new Set(notifications.map(n => n.id))
    setReadIds(all)
    localStorage.setItem('cakrana_notif_read', JSON.stringify([...all]))
  }

  const handleClick = (notif: NotificationItem) => {
    markRead(notif.id)
    onClose()
    router.push(notif.link)
  }

  const displayed = filter === 'unread'
    ? notifications.filter(n => !readIds.has(n.id))
    : notifications

  const localUnread = notifications.filter(n => !readIds.has(n.id)).length

  // Group by date
  const groups: { label: string; items: NotificationItem[] }[] = []
  for (const notif of displayed) {
    const lbl = dateLabel(notif.createdAt)
    const g = groups.find(x => x.label === lbl)
    if (g) g.items.push(notif)
    else groups.push({ label: lbl, items: [notif] })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header ── */}
        <div className="bg-[#1A1A1A] px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-none">Notifikasi</h2>
                <p className="text-white/40 text-xs mt-0.5">
                  {localUnread > 0 ? `${localUnread} belum dibaca` : 'Semua sudah dibaca'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefresh}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[#F5A623] text-black'
                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                }`}
              >
                {f === 'all' ? 'Semua' : 'Belum Dibaca'}
                {f === 'unread' && localUnread > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {localUnread}
                  </span>
                )}
              </button>
            ))}
            {localUnread > 0 && (
              <button
                onClick={markAllRead}
                className="ml-auto text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Memuat notifikasi...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-semibold">
                {filter === 'unread' ? 'Semua sudah dibaca!' : 'Tidak ada notifikasi'}
              </p>
              <p className="text-gray-400 text-xs">
                {filter === 'unread'
                  ? 'Tidak ada notifikasi baru saat ini'
                  : 'Notifikasi baru akan muncul di sini'}
              </p>
            </div>
          ) : (
            <div className="pb-6">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  {/* Date separator */}
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-5 py-2 border-b border-gray-100 z-10">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>

                  {items.map(notif => {
                    const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.TICKET
                    const Icon = cfg.icon
                    const isRead = readIds.has(notif.id)
                    return (
                      <button
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        className={`w-full text-left flex gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          !isRead ? 'bg-blue-50/20' : ''
                        } ${notif.isUrgent && !isRead ? 'bg-red-50/20' : ''}`}
                      >
                        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-sm leading-tight ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                              {notif.title}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {notif.isUrgent && !isRead && (
                                <span className="text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                                  Urgent
                                </span>
                              )}
                              {!isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-0.5" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0 text-center">
          <p className="text-[11px] text-gray-400">
            Auto-refresh tiap 30 detik · {notifications.length} notifikasi
          </p>
        </div>
      </div>
    </>
  )
}

// ── Main Navbar ────────────────────────────────────────────────
export default function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  const { admin } = useAuthStore()
  const router = useRouter()
  const [time, setTime] = useState('')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loadingNotif, setLoadingNotif] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  // Clock
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Build notifikasi dari endpoint yang ada ─────────────────
  const buildNotifications = useCallback(async (): Promise<NotificationItem[]> => {
    const [paymentsRes, regsRes, ticketsRes] = await Promise.allSettled([
      api.get('/payments?status=PENDING&limit=20&page=1'),
      api.get('/registrations?status=PENDING&limit=20&page=1'),
      api.get('/tickets?limit=30&page=1'),
    ])

    const items: NotificationItem[] = []

    // Pembayaran pending
    if (paymentsRes.status === 'fulfilled') {
      const payments = paymentsRes.value.data?.data ?? []
      for (const p of payments) {
        const amount = new Intl.NumberFormat('id-ID', {
          style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(p.amount)
        items.push({
          id: `pay-${p.id}`,
          type: 'PAYMENT',
          title: 'Pembayaran Menunggu Validasi',
          message: `${p.user?.fullName ?? 'Pelanggan'} mengirim bukti ${amount}`,
          link: '/admin/pembayaran',
          createdAt: p.createdAt,
          isUrgent: false,
        })
      }
    }

    // Registrasi pending
    if (regsRes.status === 'fulfilled') {
      const regs = regsRes.value.data?.data ?? []
      for (const r of regs) {
        items.push({
          id: `reg-${r.id}`,
          type: 'REGISTRATION',
          title: 'Pendaftaran Baru',
          message: `${r.fullName} mendaftar dari ${r.city ?? r.address}`,
          link: '/admin/pendaftar',
          createdAt: r.createdAt,
          isUrgent: false,
        })
      }
    }

    // Tiket baru + reply dari user
    if (ticketsRes.status === 'fulfilled') {
      const tickets = ticketsRes.value.data?.data ?? []
      for (const t of tickets) {
        const replies: any[] = t.replies ?? []
        const lastReply = replies[replies.length - 1]
        const hasAdminReply = replies.some((r: any) => r.isFromAdmin)

        // Tiket OPEN yang belum disentuh admin
        if (t.status === 'OPEN' && !hasAdminReply) {
          items.push({
            id: `ticket-new-${t.id}`,
            type: 'TICKET',
            title: 'Tiket Baru Masuk',
            message: `${t.user?.fullName ?? 'Pelanggan'}: "${t.title}"`,
            link: '/admin/tiket',
            createdAt: t.createdAt,
            isUrgent: t.priority === 'CRITICAL' || t.priority === 'HIGH',
          })
        }

        // Reply terbaru dari user dalam 24 jam
        if (lastReply && !lastReply.isFromAdmin) {
          const age = Date.now() - new Date(lastReply.createdAt).getTime()
          if (age < 86400000) {
            items.push({
              id: `ticket-reply-${t.id}-${lastReply.id}`,
              type: 'TICKET_REPLY',
              title: 'Balasan dari Pelanggan',
              message: `${t.user?.fullName ?? 'Pelanggan'} membalas tiket #${t.ticketNumber}`,
              link: '/admin/tiket',
              createdAt: lastReply.createdAt,
              isUrgent: t.priority === 'CRITICAL',
            })
          }
        }
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return items
  }, [])

  // Fetch full notif
  const fetchNotifications = useCallback(async () => {
    setLoadingNotif(true)
    try {
      const items = await buildNotifications()
      setNotifications(items)
      setTotalUnread(items.length)
    } catch {}
    finally { setLoadingNotif(false) }
  }, [buildNotifications])

  // Polling badge count (ringan) tiap 30 detik
  const fetchSummary = useCallback(async () => {
    try {
      const [pr, rr, tr] = await Promise.allSettled([
        api.get('/payments?status=PENDING&limit=1&page=1'),
        api.get('/registrations?status=PENDING&limit=1&page=1'),
        api.get('/tickets?status=OPEN&limit=1&page=1'),
      ])
      let count = 0
      if (pr.status === 'fulfilled') count += pr.value.data?.meta?.total ?? 0
      if (rr.status === 'fulfilled') count += rr.value.data?.meta?.total ?? 0
      if (tr.status === 'fulfilled') count += tr.value.data?.meta?.total ?? 0
      setTotalUnread(count)
    } catch {}
  }, [])

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 30000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  const handleBellClick = () => {
    if (!sidebarOpen) fetchNotifications()
    setSidebarOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div>
            <h1 className="text-gray-900 font-bold text-lg leading-none">{title}</h1>
            {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-mono hidden md:block">{time}</span>

            {/* Bell → opens sidebar */}
            <button
              onClick={handleBellClick}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative"
            >
              <Bell className="w-4 h-4 text-gray-500" />
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center px-1">
                  <span className="text-white text-[10px] font-bold leading-none">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => router.push('/admin/pengaturan')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>

            {/* Help */}
            <button
              onClick={() => setShowHelp(true)}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Bantuan"
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center ml-1">
              <span className="text-black font-bold text-sm">
                {admin?.fullName?.charAt(0) ?? 'A'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Sidebar */}
      <NotificationSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        notifications={notifications}
        loading={loadingNotif}
        onRefresh={fetchNotifications}
        totalUnread={totalUnread}
      />

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Pusat Bantuan</h2>
              <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: '📖 Dokumentasi', desc: 'Panduan penggunaan admin panel', action: () => {} },
                { label: '💬 Chat WhatsApp', desc: 'Hubungi tim support langsung', action: () => window.open('https://wa.me/628xxxxxxxxx', '_blank') },
                { label: '📧 Email Support', desc: 'support@cakrana.id', action: () => window.open('mailto:support@cakrana.id') },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
