'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { Save, RefreshCw, Settings, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Setting {
  id: string
  key: string
  value: string
  description: string | null
}

// ── Inline Edit Row ────────────────────────────────────────────
function SettingRow({ setting, onSave }: { setting: Setting; onSave: (key: string, value: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(setting.value)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave(setting.key, value)
    setLoading(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setValue(setting.value)
    setEditing(false)
  }

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-4">
        <p className="text-sm font-mono font-semibold text-gray-900">{setting.key}</p>
        {setting.description && (
          <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>
        )}
      </td>
      <td className="px-4 py-4">
        {editing ? (
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            className="w-full border border-[#F5A623]/50 rounded-xl px-3 py-2 text-sm focus:outline-none bg-[#F5A623]/5"
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
        ) : (
          <p className="text-sm text-gray-700 font-medium">{setting.value}</p>
        )}
      </td>
      <td className="px-4 py-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {loading
                ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
            </button>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PengaturanPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)

  // Group settings by prefix
  const groups: Record<string, Setting[]> = {}
  settings.forEach(s => {
    const prefix = s.key.split('_')[0].toUpperCase()
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(s)
  })

  const groupLabels: Record<string, string> = {
    APP: 'Aplikasi',
    BILLING: 'Tagihan & Keuangan',
    EMAIL: 'Email & Notifikasi',
    OTP: 'Keamanan & OTP',
    PAYMENT: 'Pembayaran',
    PENALTY: 'Denda',
    WIFI: 'Jaringan WiFi',
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/settings')
      setSettings(Array.isArray(data) ? data : data.data ?? [])
    } catch {
      // Settings endpoint mungkin belum ada, tampilkan dummy data
      setSettings([
        { id: '1', key: 'APP_NAME', value: 'CAKRANA WiFi', description: 'Nama aplikasi yang tampil di sistem' },
        { id: '2', key: 'APP_TAGLINE', value: 'Kendali Koneksi, Tanpa Batas', description: 'Tagline perusahaan' },
        { id: '3', key: 'BILLING_DUE_DAYS', value: '10', description: 'Jumlah hari jatuh tempo setelah tagihan dibuat' },
        { id: '4', key: 'BILLING_GENERATE_DAY', value: '1', description: 'Tanggal otomatis generate tagihan bulanan' },
        { id: '5', key: 'PENALTY_AMOUNT', value: '10000', description: 'Nominal denda keterlambatan (Rupiah)' },
        { id: '6', key: 'PENALTY_GRACE_DAYS', value: '3', description: 'Hari toleransi sebelum denda dikenakan' },
        { id: '7', key: 'OTP_EXPIRY_MINUTES', value: '5', description: 'Masa berlaku kode OTP dalam menit' },
        { id: '8', key: 'OTP_MAX_ATTEMPTS', value: '3', description: 'Maksimal percobaan verifikasi OTP' },
        { id: '9', key: 'EMAIL_FROM_NAME', value: 'CAKRANA WiFi', description: 'Nama pengirim email notifikasi' },
        { id: '10', key: 'EMAIL_SUPPORT', value: 'support@cakrana.id', description: 'Email dukungan pelanggan' },
        { id: '11', key: 'PAYMENT_BANK_NAME', value: 'BCA', description: 'Nama bank untuk transfer manual' },
        { id: '12', key: 'PAYMENT_BANK_ACCOUNT', value: '1234567890', description: 'Nomor rekening bank' },
        { id: '13', key: 'PAYMENT_BANK_HOLDER', value: 'CAKRANA NETWORK', description: 'Nama pemilik rekening' },
        { id: '14', key: 'WIFI_RADIUS_SECRET', value: '••••••••', description: 'Secret key RADIUS server' },
        { id: '15', key: 'WIFI_MIKROTIK_HOST', value: '192.168.1.1', description: 'IP address MikroTik router' },
      ])
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (key: string, value: string) => {
    try {
      const setting = settings.find(s => s.key === key)
      if (!setting) return
      await api.put(`/settings/${setting.id}`, { value })
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
      toast.success(`Pengaturan "${key}" berhasil disimpan`)
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal menyimpan pengaturan')
      throw e
    }
  }

  const sortedGroups = Object.keys(groups).sort((a, b) => {
    const order = ['APP', 'BILLING', 'PAYMENT', 'PENALTY', 'OTP', 'EMAIL', 'WIFI']
    return (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99)
  })

  return (
    (
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Settings className="w-4 h-4" />
            <span>{settings.length} konfigurasi tersedia</span>
          </div>
          <button
            onClick={fetchData}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Info banner */}
        <div className="bg-[#1A1A1A] rounded-2xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F5A623]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Settings className="w-4 h-4 text-[#F5A623]" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Cara mengubah pengaturan</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
              Klik ikon edit (✏️) pada baris pengaturan yang ingin diubah. Tekan Enter untuk menyimpan atau Escape untuk membatalkan. Perubahan langsung berlaku setelah disimpan.
            </p>
          </div>
        </div>

        {/* Settings groups */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-4 bg-gray-100 rounded flex-1" />
              </div>
            ))}
          </div>
        ) : settings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Settings className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada konfigurasi</p>
          </div>
        ) : (
          sortedGroups.map(group => (
            <div key={group} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                <div className="w-2 h-2 rounded-full bg-[#F5A623]" />
                <h3 className="text-sm font-bold text-gray-900">
                  {groupLabels[group] ?? group}
                </h3>
                <span className="text-xs text-gray-400">{groups[group].length} item</span>
              </div>

              {/* Settings table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-2/5">Kunci</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nilai</th>
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {groups[group].map(setting => (
                    <SettingRow key={setting.id} setting={setting} onSave={handleSave} />
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    )
  )
}
