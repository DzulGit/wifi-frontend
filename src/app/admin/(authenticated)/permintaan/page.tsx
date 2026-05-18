'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  RefreshCw, CheckCircle, XCircle, Package, MapPin,
  XOctagon, Clock, Search, AlertTriangle, X, Eye
} from 'lucide-react'
import { toast } from 'sonner'

type PermintaanDecision = 'APPROVED' | 'REJECTED'

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
    decision?: PermintaanDecision
    rejectNote?: string
    processedAt?: string
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

type TabKey = '' | 'ganti_paket' | 'pindah_alamat' | 'putus_langganan'

const TAB_TO_TYPE: Record<Exclude<TabKey, ''>, string> = {
  ganti_paket: 'PACKAGE',
  pindah_alamat: 'ADDRESS',
  putus_langganan: 'CANCEL',
}

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

const getRequestType = (title: string) => {
  if (title.includes('Ganti Paket')) return 'PACKAGE'
  if (title.includes('Pindah Alamat')) return 'ADDRESS'
  if (title.includes('Putus berlangganan')) return 'CANCEL'
  return 'UNKNOWN'
}

const isPending = (req: UserRequest) => !req.metadata?.decision

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

function Spinner({ light, small }: { light?: boolean; small?: boolean }) {
  const size = small ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div
      className={`${size} border-2 rounded-full animate-spin ${
        light ? 'border-white border-t-transparent' : 'border-black border-t-transparent'
      }`}
    />
  )
}

function DetailModal({
  request,
  packages,
  processing,
  onClose,
  onApprove,
  onReject,
}: {
  request: UserRequest
  packages: PackageInfo[]
  processing: boolean
  onClose: () => void
  onApprove: (req: UserRequest) => Promise<void>
  onReject: (req: UserRequest, note?: string) => Promise<void>
}) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNote, setRejectNote] = useState('')

  const requestType = getRequestType(request.title)
  const cfg = REQUEST_CONFIG[requestType as keyof typeof REQUEST_CONFIG]
  const pending = isPending(request)
  const decision = request.metadata?.decision

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
    await onApprove(request)
    onClose()
  }

  const handleReject = async () => {
    await onReject(request, rejectNote.trim() || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-[#1A1A1A] px-6 py-5 flex items-start justify-between">
          <ModalHeaderLeft cfg={cfg} request={request} />
          <button onClick={onClose} className="text-white/40 hover:text-white mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {userInfo && <UserInfoBlock userInfo={userInfo} />}
          <RequestDetailBlock
            cfg={cfg}
            requestType={requestType}
            request={request}
            targetPackage={targetPackage}
          />
          <SystemMessageBlock message={request.message} />
          {decision === 'REJECTED' && request.metadata?.rejectNote && (
            <RejectNoteBlock note={request.metadata.rejectNote} />
          )}
          {showRejectForm && pending && (
            <RejectForm rejectNote={rejectNote} onChange={setRejectNote} />
          )}
        </div>

        {pending ? (
          <ModalActions
            showRejectForm={showRejectForm}
            processing={processing}
            onShowReject={() => setShowRejectForm(true)}
            onHideReject={() => setShowRejectForm(false)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <ProcessedFooter decision={decision} />
        )}
      </div>
    </div>
  )
}

function ModalHeaderLeft({
  cfg,
  request,
}: {
  cfg: (typeof REQUEST_CONFIG)[keyof typeof REQUEST_CONFIG]
  request: UserRequest
}) {
  return (
    <div>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 ${cfg.bg} ${cfg.color}`}>
        <cfg.icon className="w-3.5 h-3.5" />
        {cfg.label}
      </div>
      <h2 className="text-white font-bold">{request.title}</h2>
      <p className="text-white/40 text-xs mt-0.5">{timeAgo(request.createdAt)}</p>
    </div>
  )
}

function UserInfoBlock({ userInfo }: { userInfo: UserInfo }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Info Pelanggan</p>
      <p className="font-bold text-gray-900">{userInfo.fullName}</p>
      <p className="text-sm text-gray-500 font-mono">{userInfo.customerCode}</p>
      <p className="text-sm text-gray-500">{userInfo.phone}</p>
      {userInfo.package && (
        <p className="text-sm text-[#F5A623] font-medium mt-1">Paket saat ini: {userInfo.package.name}</p>
      )}
    </div>
  )
}

function RequestDetailBlock({
  cfg,
  requestType,
  request,
  targetPackage,
}: {
  cfg: (typeof REQUEST_CONFIG)[keyof typeof REQUEST_CONFIG]
  requestType: string
  request: UserRequest
  targetPackage?: PackageInfo
}) {
  return (
    <div className={`rounded-xl p-4 border ${cfg.border} ${cfg.bg}`}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2">Detail Permintaan</p>
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
          <p className="text-sm text-gray-900 mt-1 leading-relaxed italic">
            &quot;{request.metadata?.reason ?? '-'}&quot;
          </p>
        </div>
      )}
    </div>
  )
}

function SystemMessageBlock({ message }: { message: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pesan Sistem</p>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}

function RejectNoteBlock({ note }: { note: string }) {
  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Catatan Penolakan</p>
      <p className="text-sm text-red-700">{note}</p>
    </div>
  )
}

function RejectForm({
  rejectNote,
  onChange,
}: {
  rejectNote: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        Catatan Penolakan (opsional)
      </label>
      <textarea
        value={rejectNote}
        onChange={e => onChange(e.target.value)}
        placeholder="Contoh: Area belum tersedia, paket sedang tidak aktif..."
        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-red-300"
      />
    </div>
  )
}

function ModalActions({
  showRejectForm,
  processing,
  onShowReject,
  onHideReject,
  onApprove,
  onReject,
}: {
  showRejectForm: boolean
  processing: boolean
  onShowReject: () => void
  onHideReject: () => void
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
      {!showRejectForm ? (
        <div className="flex gap-3">
          <button
            onClick={onShowReject}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Tolak
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-sm font-bold transition-colors disabled:opacity-50"
          >
            {processing ? <Spinner /> : <><CheckCircle className="w-4 h-4" /> Setujui & Proses</>}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onHideReject}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {processing ? <Spinner light /> : 'Konfirmasi Tolak'}
          </button>
        </div>
      )}
    </div>
  )
}




function ProcessedFooter({ decision }: { decision?: PermintaanDecision }) {
  return (
    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 text-center">
      <p className="text-xs text-gray-400 font-medium">
        {decision === 'APPROVED'
          ? 'Permintaan ini telah disetujui'
          : decision === 'REJECTED'
            ? 'Permintaan ini telah ditolak'
            : 'Permintaan ini sudah ditandai selesai diproses'}
      </p>
    </div>
  )
}

function PermintaanPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [packages, setPackages] = useState<PackageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('unread')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserRequest | null>(null)

  const tabParam = (searchParams.get('tab') ?? '') as TabKey
  const filterType =
    tabParam && tabParam in TAB_TO_TYPE
      ? TAB_TO_TYPE[tabParam as Exclude<TabKey, ''>]
      : ''

  const setTabFilter = (type: string) => {
    const entry = Object.entries(TAB_TO_TYPE).find(([, v]) => v === type)
    const tab = entry?.[0] ?? ''
    const params = new URLSearchParams(searchParams.toString())
    if (tab) params.set('tab', tab)
    else params.delete('tab')
    const qs = params.toString()
    router.replace(qs ? `/admin/permintaan?${qs}` : '/admin/permintaan', { scroll: false })
  }

  const totalUnread = requests.filter(isPending).length
  const packageRequests = requests.filter(r => getRequestType(r.title) === 'PACKAGE').length
  const addressRequests = requests.filter(r => getRequestType(r.title) === 'ADDRESS').length
  const cancelRequests = requests.filter(r => getRequestType(r.title) === 'CANCEL').length

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [notifRes, pkgRes] = await Promise.all([
        api.get('/admin/notifications?category=SYSTEM&limit=100'),
        api.get('/packages?active=false'),
      ])

      const allNotifs: UserRequest[] = notifRes.data.notifications ?? []
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

  const processRequest = async (
    req: UserRequest,
    decision: PermintaanDecision,
    note?: string,
  ) => {
    setProcessingId(req.id)
    try {
      const { data } = await api.post(`/admin/notifications/${req.id}/process`, {
        decision,
        ...(note ? { note } : {}),
      })

      setRequests(prev =>
        prev.map(r =>
          r.id === req.id
            ? {
                ...r,
                isRead: true,
                metadata: {
                  ...r.metadata,
                  decision,
                  ...(note ? { rejectNote: note } : {}),
                  processedAt: new Date().toISOString(),
                },
              }
            : r,
        ),
      )

      if (decision === 'APPROVED') {
        toast.success(data.message ?? 'Permintaan disetujui', {
          description: 'Perubahan data pelanggan telah diterapkan.',
        })
      } else {
        toast.success(data.message ?? 'Permintaan ditolak', {
          description: 'Tidak ada perubahan pada data pelanggan.',
        })
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Gagal memproses permintaan'
      toast.error(message)
      throw err
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprove = (req: UserRequest) => processRequest(req, 'APPROVED')
  const handleReject = (req: UserRequest, note?: string) => processRequest(req, 'REJECTED', note)

  const filtered = requests.filter(r => {
    const type = getRequestType(r.title)
    const matchType = !filterType || type === filterType
    const pending = isPending(r)
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && pending) ||
      (filterStatus === 'read' && !pending)
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase())
    return matchType && matchStatus && matchSearch
  })

  return (
    <>
      <div className="space-y-5">
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

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari permintaan..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>

            <div className="flex gap-2">
              {[
                { value: 'unread' as const, label: 'Menunggu' },
                { value: 'read' as const, label: 'Selesai' },
                { value: 'all' as const, label: 'Semua' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
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

            <div className="flex gap-2">{[
                { value: '', label: 'Semua Tipe' },
                { value: 'PACKAGE', label: 'Ganti Paket' },
                { value: 'ADDRESS', label: 'Pindah Alamat' },
                { value: 'CANCEL', label: 'Putus' },
              ].map(f => (
                <button
                  key={f.value || 'all'}
                  onClick={() => setTabFilter(f.value)}
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
          ) : (
            filtered.map(req => {
              const type = getRequestType(req.title)
              const cfg = REQUEST_CONFIG[type as keyof typeof REQUEST_CONFIG]
              const pending = isPending(req)
              const decision = req.metadata?.decision
              const isProcessing = processingId === req.id

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                    pending ? 'border-[#F5A623]/30 bg-[#F5A623]/[0.01]' : 'border-gray-100'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{req.title}</h3>
                          {pending && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-black">BARU</span>
                          )}
                          {req.isUrgent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-500">URGENT</span>
                          )}
                          {decision === 'APPROVED' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">DISETUJUI</span>
                          )}
                          {decision === 'REJECTED' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">DITOLAK</span>
                          )}
                          {!pending && !decision && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">SELESAI</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{req.message}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {timeAgo(req.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setSelected(req)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                        {pending && (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  await handleReject(req)
                                } catch { /* toast handled */ }
                              }}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {isProcessing && <Spinner small />}
                              Tolak
                            </button>
                            <button
                              onClick={() => setSelected(req)}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl bg-[#F5A623] text-black hover:bg-[#d98f1b] text-xs font-bold transition-colors disabled:opacity-50"
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
            })
          )}
        </div>
      </div>

      {selected && (
        <DetailModal
          request={selected}
          packages={packages}
          processing={processingId === selected.id}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </>
  )
}

export default function PermintaanPage() {
  return (
    <Suspense fallback={
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
        ))}
      </div>
    }>
      <PermintaanPageContent />
    </Suspense>
  )
}
