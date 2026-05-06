'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Package,
  Receipt,
  CreditCard,
  Ticket,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  {
    label: 'MENU UTAMA',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dasbor' },
      { href: '/admin/pendaftar', icon: UserPlus, label: 'Pendaftar Baru', badge: 'pending' },
      { href: '/admin/pelanggan', icon: Users, label: 'Manajemen Pelanggan' },
      { href: '/admin/paket', icon: Package, label: 'Manajemen Paket' },
    ]
  },
  {
    label: 'BILLING',
    items: [
      { href: '/admin/tagihan', icon: Receipt, label: 'Tagihan' },
      { href: '/admin/pembayaran', icon: CreditCard, label: 'Pembayaran', badge: 'payment' },
    ]
  },
  {
    label: 'SUPPORT',
    items: [
      { href: '/admin/tiket', icon: Ticket, label: 'Tiket Dukungan', badge: 'ticket' },
    ]
  },
  {
    label: 'LAPORAN',
    items: [
      { href: '/admin/laporan', icon: BarChart3, label: 'Analitik' },
      { href: '/admin/pengaturan', icon: Settings, label: 'Pengaturan' },
    ]
  },
]

interface SidebarProps {
  pendingCount?: number
  paymentCount?: number
  ticketCount?: number
}

export default function AdminSidebar({ pendingCount = 0, paymentCount = 0, ticketCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAuthStore()
  const [loggingOut, setLoggingOut] = useState(false)

  const getBadgeCount = (badge?: string) => {
    if (badge === 'pending') return pendingCount
    if (badge === 'payment') return paymentCount
    if (badge === 'ticket') return ticketCount
    return 0
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    logout()
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#1A1A1A] flex flex-col z-50 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F5A623] flex items-center justify-center flex-shrink-0">
            <Wifi className="w-5 h-5 text-black" />
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-wider leading-none">CAKRANA</p>
            <p className="text-[#F5A623]/70 text-[10px] tracking-widest leading-none mt-1">ISP MANAGEMENT</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-none">
        {navItems.map((group) => (
          <div key={group.label}>
            <p className="text-white/30 text-[9px] font-semibold tracking-widest px-2 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const badgeCount = getBadgeCount(item.badge)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-150 group relative
                      ${isActive
                        ? 'bg-[#F5A623] text-black'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-black' : 'text-white/50 group-hover:text-white'}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className={`
                        text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                        ${isActive ? 'bg-black/20 text-black' : 'bg-red-500 text-white'}
                      `}>
                        {badgeCount}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-3 h-3 text-black/60" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin info + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-bold text-xs">
              {admin?.fullName?.charAt(0) ?? 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{admin?.fullName ?? 'Admin'}</p>
            <p className="text-[#F5A623]/70 text-[10px] truncate">{admin?.role ?? 'ADMIN'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}