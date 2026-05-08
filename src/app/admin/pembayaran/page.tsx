'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Search, RefreshCw, CheckCircle, XCircle, Eye,
  X, AlertTriangle, Clock, Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import type { Payment } from '@/types'

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: 'Transfer Bank',
  QRIS: 'QRIS',
  CASH: 'Tunai',
  AUTO_GATEWAY: 'Gateway',
}

interface PaymentStats { pending: number; approved: number; rejected: number; totalAmountApproved: number }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Ditolak' },
  }
  const s = map[status] ?? map.PENDING
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
}

// ── Detail Modal ───────────────────────────────────────────────
function DetailModal({
  payment, onClose, onApprove, onReject
}: {
  payment: Payment
  onClose: () => void
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showProof, setShowProof] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await onApprove(payment.id)
    setLoading(false)
    onClose()
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Masukkan alasan penolakan'); return }
    setLoading(true)
    await onReject(payment.id, rejectReason)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-white/40 text-xs font-mono mb-1">{payment.paymentCode}</p>
            <h2 className="text-white font-bold text-lg">{payment.user?.fullName ?? '—'}</h2>
            <p className="text-[#F5A623] font-bold text-xl mt-1">{formatRp(payment.amount)}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={payment.status} />
            <button onClick={onClose} className="text-white/40 hover:text-white ml-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'No. Invoice', value: payment.invoice?.invoiceNumber ?? '—' },
              { label: 'Kode Pelanggan', value: payment.user?.customerCode ?? '—' },
              { label: 'Metode', value: METHOD_LABEL[payment.method] ?? payment.method },
              { label: 'Waktu', value: timeAgo(payment.createdAt) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Proof image */}
          {payment.proofImageUrl ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bukti Pembayaran</p>
              {showProof ? (
                <div className="relative">
                  <img
                    src={payment.proofImageUrl}
                    alt="Bukti pembayaran"
                    className="w-full rounded-xl border border-gray-200 object-contain max-h-64"
                  />
                  <button
                    onClick={() => setShowProof(false)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowProof(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#F5A623]/40 text-[#F5A623] text-sm font-semibold hover:bg-[#F5A623]/5 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" /> Lihat Bukti Transfer
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-xs text-orange-700">Tidak ada bukti pembayaran yang dilampirkan</p>
            </div>
          )}

          {payment.notes && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">Catatan dari pelanggan:</p>
              <p className="text-sm text-blue-800">{payment.notes}</p>
            </div>
          )}

          {payment.status === 'REJECTED' && payment.rejectedReason && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs text-red-600 font-semibold mb-1">Alasan penolakan:</p>
              <p className="text-sm text-red-700">{payment.rejectedReason}</p>
            </div>
          )}

          {showRejectForm && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Alasan Penolakan
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Contoh: Nominal tidak sesuai / bukti transfer tidak valid..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {payment.status === 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    : <><CheckCircle className="w-4 h-4" /> Approve</>
                  }
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    : 'Konfirmasi Tolak'
                  }
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PembayaranPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({ pending: 0, approved: 0, rejected: 0, totalAmountApproved: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Payment | null>(null)
  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (filterStatus) params.set('status', filterStatus)
      if (search) params.set('search', search)

      const [paymentsRes, statsRes] = await Promise.all([
        api.get(`/payments?${params}`),
        api.get('/payments/stats'),
      ])
      setPayments(paymentsRes.data.data ?? [])
      setTotal(paymentsRes.data.meta?.total ?? 0)
      setTotalPages(paymentsRes.data.meta?.totalPages ?? 1)
      setStats(statsRes.data)
    } catch { toast.error('Gagal memuat data pembayaran') }
    finally { setLoading(false) }
  }, [page, filterStatus, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/approve`)
      toast.success('Pembayaran disetujui! Tagihan otomatis lunas.')
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal approve') }
  }

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.patch(`/payments/${id}/reject`, { reason })
      toast.success('Pembayaran ditolak')
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal tolak') }
  }

  const handleViewDetail = async (payment: Payment) => {
    try {
      const { data } = await api.get(`/payments/${payment.id}`)
      setSelected(data)
    } catch { setSelected(payment) }
  }

  return (
    <AdminLayoutWrapper title="Manajemen Pembayaran" subtitle="Validasi pembayaran tagihan pelanggan">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Menunggu Validasi', value: stats.pending, color: 'text-yellow-600', bg: 'border-yellow-100' },
            { label: 'Disetujui', value: stats.approved, color: 'text-green-600', bg: 'border-green-100' },
            { label: 'Ditolak', value: stats.rejected, color: 'text-red-500', bg: 'border-red-100' },
            { label: 'Total Diterima', value: formatRp(stats.totalAmountApproved ?? 0), color: 'text-[#F5A623]', bg: 'border-[#F5A623]/20', isText: true },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`font-bold ${s.color} ${s.isText ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari kode pembayaran atau nama..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: '', label: 'Semua' },
                { value: 'PENDING', label: 'Menunggu' },
                { value: 'APPROVED', label: 'Disetujui' },
                { value: 'REJECTED', label: 'Ditolak' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => { setFilterStatus(f.value); setPage(1) }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === f.value
                      ? 'bg-[#F5A623] text-black'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                  {f.value === 'PENDING' && stats.pending > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Kode Bayar', 'Pelanggan', 'Invoice', 'Metode', 'Jumlah', 'Waktu', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>Tidak ada pembayaran ditemukan</p>
                    </td>
                  </tr>
                ) : payments.map(pay => (
                  <tr key={pay.id} className={`hover:bg-gray-50/50 transition-colors ${pay.status === 'PENDING' ? 'bg-yellow-50/20' : ''}`}>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-500">{pay.paymentCode}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{pay.user?.fullName ?? '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{pay.user?.customerCode ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 font-mono">{pay.invoice?.invoiceNumber ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {METHOD_LABEL[pay.method] ?? pay.method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{formatRp(pay.amount)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">{timeAgo(pay.createdAt)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={pay.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {pay.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => { const reason = prompt('Alasan penolakan:'); if (reason !== null) handleReject(pay.id, reason); }}
                              className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleApprove(pay.id)}
                              className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewDetail(pay)}
                          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="text-sm text-gray-500">Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total} pembayaran</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Selanjutnya</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </AdminLayoutWrapper>
  )
}