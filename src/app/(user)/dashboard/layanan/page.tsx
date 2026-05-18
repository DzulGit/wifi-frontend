'use client';

import { useState, useEffect } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import {
  Package,
  MapPin,
  XOctagon,
  X,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

// ─── Tipe lokal agar aman dari TypeScript ────────────────────────────────────
interface ServiceRequest {
  id: string;
  type: 'PACKAGE_CHANGE' | 'ADDRESS_MOVE' | 'CANCELLATION';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string | null;
  createdAt: string;
}

interface ActiveRequestResponse {
  hasActiveRequest: boolean;
  request: ServiceRequest | null;
  lastRequest: ServiceRequest | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const REQUEST_TYPE_LABEL: Record<ServiceRequest['type'], string> = {
  PACKAGE_CHANGE: 'Ganti Paket',
  ADDRESS_MOVE: 'Pindah Alamat',
  CANCELLATION: 'Putus Langganan',
};

const getLabel = (type?: ServiceRequest['type']) =>
  type ? (REQUEST_TYPE_LABEL[type] ?? type) : '-';

// ─────────────────────────────────────────────────────────────────────────────
export default function LayananAkunPage() {
  const { user } = useAuthStore();

  // State: Data
  const [packages, setPackages] = useState<{ id: string; name: string; price: number }[]>([]);

  // State: Lock System (PENDING)
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);

  // State: Interstitial System (APPROVED / REJECTED)
  const [lastRequest, setLastRequest] = useState<ServiceRequest | null>(null);
  const [hasConfirmedLastRequest, setHasConfirmedLastRequest] = useState(true); // default true = tidak diblokir

  const [isLoadingLock, setIsLoadingLock] = useState(true);

  // State: Modal & Form
  const [activeModal, setActiveModal] = useState<'package' | 'move' | 'cancel' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPackageId, setNewPackageId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [reason, setReason] = useState('');

  // ── Fetch data saat mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // Paket internet
        const resPackages = await api.get('/packages');
        setPackages(resPackages.data.data ?? resPackages.data);

        // Status pengajuan
        const resActive = await api.get<ActiveRequestResponse>('/service-requests/active');
        const { hasActiveRequest, request, lastRequest: lr } = resActive.data;

        // Lock Screen: PENDING
        if (hasActiveRequest && request) {
          setActiveRequest(request);
        }

        // Interstitial Screen: APPROVED / REJECTED
        if (lr) {
          setLastRequest(lr);

          if (lr.status === 'APPROVED' || lr.status === 'REJECTED') {
            // Cek apakah user sudah pernah menekan tombol OK sebelumnya
            const alreadyConfirmed =
              localStorage.getItem(`confirmed_req_${lr.id}`) === 'true';
            setHasConfirmedLastRequest(alreadyConfirmed);
          } else {
            // Status PENDING → tidak perlu interstitial, langsung confirmed
            setHasConfirmedLastRequest(true);
          }
        }
      } catch (error) {
        console.error('Gagal mengambil data', error);
      } finally {
        setIsLoadingLock(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // ── Handler tombol OK di layar interstitial ───────────────────────────────
  const handleConfirmLastRequest = () => {
    if (lastRequest?.id) {
      localStorage.setItem(`confirmed_req_${lastRequest.id}`, 'true');
    }
    setHasConfirmedLastRequest(true);
  };

  // ── Handler modal ─────────────────────────────────────────────────────────
  const closeModal = () => {
    setActiveModal(null);
    setNewPackageId('');
    setNewAddress('');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return toast.error('Sesi tidak valid, harap login ulang');

    setIsSubmitting(true);
    try {
      if (activeModal === 'package') {
        await api.post('/service-requests', {
          type: 'PACKAGE_CHANGE',
          requestData: { newPackageId },
        });
        toast.success('Permintaan Ganti Paket berhasil dikirim ke Admin!');
      } else if (activeModal === 'move') {
        await api.post('/service-requests', {
          type: 'ADDRESS_MOVE',
          requestData: { newAddress },
        });
        toast.success('Permintaan Pindah Alamat berhasil dikirim ke Admin!');
      } else if (activeModal === 'cancel') {
        await api.post('/service-requests', {
          type: 'CANCELLATION',
          requestData: { reason },
        });
        toast.success('Permintaan Putus Berlangganan berhasil dikirim.');
      }

      closeModal();
      window.location.reload();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Gagal mengirim permintaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAMPILAN 1 — LOADING
  // ══════════════════════════════════════════════════════════════════════════
  if (isLoadingLock) {
    return (
      <UserLayoutWrapper title="Layanan & Akun">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623]" />
        </div>
      </UserLayoutWrapper>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAMPILAN 2A — INTERSTITIAL: APPROVED (Hijau)
  //   Muncul jika pengajuan terakhir DISETUJUI dan user belum konfirmasi
  // ══════════════════════════════════════════════════════════════════════════
  if (lastRequest?.status === 'APPROVED' && !hasConfirmedLastRequest) {
    return (
      <UserLayoutWrapper title="Layanan & Akun">
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-[#1A1A1A] border border-emerald-500/30 rounded-[2rem] p-10 text-center flex flex-col items-center shadow-[0_0_40px_rgba(16,185,129,0.08)]">
            {/* Icon */}
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            {/* Judul */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Pengajuan Disetujui!
            </h2>

            {/* Keterangan */}
            <p className="text-white/60 mb-3 max-w-md leading-relaxed">
              Permohonan{' '}
              <strong className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {getLabel(lastRequest?.type)}
              </strong>{' '}
              Anda telah <strong className="text-white">disetujui</strong> oleh Admin.
              Perubahan layanan akan segera berlaku sesuai kebijakan yang berlaku.
            </p>

            {lastRequest?.adminNotes && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 mb-6 w-full text-left">
                <p className="text-xs text-emerald-400/70 mb-1 font-semibold uppercase tracking-wide">
                  Catatan Admin
                </p>
                <p className="text-sm text-emerald-300 leading-relaxed">
                  "{lastRequest.adminNotes}"
                </p>
              </div>
            )}

            {/* Tombol Konfirmasi */}
            <button
              onClick={handleConfirmLastRequest}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      </UserLayoutWrapper>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAMPILAN 2B — INTERSTITIAL: REJECTED (Merah)
  //   Muncul jika pengajuan terakhir DITOLAK dan user belum konfirmasi
  // ══════════════════════════════════════════════════════════════════════════
  if (lastRequest?.status === 'REJECTED' && !hasConfirmedLastRequest) {
    return (
      <UserLayoutWrapper title="Layanan & Akun">
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-[#1A1A1A] border border-red-500/30 rounded-[2rem] p-10 text-center flex flex-col items-center shadow-[0_0_40px_rgba(239,68,68,0.08)]">
            {/* Icon */}
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <Ban className="w-12 h-12 text-red-400" />
            </div>

            {/* Judul */}
            <h2 className="text-2xl font-bold text-white mb-3">
              Pengajuan Ditolak
            </h2>

            {/* Keterangan */}
            <p className="text-white/60 mb-4 max-w-md leading-relaxed">
              Mohon maaf, permohonan{' '}
              <strong className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                {getLabel(lastRequest?.type)}
              </strong>{' '}
              Anda <strong className="text-white">tidak dapat diproses</strong> oleh Admin.
            </p>

            {/* Alasan Penolakan */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-8 w-full text-left">
              <p className="text-xs text-red-400/70 mb-1 font-semibold uppercase tracking-wide">
                Alasan Penolakan
              </p>
              <p className="text-sm text-red-300 leading-relaxed">
                "{lastRequest?.adminNotes ?? 'Tidak ada alasan spesifik yang diberikan.'}"
              </p>
            </div>

            {/* Tombol Konfirmasi */}
            <button
              onClick={handleConfirmLastRequest}
              className="px-8 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
            >
              OK, Coba Ajukan Ulang
            </button>
          </div>
        </div>
      </UserLayoutWrapper>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAMPILAN 3 — LOCK SCREEN (Ada pengajuan PENDING)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeRequest) {
    return (
      <UserLayoutWrapper title="Layanan & Akun">
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-[#1A1A1A] border border-[#F5A623]/20 rounded-[2rem] p-10 text-center flex flex-col items-center shadow-[0_0_30px_rgba(245,166,35,0.05)]">
            <div className="w-24 h-24 bg-[#F5A623]/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Clock className="w-12 h-12 text-[#F5A623]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Permintaan Sedang Diproses
            </h2>
            <p className="text-white/60 mb-8 max-w-md leading-relaxed">
              Anda telah mengajukan permintaan{' '}
              <strong className="text-white bg-white/10 px-2 py-0.5 rounded">
                {getLabel(activeRequest?.type)}
              </strong>
              . Mohon tunggu hingga Admin selesai memproses pengajuan Anda sebelum
              melakukan pengajuan layanan lainnya.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10"
            >
              Perbarui Status
            </button>
          </div>
        </div>
      </UserLayoutWrapper>
    );
  }

  // TAMPILAN BARU: JIKA PUTUS LANGGANAN SUDAH DI-ACC & USER SUDAH KLIK OK
  // (Mencegah user masuk ke form normal lagi karena layanannya sudah berhenti)
  if (lastRequest?.type === 'CANCELLATION' && lastRequest?.status === 'APPROVED' && hasConfirmedLastRequest) {
    return (
      <UserLayoutWrapper title="Layanan Dinonaktifkan">
        <div className="max-w-2xl mx-auto mt-10">
          <div className="bg-[#1A1A1A] border border-red-500/20 rounded-[2rem] p-10 text-center flex flex-col items-center shadow-[0_0_30px_rgba(239,68,68,0.03)]">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Layanan Internet Berhenti</h2>
            <p className="text-white/60 mb-6 max-w-md leading-relaxed">
              Status langganan WiFi Anda telah **Nonaktif** sesuai dengan permintaan pemutusan yang telah disetujui oleh Admin.
            </p>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white/50 text-left max-w-md space-y-2">
              <p>⚠️ <strong>Informasi Masa Tenggang:</strong></p>
              <p>• Akun Anda akan memasuki status <strong>SUSPENDED</strong> otomatis dalam waktu 3 bulan jika tidak ada re-aktivasi.</p>
              <p>• Data akun Anda akan <strong>DIHAPUS PERMANEN</strong> dari sistem setelah 6 bulan.</p>
            </div>
          </div>
        </div>
      </UserLayoutWrapper>
    );
  }

  // =================================================================
  // TAMPILAN 5: NORMAL (Hanya untuk user aktif / request biasa)
  // =================================================================
  return (
    <UserLayoutWrapper title="Layanan & Akun">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Layanan & Akun</h1>
          <p className="text-white/50 text-sm mt-1">
            Ajukan perubahan layanan internet Anda di sini.
          </p>
        </div>

        <div className="grid gap-4 mt-6">
          {/* Menu 1: Ganti Paket */}
          <div
            onClick={() => setActiveModal('package')}
            className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#F5A623]/40 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Ganti Paket Internet</h3>
                <p className="text-white/40 text-sm">Upgrade atau Downgrade paket WiFi Anda saat ini</p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white/60 transition-colors" />
          </div>

          {/* Menu 2: Pindah Alamat */}
          <div
            onClick={() => setActiveModal('move')}
            className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-[#F5A623]/40 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Pindah Alamat</h3>
                <p className="text-white/40 text-sm">Pindahkan lokasi pemasangan router WiFi Anda</p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white/60 transition-colors" />
          </div>

          {/* Menu 3: Putus Berlangganan */}
          <div
            onClick={() => setActiveModal('cancel')}
            className="bg-[#1A1A1A] border border-red-500/10 p-6 rounded-2xl flex items-center justify-between cursor-pointer hover:border-red-500/40 transition-all group mt-4"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                <XOctagon size={24} />
              </div>
              <div>
                <h3 className="text-red-400 font-bold text-lg">Putus Berlangganan</h3>
                <p className="text-white/40 text-sm">Ajukan permohonan berhenti berlangganan WiFi</p>
              </div>
            </div>
            <ChevronRight className="text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </div>
      </div>

      {/* ═══════════════════ MODAL GLOBAL ═══════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-white/10 w-full max-w-md rounded-[2rem] p-8 relative shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute right-6 top-6 text-white/20 hover:text-white"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">
              {activeModal === 'package' && 'Ganti Paket'}
              {activeModal === 'move' && 'Pindah Alamat'}
              {activeModal === 'cancel' && 'Putus Berlangganan'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeModal === 'package' && (
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Pilih Paket Baru</label>
                  <select
                    required
                    value={newPackageId}
                    onChange={(e) => setNewPackageId(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#F5A623]"
                  >
                    <option value="" disabled>-- Pilih Paket --</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - Rp {pkg.price.toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeModal === 'move' && (
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Alamat Baru Lengkap</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Masukkan nama jalan, RT/RW, desa, kecamatan..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#F5A623] resize-none"
                  />
                </div>
              )}

              {activeModal === 'cancel' && (
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Alasan Berhenti</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ceritakan mengapa Anda ingin berhenti berlangganan..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-black/50 border border-red-500/20 rounded-xl p-4 text-white outline-none focus:border-red-500 resize-none"
                  />
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-500 mb-1">Catatan Perubahan Layanan</h4>
                  <p className="text-xs text-amber-500/80 leading-relaxed">
                    Jika disetujui, perubahan akan mulai berlaku sesuai kebijakan Admin. Khusus ganti
                    paket, tarif baru berlaku pada{' '}
                    <strong>siklus tagihan bulan berikutnya</strong>.
                  </p>
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className={`w-full font-bold py-4 rounded-xl disabled:opacity-50 mt-4 transition-opacity ${
                  activeModal === 'cancel'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#F5A623] text-black'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Kirim Permintaan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </UserLayoutWrapper>
  );
}