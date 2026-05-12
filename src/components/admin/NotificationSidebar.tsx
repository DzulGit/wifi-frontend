'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Bell, MessageSquare, CreditCard, UserPlus, AlertTriangle, CheckCircle, RefreshCw, Ticket } from 'lucide-react'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────
interface NotifItem {
  id: string
  type: 'ticket_new' | 'ticket_reply' | 'payment_pending' | 'registration_pending' | 'system'
  title: string
  message: string
  time: string        // ISO string
  isRead: boolean
  link?: string       // route to navigate
  meta?: Record<string, any>
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function NotifIcon({ type }: { type: NotifItem['type'] }) {
  const map = {
    ticket_new:            { icon: Ticket,       bg: 'bg-purple-100', color: 'text-purple-600' },
    ticket_reply:          { icon: MessageSquare, bg: 'bg-blue-100',   color: 'text-blue-600'   },
    payment_pending:       { icon: CreditCard,    bg: 'bg-[#F5A623]/15', color: 'text-[#F5A623]' },
    registration_pending:  { icon: UserPlus,      bg: 'bg-green-100',  color: 'text-green-600'  },
    system:                { icon: Bell,          bg: 'bg-gray-100',   color: 'text-gray-500'   },
  }
  const { icon: Icon, bg, color } = map[type] ?? map.system
  return (
    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  )
}

// ── Sidebar Component ──────────────────────────────────────────
interface NotificationSidebarProps {
  open: boolean
  onClose: () => void
  onUnreadChange?: (count: number) => void
}

export default function NotificationSidebar({ open, onClose, onUnreadChange }: NotificationSidebarProps) {
  const router = useRouter()
  const [notifs, setNotifs]       = useState<NotifItem[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<'all' | 'unread'>('all')
  const intervalRef               = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch: build notif list from multiple endpoints ────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const [ticketsRes, paymentsRes, regsRes] = await Promise.allSettled([
        api.get('/tickets?limit=50&page=1'),
        api.get('/payments?status=PENDING&limit=50&page=1'),
        api.get('/registrations?status=PENDING&limit=50&page=1'),
      ])

      const items: NotifItem[] = []

      // ── Tiket baru (OPEN) ──────────────────────────────────
      if (ticketsRes.status === 'fulfilled') {
        const tickets = ticketsRes.value.data?.data ?? ticketsRes.value.data ?? []
        for (const t of tickets) {
          // Tiket baru yang belum ada balasan admin
          const hasAdminReply = t.replies?.some((r: any) => r.isFromAdmin) ?? false
          if (t.status === 'OPEN' && !hasAdminReply) {
            items.push({
              id: `ticket-new-${t.id}`,
              type: 'ticket_new',
              title: 'Tiket Baru Masuk',
              message: `${t.user?.fullName ?? 'Pelanggan'}: "${t.title}"`,
              time: t.createdAt,
              isRead: false,
              link: '/admin/tiket',
              meta: { ticketId: t.id, priority: t.priority },
            })
          }

          // Reply dari user (isFromAdmin = false & reply terbaru bukan dari admin)
          if (t.replies && t.replies.length > 0) {
            const lastReply = t.replies[t.replies.length - 1]
            if (!lastReply.isFromAdmin) {
              // Tiket yang ada reply user terbaru
              const replyAge = Date.now() - new Date(lastReply.createdAt).getTime()
              if (replyAge < 24 * 60 * 60 * 1000) { // dalam 24 jam
                items.push({
                  id: `ticket-reply-${t.id}-${lastReply.id}`,
                  type: 'ticket_reply',
                  title: 'Balasan Tiket dari Pelanggan',
                  message: `${t.user?.fullName ?? 'Pelanggan'} membalas tiket #${t.ticketNumber}`,
                  time: lastReply.createdAt,
                  isRead: false,
                  link: '/admin/tiket',
                  meta: { ticketId: t.id },
                })
              }
            }
          }
        }
      }

      // ── Pembayaran pending ─────────────────────────────────
      if (paymentsRes.status === 'fulfilled') {
        const payments = paymentsRes.value.data?.data ?? paymentsRes.value.data ?? []
        for (const p of payments) {
          items.push({
            id: `payment-${p.id}`,
            type: 'payment_pending',
            title: 'Pembayaran Menunggu Validasi',
            message: `${p.user?.fullName ?? 'Pelanggan'} mengirim bukti pembayaran ${
              new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.amount)
            }`,
            time: p.createdAt,
            isRead: false,
            link: '/admin/pembayaran',
            meta: { paymentId: p.id },
          })
        }
      }

      // ── Registrasi pending ─────────────────────────────────
      if (regsRes.status === 'fulfilled') {
        const regs = regsRes.value.data?.data ?? regsRes.value.data ?? []
        for (const r of regs) {
          items.push({
            id: `reg-${r.id}`,
            type: 'registration_pending',
            title: 'Pendaftaran Baru Menunggu',
            message: `${r.fullName} mendaftar paket internet di ${r.city ?? r.address}`,
            time: r.createdAt,
            isRead: false,
            link: '/admin/pendaftar',
            meta: { regId: r.id },
          })
        }
      }

      // Sort by time descending
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      // Restore read state from localStorage
      const readIds: string[] = JSON.parse(localStorage.getItem('admin_notif_read') ?? '[]')
      const final = items.map(item => ({
        ...item,
        isRead: readIds.includes(item.id),
      }))

      setNotifs(final)
      const unread = final.filter(n => !n.isRead).length
      onUnreadChange?.(unread)

    } catch (e) {
      // silent fail — jangan ganggu UX
    } finally {
      setLoading(false)
    }
  }, [onUnreadChange])

  // Polling setiap 30 detik
  useEffect(() => {
    fetchNotifs()
    intervalRef.current = setInterval(fetchNotifs, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchNotifs])

  const markAsRead = (id: string) => {
    setNotifs(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      const readIds = updated.filter(n => n.isRead).map(n => n.id)
      localStorage.setItem('admin_notif_read', JSON.stringify(readIds))
      onUnreadChange?.(updated.filter(n => !n.isRead).length)
      return updated
    })
  }

  const markAllRead = () => {
    setNotifs(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }))
      localStorage.setItem('admin_notif_read', JSON.stringify(updated.map(n => n.id)))
      onUnreadChange?.(0)
      return updated
    })
  }

  const handleClick = (notif: NotifItem) => {
    markAsRead(notif.id)
    if (notif.link) {
      router.push(notif.link)
      onClose()
    }
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs
  const unreadCount = notifs.filter(n => !n.isRead).length

  // Group by date label
  const grouped: { label: string; items: NotifItem[] }[] = []
  for (const notif of displayed) {
    const d = new Date(notif.time)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const label =
      d.toDateString() === today.toDateString() ? 'Hari ini' :
      d.toDateString() === yesterday.toDateString() ? 'Kemarin' :
      d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })

    const group = grouped.find(g => g.label === label)
    if (group) group.items.push(notif)
    else grouped.push({ label, items: [notif] })
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="bg-[#1A1A1A] px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#F5A623]" />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-none">Notifikasi</h2>
                {unreadCount > 0 && (
                  <p className="text-white/40 text-xs mt-0.5">{unreadCount} belum dibaca</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifs}
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
          <div className="flex gap-1.5">
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
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="ml-auto text-[11px] text-white/40 hover:text-white/70 transition-colors px-1"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Memuat notifikasi...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {filter === 'unread' ? 'Semua sudah dibaca!' : 'Tidak ada notifikasi'}
              </p>
              <p className="text-gray-400 text-xs">
                {filter === 'unread' ? 'Tidak ada notifikasi baru untuk saat ini' : 'Notifikasi baru akan muncul di sini'}
              </p>
            </div>
          ) : (
            <div className="pb-4">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  {/* Date separator */}
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-5 py-2 border-b border-gray-100 z-10">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>

                  {/* Notif items */}
                  {items.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !notif.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <NotifIcon type={notif.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-gray-400">{timeAgo(notif.time)}</p>
                          {notif.meta?.priority && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              notif.meta.priority === 'CRITICAL' ? 'bg-red-100 text-red-500' :
                              notif.meta.priority === 'HIGH' ? 'bg-orange-100 text-orange-500' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {notif.meta.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-[11px] text-gray-400 text-center">
            Diperbarui setiap 30 detik · {notifs.length} notifikasi
          </p>
        </div>
      </div>
    </>
  )
}
