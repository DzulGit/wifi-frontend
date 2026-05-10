'use client';

import { useState, useEffect } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import { Lock, Eye, EyeOff, Save, ShieldCheck, User, Mail, Phone, Hash } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

export default function UserPengaturanPage() {
  const { user, token, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // --- STATE UNTUK PROFIL ---
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // --- STATE UNTUK PASSWORD ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Isi form profil dengan data user saat komponen dimuat
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // --- HANDLER UPDATE PROFIL ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProfileLoading(true);
      
      // 1. Tembak API ke Backend
      await api.patch(`/users/${user?.id}`, {
        fullName,
        phone,
      });

      // 2. Jika lolos sampai sini, berarti API 100% sukses. Tampilkan toast!
      toast.success("Profil Diperbarui!", { description: "Data diri Anda berhasil disimpan." });
      
      // 3. Kita bungkus setAuth dengan try-catch kecil agar tidak memicu alert error
      try {
        if (token && user) {
          setUser({ ...user, fullName, phone });
        }
      } catch (stateError) {
        console.error("Gagal mengupdate state lokal:", stateError);
        // Abaikan error state ini, karena data di database sudah aman
      }

    } catch (error: any) {
      // Alert error INI sekarang HANYA akan muncul jika backend benar-benar menolak/meledak
      console.error("API Error:", error);
      toast.error("Gagal Memperbarui Profil", {
        description: error.response?.data?.message || "Terjadi kesalahan koneksi ke server."
      });
    } finally {
      setIsProfileLoading(false);
    }
  };

  // --- HANDLER UBAH PASSWORD ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password Terlalu Pendek", { description: "Minimal 8 karakter." });
    if (newPassword !== confirmPassword) return toast.error("Password Tidak Sama", { description: "Konfirmasi tidak cocok." });
    if (oldPassword === newPassword) return toast.error("Password Sama", { description: "Gunakan password yang berbeda dari sebelumnya." });

    try {
      setIsPasswordLoading(true);
      await api.patch('/auth/change-password', { oldPassword, newPassword });
      toast.success("Berhasil!", { description: "Password akun Anda berhasil diperbarui." });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) {
      toast.error("Gagal Mengubah Password", {
        description: error.response?.data?.message || "Password lama salah."
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <UserLayoutWrapper title="Pengaturan Akun">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header & Tabs */}
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2a2a2a] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[#F5A623]">
                {activeTab === 'profile' ? <User className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1">
                  {activeTab === 'profile' ? 'Profil Saya' : 'Keamanan Akun'}
                </h2>
                <p className="text-white/50 text-sm">
                  {activeTab === 'profile' ? 'Kelola informasi data diri Anda.' : 'Perbarui password untuk menjaga keamanan.'}
                </p>
              </div>
            </div>

            {/* Tombol Navigasi Tab */}
            <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'profile' ? 'bg-[#F5A623] text-black shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" /> Profil
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'security' ? 'bg-[#F5A623] text-black shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-4 h-4" /> Keamanan
              </button>
            </div>
          </div>
        </div>

        {/* --- TAB CONTENT: PROFIL --- */}
        {activeTab === 'profile' && (
          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Pelanggan (Readonly) */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">ID Pelanggan</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="text" value={user?.customerCode || 'Memuat...'} disabled className="w-full h-12 pl-12 pr-4 bg-white/[0.02] border border-white/5 rounded-xl text-white/40 cursor-not-allowed" />
                  </div>
                  <p className="text-[10px] text-white/30 ml-1">ID Pelanggan tidak dapat diubah.</p>
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input type="email" value={user?.email || 'Memuat...'} disabled className="w-full h-12 pl-12 pr-4 bg-white/[0.02] border border-white/5 rounded-xl text-white/40 cursor-not-allowed" />
                  </div>
                  <p className="text-[10px] text-white/30 ml-1">Hubungi admin untuk mengubah email.</p>
                </div>

                {/* Nama Lengkap (Editable) */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Nama Lengkap</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all" />
                  </div>
                </div>

                {/* Nomor HP (Editable) */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Nomor WhatsApp/HP</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isProfileLoading} className="bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProfileLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <><Save className="w-4 h-4" /> Simpan Profil</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- TAB CONTENT: KEAMANAN --- */}
        {activeTab === 'security' && (
          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleChangePassword} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Password Lama</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                  <input type={showOld ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Masukkan password saat ini" required className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all" />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="h-px w-full bg-white/5 my-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Password Baru</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                    <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 8 karakter" required className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase ml-1 tracking-wider">Konfirmasi Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" required className="w-full h-12 pl-12 pr-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isPasswordLoading || !oldPassword || !newPassword || !confirmPassword} className="bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isPasswordLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <><Save className="w-4 h-4" /> Perbarui Password</>}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </UserLayoutWrapper>
  );
}