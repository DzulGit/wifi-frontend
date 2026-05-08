'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token aktivasi tidak ditemukan di URL.');
      return;
    }

    const verifyToken = async () => {
      try {
        // Asumsi rute backend untuk aktivasi adalah /auth/activate
        // Sesuaikan jika temanmu menggunakan nama rute lain (misal: /users/activate)
        await api.post('/auth/activate', { token });
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Link aktivasi tidak valid atau sudah kadaluarsa.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="bg-[#1f1f1f] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden z-10">
      {status === 'loading' && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-16 h-16 text-[#F5A623] animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Memverifikasi Akun...</h2>
          <p className="text-white/50 text-sm">Mohon tunggu sebentar, kami sedang mengecek data Anda.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Aktivasi Berhasil!</h2>
          <p className="text-white/50 text-sm mb-8">Akun CAKRANA Anda sudah aktif. Sekarang Anda dapat masuk ke Portal Pelanggan.</p>
          <Link href="/login" className="w-full">
            <button className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg">
              Masuk Sekarang <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Aktivasi Gagal</h2>
          <p className="text-red-400/80 text-sm mb-8">{message}</p>
          <Link href="/login" className="w-full">
            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10">
              Kembali ke Halaman Login
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Komponen Utama dibungkus Suspense agar aman di Next.js App Router
export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#F5A623 1px, transparent 1px), linear-gradient(90deg, #F5A623 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-[#F5A623]" />}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}