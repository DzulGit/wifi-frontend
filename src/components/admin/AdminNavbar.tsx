'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Settings, HelpCircle, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import NotificationSidebar from '@/components/admin/NotificationSidebar'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

export default function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  const { admin } = useAuthStore()
  const router = useRouter()
  const [time, setTime] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/notifications/summary')
      if (typeof data.total === 'number') {
        setTotalUnread(data.total)
      } else if (typeof data.totalUnread === 'number') {
        setTotalUnread(data.totalUnread)
      } else {
        const fallback =
          (data.payments ?? 0) +
          (data.registrations ?? 0) +
          (data.tickets ?? 0) +
          (data.invoices ?? 0)
        setTotalUnread(fallback)
      }
    } catch (err) {
      console.warn('[AdminNavbar] Gagal fetch notification summary:', err)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
    const interval = setInterval(fetchSummary, 30000)
    return () => clearInterval(interval)
  }, [fetchSummary])

  const handleUnreadChange = useCallback((count: number) => {
    setTotalUnread(count)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-gray-900 font-bold text-lg leading-none truncate">{title}</h1>
            {subtitle && <p className="text-gray-400 text-xs mt-0.5 truncate">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-gray-400 text-sm font-mono hidden md:block">{time}</span>

            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative"
              aria-label="Buka notifikasi"
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

            <button
              type="button"
              onClick={() => router.push('/admin/pengaturan')}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              title="Bantuan"
            >
              <HelpCircle className="w-4 h-4 text-gray-500" />
            </button>

            <div className="w-9 h-9 rounded-full bg-[#F5A623] flex items-center justify-center ml-1">
              <span className="text-black font-bold text-sm">
                {admin?.fullName?.charAt(0) ?? 'A'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <NotificationSidebar
        open={notifOpen}
        onClose={() => {
          setNotifOpen(false)
          fetchSummary()
        }}
        onUnreadChange={handleUnreadChange}
      />

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold">Pusat Bantuan</h2>
              <button type="button" onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Dokumentasi', desc: 'Panduan penggunaan admin panel', action: () => {} },
                {
                  label: 'Chat WhatsApp',
                  desc: 'Hubungi tim support langsung',
                  action: () => window.open('https://wa.me/628xxxxxxxxx', '_blank'),
                },
                {
                  label: 'Email Support',
                  desc: 'support@cakrana.id',
                  action: () => window.open('mailto:support@cakrana.id'),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
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
