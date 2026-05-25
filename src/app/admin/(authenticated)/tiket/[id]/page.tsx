'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ticket, Calendar, User, MessageSquare, Send, AlertTriangle, Loader2 } from 'lucide-react'
import api from '@/lib/api'

interface TicketMessage {
  id: string
  content: string
  sender: 'USER' | 'ADMIN'
  createdAt: string
  senderName?: string
}

interface Ticket {
  id: string
  ticketNumber: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  updatedAt: string
  messages?: TicketMessage[]
  user?: {
    id: string
    fullName: string
    customerCode: string
    email: string
  }
}

const formatDate = (date: string) => 
  new Date(date).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const getPriorityColor = (priority: string) => {
  const map: Record<string, string> = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return map[priority] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const getPriorityLabel = (priority: string) => {
  const map: Record<string, string> = {
    CRITICAL: 'Kritis',
    HIGH: 'Tinggi',
    MEDIUM: 'Sedang',
    LOW: 'Rendah',
  }
  return map[priority] || priority
}

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-purple-50 text-purple-700 border-purple-200',
    RESOLVED: 'bg-green-50 text-green-700 border-green-200',
    CLOSED: 'bg-gray-50 text-gray-700 border-gray-200',
  }
  return map[status] || 'bg-gray-50 text-gray-700 border-gray-200'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    OPEN: 'Dibuka',
    IN_PROGRESS: 'Sedang Ditangani',
    RESOLVED: 'Terselesaikan',
    CLOSED: 'Ditutup',
  }
  return map[status] || status
}

export default function TiketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true)
        const { data } = await api.get(`/tickets/${params.id}`)
        setTicket(data)
      } catch (err: any) {
        const msg = err.response?.data?.message ?? 'Gagal memuat detail tiket'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [params.id])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyMessage.trim() || !ticket) return

    try {
      setSending(true)
      const { data } = await api.post(`/tickets/${ticket.id}/reply`, {
        content: replyMessage
      })
      
      // Add new message to the list
      setTicket(prev => prev ? {
        ...prev,
        messages: [
          ...(prev.messages || []),
          {
            id: data.id,
            content: replyMessage,
            sender: 'ADMIN',
            createdAt: new Date().toISOString(),
            senderName: 'Admin'
          }
        ]
      } : prev)
      
      setReplyMessage('')
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Gagal mengirim balasan')
    } finally {
      setSending(false)
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
            <p className="text-gray-400 text-sm">Memuat detail tiket...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
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
          <p className="text-red-700">{error || 'Tiket tidak ditemukan'}</p>
        </div>
      </div>
    )
  }

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
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h1 className="font-bold text-gray-900 text-lg">{ticket.title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">{ticket.ticketNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getPriorityColor(ticket.priority)}`}>
                {getPriorityLabel(ticket.priority)}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-gray-500 mb-1">Dibuat</p>
              <p className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Diperbarui</p>
              <p className="font-medium text-gray-900">{formatDate(ticket.updatedAt)}</p>
            </div>
            {ticket.user && (
              <div className="md:col-span-2">
                <p className="text-gray-500 mb-1">Pelapor</p>
                <p className="font-medium text-gray-900">{ticket.user.fullName} ({ticket.user.customerCode})</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3">Deskripsi</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Messages/Conversation */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Percakapan ({ticket.messages?.length ?? 0})
          </h3>
          
          {/* Messages list */}
          <div className="space-y-4 max-h-96 overflow-y-auto mb-6 p-3 bg-gray-50 rounded-lg">
            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.sender === 'ADMIN'
                        ? 'bg-[#F5A623]/10 text-gray-900 border border-[#F5A623]/20'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      {msg.sender === 'ADMIN' ? 'Admin' : msg.senderName || 'User'}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(msg.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Belum ada pesan</p>
              </div>
            )}
          </div>

          {/* Reply form */}
          <form onSubmit={handleSendReply} className="flex gap-2">
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Tulis balasan..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-[#F5A623] focus:outline-none resize-none"
              rows={3}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!replyMessage.trim() || sending}
              className="px-4 h-fit mt-auto bg-[#F5A623] hover:bg-[#E09518] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
