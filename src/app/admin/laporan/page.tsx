'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import { exportLaporanBulanan } from '@/lib/export'
import { RefreshCw, TrendingUp, Users, CreditCard, FileText, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { toast } from 'sonner'

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const GOLD = '#F5A623'

export default function LaporanPage() {
  const [userStats, setUserStats] = useState<any>(null)
  const [billingStats, setBillingStats] = useState<any>(null)
  const [paymentStats, setPaymentStats] = useState<any>(null)
  const [ticketStats, setTicketStats] = useState<any>(null)
  const [regStats, setRegStats] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  // ✅ FIX: state khusus untuk data revenue per bulan (bukan dummy)
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; pendapatan: number; isCurrent: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  const [exporting, setExporting] = useState(false)
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1)
  const [exportYear, setExportYear] = useState(new Date().getFullYear())

  // ✅ FIX: fetch revenue per bulan dari /payments/stats dengan filter bulan
  const fetchMonthlyRevenue = useCallback(async (targetYear: number) => {
    const currentMonth = new Date().getMonth() // 0-based

    const monthPromises = MONTHS.slice(0, currentMonth + 1).map(async (month, i) => {
      try {
        // Ambil semua payment APPROVED untuk bulan & tahun tertentu
        const { data } = await api.get('/payments', {
          params: {
            status: 'APPROVED',
            limit: 1000,
            page: 1,
          },
        })

        // Filter client-side berdasarkan processedAt (bulan & tahun)
        const payments: any[] = data.data ?? []
        const filtered = payments.filter((p: any) => {
          if (!p.processedAt) return false
          const d = new Date(p.processedAt)
          return d.getFullYear() === targetYear && d.getMonth() === i
        })

        const total = filtered.reduce((sum: number, p: any) => sum + (p.amount ?? 0), 0)

        return {
          month,
          pendapatan: total,
          isCurrent: i === currentMonth,
        }
      } catch {
        return { month, pendapatan: 0, isCurrent: i === currentMonth }
      }
    })

    const results = await Promise.all(monthPromises)
    setMonthlyRevenue(results)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [uStats, bStats, pStats, tStats, rStats, pkgs] = await Promise.all([
        api.get('/users/stats'),
        api.get('/billing/stats'),
        api.get('/payments/stats'),
        api.get('/tickets/stats'),
        api.get('/registrations/stats'),
        api.get('/packages'),
      ])
      setUserStats(uStats.data)
      setBillingStats(bStats.data)
      setPaymentStats(pStats.data)
      setTicketStats(tStats.data)
      setRegStats(rStats.data)
      setPackages(Array.isArray(pkgs.data) ? pkgs.data : pkgs.data.data ?? [])

      // ✅ Fetch monthly revenue setelah stats selesai
      await fetchMonthlyRevenue(year)
    } catch { toast.error('Gagal memuat data laporan') }
    finally { setLoading(false) }
  }, [year, fetchMonthlyRevenue])

  // ✅ Re-fetch monthly revenue saat tahun berubah
  useEffect(() => { fetchData() }, [fetchData])

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await api.get(`/billing?month=${exportMonth}&year=${exportYear}&limit=1000&page=1`)
      const invoices = data.data ?? []
      if (invoices.length === 0) {
        toast.warning('Tidak ada data tagihan di bulan tersebut')
        return
      }
      await exportLaporanBulanan(invoices, MONTHS_FULL[exportMonth - 1], String(exportYear))
      toast.success('Export berhasil!', { description: `${invoices.length} tagihan diekspor` })
    } catch {
      toast.error('Gagal export laporan')
    } finally {
      setExporting(false)
    }
  }

  const userPieData = userStats ? [
    { name: 'Aktif', value: userStats.active, color: '#22C55E' },
    { name: 'Pending', value: userStats.pending, color: GOLD },
    { name: 'Suspended', value: userStats.suspended, color: '#EF4444' },
    { name: 'Nonaktif', value: userStats.inactive, color: '#9CA3AF' },
  ].filter(d => d.value > 0) : []

  const invoiceData = billingStats ? [
    { name: 'Lunas', value: billingStats.paid, color: '#22C55E' },
    { name: 'Belum Bayar', value: billingStats.unpaid, color: GOLD },
    { name: 'Terlambat', value: billingStats.overdue, color: '#EF4444' },
    { name: 'Pending', value: billingStats.pending, color: '#3B82F6' },
  ].filter(d => d.value > 0) : []

  const packageData = packages.filter(p => p._count?.users > 0).map(p => ({
    name: p.name.replace('Paket ', ''),
    pelanggan: p._count?.users ?? 0,
  }))

  if (loading) {
    return (
      <AdminLayoutWrapper title="Laporan & Analitik">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Memuat data laporan...</p>
          </div>
        </div>
      </AdminLayoutWrapper>
    )
  }

  return (
    <AdminLayoutWrapper title="Laporan & Analitik" subtitle="Ringkasan performa sistem CAKRANA WiFi">
      <div className="space-y-5">

        {/* Header bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-white"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-xs font-semibold text-gray-400 hidden sm:block">Export Laporan:</span>
            <select
              value={exportMonth}
              onChange={e => setExportMonth(Number(e.target.value))}
              className="h-8 border border-gray-200 rounded-lg px-2 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50"
            >
              {MONTHS_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={exportYear}
              onChange={e => setExportYear(Number(e.target.value))}
              className="h-8 border border-gray-200 rounded-lg px-2 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] disabled:opacity-50 transition-colors"
            >
              {exporting
                ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                : <Download className="w-3.5 h-3.5" />
              }
              {exporting ? 'Mengekspor...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Pelanggan',
              value: userStats?.total ?? 0,
              sub: `${userStats?.active ?? 0} aktif`,
              icon: Users,
              color: 'bg-blue-50 text-blue-500',
            },
            {
              label: 'Pendapatan Bulan Ini',
              value: formatRp(billingStats?.totalRevenueThisMonth ?? 0),
              sub: `${billingStats?.paid ?? 0} tagihan lunas`,
              icon: TrendingUp,
              color: 'bg-green-50 text-green-500',
              isText: true,
            },
            {
              label: 'Pembayaran Diproses',
              value: paymentStats?.approved ?? 0,
              sub: `${paymentStats?.pending ?? 0} menunggu`,
              icon: CreditCard,
              color: 'bg-[#F5A623]/10 text-[#F5A623]',
            },
            {
              label: 'Tiket Diselesaikan',
              value: (ticketStats?.resolved ?? 0) + (ticketStats?.closed ?? 0),
              sub: `${ticketStats?.open ?? 0} masih open`,
              icon: FileText,
              color: 'bg-purple-50 text-purple-500',
            },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
                  <kpi.icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className={`font-bold text-gray-900 leading-none mb-1 ${kpi.isText ? 'text-lg' : 'text-3xl'}`}>{kpi.value}</p>
              <p className="text-xs text-gray-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue chart + User status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                {/* ✅ Label chart sekarang dinamis sesuai tahun yang dipilih */}
                <h3 className="font-semibold text-gray-900">Pendapatan Bulanan {year}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Berdasarkan pembayaran yang disetujui</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#F5A623]" />
                <span className="text-xs text-gray-400">Pendapatan nyata</span>
              </div>
            </div>

            {/* ✅ Gunakan monthlyRevenue dari state (data nyata), bukan dummy */}
            {monthlyRevenue.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-gray-300 text-sm">
                Belum ada data pembayaran untuk tahun ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyRevenue} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={v => v === 0 ? '0' : `${(v / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    formatter={(v) => [formatRp(Number(v)), 'Pendapatan']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Bar dataKey="pendapatan" radius={[6, 6, 0, 0]}>
                    {monthlyRevenue.map((entry, i) => (
                      <Cell key={i} fill={entry.isCurrent ? GOLD : '#f0f0f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1">Status Pelanggan</h3>
            <p className="text-xs text-gray-400 mb-4">Total {userStats?.total ?? 0} pelanggan</p>
            {userPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={userPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {userPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {userPieData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-xs text-gray-500 flex-1">{item.name}</span>
                      <span className="text-xs font-semibold text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Invoice status + Package distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1">Status Tagihan</h3>
            <p className="text-xs text-gray-400 mb-4">Distribusi status tagihan saat ini</p>
            {invoiceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={invoiceData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {invoiceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Belum ada data</div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-1">Distribusi Paket</h3>
            <p className="text-xs text-gray-400 mb-4">Jumlah pelanggan per paket internet</p>
            {packageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={packageData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Pelanggan']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Bar dataKey="pelanggan" fill={GOLD} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-300 text-sm">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Summary table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Ringkasan Keseluruhan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['Kategori', 'Total', 'Aktif / Berhasil', 'Perlu Perhatian'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Pelanggan', userStats?.total ?? 0, `${userStats?.active ?? 0} aktif`, `${userStats?.suspended ?? 0} suspended`],
                  ['Pendaftaran', regStats?.total ?? 0, `${regStats?.approved ?? 0} disetujui`, `${regStats?.pending ?? 0} pending`],
                  ['Tagihan', (billingStats?.unpaid ?? 0) + (billingStats?.paid ?? 0) + (billingStats?.overdue ?? 0), `${billingStats?.paid ?? 0} lunas`, `${billingStats?.overdue ?? 0} overdue`],
                  ['Pembayaran', (paymentStats?.pending ?? 0) + (paymentStats?.approved ?? 0) + (paymentStats?.rejected ?? 0), `${paymentStats?.approved ?? 0} disetujui`, `${paymentStats?.pending ?? 0} menunggu`],
                  ['Tiket', ticketStats?.total ?? 0, `${(ticketStats?.resolved ?? 0) + (ticketStats?.closed ?? 0)} selesai`, `${ticketStats?.open ?? 0} open`],
                ].map(([cat, total, ok, warn], i) => (
                  <tr key={String(cat)} className={i % 2 === 0 ? '' : 'bg-gray-50/30'}>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{cat}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{total}</td>
                    <td className="px-5 py-3.5"><span className="text-sm text-green-600 font-medium">{ok}</span></td>
                    <td className="px-5 py-3.5"><span className={`text-sm font-medium ${String(warn).startsWith('0') ? 'text-gray-400' : 'text-red-500'}`}>{warn}</span></td>
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