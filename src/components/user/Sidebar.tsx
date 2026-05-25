'use client';

import Link from 'next/link';
import { Home, CreditCard, LifeBuoy, Bell, Settings, LogOut, X, Wifi, Package } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  pathname: string;
  unreadCount: number;
  handleLogout: () => void;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, pathname, unreadCount, handleLogout }: SidebarProps) {
  const menuItems = [
    { name: 'Beranda', icon: Home, path: '/dashboard' },
    { name: 'Tagihan Saya', icon: CreditCard, path: '/dashboard/tagihan' },
    { name: 'Bantuan & Laporan', icon: LifeBuoy, path: '/dashboard/bantuan' },
    // 👇 MENU LAYANAN BARU DITAMBAHKAN DI SINI 👇
    { name: 'Layanan', icon: Package, path: '/dashboard/layanan' },
    { name: 'Notifikasi', icon: Bell, path: '/dashboard/notifikasi', badge: unreadCount },
    { name: 'Pengaturan Akun', icon: Settings, path: '/dashboard/pengaturan' },
  ];

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] border-r border-white/5 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Wifi className="w-6 h-6 text-[#F5A623]" />
            <span className="text-[#F5A623] font-space-grotesk font-bold text-xl tracking-wide">
              CAKRANA
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-2 mt-4">
          <p className="px-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">
            Portal Menu
          </p>
          {menuItems.map((item) => {
            const isActive = item.path === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.path || pathname.startsWith(`${item.path}/`);
              
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#F5A623] text-black font-bold shadow-lg shadow-[#F5A623]/20'
                    : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-white/40 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                
                {/* Badge Angka Notifikasi di Sidebar */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center ${
                    isActive ? 'bg-black text-[#F5A623]' : 'bg-[#F5A623] text-black'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}