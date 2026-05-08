'use client';

import { useState, useEffect } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import { useAuthStore } from '@/store/auth.store';
import {
  ShieldCheck,
  AlertCircle,
  Zap,
  CreditCard,
  ArrowRight,
  Activity,
  Clock,
  LifeBuoy,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api'; // Import instance axios kamu

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Fungsi untuk menarik data tagihan asli dari backend
    const fetchActiveInvoice = async () => {
      try {
        setIsLoadingInvoice(true);
        // Mengambil tagihan yang berstatus UNPAID
        const { data } = await api.get('/billing', {
          params: { status: 'UNPAID', limit: 1, userId: user?.id },
        });

        // Menyesuaikan dengan standar response (biasanya ada di dalam properti .data)
        const invoices = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);

        if (invoices.length > 0) {
          setActiveInvoice(invoices[0]);
        }
      } catch (error) {
        console.error('Gagal menarik data tagihan:', error);
      } finally {
        setIsLoadingInvoice(false);
      }
    };

    // Hanya panggil API jika user sudah ter-load
    if (user) {
      fetchActiveInvoice();
    }
  }, [user]);

  if (!mounted) return null;

  const isConnected = user?.status === 'ACTIVE';
  const currentBill = activeInvoice ? activeInvoice.totalAmount : 0;
  const dueDate = activeInvoice ? activeInvoice.dueDate : null;

  return (
    <UserLayoutWrapper title="Beranda">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Ucapan Selamat Datang */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Halo, {user?.fullName?.split(' ')[0] || 'Pelanggan'}! 👋
          </h2>
          <p className="text-white/50 mt-1">
            Selamat datang di portal manajemen layanan internet Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KARTU 1: STATUS KONEKSI */}
          <div className="lg:col-span-2 bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Zap className="w-40 h-40 text-[#F5A623]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-white/50 font-medium text-sm mb-2 uppercase tracking-wider">
                  Status Jaringan
                </p>
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20">
                        <ShieldCheck className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          Aktif & Stabil
                        </h3>
                        <p className="text-green-400 text-sm flex items-center gap-1 mt-1">
                          <Activity className="w-3.5 h-3.5" /> Terhubung ke
                          Jaringan CAKRANA
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <Clock className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          Menunggu Pemasangan
                        </h3>
                        <p className="text-yellow-400 text-sm flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Teknisi akan
                          segera datang
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 w-full md:w-auto backdrop-blur-sm">
                <p className="text-white/40 text-xs mb-1">Paket Saat Ini</p>
                <p className="text-white font-bold text-lg">
                  {user?.package?.name || 'Menunggu Survei'}
                </p>
              </div>
            </div>
          </div>

          {/* KARTU 2: INFO TAGIHAN */}
          <div className="bg-gradient-to-br from-[#F5A623] to-[#d98f1b] rounded-3xl p-6 md:p-8 text-black shadow-xl shadow-[#F5A623]/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-black/10 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                {activeInvoice && (
                  <span className="text-xs font-bold px-3 py-1 bg-black/10 rounded-full uppercase tracking-wider">
                    Bulan Ini
                  </span>
                )}
              </div>

              <p className="text-black/70 font-medium text-sm mb-1">
                Total Tagihan
              </p>

              {isLoadingInvoice ? (
                <div className="h-10 bg-black/10 rounded w-3/4 animate-pulse mt-2"></div>
              ) : activeInvoice ? (
                <>
                  <h3 className="text-4xl font-black tracking-tight">
                    Rp {currentBill.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-black/80 text-sm mt-3 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Jatuh Tempo:{' '}
                    {new Date(dueDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-black tracking-tight mt-2">
                    Rp 0
                  </h3>
                  <p className="text-black/80 text-sm mt-2 font-medium">
                    Semua tagihan lunas!
                  </p>
                </>
              )}
            </div>

            <Link href="/dashboard/tagihan" className="mt-6">
              <button
                className="w-full bg-black text-white hover:bg-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                disabled={!activeInvoice}
              >
                {activeInvoice ? 'Bayar Sekarang' : 'Lihat Riwayat'}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-8">
          <h3 className="text-white font-bold text-lg mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/dashboard/bantuan">
              <div className="bg-[#1A1A1A] hover:bg-white/5 transition-colors border border-white/5 rounded-2xl p-5 flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F5A623]/20 transition-colors">
                  <LifeBuoy className="w-5 h-5 text-white/50 group-hover:text-[#F5A623] transition-colors" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Lapor Gangguan</h4>
                  <p className="text-white/40 text-xs mt-0.5">
                    Buat tiket pengaduan teknis
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/pengaturan">
              <div className="bg-[#1A1A1A] hover:bg-white/5 transition-colors border border-white/5 rounded-2xl p-5 flex items-center gap-4 cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F5A623]/20 transition-colors">
                  <Settings className="w-5 h-5 text-white/50 group-hover:text-[#F5A623] transition-colors" />
                </div>
                <div>
                  <h4 className="text-white font-bold">Pengaturan Akun</h4>
                  <p className="text-white/40 text-xs mt-0.5">
                    Ubah password & data diri
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </UserLayoutWrapper>
  );
}
