'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import { Plus, MessageSquare, ChevronRight, AlertCircle, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function BantuanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState(''); // Diganti jadi title
  const [category, setCategory] = useState('GANGGUAN');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    // Pastikan user sudah ter-load dari store
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data } = await api.get('/tickets', {
        // Mengirimkan query parameter userId ke backend Fikar
        params: { 
          userId: user.id 
        }
      });
      
      // Sesuaikan dengan struktur return backend Fikar (data.data)
      setTickets(data.data || data);
    } catch (error) {
      console.error("Gagal mengambil data tiket pribadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
    }
  }, [user?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Backend pakai 'title'
      const { data } = await api.post('/tickets', { title, category, description });
      toast.success('Laporan berhasil terkirim!');
      router.push(`/dashboard/bantuan/${data.data?.id || data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal kirim laporan');
    } finally { setIsSubmitting(false); }
  };

  return (
    <UserLayoutWrapper title="Pusat Bantuan">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Bantuan & Laporan</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#F5A623] text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus className="w-5 h-5" /> Buat Laporan
          </button>
        </div>

        <div className="grid gap-3">
          {isLoading ? (
            <div className="py-20 text-center"><div className="inline-block w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div></div>
          ) : tickets.length === 0 ? (
            <div className="bg-[#1A1A1A] border border-white/5 p-12 rounded-3xl text-center text-white/40">Belum ada laporan kendala.</div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} onClick={() => router.push(`/dashboard/bantuan/${t.id}`)} className="bg-[#1A1A1A] border border-white/5 p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#F5A623]/40 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${t.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}><AlertCircle /></div>
                  <div>
                    {/* Backend pakai 'title' */}
                    <h4 className="text-white font-bold">{t.title}</h4>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">{t.category} • {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight className="text-white/20" />
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 w-full max-w-lg rounded-[2rem] p-8 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-white/20 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6">Laporan Baru</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#F5A623]">
                <option value="GANGGUAN">Gangguan Koneksi</option>
                <option value="TAGIHAN">Masalah Tagihan</option>
                <option value="LAINNYA">Lain-lain</option>
              </select>
              <input required placeholder="Judul Masalah" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#F5A623]" />
              <textarea required rows={4} placeholder="Jelaskan kendala Anda..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#F5A623] resize-none" />
              <button disabled={isSubmitting} className="w-full bg-[#F5A623] text-black font-bold py-4 rounded-xl disabled:opacity-50">
                {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </UserLayoutWrapper>
  );
}