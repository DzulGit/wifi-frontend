'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Search, RefreshCw, AlertTriangle, CheckCircle,
  Zap, Clock, XCircle, X, Eye, Plus
} from 'lucide-react'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  userId: string
  amount: number
  penaltyAmount: number
  totalAmount: number
  billingMonth: number
  billingYear: number
  dueDate: string
  status: string
  paidAt: string | null
  user?: { fullName: string; customerCode: string; phone: string }
  package?: { name: string }
  createdAt: string
}

interface BillingStats {
  unpaid: number; pending: number; paid: number; overdue: number; totalRevenueThisMonth: number
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    UNPAID: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Belum Bayar' },
    PENDING: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'Pending' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Lunas' },
    OVERDUE: { bg: 'bg-red-100', text: 'text-red-600', label: 'Terlambat' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Dibatalkan' },
  }
  const s = map[status] ?? map.UNPAID
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
}

// ── Generate Bulk Modal ────────────────────────────────────────
function GenerateBulkModal({ onClose, onSuccess, activeUsers }: { onClose: () => void; onSuccess: () => void; activeUsers: number }) {
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/billing/generate-bulk', { billingMonth: month, billingYear: year })
      toast.success(data.message)
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal generate tagihan')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/20 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-[#F5A623]" />
          </div>
          <h2 className="text-white font-bold text-lg">Generate Tagihan Massal</h2>
          <p className="text-white/40 text-sm mt-1">Buat tagihan untuk semua pelanggan aktif</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Period selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Bulan</label>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Tahun</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total pelanggan aktif</span>
              <span className="font-bold text-gray-900">{activeUsers} pelanggan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Periode tagihan</span>
              <span className="font-bold text-[#F5A623]">{MONTHS[month - 1]} {year}</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Tagihan yang sudah ada untuk periode ini akan dilewati otomatis. Notifikasi email akan dikirim ke pelanggan.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
            <button onClick={handleGenerate} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <><Zap className="w-4 h-4" /> Mulai Proses</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function TagihanPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<BillingStats>({ unpaid: 0, pending: 0, paid: 0, overdue: 0, totalRevenueThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [activeUsers, setActiveUsers] = useState(0)
  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (filterStatus) params.set('status', filterStatus)
      if (filterMonth) params.set('month', filterMonth)
      if (filterYear) params.set('year', filterYear)

      const [invRes, statsRes, userStatsRes] = await Promise.all([
        api.get(`/billing?${params}`),
        api.get('/billing/stats'),
        api.get('/users/stats'),
      ])
      setInvoices(invRes.data.data)
      setTotal(invRes.data.meta.total)
      setTotalPages(invRes.data.meta.totalPages)
      setStats(statsRes.data)
      setActiveUsers(userStatsRes.data.active)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [page, filterStatus, filterMonth, filterYear])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddPenalty = async (id: string) => {
    try {
      await api.patch(`/billing/${id}/penalty`)
      toast.success('Denda berhasil ditambahkan')
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal tambah denda') }
  }

  return (
    <AdminLayoutWrapper title="Manajemen Tagihan" subtitle="Kelola tagihan bulanan pelanggan">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Belum Bayar', value: stats.unpaid, color: 'text-yellow-600', bg: 'border-yellow-100' },
            { label: 'Pending', value: stats.pending, color: 'text-blue-600', bg: 'border-blue-100' },
            { label: 'Lunas', value: stats.paid, color: 'text-green-600', bg: 'border-green-100' },
            { label: 'Terlambat', value: stats.overdue, color: 'text-red-500', bg: 'border-red-100' },
            { label: 'Pendapatan Bulan Ini', value: formatRp(stats.totalRevenueThisMonth), color: 'text-[#F5A623]', bg: 'border-[#F5A623]/20', isText: true },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`font-bold ${s.color} ${s.isText ? 'text-base' : 'text-2xl'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white">
              <option value="">Status: Semua</option>
              <option value="UNPAID">Belum Bayar</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Lunas</option>
              <option value="OVERDUE">Terlambat</option>
            </select>
            <select value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }} className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white">
              <option value="">Bulan: Semua</option>
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1) }} className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="ml-auto">
              <button onClick={() => setShowGenerateModal(true)} className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] transition-colors">
                <Zap className="w-4 h-4" /> Generate Tagihan Massal
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['No Invoice', 'Pelanggan', 'Paket', 'Tagihan', 'Denda', 'Total', 'Jatuh Tempo', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-400">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>Tidak ada tagihan ditemukan</p>
                    </td>
                  </tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className={`hover:bg-gray-50/50 transition-colors ${inv.status === 'OVERDUE' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">{inv.user?.fullName ?? '—'}</p>
                      <p className="text-xs text-gray-400 font-mono">{inv.user?.customerCode ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{inv.package?.name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-700">{formatRp(inv.amount)}</td>
                    <td className="px-4 py-3.5">
                      {inv.penaltyAmount > 0
                        ? <span className="text-red-500 text-sm font-medium">+{formatRp(inv.penaltyAmount)}</span>
                        : <span className="text-gray-300 text-sm">—</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{formatRp(inv.totalAmount)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm ${new Date(inv.dueDate) < new Date() && inv.status !== 'PAID' ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                        {new Date(inv.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {(inv.status === 'UNPAID' || inv.status === 'OVERDUE') && (
                          <button onClick={() => handleAddPenalty(inv.id)} className="px-2 py-1 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-colors whitespace-nowrap">+ Denda</button>
                        )}
                        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
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
              <p className="text-sm text-gray-500">Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total} tagihan</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">Selanjutnya</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <GenerateBulkModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={fetchData}
          activeUsers={activeUsers}
        />
      )}
    </AdminLayoutWrapper>
  )
}