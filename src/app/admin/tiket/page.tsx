'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Search, RefreshCw, Eye, X, Send, CheckCircle,
  Clock, AlertTriangle, MessageSquare, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import type { Ticket, TicketReply } from '@/types'

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

interface TicketStats { open: number; inProgress: number; resolved: number; closed: number; total: number }

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-600',
    HIGH: 'bg-orange-100 text-orange-600',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[priority] ?? 'bg-gray-100 text-gray-500'}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    OPEN: { bg: 'bg-red-100', text: 'text-red-600', label: 'Open' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-600', label: 'In Progress' },
    RESOLVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Closed' },
  }
  const s = map[status] ?? map.OPEN
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
}

// ── Ticket Detail / Chat Modal ─────────────────────────────────
function TicketDetailModal({
  ticket, onClose, onRefresh
}: {
  ticket: Ticket
  onClose: () => void
  onRefresh: () => void
}) {
  const [detail, setDetail] = useState<Ticket & { replies?: TicketReply[] }>(ticket)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchDetail = useCallback(async () => {
    try {
      const { data } = await api.get(`/tickets/${ticket.id}`)
      setDetail(data)
    } catch { toast.error('Gagal memuat detail tiket') }
    finally { setLoadingDetail(false) }
  }, [ticket.id])

  useEffect(() => { fetchDetail() }, [fetchDetail])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [detail.replies])

  const handleSendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await api.post(`/tickets/${ticket.id}/reply`, { message: reply })
      setReply('')
      fetchDetail()
      onRefresh()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal mengirim balasan')
    } finally { setSending(false) }
  }

  const handleStatusChange = async (status: string) => {
    setUpdatingStatus(true)
    try {
      await api.patch(`/tickets/${ticket.id}/status`, { status })
      toast.success(`Status diubah ke ${status.replace('_', ' ')}`)
      fetchDetail()
      onRefresh()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal mengubah status')
    } finally { setUpdatingStatus(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden">

        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 py-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white/40 text-xs font-mono">{detail.ticketNumber}</p>
                <PriorityBadge priority={detail.priority} />
              </div>
              <h2 className="text-white font-bold truncate">{detail.title}</h2>
              <p className="text-white/40 text-xs mt-0.5">{detail.user?.fullName ?? '—'} · {timeAgo(detail.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge status={detail.status} />
              <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Status actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5">
            {(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={detail.status === s || updatingStatus}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  detail.status === s
                    ? 'bg-[#F5A623] text-black'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-40'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Deskripsi Masalah</p>
          <p className="text-sm text-gray-700 leading-relaxed">{detail.description}</p>
          {detail.category && (
            <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 uppercase">
              {detail.category}
            </span>
          )}
        </div>

        {/* Chat thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !detail.replies || detail.replies.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Belum ada balasan</p>
            </div>
          ) : detail.replies.map(r => (
            <div key={r.id} className={`flex gap-3 ${r.isFromAdmin ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                r.isFromAdmin ? 'bg-[#F5A623] text-black' : 'bg-gray-200 text-gray-600'
              }`}>
                {r.isFromAdmin ? 'A' : (detail.user?.fullName?.charAt(0) ?? 'U')}
              </div>
              <div className={`max-w-[75%] ${r.isFromAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <p className={`text-xs text-gray-400 ${r.isFromAdmin ? 'text-right' : ''}`}>
                  {r.isFromAdmin ? (r.admin?.fullName ?? 'Admin') : (detail.user?.fullName ?? 'Pelanggan')}
                </p>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  r.isFromAdmin
                    ? 'bg-[#1A1A1A] text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  {r.message}
                </div>
                <p className="text-[10px] text-gray-300">{timeAgo(r.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {detail.status !== 'CLOSED' && (
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-end gap-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis balasan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#F5A623]/50 min-h-[44px] max-h-32"
                rows={1}
              />
              <button
                onClick={handleSendReply}
                disabled={!reply.trim() || sending}
                className="w-11 h-11 rounded-2xl bg-[#F5A623] text-black flex items-center justify-center hover:bg-[#d98f1b] disabled:opacity-50 transition-colors flex-shrink-0"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function TiketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<TicketStats>({ open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const LIMIT = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (filterStatus) params.set('status', filterStatus)
      if (filterPriority) params.set('priority', filterPriority)
      if (search) params.set('search', search)

      const [ticketsRes, statsRes] = await Promise.all([
        api.get(`/tickets?${params}`),
        api.get('/tickets/stats'),
      ])
      setTickets(ticketsRes.data.data ?? [])
      setTotal(ticketsRes.data.meta?.total ?? 0)
      setTotalPages(ticketsRes.data.meta?.totalPages ?? 1)
      setStats(statsRes.data)
    } catch { toast.error('Gagal memuat data tiket') }
    finally { setLoading(false) }
  }, [page, filterStatus, filterPriority, search])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <AdminLayoutWrapper title="Helpdesk & Tiket" subtitle="Tangani laporan dan pertanyaan pelanggan">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-900' },
            { label: 'Open', value: stats.open, color: 'text-red-500', bg: 'border-red-100' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600', bg: 'border-blue-100' },
            { label: 'Resolved', value: stats.resolved, color: 'text-green-600', bg: 'border-green-100' },
            { label: 'Closed', value: stats.closed, color: 'text-gray-400', bg: 'border-gray-100' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg ?? 'border-gray-100'}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
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
                placeholder="Cari nomor tiket atau judul..."
                className="w-full pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F5A623]/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: '', label: 'Semua Status' },
                { value: 'OPEN', label: 'Open' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
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
                  {f.value === 'OPEN' && stats.open > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{stats.open}</span>
                  )}
                </button>
              ))}
            </div>
            <select
              value={filterPriority}
              onChange={e => { setFilterPriority(e.target.value); setPage(1) }}
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white"
            >
              <option value="">Semua Prioritas</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Ticket List */}
        <div className="space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Tidak ada tiket</p>
              <p className="text-gray-400 text-sm mt-1">
                {filterStatus ? 'Tidak ada tiket dengan status ini' : 'Semua tiket sudah ditangani'}
              </p>
            </div>
          ) : tickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Priority indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  ticket.priority === 'CRITICAL' ? 'bg-red-100' :
                  ticket.priority === 'HIGH' ? 'bg-orange-100' :
                  ticket.priority === 'MEDIUM' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    ticket.priority === 'CRITICAL' ? 'text-red-500' :
                    ticket.priority === 'HIGH' ? 'text-orange-500' :
                    ticket.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <p className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</p>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                    {ticket.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{ticket.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span>{ticket.user?.fullName ?? '—'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(ticket.createdAt)}
                    </span>
                    {ticket._count && ticket._count.replies > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {ticket._count.replies} balasan
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => setSelected(ticket)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5A623]/10 text-[#F5A623] hover:bg-[#F5A623]/20 text-sm font-semibold transition-colors flex-shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Balas</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-5 py-3">
            <p className="text-sm text-gray-500">
              Menampilkan {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} dari {total} tiket
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Sebelumnya</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Selanjutnya</button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onRefresh={fetchData}
        />
      )}
    </AdminLayoutWrapper>
  )
}
