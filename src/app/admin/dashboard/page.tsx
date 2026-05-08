'use client'

import { useEffect, useState } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Users, Wifi, Ban, UserPlus, TrendingUp, AlertTriangle,
  Clock, BarChart2, CheckCircle, XCircle, Ticket,
  ArrowUpRight, ArrowDownRight, Eye, MoreVertical
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────
interface DashboardStats {
  userStats: { total: number; active: number; suspended: number; pending: number; inactive: number }
  billingStats: { unpaid: number; pending: number; paid: number; overdue: number; totalRevenueThisMonth: number }
  paymentStats: { pending: number; approved: number; rejected: number }
  ticketStats: { open: number; inProgress: number; resolved: number; closed: number; total: number }
  registrationStats: { total: number; pending: number; approved: number; rejected: number }
}

interface RecentUser { id: string; fullName: string; customerCode: string; phone: string; status: string; package?: { name: string } }
interface PendingReg { id: string; fullName: string; phone: string; city: string | null; createdAt: string; packageId: string }
interface PendingPayment { id: string; paymentCode: string; amount: number; method: string; user?: { fullName: string; customerCode: string }; invoice?: { invoiceNumber: string } }
interface ActiveTicket { id: string; ticketNumber: string; title: string; priority: string; status: string; createdAt: string; user?: { fullName: string } }

// ── Helper ────────────────────────────────────────────────────
const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const currentMonth = new Date().getMonth()

// Generate dummy monthly data (nanti bisa diganti dengan API laporan)
const monthlyData = MONTHS.slice(0, currentMonth + 1).map((month, i) => ({
  month,
  pendapatan: Math.floor(Math.random() * 30000000) + 10000000,
  isCurrent: i === currentMonth,
}))

// ── Subcomponents ─────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, badge }: {
  label: string; value: string | number; icon: any; color: string; sub?: string; badge?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {badge && (
        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623]/15 text-[#F5A623]">
          {badge}
        </span>
      )}
    </div>
  )
}

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
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-600',
    SUSPENDED: 'bg-red-100 text-red-600',
    PENDING: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Aktif', SUSPENDED: 'Suspend', PENDING: 'Proses', INACTIVE: 'Nonaktif'
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [pendingRegs, setPendingRegs] = useState<PendingReg[]>([])
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([])
  const [activeTickets, setActiveTickets] = useState<ActiveTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userStats, billingStats, paymentStats, ticketStats, regStats,
          usersRes, regsRes, paymentsRes, ticketsRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/billing/stats'),
          api.get('/payments/stats'),
          api.get('/tickets/stats'),
          api.get('/registrations/stats'),
          api.get('/users?limit=5&page=1'),
          api.get('/registrations?status=PENDING&limit=3'),
          api.get('/payments?status=PENDING&limit=3'),
          api.get('/tickets?status=OPEN&limit=3'),
        ])

        setStats({
          userStats: userStats.data,
          billingStats: billingStats.data,
          paymentStats: paymentStats.data,
          ticketStats: ticketStats.data,
          registrationStats: regStats.data,
        })
        setRecentUsers(usersRes.data.data ?? [])
        setPendingRegs(regsRes.data.data ?? [])
        setPendingPayments(paymentsRes.data.data ?? [])
        setActiveTickets(ticketsRes.data.data ?? [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // ── Approve / Reject Registration ─────────────────────────
  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/registrations/${id}/approve`)
      setPendingRegs(prev => prev.filter(r => r.id !== id))
      setStats(prev => prev ? {
        ...prev,
        registrationStats: { ...prev.registrationStats, pending: prev.registrationStats.pending - 1 }
      } : prev)
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Alasan penolakan:')
    if (!reason) return
    try {
      await api.patch(`/registrations/${id}/reject`, { reason })
      setPendingRegs(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // ── Approve Payment ────────────────────────────────────────
  const handleApprovePayment = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/approve`)
      setPendingPayments(prev => prev.filter(p => p.id !== id))
      setStats(prev => prev ? {
        ...prev,
        paymentStats: { ...prev.paymentStats, pending: prev.paymentStats.pending - 1 }
      } : prev)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading || !stats) {
  return (
    <AdminLayoutWrapper title="Dasbor Overview">
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Memuat data dashboard...</p>
        </div>
      </div>
    </AdminLayoutWrapper>
  )
}

const s = stats  

  return (
    <AdminLayoutWrapper title="Dasbor Overview">
      <div className="space-y-6">

        {/* ── Alert Strip ─────────────────────────────────── */}
        {(s.billingStats.overdue > 0 || s.registrationStats.pending > 0 || s.ticketStats.open > 0) && (
          <div className="bg-[#1A1A1A] rounded-xl px-5 py-3 flex items-center gap-2 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {s.billingStats.overdue > 0 && (
                <span className="text-white/80">
                  🔴 <span className="text-[#F5A623] font-semibold">{s.billingStats.overdue}</span> tagihan melewati jatuh tempo
                </span>
              )}
              {s.registrationStats.pending > 0 && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-white/80">
                    🟡 <span className="text-[#F5A623] font-semibold">{s.registrationStats.pending}</span> pendaftar menunggu approval
                  </span>
                </>
              )}
              {s.ticketStats.open > 0 && (
                <>
                  <span className="text-white/20">|</span>
                  <span className="text-white/80">
                    🔵 <span className="text-[#F5A623] font-semibold">{s.ticketStats.open}</span> tiket belum ditangani
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Overview Pelanggan ───────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview Pelanggan</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Pelanggan" value={s.userStats.total} icon={Users} color="bg-blue-50 text-blue-500" sub="Semua terdaftar" />
            <StatCard label="Aktif" value={s.userStats.active} icon={Wifi} color="bg-green-50 text-green-500" sub={`${Math.round(s.userStats.active / (s.userStats.total || 1) * 100)}% dari total`} />
            <StatCard label="Suspended" value={s.userStats.suspended} icon={Ban} color="bg-red-50 text-red-500" sub="Perlu perhatian" />
            <StatCard label="Pendaftar Baru" value={s.registrationStats.pending} icon={UserPlus} color="bg-[#F5A623]/10 text-[#F5A623]" badge="MENUNGGU APPROVAL" />
          </div>
        </div>

        {/* ── Overview Keuangan ────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview Keuangan</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pendapatan Bulan Ini"
              value={formatRp(s.billingStats.totalRevenueThisMonth)}
              icon={TrendingUp}
              color="bg-green-50 text-green-500"
              sub={`${s.billingStats.paid} tagihan lunas`}
            />
            <div className="bg-white rounded-2xl p-5 border border-red-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tagihan Belum Bayar</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-50 text-red-500">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500 leading-none">{s.billingStats.unpaid + s.billingStats.overdue}</p>
              <p className="text-xs text-gray-400 mt-1">Termasuk {s.billingStats.overdue} overdue</p>
            </div>
            <StatCard
              label="Pembayaran Pending"
              value={s.paymentStats.pending}
              icon={Clock}
              color="bg-orange-50 text-orange-500"
              sub="Menunggu validasi"
            />
            <div className="bg-[#1A1A1A] rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Total Tahun Ini</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F5A623]/20">
                  <BarChart2 className="w-4.5 h-4.5 text-[#F5A623]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white leading-none">
                {formatRp(s.billingStats.totalRevenueThisMonth * 6)}
              </p>
              <p className="text-xs text-white/40 mt-1">Estimasi berdasarkan bulan ini</p>
            </div>
          </div>
        </div>

        {/* ── Charts ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-gray-900">Pendapatan Bulanan 2026</h3>
                <p className="text-xs text-gray-400 mt-0.5">Estimasi berdasarkan tagihan lunas</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#F5A623]" />
                <span className="text-xs text-gray-400">Pendapatan</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  formatter={(v) => [formatRp(Number(v)), 'Pendapatan']}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Bar dataKey="pendapatan" radius={[6, 6, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.isCurrent ? '#F5A623' : '#f0f0f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status donut */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1">Status Pelanggan</h3>
            <p className="text-xs text-gray-400 mb-4">Distribusi saat ini</p>
            <div className="flex flex-col items-center">
              {/* Diamond visual sesuai design */}
              <div className="relative w-36 h-36 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 bg-[#F5A623] rotate-45 rounded-xl opacity-20" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-400 font-medium">TOTAL</p>
                  <p className="text-4xl font-bold text-gray-900">{s.userStats.total}</p>
                </div>
              </div>
              <div className="w-full space-y-2">
                {[
                  { label: 'Aktif', value: s.userStats.active, color: '#22C55E' },
                  { label: 'Isolir', value: s.userStats.suspended, color: '#EF4444' },
                  { label: 'Baru', value: s.userStats.pending, color: '#F5A623' },
                  { label: 'Nonaktif', value: s.userStats.inactive, color: '#9CA3AF' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-xs text-gray-500 flex-1">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Column: Pendaftar, Pembayaran, Tiket ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pendaftar Baru */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Pendaftar Baru</h3>
                {s.registrationStats.pending > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-black">
                    {s.registrationStats.pending}
                  </span>
                )}
              </div>
              <a href="/admin/pendaftar" className="text-xs text-[#F5A623] font-medium hover:underline">Lihat Semua</a>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingRegs.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Tidak ada pendaftar baru</p>
                </div>
              ) : pendingRegs.map(reg => (
                <div key={reg.id} className="px-5 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#F5A623]/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#F5A623] font-bold text-xs">{reg.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{reg.fullName}</p>
                      <p className="text-xs text-gray-400">{reg.city ?? '-'} · {timeAgo(reg.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-11">
                    <button
                      onClick={() => handleApprove(reg.id)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(reg.id)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    >
                      ✗ Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pembayaran Pending */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Pembayaran Pending</h3>
                {s.paymentStats.pending > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {s.paymentStats.pending}
                  </span>
                )}
              </div>
              <a href="/admin/pembayaran" className="text-xs text-[#F5A623] font-medium hover:underline">Lihat Semua</a>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingPayments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Tidak ada pembayaran pending</p>
                </div>
              ) : pendingPayments.map(pay => (
                <div key={pay.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400 font-mono">{pay.invoice?.invoiceNumber ?? pay.paymentCode}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">CEK TRANSFER</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{pay.user?.fullName ?? '-'}</p>
                  <p className="text-[#F5A623] font-bold text-sm">{formatRp(pay.amount)}</p>
                  <button
                    onClick={() => handleApprovePayment(pay.id)}
                    className="mt-2 w-full text-xs font-semibold py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  >
                    ✓ Approve Pembayaran
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tiket Support */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">Tiket Support</h3>
                {s.ticketStats.open > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
                    {s.ticketStats.open} HIGH
                  </span>
                )}
              </div>
              <a href="/admin/tiket" className="text-xs text-[#F5A623] font-medium hover:underline">Ke Helpdesk</a>
            </div>
            <div className="divide-y divide-gray-50">
              {activeTickets.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Tidak ada tiket aktif</p>
                </div>
              ) : activeTickets.map(ticket => (
                <div key={ticket.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{ticket.title}</p>
                  <p className="text-xs text-gray-400">{ticket.user?.fullName ?? '-'} · {timeAgo(ticket.createdAt)}</p>
                  <a
                    href={`/admin/tiket`}
                    className="mt-2 block text-center text-xs font-semibold py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] hover:bg-[#F5A623]/20 transition-colors"
                  >
                    Balas →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabel Pelanggan Terbaru ──────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Pelanggan Terbaru</h3>
            <a
              href="/admin/pelanggan"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#F5A623] text-black hover:bg-[#F5A623]/90 transition-colors"
            >
              + TAMBAH PELANGGAN
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">ID Pelanggan</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Nama</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Paket</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Belum ada pelanggan</td>
                  </tr>
                ) : recentUsers.map((user, i) => (
                  <tr key={user.id} className={`hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/20'}`}>
                    <td className="px-6 py-3 text-sm font-mono text-gray-500">{user.customerCode}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.package?.name ?? '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <Eye className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                          <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayoutWrapper>
  )
}