'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Calendar, User, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'
import api from '@/lib/api'

interface Payment {
  id: string
  paymentCode: string
  amount: number
  method: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  proofUrl?: string
  createdAt: string
  approvedAt?: string
  user?: {
    id: string
    fullName: string
    customerCode: string
    email: string
  }
  invoice?: {
    id: string
    invoiceNumber: string
  }
  notes?: string
}

const formatRp = (n: number) => 
  new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(n)

const formatDate = (date: string) => 
  new Date(date).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    APPROVED: 'bg-green-50 text-green-700 border-green-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  }
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'Menunggu Persetujuan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
  }
  return map[status] || status
}

const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: AlertTriangle,
  }
  return map[status] || AlertTriangle
}

export default function PembayaranDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/payments/${params.id}`)
        setPayment(data)
      } catch (err: any) {
        const msg = err.response?.data?.message ?? 'Gagal memuat detail pembayaran'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchPayment()
  }, [params.id])

  const handleApprove = async () => {
    if (!payment) return
    try {
      setApproving(true)
      await api.patch(`/payments/${payment.id}/approve`)
      setPayment(prev => prev ? { ...prev, status: 'APPROVED' } : prev)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal menyetujui pembayaran')
    } finally {
      setApproving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <div className="bg-white rounded-2xl p-8 border border-gray-100 flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Memuat detail pembayaran...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <div className="bg-white rounded-2xl p-8 border border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-700">{error || 'Pembayaran tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(payment.status)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali</span>
      </button>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{payment.paymentCode}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Kode Pembayaran</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(payment.status)} flex items-center gap-2`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {getStatusLabel(payment.status)}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Jumlah Pembayaran</p>
            <p className="text-4xl font-bold text-gray-900">{formatRp(payment.amount)}</p>
            {payment.method && (
              <p className="text-xs text-gray-600 mt-3">Metode: <span className="font-semibold">{payment.method}</span></p>
            )}
          </div>

          {/* Dates section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal Pembayaran</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatDate(payment.createdAt)}</p>
            </div>
            {payment.approvedAt && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase">Disetujui Tanggal</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatDate(payment.approvedAt)}</p>
              </div>
            )}
          </div>

          {/* Invoice reference */}
          {payment.invoice && (
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <FileText className="w-5 h-5 text-[#F5A623]" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Referensi Tagihan</p>
                  <p className="text-sm font-medium text-gray-900">{payment.invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Customer info */}
          {payment.user && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informasi Pelanggan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nama</p>
                  <p className="text-sm font-medium text-gray-900">{payment.user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kode Pelanggan</p>
                  <p className="text-sm font-medium text-gray-900">{payment.user.customerCode}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{payment.user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Proof section */}
          {payment.proofUrl && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Bukti Pembayaran</h3>
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img 
                  src={payment.proofUrl} 
                  alt="Bukti pembayaran" 
                  className="max-w-md rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                />
              </a>
            </div>
          )}

          {/* Notes section */}
          {payment.notes && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Catatan</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{payment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer - Action buttons */}
        {payment.status === 'PENDING' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 h-10 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
            >
              {approving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyetujui...
                </>
              ) : (
                'Setujui Pembayaran'
              )}
            </button>
            <button
              onClick={() => router.back()}
              className="flex-1 h-10 border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
