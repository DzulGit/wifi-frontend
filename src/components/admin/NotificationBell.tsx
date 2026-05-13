'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import NotificationSidebar from './NotificationSidebar'
import api from '@/lib/api'

export default function NotificationBell() {
  const [open, setOpen]         = useState(false)
  const [unread, setUnread]     = useState(0)
  const intervalRef             = useRef<NodeJS.Timeout | null>(null)

  // Quick count poll (lighter than full fetch)
  const pollCount = useCallback(async () => {
    try {
      const [paymentsRes, regsRes, ticketsRes] = await Promise.allSettled([
        api.get('/payments?status=PENDING&limit=1&page=1'),
        api.get('/registrations?status=PENDING&limit=1&page=1'),
        api.get('/tickets?status=OPEN&limit=1&page=1'),
      ])
      let count = 0
      if (paymentsRes.status === 'fulfilled') count += paymentsRes.value.data?.meta?.total ?? 0
      if (regsRes.status === 'fulfilled') count += regsRes.value.data?.meta?.total ?? 0
      if (ticketsRes.status === 'fulfilled') count += ticketsRes.value.data?.meta?.total ?? 0
      setUnread(count)
    } catch {}
  }, [])

  useEffect(() => {
    pollCount()
    intervalRef.current = setInterval(pollCount, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pollCount])

  return (
    <>
      <button
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
        onClose={() => setOpen(false)}
        onUnreadChange={setUnread}
      />
    </>
  )
}
