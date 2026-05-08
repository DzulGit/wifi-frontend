'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

// Kita pisahkan kontennya agar aman menggunakan useSearchParams di Next.js App Router
function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Jika tidak ada token di URL, langsung hentikan
    if (!token) {
      setStatus('error');
      setMessage('Token aktivasi tidak ditemukan atau tidak valid.');
      return;
    }

    const verifyAccount = async () => {
      try {
        // Sesuaikan endpoint ini dengan backend temenmu (misal: /auth/activate atau /users/activate)
        await api.post('/auth/activate', { token });
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Gagal mengaktifkan akun. Token mungkin sudah kadaluarsa.');
      }
    };

    verifyAccount();
  }, [token]);

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative z-10">
      {status === 'loading' && (
        <div className="flex flex-col items-center py-4">
          <Loader2 className="w-16 h-16 text-[#F5A623] animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Memverifikasi Akun</h2>
          <p className="text-white/50 text-sm">Sedang memproses aktivasi akun CAKRANA Anda...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Akun Berhasil Aktif!</h2>
          <p className="text-white/50 text-sm mb-8">Selamat! Akun Anda telah berhasil diverifikasi. Silakan masuk untuk melanjutkan.</p>
          <Link href="/login" className="w-full">
            <button className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              Masuk ke Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center py-4 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verifikasi Gagal</h2>
          <p className="text-red-400/80 text-sm mb-8">{message}</p>
          <Link href="/login" className="w-full">
            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/10">
              Kembali ke Login
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Ini adalah DEFAULT EXPORT yang diminta oleh Next.js
export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ornamen */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F5A623]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#F5A623]/5 rounded-full blur-[120px]" />
      
      {/* Suspense wajib ada jika menggunakan useSearchParams di Client Component Next.js 13+ */}
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-[#F5A623]" />}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}