'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Calendar, CreditCard, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
  createdAt: string
  user?: {
    id: string
    fullName: string
    customerCode: string
    email: string
    phone: string
  }
  details?: string
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
    day: 'numeric' 
  })

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'bg-green-50 text-green-700 border-green-200',
    PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    OVERDUE: 'bg-red-50 text-red-700 border-red-200',
    CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PAID: 'Lunas',
    PENDING: 'Menunggu Pembayaran',
    OVERDUE: 'Jatuh Tempo',
    CANCELLED: 'Dibatalkan',
  }
  return map[status] || status
}

const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    PAID: CheckCircle,
    PENDING: Clock,
    OVERDUE: AlertTriangle,
    CANCELLED: AlertTriangle,
  }
  return map[status] || AlertTriangle
}

export default function TagihanDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/billing/${params.id}`)
        setInvoice(data)
      } catch (err: any) {
        const msg = err.response?.data?.message ?? 'Gagal memuat detail tagihan'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [params.id])

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
            <p className="text-gray-400 text-sm">Memuat detail tagihan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
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
          <p className="text-red-700">{error || 'Tagihan tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

  const StatusIcon = getStatusIcon(invoice.status)

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
            <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-xs text-gray-400 mt-0.5">Nomor Tagihan</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)} flex items-center gap-2`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {getStatusLabel(invoice.status)}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount section */}
          <div className="bg-gradient-to-r from-[#F5A623]/5 to-[#F5A623]/10 rounded-xl p-5 border border-[#F5A623]/20">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Jumlah Tagihan</p>
            <p className="text-4xl font-bold text-gray-900">{formatRp(invoice.amount)}</p>
          </div>

          {/* Dates section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Dibuat Tanggal</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.createdAt)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Jatuh Tempo</p>
              </div>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* Customer info section */}
          {invoice.user && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informasi Pelanggan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nama</p>
                  <p className="text-sm font-medium text-gray-900">{invoice.user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Kode Pelanggan</p>
                  <p className="text-sm font-medium text-gray-900">{invoice.user.customerCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{invoice.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Telepon</p>
                  <p className="text-sm font-medium text-gray-900">{invoice.user.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Details section */}
          {invoice.details && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Catatan</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{invoice.details}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
