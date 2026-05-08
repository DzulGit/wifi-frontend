'use client';

import { useState, useEffect } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function UserHelpdeskPage() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState('Teknis / Jaringan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // 1. Tarik Data Tiket dari Backend
  const fetchTickets = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      // Asumsi rute tiket adalah /tickets, dan kita filter berdasarkan userId
      const { data } = await api.get('/tickets', {
        params: { userId: user.id },
      });

      const ticketData = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      // Urutkan tiket terbaru di atas
      setTickets(
        ticketData.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error('Gagal memuat tiket:', error);
      toast.error('Gagal mengambil data laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.id]);

  // 2. Fungsi Submit Tiket Baru
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error('Judul dan deskripsi wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      // Sesuai ERD, kita kirimkan title, description, dan category
      await api.post('/tickets', {
        title,
        description,
        category,
        userId: user?.id, // Kirimkan ID pelanggan agar masuk ke miliknya
      });

      toast.success('Laporan Berhasil Terkirim!', {
        description: 'Teknisi kami akan segera merespons tiket Anda.',
      });

      // Bersihkan form & tutup modal
      setTitle('');
      setDescription('');
      setCategory('Teknis / Jaringan');
      setIsModalOpen(false);

      // Refresh list tiket agar tiket yang baru dibuat langsung muncul!
      fetchTickets();
    } catch (error: any) {
      console.error('Gagal membuat tiket:', error);
      toast.error('Gagal mengirim laporan', {
        description:
          error.response?.data?.message || 'Terjadi kesalahan pada sistem.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">
            Menunggu Balasan
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
            <Clock className="w-3 h-3" /> Dicek Teknisi
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
      default:
        return (
          <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'HIGH' || priority === 'CRITICAL')
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <MessageSquare className="w-4 h-4 text-white/40" />;
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const categoriesList = [
    'Teknis / Jaringan Mati',
    'Pertanyaan Tagihan',
    'Informasi Layanan',
  ];

  return (
    <UserLayoutWrapper title="Bantuan & Laporan">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* HEADER & TOMBOL TAMBAH */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 md:p-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <LifeBuoy className="w-6 h-6 text-[#F5A623]" /> Pusat Bantuan
              CAKRANA
            </h2>
            <p className="text-white/50 text-sm">
              Laporkan kendala jaringan atau tanyakan informasi layanan di sini.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,166,35,0.2)]"
          >
            <Plus className="w-5 h-5" /> Buat Laporan Baru
          </button>
        </div>

        {/* LIST TIKET */}
        <div>
          <h3 className="text-white font-bold text-lg mb-4">
            Riwayat Laporan Saya
          </h3>

          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/50">
                  Belum ada riwayat tiket/laporan.
                </p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-[#1A1A1A] hover:bg-white/[0.02] transition-colors border border-white/5 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row gap-4 justify-between md:items-center group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white/5 p-2.5 rounded-xl border border-white/5">
                      {getPriorityIcon(ticket.priority)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-white/40 font-mono text-xs">
                          {ticket.ticketNumber ||
                            `TKT-${ticket.id.substring(0, 6).toUpperCase()}`}
                        </span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <h4 className="text-white font-bold text-lg mb-1 group-hover:text-[#F5A623] transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-white/50 text-sm flex items-center gap-2">
                        {ticket.category}{' '}
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        {new Date(
                          ticket.updatedAt || ticket.createdAt
                        ).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center text-white/30 group-hover:text-white/80 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL BUAT TIKET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-lg relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">
              Buat Laporan Baru
            </h3>
            <p className="text-white/50 text-sm mb-6">
              Deskripsikan kendala Anda sedetail mungkin agar teknisi kami dapat
              membantu dengan cepat.
            </p>

            <form className="space-y-4" onSubmit={handleSubmitTicket}>
              {/* KODE YANG BARU - CUSTOM DROPDOWN */}
              <div className="relative">
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Kategori Masalah
                </label>

                {/* Tombol Input Palsu (Trigger) */}
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full h-12 rounded-xl bg-white/5 border text-white px-4 flex items-center justify-between cursor-pointer transition-colors ${isDropdownOpen ? 'border-[#F5A623]/50' : 'border-white/10 hover:border-white/20'}`}
                >
                  <span className="text-sm">{category}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Menu Dropdown yang Melayang */}
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {categoriesList.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className="px-4 py-3 text-sm text-white/80 hover:bg-[#F5A623] hover:text-black hover:font-bold cursor-pointer transition-all"
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Judul Laporan
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Indikator LOS berkedip merah"
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white px-4 outline-none focus:border-[#F5A623]/50"
                  required
                />
              </div>

              <div>
                <label className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Deskripsi Detail
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan sejak kapan masalah terjadi dan lampu warna apa saja yang menyala di router..."
                  className="w-full h-32 rounded-xl bg-white/5 border border-white/10 text-white p-4 outline-none focus:border-[#F5A623]/50 resize-none"
                  required
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-black bg-[#F5A623] hover:bg-[#d98f1b] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Kirim Laporan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayoutWrapper>
  );
}
