'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Settings, HelpCircle, X, CreditCard, UserPlus, Ticket, AlertTriangle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

interface NotificationItem {
  id: string
  type: 'PAYMENT' | 'REGISTRATION' | 'TICKET' | 'INVOICE'
  title: string
  message: string
  link: string
  createdAt: string
  isUrgent: boolean
}

const TYPE_CONFIG = {
  PAYMENT:      { icon: CreditCard,    color: 'text-blue-500',   bg: 'bg-blue-50' },
  REGISTRATION: { icon: UserPlus,      color: 'text-green-500',  bg: 'bg-green-50' },
  TICKET:       { icon: Ticket,        color: 'text-purple-500', bg: 'bg-purple-50' },
  INVOICE:      { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50' },
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

export default function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  const { admin } = useAuthStore()
  const router = useRouter()
  const [time, setTime] = useState('')

  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loadingNotif, setLoadingNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const [showHelp, setShowHelp] = useState(false)

  // Clock
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch badge count tiap 30 detik (ringan)
  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications/summary')
      setTotalUnread(data.total)
    } catch {}
  }, [])

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 30000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  // Fetch detail notif saat dropdown dibuka
  const fetchNotifications = useCallback(async () => {
    setLoadingNotif(true)
    try {
      const { data } = await api.get('/admin/notifications')
      setNotifications(data.notifications)
      setTotalUnread(data.totalUnread)
    } catch {}
    finally { setLoadingNotif(false) }
  }, [])

  const handleBellClick = () => {
    if (!showNotif) fetchNotifications()
    setShowNotif(prev => !prev)
  }

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifClick = (link: string) => {
    setShowNotif(false)
    router.push(link)
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

            {/* Bell + Dropdown */}
            <div className="relative" ref={notifRef}>
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

              {/* Dropdown */}
              {showNotif && (
                <div className="absolute right-0 top-11 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Notifikasi</h3>
                      <p className="text-[11px] text-gray-400">{totalUnread} aktivitas perlu perhatian</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchNotifications}
                        className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loadingNotif ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowNotif(false)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
                    {loadingNotif ? (
                      [...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-3 p-4 animate-pulse">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                          </div>
                        </div>
                      ))
                    ) : notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm font-medium">Semua beres!</p>
                        <p className="text-gray-300 text-xs mt-1">Tidak ada aktivitas baru</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const cfg = TYPE_CONFIG[notif.type]
                        const Icon = cfg.icon
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif.link)}
                            className={`w-full flex gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${notif.isUrgent ? 'bg-red-50/30' : ''}`}
                          >
                            <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-700">{notif.title}</span>
                                {notif.isUrgent && (
                                  <span className="text-[10px] font-semibold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">Urgent</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                              <p className="text-[11px] text-gray-300 mt-1">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

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