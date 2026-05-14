'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X, Bell, MessageSquare, CreditCard, Users, FileText, CheckCircle, RefreshCw, Activity } from 'lucide-react'
import api from '@/lib/api'
import { useRouter } from 'next/navigation'

// ── Types (Sesuai Skema Prisma Baru) ───────────────────────────
type NotifCategory = 'FINANCE' | 'SUPPORT' | 'SYSTEM' | 'ACCOUNT' | 'BILLING'

interface AdminNotification {
  id: string
  title: string
  message: string
  category: NotifCategory
  link?: string
  isUrgent: boolean
  isRead: boolean
  metadata?: Record<string, any>
  createdAt: string
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

function NotifIcon({ category, isUrgent }: { category: NotifCategory, isUrgent: boolean }) {
  if (isUrgent) {
    return (
      <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 animate-pulse">
        <Activity className="w-4 h-4 text-red-600" />
      </div>
    )
  }

  const map = {
    FINANCE: { icon: CreditCard,    bg: 'bg-[#F5A623]/15', color: 'text-[#F5A623]' },
    SUPPORT: { icon: MessageSquare, bg: 'bg-blue-100',   color: 'text-blue-600'   },
    SYSTEM:  { icon: Bell,          bg: 'bg-gray-100',   color: 'text-gray-600'   },
    ACCOUNT: { icon: Users,         bg: 'bg-green-100',  color: 'text-green-600'  },
    BILLING: { icon: FileText,      bg: 'bg-purple-100', color: 'text-purple-600' },
  }
  const { icon: Icon, bg, color } = map[category] ?? map.SYSTEM

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
  onReadAction: () => void
  refreshGlobalCount: () => Promise<void>
}

type FilterType = 'ALL' | 'UNREAD' | NotifCategory

export default function NotificationSidebar({ open, onClose, onReadAction, refreshGlobalCount }: NotificationSidebarProps) {
  const router = useRouter()
  const [notifs, setNotifs]       = useState<AdminNotification[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState<FilterType>('ALL')
  const intervalRef               = useRef<NodeJS.Timeout | null>(null)

  // ── Fetch Langsung dari Tabel AdminNotification ──────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      let url = '/admin/notifications?limit=50&page=1'
      
      if (filter === 'UNREAD') {
        url += '&isRead=false'
      } else if (filter !== 'ALL') {
        url += `&category=${filter}`
      }

      const res = await api.get(url)
      // Tergantung format NestJS lu, biasanya di res.data.data
      const items = res.data?.data ?? res.data ?? []
      
      setNotifs(items)
    } catch (e) {
      console.error("Gagal memuat notifikasi", e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  // Fetch tiap buka sidebar / ganti filter
  useEffect(() => {
    if (open) fetchNotifs()
  }, [open, fetchNotifs])

  // Polling kalau sidebar lagi kebuka
  useEffect(() => {
    if (!open) return
    intervalRef.current = setInterval(fetchNotifs, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, fetchNotifs])

  // ── Update DB pas di-klik ──────────────────────────────────
  const markAsRead = async (id: string, isCurrentlyRead: boolean) => {
    if (isCurrentlyRead) return // Kalo udah read, ga usah tembak API lagi

    // Optimistic UI update (biar instan di mata user)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    onReadAction() // Ngurangin badge merah di Bell icon

    try {
      await api.patch(`/admin/notifications/${id}/read`)
    } catch (err) {
      console.error("Gagal update status read", err)
      fetchNotifs() // Revert kalau gagal
    }
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    try {
      // Ganti URL ini kalau endpoint mark-all lu beda dari yang di-generate AI
      await api.post('/admin/notifications/read/many') 
      refreshGlobalCount()
    } catch (err) {
      console.error(err)
      fetchNotifs()
    }
  }

  const handleClick = (notif: AdminNotification) => {
    markAsRead(notif.id, notif.isRead)
    if (notif.link) {
      router.push(notif.link)
      onClose()
    }
  }

  // Group by date label
  const grouped: { label: string; items: AdminNotification[] }[] = []
  for (const notif of notifs) {
    const d = new Date(notif.createdAt)
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

  const FILTER_TABS: { value: FilterType, label: string }[] = [
    { value: 'ALL', label: 'Semua' },
    { value: 'UNREAD', label: 'Belum Dibaca' },
    { value: 'FINANCE', label: 'Keuangan' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'BILLING', label: 'Tagihan' },
    { value: 'SYSTEM', label: 'Sistem' },
  ]

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[450px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-[#1A1A1A] px-5 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#F5A623]" />
              </div>
              <h2 className="text-white font-bold text-sm leading-none">Notifikasi Admin</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchNotifs} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Filter tabs (Scrollable horizontal) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {FILTER_TABS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filter === f.value ? 'bg-[#F5A623] text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={markAllRead}
              className="flex-shrink-0 text-[11px] text-white/40 hover:text-white/70 transition-colors pl-2 border-l border-white/10"
            >
              Tandai semua dibaca
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Memuat notifikasi...</p>
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="pb-4">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-5 py-2 border-b border-gray-100 z-10">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                  </div>
                  {items.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left px-5 py-4 flex items-start gap-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !notif.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <NotifIcon category={notif.category} isUrgent={notif.isUrgent} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-gray-400">{timeAgo(notif.createdAt)}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {notif.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}