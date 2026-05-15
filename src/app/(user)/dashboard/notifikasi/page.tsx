'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import {
  Bell,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Check
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function NotifikasiPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Tab Filter ('ALL' atau 'UNREAD')
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('UNREAD');

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      
      // Jika tab aktif adalah UNREAD, kirim query parameter ?isRead=false
      const url = activeTab === 'UNREAD' ? '/notifications?isRead=false' : '/notifications';
      const { data } = await api.get(url);
      
      const notifs = data?.data || data || [];
      const sortedNotifs = Array.isArray(notifs)
        ? notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];

      setNotifications(sortedNotifs);
    } catch (error) {
      console.error('Gagal memuat notifikasi:', error);
      toast.error('Gagal memuat daftar notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil ulang fetch jika User ID atau Tab Filter berubah
  useEffect(() => {
    fetchNotifications();
  }, [user?.id, activeTab]);

  const getNotificationIcon = (type: string) => {
    const t = type?.toUpperCase();
    if (t?.includes('INVOICE') || t?.includes('PAYMENT')) {
      return <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-500"><Bell className="w-6 h-6" /></div>;
    }
    if (t?.includes('SUSPEND') || t?.includes('CANCEL')) {
      return <div className="bg-red-500/10 p-3 rounded-2xl text-red-500"><AlertTriangle className="w-6 h-6" /></div>;
    }
    if (t?.includes('ACTIVATE') || t?.includes('APPROVED')) {
      return <div className="bg-green-500/10 p-3 rounded-2xl text-green-500"><CheckCircle2 className="w-6 h-6" /></div>;
    }
    return <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-400"><Info className="w-6 h-6" /></div>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 172800) return 'Kemarin';

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // FITUR: Aksi Klik Notifikasi (Read & Redirect)
  const handleNotifClick = async (notif: any) => {
    try {
      // 1. Jika belum dibaca, tembak API markAsRead di background
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif.id}/read`);
        // Update state lokal biar UI langsung berubah
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      }

      // 2. Jika ada metadata URL tujuan, langsung redirect ke sana
      if (notif.metadata?.url) {
        router.push(notif.metadata.url);
      }
    } catch (error) {
      console.error("Gagal update status read:", error);
    }
  };

  // FITUR: Hapus Notifikasi (Soft Delete)
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Mencegah trigger fungsi handleNotifClick saat ngeklik tombol hapus
    
    if (!confirm('Hapus notifikasi ini?')) return;
    
    try {
      await api.delete(`/notifications/${id}`);
      // Hapus dari state lokal biar UI langsung hilang tanpa loading
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      toast.error('Gagal menghapus notifikasi');
    }
  };

  // FITUR: Tandai Semua Dibaca
  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
      toast.success('Semua notifikasi ditandai sudah dibaca');
    } catch (error) {
      toast.error('Gagal menandai semua notifikasi');
    }
  };

  return (
    <UserLayoutWrapper title="Notifikasi">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER NOTIFIKASI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#F5A623]" /> Pusat Notifikasi
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Pembaruan dan informasi terbaru akun Anda.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-bold text-[#F5A623] hover:text-black bg-[#F5A623]/10 hover:bg-[#F5A623] px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-[#F5A623]/20"
            >
              <Check className="w-4 h-4" /> Tandai Semua Dibaca
            </button>
            <button
              onClick={fetchNotifications}
              className="text-xs font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" /> Perbarui
            </button>
          </div>
        </div>

        {/* TAB FILTER UNREAD vs ALL */}
        <div className="flex bg-[#1A1A1A] border border-white/5 p-1 rounded-xl w-fit mb-6">
           <button 
             onClick={() => setActiveTab('UNREAD')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'UNREAD' ? 'bg-[#F5A623] text-black shadow-lg' : 'text-white/40 hover:text-white'
             }`}
           >
             Belum Dibaca
           </button>
           <button 
             onClick={() => setActiveTab('ALL')}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
               activeTab === 'ALL' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
             }`}
           >
             Semua
           </button>
        </div>

        {/* LIST NOTIFIKASI */}
        <div className="space-y-4">
          {isLoading ? (
            // LOADING STATE
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-[#1A1A1A] border border-white/5 p-6 rounded-[1.5rem] flex items-start gap-4 animate-pulse">
                <div className="w-12 h-12 bg-white/5 rounded-2xl shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-white/10 rounded-md w-1/3"></div>
                  <div className="h-3 bg-white/5 rounded-md w-3/4"></div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            // EMPTY STATE
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-16 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Bell className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-xl mb-2">
                {activeTab === 'UNREAD' ? 'Tidak Ada Notifikasi Baru' : 'Belum Ada Notifikasi'}
              </h3>
              <p className="text-white/40 text-sm">
                Anda sudah membaca semua pemberitahuan saat ini.
              </p>
            </div>
          ) : (
            // DATA NOTIFIKASI
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`group relative overflow-hidden bg-[#1A1A1A] border p-5 sm:p-6 rounded-[1.5rem] flex items-start gap-4 sm:gap-5 transition-all cursor-pointer hover:border-[#F5A623]/30 ${
                  !notif.isRead
                    ? 'border-white/10 shadow-[0_0_20px_rgba(245,166,35,0.05)]'
                    : 'border-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Indikator Belum Dibaca */}
                {!notif.isRead && <div className="absolute top-0 right-0 w-16 h-16 bg-[#F5A623]/10 blur-2xl rounded-full rounded-tr-[1.5rem] pointer-events-none"></div>}
                {!notif.isRead && <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-[#F5A623] rounded-full shadow-[0_0_10px_rgba(245,166,35,0.5)]"></div>}

                {/* Ikon */}
                <div className="shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Konten */}
                <div className="flex-1 pr-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1.5">
                    <h4 className={`text-base font-bold ${!notif.isRead ? 'text-white' : 'text-white/80'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[11px] font-mono text-white/40 whitespace-nowrap">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Tombol Hapus (Muncul saat di-hover) */}
                <button 
                  onClick={(e) => handleDelete(e, notif.id)}
                  className="absolute right-4 bottom-4 p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Hapus Notifikasi"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </UserLayoutWrapper>
  );
}