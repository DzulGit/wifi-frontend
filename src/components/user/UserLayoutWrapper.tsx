'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CreditCard,
  LifeBuoy,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Wifi,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function UserLayoutWrapper({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const { 
    user, 
    logout, 
    isAuthenticated, 
    isAdmin, 
    _hasHydrated 
  } = useAuthStore();

  // ── FETCH UNREAD NOTIFICATIONS ──
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        const notifs = data?.data || data || [];
        // Hitung yang belum dibaca
        const unread = notifs.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Gagal get notif header");
      }
    };

    fetchUnread();
  }, [isAuthenticated, user?.id, pathname]); // Akan update setiap kali pindah halaman

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // ── GUARD LOGIC: Mencegah redirect prematur ──
  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;

    // Safety Net: Cek manual ke localStorage jika state telat
    let hasLocalToken = false;
    const authStorage = localStorage.getItem('cakrana-auth');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        hasLocalToken = !!parsed?.state?.token;
      } catch (e) { hasLocalToken = false; }
    }

    if (!isAuthenticated && !hasLocalToken) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
      return;
    }
  }, [isMounted, _hasHydrated, isAuthenticated, isAdmin, router]);

  // ── LOADING STATE ──
  // Cegah render jika data belum siap, munculkan spinner sejenak saat refresh
  if (!isMounted || !_hasHydrated || (!isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('cakrana-auth'))) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jika fix tidak login, kosongkan sebelum pindah ke halaman login
  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { name: 'Beranda', icon: Home, path: '/dashboard' },
    { name: 'Tagihan Saya', icon: CreditCard, path: '/dashboard/tagihan' },
    { name: 'Bantuan & Laporan', icon: LifeBuoy, path: '/dashboard/bantuan' },
    { name: 'Pengaturan Akun', icon: Settings, path: '/dashboard/pengaturan' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex font-sans">
      {/* ── SIDEBAR ── */}
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
            const isActive =
              item.path === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.path ||
                  pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F5A623] text-black font-bold shadow-lg shadow-[#F5A623]/20'
                    : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${isActive ? 'text-black' : 'text-white/40'}`}
                />
                {item.name}
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

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP NAVBAR */}
        <header className="h-20 bg-[#1A1A1A]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-white/60 hover:bg-white/5"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-white hidden sm:block">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push('/dashboard/notifikasi')}
              className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {/* Ini logika untuk memunculkan ANGKA NOTIFIKASI */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#1A1A1A] flex items-center justify-center animate-in zoom-in">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">
                  {user?.fullName || 'Pelanggan'}
                </p>
                <p className="text-xs text-[#F5A623] font-mono">
                  {user?.customerCode || 'ID: -'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#F5A623]/20">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <h1 className="text-2xl font-bold text-white sm:hidden mb-6">
            {title}
          </h1>
          {children}
        </main>
      </div>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}