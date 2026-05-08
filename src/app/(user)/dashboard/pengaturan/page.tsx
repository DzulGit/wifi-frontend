'use client';

import { useState } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import { useAuthStore } from '@/store/auth.store';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Save, 
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PengaturanPage() {
  const { user } = useAuthStore();
  
  // State Profil
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // State Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      // Ganti '/users/profile' sesuai endpoint backend temanmu
      await api.patch(`/users/${user?.id}`, { fullName, phoneNumber });
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok!");
    }
    
    try {
      setIsUpdatingPassword(true);
      await api.post('/auth/change-password', { oldPassword, newPassword });
      toast.success("Password berhasil diubah!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengubah password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <UserLayoutWrapper title="Pengaturan Akun">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SECTION 1: PROFIL */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 bg-[#F5A623]/10 rounded-lg text-[#F5A623]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">Informasi Dasar</h3>
              <p className="text-white/40 text-xs tracking-wide">Kelola data diri Anda yang terdaftar di CAKRANA.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-white/50 text-xs font-bold uppercase ml-1">Email (Akun Utama)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type="text" 
                    value={user?.email || ''} 
                    disabled 
                    className="w-full h-12 pl-12 bg-white/[0.02] border border-white/5 rounded-xl text-white/30 cursor-not-allowed italic"
                  />
                </div>
                <p className="text-[10px] text-white/20 ml-1 italic">* Email tidak dapat diubah secara mandiri.</p>
              </div>

              <div className="space-y-2">
                <label className="text-white/50 text-xs font-bold uppercase ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full h-12 pl-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/50 text-xs font-bold uppercase ml-1">Nomor WhatsApp</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#F5A623] transition-colors" />
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full h-12 pl-12 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-[#F5A623]/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full h-12 bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isUpdatingProfile ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* SECTION 2: KEAMANAN */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold">Keamanan & Password</h3>
              <p className="text-white/40 text-xs tracking-wide">Amankan akun Anda dengan mengganti password secara berkala.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Password Lama */}
              <div className="space-y-2">
                <label className="text-white/50 text-[10px] font-bold uppercase ml-1">Password Saat Ini</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-red-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-2">
                <label className="text-white/50 text-[10px] font-bold uppercase ml-1">Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-green-500/50 transition-all"
                    placeholder="Min. 8 karakter"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-2">
                <label className="text-white/50 text-[10px] font-bold uppercase ml-1">Konfirmasi Password Baru</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 pl-11 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-green-500/50 transition-all"
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button 
                type="submit" 
                disabled={isUpdatingPassword}
                className="w-full md:w-auto px-10 h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 disabled:opacity-50"
              >
                {isUpdatingPassword ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Perbarui Password"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </UserLayoutWrapper>
  );
}