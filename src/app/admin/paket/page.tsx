'use client'

import { useEffect, useState, useCallback } from 'react'
import AdminLayoutWrapper from '@/components/admin/AdminLayoutWrapper'
import api from '@/lib/api'
import {
  Plus, Edit2, Trash2, Wifi, CheckCircle, X,
  Star, ToggleLeft, ToggleRight, AlertTriangle, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import type { Package } from '@/types'

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

// ── Package Form Modal ─────────────────────────────────────────
function PackageFormModal({
  pkg, onClose, onSuccess
}: {
  pkg?: Package | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEdit = !!pkg
  const [loading, setLoading] = useState(false)
  const [featuresInput, setFeaturesInput] = useState(pkg?.features?.join('\n') ?? '')
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    description: pkg?.description ?? '',
    price: pkg?.price ?? 0,
    speedDown: pkg?.speedDown ?? 10,
    speedUp: pkg?.speedUp ?? 5,
    isUnlimited: pkg?.isUnlimited ?? true,
    isActive: pkg?.isActive ?? true,
    isPopular: pkg?.isPopular ?? false,
    color: pkg?.color ?? '#F5A623',
    sortOrder: pkg?.sortOrder ?? 0,
  })

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        features: featuresInput.split('\n').map(f => f.trim()).filter(Boolean),
      }
      if (isEdit) {
        await api.put(`/packages/${pkg!.id}`, payload)
        toast.success('Paket berhasil diperbarui')
      } else {
        await api.post('/packages', payload)
        toast.success('Paket baru berhasil ditambahkan')
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal menyimpan paket')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-[#1A1A1A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold">{isEdit ? 'Edit Paket' : 'Tambah Paket Baru'}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nama */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Nama Paket <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)} required
              placeholder="Contoh: Paket Pro 20 Mbps"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Deskripsi</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Deskripsi singkat paket..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50 resize-none h-20"
            />
          </div>

          {/* Harga & Speed */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Harga/Bulan <span className="text-red-400">*</span>
              </label>
              <input
                type="number" value={form.price} onChange={e => set('price', Number(e.target.value))} required min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Download (Mbps) <span className="text-red-400">*</span>
              </label>
              <input
                type="number" value={form.speedDown} onChange={e => set('speedDown', Number(e.target.value))} required min={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Upload (Mbps) <span className="text-red-400">*</span>
              </label>
              <input
                type="number" value={form.speedUp} onChange={e => set('speedUp', Number(e.target.value))} required min={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Fitur */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Fitur (satu per baris)
            </label>
            <textarea
              value={featuresInput} onChange={e => setFeaturesInput(e.target.value)}
              placeholder={"Tanpa batas kuota\nStabil 24 jam\nFree instalasi"}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50 resize-none h-24 font-mono"
            />
          </div>

          {/* Warna & Sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Warna Badge</label>
              <div className="flex items-center gap-2">
                <input
                  type="color" value={form.color} onChange={e => set('color', e.target.value)}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  value={form.color} onChange={e => set('color', e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Urutan Tampil</label>
              <input
                type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} min={0}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A623]/50 bg-gray-50/50"
              />
            </div>
          </div>

          {/* Toggle options */}
          <div className="space-y-2">
            {[
              { key: 'isUnlimited', label: 'Kuota Unlimited', desc: 'Tanpa batas penggunaan data' },
              { key: 'isActive', label: 'Paket Aktif', desc: 'Tampil dan bisa dipilih pelanggan' },
              { key: 'isPopular', label: 'Tandai Populer', desc: 'Ditampilkan badge "Terpopuler"' },
            ].map(({ key, label, desc }) => (
              <div
                key={key}
                onClick={() => set(key, !(form as any)[key])}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  (form as any)[key] ? 'border-[#F5A623]/40 bg-[#F5A623]/5' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                {(form as any)[key]
                  ? <ToggleRight className="w-6 h-6 text-[#F5A623]" />
                  : <ToggleLeft className="w-6 h-6 text-gray-300" />
                }
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] disabled:opacity-50 transition-colors">
              {loading
                ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                : isEdit ? 'Simpan Perubahan' : 'Tambah Paket'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ───────────────────────────────────────
function DeleteModal({ pkg, onClose, onConfirm }: { pkg: Package; onClose: () => void; onConfirm: () => void }) {
  const [loading, setLoading] = useState(false)
  const confirm = async () => { setLoading(true); await onConfirm(); setLoading(false) }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Hapus Paket?</h3>
        <p className="text-gray-500 text-sm mb-1">Paket <span className="font-semibold text-gray-900">{pkg.name}</span> akan dihapus permanen.</p>
        <p className="text-xs text-red-500 mb-6">Paket yang masih memiliki pelanggan aktif tidak dapat dihapus.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={confirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PaketPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPkg, setEditPkg] = useState<Package | null>(null)
  const [deletePkg, setDeletePkg] = useState<Package | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/packages')
      setPackages(Array.isArray(data) ? data : data.data ?? [])
    } catch { toast.error('Gagal memuat data paket') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async () => {
    if (!deletePkg) return
    try {
      await api.delete(`/packages/${deletePkg.id}`)
      toast.success('Paket berhasil dihapus')
      setDeletePkg(null)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Gagal menghapus paket')
      setDeletePkg(null)
    }
  }

  const handleToggleActive = async (pkg: Package) => {
    try {
      await api.put(`/packages/${pkg.id}`, { isActive: !pkg.isActive })
      toast.success(`Paket ${pkg.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchData()
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Gagal mengubah status') }
  }

  const active = packages.filter(p => p.isActive).length
  const inactive = packages.filter(p => !p.isActive).length
  const popular = packages.filter(p => p.isPopular).length

  return (
    <AdminLayoutWrapper title="Manajemen Paket" subtitle="Kelola paket layanan internet CAKRANA">
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Paket', value: packages.length, color: 'text-gray-900' },
            { label: 'Aktif', value: active, color: 'text-green-600', bg: 'border-green-100' },
            { label: 'Nonaktif', value: inactive, color: 'text-gray-400', bg: 'border-gray-100' },
            { label: 'Populer', value: popular, color: 'text-[#F5A623]', bg: 'border-[#F5A623]/20' },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-2xl p-4 border ${s.bg ?? 'border-gray-100'}`}>
              <p className="text-xs font-medium text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Header action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-sm text-gray-400">{packages.length} paket tersedia</span>
          </div>
          <button
            onClick={() => { setEditPkg(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-[#F5A623] text-black text-sm font-bold hover:bg-[#d98f1b] transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Paket
          </button>
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-100 rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => <div key={j} className="h-3 bg-gray-100 rounded" />)}
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Wifi className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada paket</p>
            <p className="text-gray-400 text-sm mt-1">Klik tombol "Tambah Paket" untuk mulai</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${
                  !pkg.isActive ? 'opacity-60 border-gray-100' : 'border-gray-100'
                }`}
              >
                {/* Card header with color */}
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: pkg.color ?? '#F5A623' }}
                />
                <div className="p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                        {pkg.isPopular && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5A623] text-black">
                            <Star className="w-2.5 h-2.5" /> POPULER
                          </span>
                        )}
                        {!pkg.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                            NONAKTIF
                          </span>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-xs text-gray-400 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900">{formatRp(pkg.price)}</p>
                    <p className="text-xs text-gray-400">per bulan</p>
                  </div>

                  {/* Speed */}
                  <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Download</p>
                      <p className="font-bold text-gray-900 text-sm">{pkg.speedDown} <span className="text-xs font-normal text-gray-400">Mbps</span></p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Upload</p>
                      <p className="font-bold text-gray-900 text-sm">{pkg.speedUp} <span className="text-xs font-normal text-gray-400">Mbps</span></p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">Kuota</p>
                      <p className="font-bold text-gray-900 text-sm">{pkg.isUnlimited ? '∞' : 'Terbatas'}</p>
                    </div>
                  </div>

                  {/* Features */}
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="space-y-1.5 mb-4">
                      {pkg.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                      {pkg.features.length > 4 && (
                        <li className="text-xs text-gray-400 pl-5">+{pkg.features.length - 4} fitur lainnya</li>
                      )}
                    </ul>
                  )}

                  {/* Pelanggan count */}
                  {pkg._count && (
                    <p className="text-xs text-gray-400 mb-4">
                      <span className="font-semibold text-gray-600">{pkg._count.users}</span> pelanggan aktif
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        pkg.isActive
                          ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {pkg.isActive
                        ? <><ToggleLeft className="w-3.5 h-3.5" /> Nonaktifkan</>
                        : <><ToggleRight className="w-3.5 h-3.5" /> Aktifkan</>
                      }
                    </button>
                    <button
                      onClick={() => { setEditPkg(pkg); setShowForm(true) }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/10 text-xs font-semibold transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setDeletePkg(pkg)}
                      className="w-8 h-8 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PackageFormModal
          pkg={editPkg}
          onClose={() => { setShowForm(false); setEditPkg(null) }}
          onSuccess={fetchData}
        />
      )}
      {deletePkg && (
        <DeleteModal
          pkg={deletePkg}
          onClose={() => setDeletePkg(null)}
          onConfirm={handleDelete}
        />
      )}
    </AdminLayoutWrapper>
  )
}
