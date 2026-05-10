'use client';

import { useState, useEffect, useRef } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import {
  Wifi, AlertTriangle, CreditCard, ChevronRight, Gauge, Ticket, Download, Upload, Zap, Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import SpeedTestEngine from '@cloudflare/speedtest'


export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<any>(null);
  const [currentBill, setCurrentBill] = useState<any>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [packageName, setPackageName] = useState<string>('Memuat paket...');

  type SpeedPhase = 'IDLE' | 'PING' | 'DOWNLOAD' | 'UPLOAD' | 'DONE';
  const [speedPhase, setSpeedPhase] = useState<SpeedPhase>('IDLE');
  const [liveMetrics, setLiveMetrics] = useState({ ping: 0, download: 0, upload: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      try {
        setIsLoading(true);
        const apiCalls = [
          api.get('/notification').catch(() => null),
          api.get('/billing').catch(() => null),
          api.get('/tickets', { params: { userId: user.id } }).catch(() => null),
        ];
        if (user.packageId && !user.package?.name) {
          apiCalls.push(api.get(`/packages/${user.packageId}`).catch(() => null));
        }
        const results = await Promise.all(apiCalls);
        const [notifRes, billingRes, ticketRes, packageRes] = results;

        const notifs = notifRes?.data?.data || notifRes?.data || [];
        if (notifs.length > 0) setNotification(notifs[0]);

        const bills = billingRes?.data?.data || billingRes?.data || [];
        if (Array.isArray(bills)) {
          const unpaid = bills.find(b => b.status === 'UNPAID' || b.status === 'PENDING');
          setCurrentBill(unpaid || null);
          setBillingHistory(bills.filter(b => b.status === 'PAID' || b.status === 'LUNAS').slice(0, 2));
        }

        const tickets = ticketRes?.data?.data || ticketRes?.data || [];
        if (Array.isArray(tickets)) {
          setActiveTickets(tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').slice(0, 2));
        }

        const fetchedPackage = packageRes?.data?.data || packageRes?.data;
        setPackageName(fetchedPackage?.name || user.package?.name || 'Paket Internet Aktif');
      } catch {
        setPackageName('Paket Internet');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user?.id]);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

  // ── Live counter animasi selama download/upload ────────────
  const startLiveCounter = (field: 'download' | 'upload', targetMbps: number, durationMs: number) => {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // easing: progress melambat di awal, cepat di tengah
      const eased = 1 - Math.pow(1 - progress, 2);
      const current = +(eased * targetMbps).toFixed(1);
      setLiveMetrics(prev => ({ ...prev, [field]: current }));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const stopLiveCounter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // ── Speed test engine ──────────────────────────────────────
  const handleStartSpeedTest = () => {
    if (speedPhase !== 'IDLE' && speedPhase !== 'DONE') return;
    setSpeedPhase('PING');
    setLiveMetrics({ ping: 0, download: 0, upload: 0 });

    const engine = new SpeedTestEngine({ autoStart: false })

    engine.onResultsChange = ({ type }: { type: string }) => {
      if (type === 'latency') {
        const ping = engine.results.getUnloadedLatency()
        if (ping) setLiveMetrics(prev => ({ ...prev, ping: Math.round(ping) }))
      }
      if (type === 'download') {
        setSpeedPhase('DOWNLOAD')
        const dl = engine.results.getDownloadBandwidth()
        if (dl) setLiveMetrics(prev => ({ ...prev, download: +(dl / 1_000_000).toFixed(1) }))
      }
      if (type === 'upload') {
        setSpeedPhase('UPLOAD')
        const ul = engine.results.getUploadBandwidth()
        if (ul) setLiveMetrics(prev => ({ ...prev, upload: +(ul / 1_000_000).toFixed(1) }))
      }
    }

    engine.onFinish = (results) => {
      const summary = results.getSummary()
      setLiveMetrics({
        ping: Math.round(summary.latency ?? 0),
        download: +((summary.download ?? 0) / 1_000_000).toFixed(1),
        upload: +((summary.upload ?? 0) / 1_000_000).toFixed(1),
      })
      setSpeedPhase('DONE')
    }

    engine.onError = (err) => {
      console.error('Speedtest error:', err)
      setSpeedPhase('DONE')
    }

    engine.play() // ← start setelah semua handler terpasang
  }

  // Gauge visual berdasarkan nilai download
  const getSpeedColor = (mbps: number) => {
    if (mbps >= 50) return 'text-green-400';
    if (mbps >= 20) return 'text-[#F5A623]';
    return 'text-red-400';
  };

  const getSpeedLabel = (mbps: number) => {
    if (mbps >= 50) return 'Sangat Cepat';
    if (mbps >= 20) return 'Normal';
    if (mbps > 0) return 'Lambat';
    return '';
  };

  if (isLoading) {
    return (
      <UserLayoutWrapper title="Beranda">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </UserLayoutWrapper>
    );
  }

  const currentLiveValue = speedPhase === 'PING'
    ? liveMetrics.ping
    : speedPhase === 'DOWNLOAD'
      ? liveMetrics.download
      : liveMetrics.upload;

  const currentUnit = speedPhase === 'PING' ? 'ms' : 'Mbps';

  return (
    <UserLayoutWrapper title="Beranda">
      <div className="max-w-6xl mx-auto space-y-6">

        {notification && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start sm:items-center gap-4">
            <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400 shrink-0"><AlertTriangle className="w-5 h-5" /></div>
            <div className="flex-1">
              <h4 className="text-blue-400 font-bold text-sm">{notification.title || 'Informasi Penting'}</h4>
              <p className="text-white/60 text-xs mt-1">{notification.message || notification.content}</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-white">Halo, {user?.fullName || 'Pelanggan'}! 👋</h2>
          <p className="text-white/50 text-sm mt-1">Selamat datang di portal layanan internet CAKRANA Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Kartu Paket */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Wifi className="w-32 h-32" /></div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex h-4 w-4">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${currentBill ? 'bg-red-400 animate-pulse' : 'bg-green-400 animate-ping'}`}></span>
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${currentBill ? 'bg-red-500' : 'bg-green-500'}`}></span>
                </div>
                <span className={`${currentBill ? 'text-red-400' : 'text-green-400'} font-bold tracking-wider text-sm uppercase`}>
                  {currentBill ? 'Menunggu Pembayaran' : 'Koneksi Aktif'}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{packageName}</h3>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Kode Pelanggan</p>
                <p className="text-white/80 font-mono text-sm mt-1">{user?.customerCode || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold text-right">Status Akun</p>
                <p className="text-white/80 font-mono text-sm mt-1 text-right">AKTIF</p>
              </div>
            </div>
          </div>

          {/* Kartu Tagihan */}
          <div className={`${currentBill ? 'bg-[#F5A623] shadow-[0_0_40px_rgba(245,166,35,0.15)]' : 'bg-[#1A1A1A] border border-white/5'} rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all`}>
            {currentBill && <div className="absolute -right-6 -top-6 bg-white/20 w-32 h-32 rounded-full blur-2xl"></div>}
            <div>
              <div className={`flex items-center gap-2 mb-4 font-bold text-sm uppercase tracking-wider ${currentBill ? 'text-black/60' : 'text-white/40'}`}>
                <CreditCard className="w-5 h-5" /> Tagihan Saat Ini
              </div>
              {currentBill ? (
                <>
                  <h3 className="text-4xl font-black text-black tracking-tight">{formatRupiah(currentBill.amount || currentBill.total)}</h3>
                  <p className="text-black/70 font-medium mt-2">Jatuh tempo: {new Date(currentBill.dueDate || currentBill.createdAt).toLocaleDateString('id-ID')}</p>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-black text-white/20 tracking-tight">Rp 0</h3>
                  <p className="text-white/40 font-medium mt-2">Semua tagihan sudah lunas.</p>
                </>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/tagihan')}
              disabled={!currentBill}
              className={`mt-8 w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group ${currentBill ? 'bg-black text-white hover:bg-black/80' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
            >
              {currentBill ? 'Bayar Sekarang' : 'Riwayat Tagihan'}
              <ChevronRight className={`w-5 h-5 ${currentBill ? 'group-hover:translate-x-1 transition-transform' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* SPEED TEST WIDGET */}
          <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-6 lg:col-span-1 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-[#F5A623]/10 p-2 rounded-xl text-[#F5A623]"><Gauge className="w-5 h-5" /></div>
              <h3 className="text-white font-bold">Uji Kecepatan</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {speedPhase === 'IDLE' ? (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 border border-[#F5A623]/30 rounded-full animate-pulse"></div>
                    <Wifi className="w-8 h-8 text-[#F5A623]" />
                  </div>
                  <p className="text-white/40 text-sm">Uji kecepatan internet kamu secara real-time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Live main display */}
                  <div className="text-center bg-black/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F5A623]/10 to-transparent opacity-50"></div>
                    <span className="text-[10px] uppercase tracking-widest text-[#F5A623] font-bold">
                      {speedPhase === 'PING' && '⚡ Mengukur Latensi...'}
                      {speedPhase === 'DOWNLOAD' && '⬇ Mengunduh Paket Data...'}
                      {speedPhase === 'UPLOAD' && '⬆ Mengunggah Paket Data...'}
                      {speedPhase === 'DONE' && '✓ Pengujian Selesai'}
                    </span>
                    <div className={`text-5xl font-black mt-2 font-mono tracking-tighter transition-colors ${speedPhase === 'DONE' ? getSpeedColor(liveMetrics.download) : 'text-white'}`}>
                      {speedPhase === 'DONE'
                        ? liveMetrics.download.toFixed(1)
                        : typeof currentLiveValue === 'number'
                          ? speedPhase === 'PING'
                            ? currentLiveValue
                            : currentLiveValue.toFixed(1)
                          : '0'
                      }
                      <span className="text-sm font-medium text-white/40 ml-1">{speedPhase === 'DONE' ? 'Mbps' : currentUnit}</span>
                    </div>
                    {speedPhase === 'DONE' && liveMetrics.download > 0 && (
                      <p className={`text-xs font-bold mt-1 ${getSpeedColor(liveMetrics.download)}`}>{getSpeedLabel(liveMetrics.download)}</p>
                    )}
                    {speedPhase !== 'DONE' && speedPhase !== 'DOWNLOAD' && (
                      <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F5A623] rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                  </div>

                  {/* 3 metric boxes */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`flex flex-col items-center p-3 rounded-xl border transition-all ${speedPhase === 'PING' ? 'border-[#F5A623] bg-[#F5A623]/10 animate-pulse' : 'border-white/5 bg-black/30'}`}>
                      <Zap className={`w-4 h-4 mb-1 ${speedPhase === 'PING' ? 'text-[#F5A623]' : 'text-white/40'}`} />
                      <span className="text-white font-bold font-mono text-sm">{liveMetrics.ping > 0 ? liveMetrics.ping : '--'}</span>
                      <span className="text-[8px] text-white/40 uppercase mt-0.5">ms</span>
                    </div>
                    <div className={`flex flex-col items-center p-3 rounded-xl border transition-all ${speedPhase === 'DOWNLOAD' ? 'border-green-400 bg-green-400/10 animate-pulse' : 'border-white/5 bg-black/30'}`}>
                      <Download className={`w-4 h-4 mb-1 ${speedPhase === 'DOWNLOAD' ? 'text-green-400' : 'text-white/40'}`} />
                      <span className="text-white font-bold font-mono text-sm">
                        {speedPhase === 'PING' ? '--' : liveMetrics.download > 0 ? liveMetrics.download.toFixed(1) : '--'}
                      </span>
                      <span className="text-[8px] text-white/40 uppercase mt-0.5">Unduh</span>
                    </div>
                    <div className={`flex flex-col items-center p-3 rounded-xl border transition-all ${speedPhase === 'UPLOAD' ? 'border-blue-400 bg-blue-400/10 animate-pulse' : 'border-white/5 bg-black/30'}`}>
                      <Upload className={`w-4 h-4 mb-1 ${speedPhase === 'UPLOAD' ? 'text-blue-400' : 'text-white/40'}`} />
                      <span className="text-white font-bold font-mono text-sm">
                        {speedPhase === 'DONE' ? liveMetrics.upload.toFixed(1) : speedPhase === 'UPLOAD' ? liveMetrics.upload.toFixed(1) : '--'}
                      </span>
                      <span className="text-[8px] text-white/40 uppercase mt-0.5">Unggah</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleStartSpeedTest}
              disabled={speedPhase !== 'IDLE' && speedPhase !== 'DONE'}
              className="w-full bg-white/5 hover:bg-[#F5A623] hover:text-black border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {speedPhase === 'IDLE' ? 'Mulai Speed Test' : speedPhase === 'DONE' ? '↺ Uji Ulang' : 'Mengukur...'}
            </button>
          </div>

          {/* Tiket & Riwayat */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500/10 p-2 rounded-xl text-red-400"><Ticket className="w-5 h-5" /></div>
                  <h3 className="text-white font-bold">Tiket Aktif</h3>
                </div>
                <button onClick={() => router.push('/dashboard/bantuan')} className="text-[#F5A623] text-xs font-bold hover:underline">Lihat Semua</button>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                {activeTickets.length > 0 ? (
                  activeTickets.map(ticket => (
                    <div key={ticket.id} onClick={() => router.push(`/dashboard/bantuan/${ticket.id}`)} className="bg-black/30 p-4 rounded-xl border border-white/5 cursor-pointer hover:border-[#F5A623]/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white text-sm font-bold group-hover:text-[#F5A623] transition-colors line-clamp-1">{ticket.title || ticket.subject}</h4>
                        <span className={`text-[9px] px-2 py-1 rounded font-bold tracking-wider ${ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{ticket.status}</span>
                      </div>
                      <p className="text-[10px] text-white/40">Dibuat: {new Date(ticket.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Tidak ada laporan aktif.</div>
                )}
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-white/5 rounded-[2rem] p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-xl text-green-400"><CreditCard className="w-5 h-5" /></div>
                  <h3 className="text-white font-bold">Riwayat Bayar</h3>
                </div>
              </div>
              <div className="space-y-3">
                {billingHistory.length > 0 ? (
                  billingHistory.map(bill => (
                    <div key={bill.id} className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
                      <div>
                        <h4 className="text-white text-sm font-bold">{formatRupiah(bill.amount || bill.total)}</h4>
                        <p className="text-[10px] text-white/40 mt-1">{new Date(bill.updatedAt || bill.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <span className="text-[9px] px-2 py-1 bg-green-500/10 text-green-400 rounded font-bold tracking-wider">{bill.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex h-full items-center justify-center text-white/30 text-sm">Belum ada riwayat lunas.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayoutWrapper>
  );
}