'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Token tidak valid");
    if (password.length < 8) return toast.error("Password minimal 8 karakter");

    try {
      setStatus('loading');
      // SEKARANG KITA KIRIM TOKEN DAN PASSWORD SESUAI KEBUTUHAN BACKEND
      await api.post('/auth/activate', { token, password });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Gagal mengaktifkan akun.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-green-500/20">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Aktivasi Berhasil!</h2>
        <p className="text-white/50 text-sm mb-8">Akun Anda aktif dan password telah disimpan. Silakan masuk.</p>
        <Link href="/login" className="w-full">
          <button className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            Masuk Sekarang <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Aktivasi Akun</h2>
        <p className="text-white/50 text-sm">Silakan buat password untuk mengaktifkan akun Anda.</p>
      </div>

      <form onSubmit={handleActivate} className="space-y-6">
        <div className="space-y-2">
          <label className="text-white/50 text-xs font-bold uppercase ml-1">Buat Password Baru</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
            <input 
              type={showPass ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
          className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aktifkan Akun Saya"}
        </button>

        {status === 'error' && (
          <p className="text-red-500 text-xs text-center mt-4 font-medium italic">{message}</p>
        )}
      </form>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F5A623]/5 rounded-full blur-[120px]" />
      <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-[#F5A623]" />}>
        <ActivateContent />
      </Suspense>
    </div>
  );
}