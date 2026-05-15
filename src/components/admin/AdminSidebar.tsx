'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Ticket, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store' // Sesuaikan path jika beda

// 1. Interface yang bikin error TS2322 hilang
interface AdminSidebarProps {
  pendingCount: number;
  paymentCount: number;
  ticketCount: number;
}

export default function AdminSidebar({ 
  pendingCount, 
  paymentCount, 
  ticketCount 
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuthStore()

  // 2. Daftar Menu Sidebar (Sesuaikan href dengan routing asli lu)
  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Pendaftaran', href: '/admin/registrations', icon: Users, badge: pendingCount },
    { name: 'Pembayaran', href: '/admin/payments', icon: CreditCard, badge: paymentCount },
    { name: 'Tiket Bantuan', href: '/admin/tickets', icon: Ticket, badge: ticketCount },
    { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ]

  return (
    <aside className="w-[220px] fixed left-0 top-0 h-full bg-[#1A1A1A] text-white flex flex-col z-20">
      
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
        <h1 className="font-bold text-lg tracking-wide text-[#F5A623]">CAKRANA</h1>
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 no-scrollbar">
        {navItems.map((item) => {
          // Cek apakah menu ini sedang aktif
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-[#F5A623] text-black' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                {item.name}
              </div>
              
              {/* Badge Angka Notifikasi */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-black text-[#F5A623]' : 'bg-[#F5A623] text-black'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Tombol Logout */}
      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <button 
          onClick={() => logout && logout()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </aside>
  )
}