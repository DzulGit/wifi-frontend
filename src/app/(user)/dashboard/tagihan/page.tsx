'use client';

import { useState, useEffect, useRef } from 'react';
import UserLayoutWrapper from '@/components/user/UserLayoutWrapper';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function UserTagihanPage() {
  const { user } = useAuthStore();
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Upload File
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pindahkan fetchInvoices ke luar useEffect agar bisa dipanggil ulang setelah bayar
  const fetchInvoices = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data } = await api.get('/billing', {
        params: { userId: user?.id },
      });

      const allInvoices = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

      // Pisahkan tagihan secara logis
      const unpaid = allInvoices.find((inv: any) => inv.status === 'UNPAID');
      const paid = allInvoices.filter((inv: any) => inv.status === 'PAID');

      setActiveInvoice(unpaid || null);
      setInvoiceHistory(paid);
    } catch (error) {
      console.error('Gagal memuat tagihan:', error);
      toast.error('Gagal memuat data tagihan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.id]);

  const getMonthName = (monthNumber: number) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    return months[monthNumber - 1] || '-';
  };

  // Fungsi saat user memilih file gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File terlalu besar", { description: "Maksimal ukuran file adalah 5MB" });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Fungsi Kirim ke API Payments
  const handleUploadPayment = async () => {
    if (!file) {
      toast.error("Bukti transfer wajib diunggah");
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('paymentProof', file);
      formData.append('invoiceId', selectedInvoice.id);
      formData.append('amount', (selectedInvoice.totalAmount || selectedInvoice.amount).toString());
      formData.append('method', 'TRANSFER_BCA'); // Sesuaikan dengan opsi bank kalian jika ada
      formData.append('userId', user?.id || '');

      await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success("Bukti Transfer Terkirim!", {
        description: "Admin akan melakukan verifikasi pembayaran Anda secepatnya."
      });

      // Tutup modal dan reset form file
      setSelectedInvoice(null);
      setFile(null);
      setPreviewUrl(null);
      
      // Tarik ulang data tagihan dari server agar statusnya update
      fetchInvoices();
      
    } catch (error: any) {
      console.error("Gagal upload pembayaran:", error);
      toast.error("Gagal mengirim bukti", {
        description: error.response?.data?.message || "Terjadi kesalahan pada server."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserLayoutWrapper title="Tagihan & Pembayaran">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- SECTION 1: TAGIHAN AKTIF (BELUM DIBAYAR) --- */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#F5A623]" /> Menunggu Pembayaran
          </h2>

          {isLoading ? (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 flex justify-center">
              <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeInvoice ? (
            <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2a2a2a] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl shadow-black/50">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#F5A623]/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 w-full md:w-auto">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                    Belum Lunas
                  </span>
                  <span className="text-white/40 text-sm font-mono">
                    {activeInvoice.invoiceNumber}
                  </span>
                </div>
                <h3 className="text-white font-bold text-2xl mb-1">
                  Tagihan {getMonthName(activeInvoice.billingMonth)} {activeInvoice.billingYear}
                </h3>
                <p className="text-white/50 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Jatuh tempo:{' '}
                  <span className="text-white font-semibold">
                    {new Date(activeInvoice.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-start md:items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                <p className="text-white/50 text-sm mb-1">Total Pembayaran</p>
                <p className="text-4xl font-black text-[#F5A623] mb-4 tracking-tight">
                  Rp {(activeInvoice.totalAmount || activeInvoice.amount)?.toLocaleString('id-ID')}
                </p>
                <button
                  onClick={() => setSelectedInvoice(activeInvoice)}
                  className="w-full md:w-auto bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,166,35,0.3)]"
                >
                  Bayar Sekarang <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-white font-bold text-xl mb-1">
                Semua Tagihan Lunas!
              </h3>
              <p className="text-white/50">
                Terima kasih telah melakukan pembayaran tepat waktu.
              </p>
            </div>
          )}
        </div>

        {/* --- SECTION 2: RIWAYAT TAGIHAN --- */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-white/50" /> Riwayat Pembayaran
          </h2>

          <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">No. Invoice</th>
                    <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Bulan</th>
                    <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Nominal</th>
                    <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Tanggal Bayar</th>
                    <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">
                        Memuat data...
                      </td>
                    </tr>
                  ) : invoiceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/40">
                        Belum ada riwayat pembayaran.
                      </td>
                    </tr>
                  ) : (
                    invoiceHistory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 text-sm font-mono text-white/60">{inv.invoiceNumber}</td>
                        <td className="p-4 text-sm font-medium text-white">{getMonthName(inv.billingMonth)} {inv.billingYear}</td>
                        <td className="p-4 text-sm font-bold text-white">
                          Rp {(inv.totalAmount || inv.amount).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-sm text-white/60">
                          {inv.paidAt
                            ? new Date(inv.paidAt).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL BAYAR (SEKARANG DENGAN FUNGSI UPLOAD) --- */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1f1f1f] border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Konfirmasi Pembayaran</h3>
            <p className="text-white/50 text-sm mb-6">
              Transfer sesuai nominal ke rekening BCA dan unggah bukti transfer.
            </p>

            <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mb-6">
              <p className="text-white/40 text-xs uppercase mb-1 text-center">Nominal yang harus dibayar:</p>
              <p className="text-3xl font-black text-[#F5A623] text-center">
                Rp {(selectedInvoice.totalAmount || selectedInvoice.amount).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Input File Tersembunyi */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />

            {/* Area Drop/Click Upload */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer mb-6 group ${
                previewUrl ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 hover:border-[#F5A623]/50 hover:bg-white/5'
              }`}
            >
              {previewUrl ? (
                <div className="relative h-32 w-full">
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                  <p className="text-[10px] text-green-500 mt-2 font-bold uppercase tracking-widest">Siap Dikirim ✓</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-white/40 group-hover:text-[#F5A623] mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-semibold text-white mb-1">Klik untuk Pilih Foto Bukti</p>
                  <p className="text-xs text-white/40">JPG, PNG atau JPEG (Maks. 5MB)</p>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedInvoice(null); setFile(null); setPreviewUrl(null); }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
                disabled={isLoading}
              >
                Batal
              </button>
              <button
                onClick={handleUploadPayment}
                disabled={isLoading || !file}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-black bg-[#F5A623] hover:bg-[#d98f1b] transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Kirim Bukti"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayoutWrapper>
  );
}