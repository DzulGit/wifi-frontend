'use client'

import { useState, useRef, useEffect, useCallback, JSX } from 'react'
import {
  MessageCircle, X, Send, Wifi, Sparkles,
  AlertCircle, RotateCcw, ChevronDown, Zap
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  isError?: boolean
}

interface GeminiHistoryPart {
  role: 'user' | 'model'
  parts: { text: string }[]
}

// ── Konstanta ──────────────────────────────────────────────────
const MAX_INPUT_LENGTH = 500
const SUGGESTED_QUESTIONS = [
  'Berapa harga paket internet CAKRANA?',
  'Bagaimana cara daftar layanan baru?',
  'Cara upload bukti pembayaran?',
  'Apa yang harus dilakukan jika internet mati?',
  'Berapa lama proses instalasi?',
]

// ── Helper: format teks AI (bold + bullet) ─────────────────────
function formatAIText(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bullet point (- atau • atau *)
    if (/^[-•*]\s/.test(line.trim())) {
      const content = line.trim().replace(/^[-•*]\s/, '')
      return (
        <li key={i} className="flex items-start gap-2 text-sm text-white/75 leading-relaxed">
          <span className="text-[#F5A623] mt-1.5 flex-shrink-0">▸</span>
          <span dangerouslySetInnerHTML={{ __html: applyBold(content) }} />
        </li>
      )
    }
    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const num = line.trim().match(/^(\d+)\./)?.[1]
      const content = line.trim().replace(/^\d+\.\s/, '')
      return (
        <li key={i} className="flex items-start gap-2.5 text-sm text-white/75 leading-relaxed">
          <span className="text-[#F5A623] font-bold flex-shrink-0 min-w-[16px]">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: applyBold(content) }} />
        </li>
      )
    }
    // Empty line
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    // Normal paragraph
    return (
      <p
        key={i}
        className="text-sm text-white/75 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: applyBold(line) }}
      />
    )
  })
}

function applyBold(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
}

// Cek apakah teks mengandung list item
function hasListItems(text: string) {
  return text.split('\n').some(l => /^[-•*]\s/.test(l.trim()) || /^\d+\.\s/.test(l.trim()))
}

function renderMessage(text: string) {
  const lines = text.split('\n')
  const hasList = hasListItems(text)

  if (hasList) {
    const groups: JSX.Element[] = []
    let currentList: JSX.Element[] = []
    let listType: 'ul' | 'ol' | null = null

    lines.forEach((line, i) => {
      const isBullet = /^[-•*]\s/.test(line.trim())
      const isNumbered = /^\d+\.\s/.test(line.trim())

      if (isBullet || isNumbered) {
        const newType = isBullet ? 'ul' : 'ol'
        if (listType && listType !== newType) {
          groups.push(
            listType === 'ul'
              ? <ul key={`list-${i}`} className="space-y-1.5 my-2 pl-0">{currentList}</ul>
              : <ol key={`list-${i}`} className="space-y-1.5 my-2 pl-0">{currentList}</ol>
          )
          currentList = []
        }
        listType = newType
        currentList.push(formatAIText(line)[0] as JSX.Element)
      } else {
        if (currentList.length > 0) {
          groups.push(
            listType === 'ul'
              ? <ul key={`list-${i}`} className="space-y-1.5 my-2 pl-0">{currentList}</ul>
              : <ol key={`list-${i}`} className="space-y-1.5 my-2 pl-0">{currentList}</ol>
          )
          currentList = []
          listType = null
        }
        const formatted = formatAIText(line)[0]
        if (formatted) groups.push(formatted as JSX.Element)
      }
    })

    if (currentList.length > 0) {
      groups.push(
        listType === 'ul'
          ? <ul key="list-final" className="space-y-1.5 my-2 pl-0">{currentList}</ul>
          : <ol key="list-final" className="space-y-1.5 my-2 pl-0">{currentList}</ol>
      )
    }

    return <div className="space-y-1">{groups}</div>
  }

  return <div className="space-y-1.5">{formatAIText(text)}</div>
}

// ── Typing Indicator ───────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 justify-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F5A623] to-[#d98f1b] flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(245,166,35,0.4)]">
        <Zap className="w-3.5 h-3.5 text-black" />
      </div>
      <div className="bg-[#242424] border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40 mr-1">KANA mengetik</span>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#F5A623]/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Widget Component ──────────────────────────────────────
export default function FAQChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ── Greeting message saat pertama buka ────────────────────────
  const GREETING: Message = {
    id: 'greeting',
    role: 'assistant',
    text: 'Halo! Saya **KANA**, asisten virtual CAKRANA 👋\n\nSaya siap membantu kamu dengan:\n- Informasi paket internet\n- Cara pendaftaran & aktivasi\n- Pertanyaan tagihan & pembayaran\n- Laporan gangguan koneksi\n\nAda yang bisa saya bantu hari ini?',
    timestamp: new Date(),
  }

  // Init greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([GREETING])
    }
  }, [isOpen])

  // Auto scroll
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // Scroll button visibility
  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 80)
  }

  // Focus input saat buka
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  // ── Build history untuk dikirim ke API ────────────────────────
  const buildHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 'greeting' && !m.isError)
      .map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }))
  }, [messages])

  // ── Send message ───────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    if (trimmed.length > MAX_INPUT_LENGTH) return

    setHasInteracted(true)
    setInput('')

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const history = buildHistory()

      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, history }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan.')
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.answer,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])

    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: err.message || 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date(),
        isError: true,
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isLoading, buildHistory])

  // ── Handle keyboard ────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ── Reset conversation ─────────────────────────────────────────
  const resetChat = () => {
    setMessages([GREETING])
    setInput('')
    setHasInteracted(false)
  }

  const inputLength = input.length
  const isNearLimit = inputLength > MAX_INPUT_LENGTH * 0.8
  const isOverLimit = inputLength > MAX_INPUT_LENGTH
  const canSend = input.trim().length > 0 && !isLoading && !isOverLimit

  return (
    <>
      {/* ── FAB Button ─────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-[200]">
        {/* Pulse ring saat belum interact */}
        {!isOpen && !hasInteracted && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#F5A623]/30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-[#F5A623]/15 animate-ping"
              style={{ animationDelay: '0.5s' }} />
          </>
        )}

        <button
          onClick={() => setIsOpen(v => !v)}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-[#2a2a2a] border border-white/10 rotate-0 scale-95'
              : 'bg-gradient-to-br from-[#F5A623] to-[#d98f1b] shadow-[0_0_24px_rgba(245,166,35,0.5)] hover:scale-110 hover:shadow-[0_0_32px_rgba(245,166,35,0.6)]'
          }`}
          aria-label={isOpen ? 'Tutup chat' : 'Buka asisten KANA'}
        >
          <div className={`transition-all duration-300 ${isOpen ? 'rotate-90 opacity-100' : 'rotate-0 opacity-100'}`}>
            {isOpen
              ? <X className="w-6 h-6 text-white/70" />
              : <MessageCircle className="w-6 h-6 text-black" />
            }
          </div>
        </button>

        {/* Tooltip saat belum pernah dibuka */}
        {!isOpen && !hasInteracted && (
          <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap">
            <div className="bg-[#1A1A1A] text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 shadow-xl flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#F5A623]" />
              Tanya KANA — AI Assistant
            </div>
            <div className="absolute bottom-0 right-5 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1A1A1A]" />
            </div>
          </div>
        )}
      </div>

      {/* ── Chat Panel ─────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-[199] w-[calc(100vw-3rem)] sm:w-[400px] max-h-[600px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-white/8 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
        }`}
        style={{ background: '#141414' }}
      >
        {/* ── Panel Header ───────────────────────────────────── */}
        <div className="bg-[#1A1A1A] border-b border-white/8 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5A623] to-[#d98f1b] flex items-center justify-center shadow-[0_0_16px_rgba(245,166,35,0.4)]">
                <Zap className="w-5 h-5 text-black" />
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1A1A1A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">KANA</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623] tracking-wider">AI</span>
              </div>
              <p className="text-white/40 text-xs">Asisten CAKRANA · Selalu aktif</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetChat}
              className="w-8 h-8 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors text-white/40 hover:text-white/70"
              title="Reset percakapan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl hover:bg-white/8 flex items-center justify-center transition-colors text-white/40 hover:text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages Area ───────────────────────────────────── */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
          style={{ maxHeight: '380px', minHeight: '280px' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F5A623] to-[#d98f1b] flex items-center justify-center flex-shrink-0 mb-0.5 shadow-[0_0_10px_rgba(245,166,35,0.3)]">
                  <Zap className="w-3.5 h-3.5 text-black" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-[#F5A623] rounded-br-sm'
                    : msg.isError
                    ? 'bg-red-500/10 border border-red-500/20 rounded-bl-sm'
                    : 'bg-[#242424] border border-white/6 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm text-black font-medium leading-relaxed">{msg.text}</p>
                ) : msg.isError ? (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300 leading-relaxed">{msg.text}</p>
                  </div>
                ) : (
                  renderMessage(msg.text)
                )}

                {/* Timestamp */}
                <p className={`text-[10px] mt-2 ${
                  msg.role === 'user' ? 'text-black/50 text-right' : 'text-white/25'
                }`}>
                  {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mb-0.5">
                  <span className="text-white/60 text-xs font-bold">U</span>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-4 w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center shadow-lg text-white/60 hover:text-white transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* ── Suggested Questions (hanya saat baru buka) ───────── */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-3 flex-shrink-0">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Pertanyaan umum</p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left text-xs text-white/60 bg-white/4 hover:bg-[#F5A623]/10 hover:text-[#F5A623] border border-white/6 hover:border-[#F5A623]/20 rounded-xl px-3 py-2 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Input Area ──────────────────────────────────────── */}
        <div className="bg-[#1A1A1A] border-t border-white/8 px-4 py-3 flex-shrink-0">
          <div className={`flex items-end gap-2 bg-[#242424] border rounded-2xl px-3 py-2.5 transition-all duration-200 ${
            isOverLimit
              ? 'border-red-500/50'
              : 'border-white/8 focus-within:border-[#F5A623]/40'
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pertanyaan kamu..."
              maxLength={MAX_INPUT_LENGTH + 50} // sedikit lebih untuk deteksi
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none resize-none leading-relaxed disabled:opacity-50 max-h-[100px]"
              style={{ scrollbarWidth: 'none' }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!canSend}
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                canSend
                  ? 'bg-[#F5A623] hover:bg-[#d98f1b] shadow-[0_0_12px_rgba(245,166,35,0.3)] hover:scale-105'
                  : 'bg-white/5 cursor-not-allowed'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${canSend ? 'text-black' : 'text-white/20'}`} />
            </button>
          </div>

          {/* Counter + hint */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-white/25">
              Enter kirim · Shift+Enter baris baru
            </p>
            <p className={`text-[10px] font-mono transition-colors ${
              isOverLimit ? 'text-red-400' : isNearLimit ? 'text-[#F5A623]/60' : 'text-white/20'
            }`}>
              {inputLength}/{MAX_INPUT_LENGTH}
            </p>
          </div>
        </div>

        {/* Brand footer */}
        <div className="bg-[#111] px-4 py-2 flex items-center justify-center gap-1.5 flex-shrink-0">
          <Wifi className="w-3 h-3 text-[#F5A623]/50" />
          <p className="text-[10px] text-white/20 font-medium tracking-wider">
            Powered by CAKRANA AI · Gemini 1.5 Flash
          </p>
        </div>
      </div>
    </>
  )
}