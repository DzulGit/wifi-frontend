'use client'

import { useState, useEffect } from 'react'
import { Bell, Settings, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

export default function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  const { admin } = useAuthStore()
  const router = useRouter() 
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
      }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-gray-900 font-bold text-lg leading-none">{title}</h1>
          {subtitle && (
            <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Time */}
          <span className="text-gray-400 text-sm font-mono hidden md:block">{time}</span>

          {/* Notifikasi */}
          <button className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors relative">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* Settings → /admin/pengaturan */}
          <button
            onClick={() => router.push('/admin/pengaturan')}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4 text-gray-500" />
          </button>

          {/* Help → modal bantuan (TODO: tambah state modal) */}
          <button
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
  )
}