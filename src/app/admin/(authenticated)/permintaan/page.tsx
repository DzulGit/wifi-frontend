'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import {
  RefreshCw, CheckCircle, XCircle, Package, MapPin,
  XOctagon, Clock, Search, AlertTriangle, X, Eye
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────
interface UserRequest {
  id: string
  title: string
  message: string
  category: string
  link: string | null
  isUrgent: boolean
  isRead: boolean
  metadata: {
    userId?: string
    newPackageId?: string
    newAddress?: string
    reason?: string
  }
  createdAt: string
}

interface PackageInfo {
  id: string
  name: string
  price: number
  speedDown: number
}

interface UserInfo {
  id: string
  fullName: string
  customerCode: string
  phone: string
  address: string
  status: string
  package?: { name: string }
}

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

// ── Identifikasi tipe request dari judul notifikasi ──────────
const getRequestType = (title: string) => {
  if (title.includes('Ganti Paket')) return 'PACKAGE'
  if (title.includes('Pindah Alamat')) return 'ADDRESS'
  if (title.includes('Putus Berlangganan')) return 'CANCEL'
  return 'UNKNOWN'
}

const REQUEST_CONFIG = {
  PACKAGE: {
    icon: Package,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    label: 'Ganti Paket',
  },
  ADDRESS: {
    icon: MapPin,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    label: 'Pindah Alamat',
  },
  CANCEL: {
    icon: XOctagon,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    label: 'Putus Berlangganan',
  },
  UNKNOWN: {
    icon: AlertTriangle,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-100',
    label: 'Permintaan Lainnya',
  },
}

// ── Detail Modal ───────────────────────────────────────────────
function DetailModal({
  request,
  packages,
  onClose,
  onApprove,
  onReject,
}: {
  request: UserRequest
  packages: PackageInfo[]
  onClose: () => void
  onApprove: (req: UserRequest) => Promise<void>
  onReject: (req: UserRequest) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const requestType = getRequestType(request.title)
  const cfg = REQUEST_CONFIG[requestType as keyof typeof REQUEST_CONFIG]

  useEffect(() => {
    const fetchUser = async () => {
      if (!request.metadata?.userId) return
      try {
        const { data } = await api.get(`/users/${request.metadata.userId}`)
        setUserInfo(data)
      } catch {
        // silent
      }
    }
    fetchUser()
  }, [request.metadata?.userId])

  const targetPackage = packages.find(p => p.id === request.metadata?.newPackageId)

  const handleApprove = async () => {
    setLoading(true)
    await onApprove(request)
    setLoading(false)
    onClose()
  }

  const handleReject = async () => {
    setLoading(true)
    await onReject(request)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-5 flex items-start justify-between">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 ${cfg.bg} ${cfg.color}`}>
              <cfg.icon className="w-3.5 h-3.5" />
              {cfg.label}
            </div>
            <h2 className="text-white font-bold">{request.title}</h2>
            <p className="text-white/40 text-xs mt-0.5">{timeAgo(request.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Info User */}
          {userInfo && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Info Pelanggan</p>
              <p className="font-bold text-gray-900">{userInfo.fullName}</p>
              <p className="text-sm text-gray-500 font-mono">{userInfo.customerCode}</p>
              <p className="text-sm text-gray-500">{userInfo.phone}</p>
              {userInfo.package && (
                <p className="text-sm text-[#F5A623] font-medium mt-1">Paket saat ini: {userInfo.package.name}</p>
              )}
            </div>
          )}

          {/* Detail permintaan */}
          <div className={`rounded-xl p-4 border ${cfg.border} ${cfg.bg}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'inherit' }}>
              Detail Permintaan
            </p>
            {requestType === 'PACKAGE' && targetPackage && (
              <div>
                <p className="text-sm font-medium text-gray-700">Paket yang diminta:</p>
                <p className="font-bold text-gray-900 mt-1">{targetPackage.name}</p>
                <p className="text-sm text-gray-500">{targetPackage.speedDown} Mbps — {formatRp(targetPackage.price)}/bulan</p>
              </div>
            )}
            {requestType === 'PACKAGE' && !targetPackage && (
              <p className="text-sm text-gray-500">ID Paket: {request.metadata?.newPackageId ?? '-'}</p>
            )}
            {requestType === 'ADDRESS' && (
              <div>
                <p className="text-sm font-medium text-gray-700">Alamat baru:</p>
                <p className="text-sm text-gray-900 mt-1 leading-relaxed">{request.metadata?.newAddress ?? '-'}</p>
              </div>
            )}
            {requestType === 'CANCEL' && (
              <div>
                <p className="text-sm font-medium text-gray-700">Alasan berhenti:</p>
                <p className="text-sm text-gray-900 mt-1 leading-relaxed italic">"{request.metadata?.reason ?? '-'}"</p>
              </div>
            )}
          </div>

          {/* Pesan lengkap */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pesan Sistem</p>
            <p className="text-sm text-gray-600">{request.message}</p>
          </div>

          {/* Form tolak */}
          {showRejectForm && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Catatan Penolakan (opsional)
              </label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Contoh: Area belum tersedia, paket sedang tidak aktif..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-red-300"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {!request.isRead ? (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Tolak
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><CheckCircle className="w-4 h-4" /> Setujui & Proses</>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Konfirmasi Tolak'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
            <p className="text-xs text-gray-400 font-medium">Permintaan ini sudah ditandai selesai diproses</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PermintaanPage() {
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('unread')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserRequest | null>(null)

  // Stats
  const totalUnread = requests.filter(r => !r.isRead).length
  const packageRequests = requests.filter(r => getRequestType(r.title) === 'PACKAGE').length
  const addressRequests = requests.filter(r => getRequestType(r.title) === 'ADDRESS').length
  const cancelRequests = requests.filter(r => getRequestType(r.title) === 'CANCEL').length

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Ambil notifikasi admin category SYSTEM (request dari user)
      const [notifRes, pkgRes] = await Promise.all([
        api.get('/admin/notifications?category=SYSTEM&limit=100'),
        api.get('/packages?active=false'),
      ])

      const allNotifs: UserRequest[] = notifRes.data.notifications ?? []
      // Filter hanya yang berisi keyword request user
      const userRequests = allNotifs.filter(n =>
        n.title.includes('Ganti Paket') ||
        n.title.includes('Pindah Alamat') ||
        n.title.includes('Putus Berlangganan')
      )
      setRequests(userRequests)
      setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : pkgRes.data.data ?? [])
    } catch {
      toast.error('Gagal memuat data permintaan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Approve: terapkan perubahan ke user + mark as read
  const handleApprove = async (req: UserRequest) => {
    const requestType = getRequestType(req.title)
    const userId = req.metadata?.userId

    if (!userId) {
      toast.error('User ID tidak ditemukan di metadata')
      return
    }

    try {
      if (requestType === 'PACKAGE' && req.metadata?.newPackageId) {
        // Ganti paket user
        await api.patch(`/users/${userId}`, { packageId: req.metadata.newPackageId })
        toast.success('Paket berhasil diganti!', {
          description: 'Paket internet pelanggan sudah diperbarui.'
        })
      } else if (requestType === 'ADDRESS' && req.metadata?.newAddress) {
        // Update alamat user
        await api.patch(`/users/${userId}`, { address: req.metadata.newAddress })
        toast.success('Alamat berhasil diperbarui!', {
          description: 'Alamat pelanggan sudah diubah ke lokasi baru.'
        })
      } else if (requestType === 'CANCEL') {
        // Set status user jadi INACTIVE
        await api.patch(`/users/${userId}/status`, { status: 'INACTIVE' })
        toast.success('Berlangganan dihentikan', {
          description: 'Status pelanggan berhasil diubah ke INACTIVE.'
        })
      } else {
        toast.error('Tipe permintaan tidak dikenali atau data tidak lengkap')
        return
      }

      // Tandai notifikasi sebagai sudah dibaca (selesai diproses)
      await api.post(`/admin/notifications/${req.id}/read`)

      // Update state lokal
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, isRead: true } : r))
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal memproses permintaan')
      throw err
    }
  }

  // Reject: hanya tandai as read tanpa mengubah data user
  const handleReject = async (req: UserRequest) => {
    try {
      await api.post(`/admin/notifications/${req.id}/read`)
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, isRead: true } : r))
      toast.success('Permintaan ditolak', {
        description: 'Notifikasi ditandai selesai tanpa perubahan data pelanggan.'
      })
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Gagal menolak permintaan')
      throw err
    }
  }

  // Filter tampilan
  const filtered = requests.filter(r => {
    const type = getRequestType(r.title)
    const matchType = !filterType || type === filterType
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !r.isRead) ||
      (filterStatus === 'read' && r.isRead)
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  return (
    <>
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Menunggu Diproses', value: totalUnread, color: 'text-[#F5A623]', bg: 'border-[#F5A623]/20' },
            { label: 'Ganti Paket', value: packageRequests, color: 'text-blue-600', bg: 'border-blue-100' },
            { label: 'Pindah Alamat', value: addressRequests, color: 'text-emerald-600', bg: 'border-emerald-100' },
            { label: 'Putus Berlangganan', value: cancelRequests, color: 'text-red-500', bg: 'border-red-100' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari permintaan..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>

            {/* Filter status */}
            <div className="flex gap-2">
              {[
                { value: 'unread', label: 'Menunggu' },
                { value: 'read', label: 'Selesai' },
                { value: 'all', label: 'Semua' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value as any)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === f.value
                    ? 'bg-[#F5A623] text-black'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {f.label}
                  {f.value === 'unread' && totalUnread > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter tipe */}
            <div className="flex gap-2">
              {[
                { value: '', label: 'Semua Tipe' },
                { value: 'PACKAGE', label: 'Ganti Paket' },
                { value: 'ADDRESS', label: 'Pindah Alamat' },
                { value: 'CANCEL', label: 'Putus' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filterType === f.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  {f.label}
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

        {/* List permintaan */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {filterStatus === 'unread' ? 'Tidak ada permintaan yang menunggu' : 'Tidak ada data'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {filterStatus === 'unread' ? 'Semua permintaan sudah diproses' : 'Coba ubah filter'}
              </p>
            </div>
          ) : filtered.map(req => {
            const type = getRequestType(req.title)
            const cfg = REQUEST_CONFIG[type as keyof typeof REQUEST_CONFIG]

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${!req.isRead ? 'border-[#F5A623]/30 bg-[#F5A623]/[0.01]' : 'border-gray-100'
                  }`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Ikon tipe */}
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{req.title}</h3>
                        {!req.isRead && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-black">
                            BARU
                          </span>
                        )}
                        {req.isUrgent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500">
                            URGENT
                          </span>
                        )}
                        {req.isRead && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                            SELESAI
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{req.message}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(req.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelected(req)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Detail
                      </button>
                      {!req.isRead && (
                        <>
                          <button
                            onClick={async () => {
                              try {
                                await handleReject(req)
                              } catch { }
                            }}
                            className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => setSelected(req)}
                            className="px-3 py-2 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-xs font-bold transition-colors"
                          >
                            Proses
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <DetailModal
          request={selected}
          packages={packages}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  )
}