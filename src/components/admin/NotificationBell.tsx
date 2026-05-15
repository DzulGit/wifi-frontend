'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import NotificationSidebar from './NotificationSidebar'
import api from '@/lib/api'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Polling super ringan: Cuma ngambil angka total yang belum dibaca
  const pollCount = useCallback(async () => {
    try {
      // Kita hitung total notif yang isRead = false
      const res = await api.get('/admin/notifications?isRead=false&limit=1')
      // Tergantung format respon NestJS lu, biasanya total ada di meta
      const total = res.data?.meta?.total ?? res.data?.data?.length ?? 0
      setUnread(total)
    } catch (err) {
      console.error("Gagal fetch unread count", err)
    }
  }, [])

  useEffect(() => {
    pollCount()
    intervalRef.current = setInterval(pollCount, 30000) // Cek tiap 30 detik
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pollCount])

  // Fungsi buat ngurangin badge dari sidebar pas admin ngeklik notif
  const handleUnreadDecrement = () => {
    setUnread(prev => Math.max(0, prev - 1))
  }

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
        // Ganti onReadAction dan refreshGlobalCount dengan ini:
        onUnreadChange={(count) => {
          // Panggil fungsi untuk update angka badge merah di Bell lu
          // Misalnya setUnreadCount(count) atau sejenisnya
          console.log("Sisa unread:", count);
        }}
      />
    </>
  )
}