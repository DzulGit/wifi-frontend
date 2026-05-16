'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import {
  CheckCircle, XCircle, Eye, MapPin, Phone,
  Package, Clock, Search, Filter, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface Registration {
  id: string
  fullName: string
  phone: string
  email: string | null
  address: string
  city: string | null
  district: string | null
  notes: string | null
  status: string
  rejectedReason: string | null
  approvedAt: string | null
  createdAt: string
  packageId: string
  approvedBy?: { fullName: string; email: string }
  user?: { id: string; customerCode: string; status: string }
}

interface Package { id: string; name: string; price: number; speedDown: number }
interface Stats { total: number; pending: number; approved: number; rejected: number }

// ── Helpers ────────────────────────────────────────────────────
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Menunggu' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Ditolak' },
  }
  const s = map[status] ?? map.PENDING
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ── Detail Modal ───────────────────────────────────────────────
function DetailModal({
  reg, pkg, onClose, onApprove, onReject
}: {
  reg: Registration
  pkg?: Package
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    await onApprove(reg.id)
    setLoading(false)
    onClose()
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Masukkan alasan penolakan'); return }
    setLoading(true)
    await onReject(reg.id)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{reg.fullName}</h2>
              <p className="text-white/40 text-sm">{timeAgo(reg.createdAt)}</p>
            </div>
            <StatusBadge status={reg.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Info rows */}
          {[
            { icon: Phone, label: 'No HP', value: reg.phone },
            { icon: MapPin, label: 'Alamat', value: `${reg.address}${reg.city ? `, ${reg.city}` : ''}` },
            { icon: Package, label: 'Paket', value: pkg ? `${pkg.name} — ${pkg.speedDown} Mbps (${formatRp(pkg.price)}/bln)` : reg.packageId },
            ...(reg.email ? [{ icon: Clock, label: 'Email', value: reg.email }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm text-gray-900 font-medium">{value}</p>
              </div>
            </div>
          ))}

          {reg.notes && (
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
              <p className="text-xs text-yellow-700 font-medium mb-1">Catatan dari pendaftar:</p>
              <p className="text-sm text-yellow-800">{reg.notes}</p>
            </div>
          )}

          {reg.status === 'REJECTED' && reg.rejectedReason && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600 font-medium mb-1">Alasan penolakan:</p>
              <p className="text-sm text-red-700">{reg.rejectedReason}</p>
            </div>
          )}

          {reg.status === 'APPROVED' && reg.user && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs text-green-700 font-medium mb-1">Akun pelanggan dibuat:</p>
              <p className="text-sm text-green-800 font-semibold">{reg.user.customerCode}</p>
            </div>
          )}

          {/* Reject form */}
          {showRejectForm && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Alasan Penolakan
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Contoh: Area belum terjangkau jaringan kami..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-[#F5A623]/50 h-24"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {reg.status === 'PENDING' && (
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
export default function PendaftarPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (filterStatus) params.set('status', filterStatus)
      if (search) params.set('search', search)

      const [regsRes, statsRes, pkgsRes] = await Promise.all([
        api.get(`/registrations?${params}`),
        api.get('/registrations/stats'),
        api.get('/packages'),
      ])
      setRegistrations(regsRes.data.data)
      setTotal(regsRes.data.meta.total)
      setTotalPages(regsRes.data.meta.totalPages)
      setStats(statsRes.data)
      setPackages(pkgsRes.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [page, filterStatus, search])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/registrations/${id}/approve`)
      toast.success('Pendaftaran disetujui!', { description: 'Link aktivasi dikirim ke email pelanggan' })
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal approve') }
  }

  const handleReject = async (id: string, reason?: string) => {
    try {
      const r = reason ?? prompt('Alasan penolakan:')
      if (!r) return
      await api.patch(`/registrations/${id}/reject`, { reason: r })
      toast.success('Pendaftaran ditolak')
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal reject') }
  }

  const getPackage = (pkgId: string) => packages.find(p => p.id === pkgId)

  const LIMIT = 10

  return (
    <AdminLayoutWrapper title="Pendaftar Baru" subtitle="Kelola pendaftaran pelanggan baru dari landing page">
      <div className="space-y-5">

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Pendaftar', value: stats.total, color: 'text-gray-900' },
            { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600', bg: 'border-yellow-200 bg-yellow-50/50' },
            { label: 'Disetujui', value: stats.approved, color: 'text-green-600', bg: 'border-green-200 bg-green-50/50' },
            { label: 'Ditolak', value: stats.rejected, color: 'text-red-500', bg: 'border-red-200 bg-red-50/50' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 border ${s.bg ?? 'border-gray-100'}`}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter & search */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari nama atau nomor HP..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>

            {/* Status filter pills */}
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

            <button
              onClick={fetchData}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Tidak ada pendaftar</p>
              <p className="text-gray-400 text-sm mt-1">
                {filterStatus === 'PENDING' ? 'Semua pendaftaran sudah diproses' : 'Belum ada data'}
              </p>
            </div>
          ) : registrations.map(reg => {
            const pkg = getPackage(reg.packageId)
            return (
              <div
                key={reg.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#F5A623] font-bold text-lg">
                      {reg.fullName.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900">{reg.fullName}</h3>
                      <StatusBadge status={reg.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {reg.phone}
                      </span>
                      {reg.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {reg.city}
                        </span>
                      )}
                      {pkg && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          <span className="text-[#F5A623] font-medium">{pkg.name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" /> {timeAgo(reg.createdAt)}
                      </span>
                    </div>
                    {reg.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic truncate">"{reg.notes}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setSelectedReg(reg)}
                      className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    {reg.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleReject(reg.id)}
                          className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprove(reg.id)}
                          className="px-3 py-2 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-sm font-bold transition-colors"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {reg.status === 'APPROVED' && reg.user && (
                      <span className="text-xs text-green-600 font-mono bg-green-50 px-2 py-1 rounded-lg">
                        {reg.user.customerCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-3">
            <p className="text-sm text-gray-500">
              Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total} pendaftar
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedReg && (
        <DetailModal
          reg={selectedReg}
          pkg={getPackage(selectedReg.packageId)}
          onClose={() => setSelectedReg(null)}
          onApprove={handleApprove}
          onReject={(id) => handleReject(id)}
        />
      )}
    )
  )
}