'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Sidebar from './Sidebar';
import Header from './Header';
import FAQChatWidget from '@/components/user/FAQChatWidget';
import { Ban, CreditCard, Package, LogOut, Clock, MessageCircle } from 'lucide-react'; // 👈 Tambahan icon Clock & Message

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
  
  // 👇 Tambahan State: WAITING_ACTIVATION
  const [suspensionType, setSuspensionType] = useState<'CANCELLATION' | 'BILLING' | 'WAITING_ACTIVATION' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  
  const { user, logout, isAuthenticated, isAdmin, _hasHydrated } = useAuthStore();

  // (Nomor WA Admin - Ganti dengan nomor asli lu)
  const ADMIN_WA_NUMBER = '6285883934965'; 

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // ── Deteksi Alasan Suspend (Mengecek History Request & Tagihan) ────────
  useEffect(() => {
    if (!isAuthenticated || user?.status !== 'SUSPENDED') return;

    const checkSuspensionReason = async () => {
      setIsCheckingStatus(true);
      try {
        // Tarik data request terakhir DAN data tagihan secara bersamaan (limit 100 biar narik semua)
        const [resReq, resBills] = await Promise.all([
          api.get('/service-requests/active').catch(() => ({ data: {} })),
          api.get('/billing?limit=100').catch(() => ({ data: { data: [] } }))
        ]);

        const { lastRequest } = resReq.data;
        const bills = resBills.data?.data || [];
        
        // Cek apakah ada tagihan yang belum dibayar / nunggak
        const hasUnpaidBills = bills.some((b: any) => b.status === 'UNPAID' || b.status === 'OVERDUE');

        if (hasUnpaidBills) {
          // Kondisi 1: Punya tagihan -> Lempar ke halaman bayar
          setSuspensionType('BILLING');
        } else if (lastRequest?.type === 'CANCELLATION' && lastRequest?.status === 'APPROVED') {
          // Kondisi 2: Gak ada tagihan TAPI last requestnya putus langganan -> Lempar ke Pilih Paket
          setSuspensionType('CANCELLATION');
        } else {
          // Kondisi 3: Gak ada tagihan & bukan putus langganan -> Tinggal nunggu Admin aktifin
          setSuspensionType('WAITING_ACTIVATION');
        }
      } catch (error) {
        setSuspensionType('BILLING');
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSuspensionReason();
  }, [isAuthenticated, user?.status]);

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

    // A. JIKA KARENA PUTUS LANGGANAN (Hanya boleh akses form pilih paket)
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
                Akun internet Anda saat ini dinonaktifkan sepenuhnya berdasarkan permohonan putus langganan Anda.
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

    // B. JIKA KARENA NUNGGAK BAYAR
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
                Akses internet Anda ditangguhkan sementara karena terdapat tagihan yang melewati batas jatuh tempo pembayaran.
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

    // 👇 C. JIKA LUNAS & BUKAN PUTUS LANGGANAN (MENUNGGU ADMIN) 👇
    if (suspensionType === 'WAITING_ACTIVATION') {
      return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#1A1A1A] border border-blue-500/20 rounded-[2rem] p-8 text-center flex flex-col items-center shadow-2xl relative">
            <button onClick={handleLogout} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-xl transition-all" title="Keluar">
              <LogOut size={20} />
            </button>
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Menunggu Pemulihan</h2>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              Sistem mendeteksi bahwa tidak ada tunggakan tagihan pada akun Anda. Saat ini layanan sedang menunggu aktivasi dari Admin.
            </p>
            <a
              href={`https://wa.me/${ADMIN_WA_NUMBER}?text=Halo Admin Cakrana, akun saya dengan ID ${user.customerCode} sudah tidak ada tunggakan, tolong bantu cek dan aktifkan kembali koneksi WiFi-nya ya. Terima kasih.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle size={20} />
              Hubungi Admin via WA
            </a>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
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