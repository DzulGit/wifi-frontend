'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import NotificationSidebar from './NotificationSidebar'
import api from '@/lib/api'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollCount = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications/summary')
      const data = res.data
      if (typeof data.total === 'number') {
        setUnread(data.total)
      } else if (typeof data.totalUnread === 'number') {
        setUnread(data.totalUnread)
      } else {
        const fallback =
          (data.payments ?? 0) +
          (data.registrations ?? 0) +
          (data.tickets ?? 0) +
          (data.invoices ?? 0)
        setUnread(fallback)
      }
    } catch (err) {
      console.error('Gagal fetch unread count', err)
    }
  }, [])

  useEffect(() => {
    pollCount()
    intervalRef.current = setInterval(pollCount, 30000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [pollCount])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:shadow-sm transition-all"
        aria-label="Notifikasi"
      >
        <Bell className="w-4.5 h-4.5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <NotificationSidebar
        open={open}
        onClose={() => {
          setOpen(false)
          pollCount()
        }}
        onUnreadChange={setUnread}
      />
    </>
  )
}
