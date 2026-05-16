'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  UserPlus,      // Untuk Pendaftar
  Users,         // Untuk Pelanggan
  Package,       // Untuk Paket
  Receipt,       // Untuk Tagihan
  CreditCard,    // Untuk Pembayaran
  Ticket,        // Untuk Tiket
  FileText,      // Untuk Laporan
  Settings,      // Untuk Pengaturan
  LogOut,
  X 
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store' // Sesuaikan path jika beda

interface AdminSidebarProps {
  pendingCount?: number;
  paymentCount?: number;
  ticketCount?: number;
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void;
}

export default function AdminSidebar({ 
  pendingCount = 0, 
  paymentCount = 0, 
  ticketCount = 0,
  isOpen,
  setIsOpen
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuthStore()

  // Routing sudah disesuaikan EXACTLY dengan struktur folder di gambar kamu
  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Pendaftar', href: '/admin/pendaftar', icon: UserPlus, badge: pendingCount },
    { name: 'Pelanggan', href: '/admin/pelanggan', icon: Users },
    { name: 'Paket Layanan', href: '/admin/paket', icon: Package },
    { name: 'Tagihan', href: '/admin/tagihan', icon: Receipt },
    { name: 'Pembayaran', href: '/admin/pembayaran', icon: CreditCard, badge: paymentCount },
    { name: 'Laporan', href: '/admin/laporan', icon: FileText },
    { name: 'Tiket Bantuan', href: '/admin/tiket', icon: Ticket, badge: ticketCount },
    { name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
  ]

  return (
    <>
      {/* Overlay Background Transparan untuk Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed left-0 top-0 h-full w-[260px] bg-[#121212] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out border-r border-white/5 shadow-2xl lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 flex-shrink-0 bg-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F5A623] rounded-lg flex items-center justify-center font-bold text-black">
              C
            </div>
            <h1 className="font-bold text-lg tracking-wide text-white">CAKRANA</h1>
          </div>
          
          {/* Tombol Close Mobile */}
          <button 
            className="lg:hidden text-white/70 hover:text-white p-1 rounded-md hover:bg-white/10"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
          <p className="px-2 text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
            Menu Utama
          </p>
          
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} // Tutup otomatis saat di HP
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {item.name}
                </div>
                
                {/* Badge Notifikasi */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                    isActive ? 'bg-black/90 text-[#F5A623]' : 'bg-[#F5A623] text-black'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer / Tombol Logout */}
        <div className="p-4 border-t border-white/10 flex-shrink-0 bg-[#1A1A1A]/50">
          <button 
            onClick={() => {
              if(logout) logout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar Akun
          </button>
        </div>
      </aside>
    </>
  )
}