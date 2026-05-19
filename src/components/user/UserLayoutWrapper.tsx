'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Sidebar from './Sidebar';
import Header from './Header';
import FAQChatWidget from '@/components/user/FAQChatWidget';
import { Ban, CreditCard, Package, LogOut } from 'lucide-react';

export default function UserLayoutWrapper({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // State tambahan untuk mendeteksi alasan suspend
  const [suspensionType, setSuspensionType] = useState<'CANCELLATION' | 'BILLING' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  
  const { user, logout, isAuthenticated, isAdmin, _hasHydrated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Fetch unread notifications ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        const notifs = data?.data || data || [];
        const unread = notifs.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch {
        // silent
      }
    };

    fetchUnread();
  }, [isAuthenticated, user?.id, pathname]);

  // ── Deteksi Alasan Suspend Jika User Berstatus SUSPENDED ────────
  useEffect(() => {
    if (!isAuthenticated || user?.status !== 'SUSPENDED') return;

    const checkSuspensionReason = async () => {
      setIsCheckingStatus(true);
      try {
        // Cek request terakhir untuk mendeteksi apakah suspend karena putus langganan
        const res = await api.get('/service-requests/active');
        const { lastRequest } = res.data;

        if (lastRequest?.type === 'CANCELLATION' && lastRequest?.status === 'APPROVED') {
          setSuspensionType('CANCELLATION');
        } else {
          setSuspensionType('BILLING');
        }
      } catch (error) {
        // Jika error, fallback aman ke isolasi tagihan/billing
        setSuspensionType('BILLING');
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSuspensionReason();
  }, [isAuthenticated, user?.status]);

  // ── Logout Handler ─────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;

    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
      return;
    }
  }, [isMounted, _hasHydrated, isAuthenticated, isAdmin, router]);

  // ── Loading Screen ─────────────────────────────────────────────
  if (!isMounted || !_hasHydrated || (!isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('cakrana-auth'))) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ── 🔐 LOGIC LOCK SCREEN GLOBAL (KHUSUS USER SUSPENDED) ─────────
  if (user?.status === 'SUSPENDED') {
    if (isCheckingStatus) {
      return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    // A. JIKA KARENA PUTUS LANGGANAN (Hanya boleh akses halaman /dashboard/layanan)
    if (suspensionType === 'CANCELLATION') {
      if (pathname !== '/dashboard/layanan') {
        return (
          <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-8 text-center flex flex-col items-center shadow-2xl relative">
              <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-xl transition-all" title="Keluar">
                <LogOut size={20} />
              </button>
              <div className="w-20 h-20 bg-[#F5A623]/10 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-[#F5A623]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Layanan Dinonaktifkan</h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Akun internet Anda saat ini dinonaktifkan sepenuhnya berdasarkan permohonan putus langganan Anda yang telah disetujui admin.
              </p>
              <button
                onClick={() => router.push('/dashboard/layanan')}
                className="w-full py-4 bg-[#F5A623] hover:bg-[#F5A623]/90 text-black rounded-xl font-bold transition-all active:scale-95 shadow-lg text-sm"
              >
                Berlangganan Kembali
              </button>
            </div>
          </div>
        );
      }

      // Jika sudah berada di /dashboard/layanan, render halaman tanpa Sidebar (Biar gak bisa diklik menu lain)
      return (
        <div className="min-h-screen bg-[#0F0F0F] flex flex-col font-sans">
          <div className="border-b border-white/5 bg-[#1A1A1A] px-6 py-4 flex justify-between items-center">
            <span className="text-white font-bold tracking-wide">CAKRANA WIFI</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors">
              <LogOut size={16} /> Keluar
            </button>
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
            {children}
          </main>
        </div>
      );
    }

    // B. JIKA KARENA NUNGGAK BAYAR (Hanya boleh akses halaman /dashboard/tagihan)
    if (suspensionType === 'BILLING') {
      if (pathname !== '/dashboard/tagihan') {
        return (
          <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 font-sans">
            <div className="max-w-md w-full bg-[#1A1A1A] border border-red-500/10 rounded-[2rem] p-8 text-center flex flex-col items-center shadow-2xl relative">
              <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-xl transition-all" title="Keluar">
                <LogOut size={20} />
              </button>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Layanan Terisolasi ⚠️</h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Akses internet Anda ditangguhkan sementara karena terdapat invoice/tagihan bulanan yang melewati jatuh tempo pembayaran.
              </p>
              <button
                onClick={() => router.push('/dashboard/tagihan')}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg text-sm"
              >
                Bayar Tagihan Sekarang
              </button>
            </div>
          </div>
        );
      }

      // Jika sudah berada di /dashboard/tagihan, render halaman tagihan saja tanpa Sidebar menu lainnya
      return (
        <div className="min-h-screen bg-[#0F0F0F] flex flex-col font-sans">
          <div className="border-b border-white/5 bg-[#1A1A1A] px-6 py-4 flex justify-between items-center">
            <span className="text-white font-bold tracking-wide text-red-500">LAYANAN TERISOLASI</span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/60 hover:text-white font-medium transition-colors">
              <LogOut size={16} /> Keluar
            </button>
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-8">
            {children}
          </main>
        </div>
      );
    }
  }

  // ─── TAMPILAN NORMAL USER AKTIF ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex font-sans">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        pathname={pathname} 
        unreadCount={unreadCount} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={title} 
          user={user} 
          unreadCount={unreadCount} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <h1 className="text-2xl font-bold text-white sm:hidden mb-6">
            {title}
          </h1>
          {children}
        </main>
      </div>

      <FAQChatWidget />
    </div>
  );
}