'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Search, RefreshCw, Eye, MoreVertical, UserPlus,
  Download, Phone, MapPin, Package, CheckCircle,
  XCircle, AlertTriangle, X, Edit2
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface User {
  id: string
  fullName: string
  email: string | null
  phone: string
  address: string
  city: string | null
  customerCode: string
  status: string
  packageId: string | null
  package?: { id: string; name: string; price: number; speedDown: number }
  invoices?: any[]
  createdAt: string
}
interface Package { id: string; name: string; price: number; speedDown: number }
interface Stats { total: number; active: number; suspended: number; pending: number; inactive: number }

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
    SUSPENDED: { bg: 'bg-red-100', text: 'text-red-600', label: 'Suspended' },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Proses' },
    INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Nonaktif' },
  }
  const s = map[status] ?? map.PENDING
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
}

// ── Add/Edit User Modal ────────────────────────────────────────
function UserFormModal({
  user, packages, onClose, onSuccess
}: {
  user?: User | null
  packages: Package[]
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!user
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    city: user?.city ?? '',
    packageId: user?.packageId ?? '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/users/${user!.id}`, form)
        toast.success('Data pelanggan diperbarui')
      } else {
        await api.post('/users', form)
        toast.success('Pelanggan ditambahkan!', { description: 'Link aktivasi dikirim via email' })
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">{isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {[
            { label: 'Nama Lengkap', key: 'fullName', placeholder: 'Nama lengkap pelanggan', required: true },
            { label: 'No HP (WA Aktif)', key: 'phone', placeholder: '08xxxxxxxxxx', required: true },
            { label: 'Email', key: 'email', placeholder: 'email@contoh.com', required: false },
            { label: 'Alamat', key: 'address', placeholder: 'Alamat lengkap', required: true },
            { label: 'Kota', key: 'city', placeholder: 'Kota/Kabupaten', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Paket WiFi</label>
            <select
              value={form.packageId}
              onChange={e => setForm(prev => ({ ...prev, packageId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
            >
              <option value="">-- Pilih Paket --</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.speedDown} Mbps ({formatRp(p.price)}/bln)</option>
              ))}
            </select>
          </div>
          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Catatan Admin</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Catatan internal (opsional)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50 resize-none h-20"
              />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] disabled:opacity-50 transition-colors">
              {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" /> : isEdit ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Slide Panel ─────────────────────────────────────────
function DetailPanel({
  user, packages, onClose, onRefresh
}: {
  user: User
  packages: Package[]
  onClose: () => void
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const handleStatusChange = async (status: string) => {
    setLoading(true)
    try {
      await api.patch(`/users/${user.id}/status`, { status })
      toast.success(`Status diubah ke ${status}`)
      onRefresh()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal mengubah status')
    } finally { setLoading(false) }
  }

  const handleGenerateInvoice = async () => {
    setLoading(true)
    try {
      await api.post(`/billing/generate/${user.id}`, {})
      toast.success('Tagihan berhasil dibuat!')
      onRefresh()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal generate tagihan')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F5A623] flex items-center justify-center">
              <span className="text-black font-bold text-lg">{user.fullName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-white font-bold">{user.fullName}</h3>
              <p className="text-[#F5A623] text-sm font-mono">{user.customerCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white mt-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <StatusBadge status={user.status} />
            <span className="text-xs text-gray-400">Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Info Kontak</h4>
            {[
              { icon: Phone, label: 'No HP', value: user.phone },
              { icon: MapPin, label: 'Alamat', value: user.city ? `${user.address}, ${user.city}` : user.address },
              ...(user.email ? [{ icon: Edit2, label: 'Email', value: user.email }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 items-start">
                <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-sm text-gray-800 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Paket info */}
          <div className="bg-[#F5A623]/8 rounded-xl p-4 border border-[#F5A623]/20">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Info Layanan</h4>
            {user.package ? (
              <div className="space-y-1.5">
                <p className="font-semibold text-gray-900">{user.package.name}</p>
                <p className="text-[#F5A623] font-mono text-sm">{user.package.speedDown} Mbps</p>
                <p className="text-gray-500 text-sm">{formatRp(user.package.price)}/bulan</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada paket</p>
            )}
          </div>

          {/* Ringkasan tagihan */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ringkasan Tagihan</h4>
            {user.invoices && user.invoices.length > 0 ? (
              <div className="space-y-2">
                {user.invoices.slice(0, 3).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{inv.billingMonth}/{inv.billingYear}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{inv.status === 'PAID' ? 'Lunas' : inv.status === 'OVERDUE' ? 'Terlambat' : 'Belum Bayar'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Belum ada tagihan</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-4 space-y-2 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Data
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20 text-sm font-semibold hover:bg-[#F5A623]/20 transition-colors disabled:opacity-50"
            >
              Generate Invoice
            </button>
          </div>
          {user.status === 'ACTIVE' ? (
            <button
              onClick={() => handleStatusChange('SUSPENDED')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-500 border border-red-200 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Suspend Pelanggan
            </button>
          ) : user.status === 'SUSPENDED' ? (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Aktifkan Kembali
            </button>
          ) : null}
        </div>
      </div>

      {showEdit && (
        <UserFormModal
          user={user}
          packages={packages}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { onRefresh(); onClose() }}
        />
      )}
    </>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PelangganPage() {
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, suspended: 0, pending: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (filterStatus) params.set('status', filterStatus)
      if (search) params.set('search', search)

      const [usersRes, statsRes, pkgsRes] = await Promise.all([
        api.get(`/users?${params}`),
        api.get('/users/stats'),
        api.get('/packages'),
      ])
      setUsers(usersRes.data.data)
      setTotal(usersRes.data.meta.total)
      setTotalPages(usersRes.data.meta.totalPages)
      setStats(statsRes.data)
      setPackages(pkgsRes.data)
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [page, filterStatus, search])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === users.length ? [] : users.map(u => u.id))
  }

  const handleBulkStatus = async (status: string) => {
    if (!selectedIds.length) return
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/users/${id}/status`, { status })))
      toast.success(`${selectedIds.length} pelanggan berhasil di-${status.toLowerCase()}`)
      setSelectedIds([])
      fetchData()
    } catch { toast.error('Gagal bulk action') }
  }

  const handleViewDetail = async (user: User) => {
    try {
      const { data } = await api.get(`/users/${user.id}`)
      setSelectedUser(data)
    } catch { setSelectedUser(user) }
  }

  return (
    <AdminLayoutWrapper title="Manajemen Pelanggan" subtitle="Kelola seluruh data pelanggan WiFi">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Aktif', value: stats.active, color: 'text-green-600', bg: 'border-green-100' },
            { label: 'Suspended', value: stats.suspended, color: 'text-red-500', bg: 'border-red-100' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'border-yellow-100' },
            { label: 'Nonaktif', value: stats.inactive, color: 'text-gray-400', bg: 'border-gray-100' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg ?? 'border-gray-100'}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari nama, HP, kode pelanggan..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white"
            >
              <option value="">Status: Semua</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 h-10 rounded-xl border border-green-200 text-green-600 text-sm font-semibold hover:bg-green-50 transition-colors">
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] transition-colors"
            >
              <UserPlus className="w-4 h-4" /> Tambah Pelanggan
            </button>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-[#F5A623]/10 rounded-xl border border-[#F5A623]/20">
              <span className="text-sm font-semibold text-[#F5A623]">{selectedIds.length} dipilih</span>
              <button onClick={() => handleBulkStatus('ACTIVE')} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors">Aktifkan Semua</button>
              <button onClick={() => handleBulkStatus('SUSPENDED')} className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition-colors">Suspend Semua</button>
              <button onClick={() => setSelectedIds([])} className="ml-auto text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3 text-left">
                    <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleSelectAll} className="rounded accent-[#F5A623]" />
                  </th>
                  {['No', 'Kode', 'Nama Lengkap', 'No HP', 'Paket', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p>Tidak ada pelanggan ditemukan</p>
                    </td>
                  </tr>
                ) : users.map((user, i) => (
                  <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(user.id) ? 'bg-[#F5A623]/5' : ''}`}>
                    <td className="px-5 py-3.5">
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded accent-[#F5A623]" />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-gray-500">{user.customerCode}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#F5A623] font-bold text-xs">{user.fullName.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{user.phone}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{user.package?.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetail(user)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="text-sm text-gray-500">Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total} pelanggan</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Selanjutnya</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddForm && <UserFormModal packages={packages} onClose={() => setShowAddForm(false)} onSuccess={fetchData} />}
      {selectedUser && <DetailPanel user={selectedUser} packages={packages} onClose={() => setSelectedUser(null)} onRefresh={fetchData} />}
    </AdminLayoutWrapper>
  )
}