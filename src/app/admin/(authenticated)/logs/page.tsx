'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  Pause,
  Play,
  Trash2,
  Wifi,
  WifiOff,
  Terminal,
} from 'lucide-react'
import { API_URL } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/api'

const MAX_LOGS = 100

export interface ApiActivityLog {
  id: string
  timestamp: string
  method: string
  path: string
  statusCode: number
  responseTimeMs: number
  actorType: 'admin' | 'user' | 'anonymous'
  actorId?: string
  actorLabel: string
  ip?: string
  userAgent?: string
}

function getToken(): string | null {
  const fromStore = useAuthStore.getState().token
  if (fromStore) return fromStore

  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('cakrana-auth')
  if (!raw) return null
  try {
    return JSON.parse(raw)?.state?.token ?? null
  } catch {
    return null
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

function methodClass(method: string) {
  switch (method) {
    case 'GET':
      return 'text-sky-400'
    case 'POST':
      return 'text-emerald-400'
    case 'PUT':
    case 'PATCH':
      return 'text-amber-400'
    case 'DELETE':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

function statusClass(code: number) {
  if (code >= 500) return 'text-red-400 bg-red-500/10 border-red-500/30'
  if (code >= 400) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  if (code >= 300) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  if (code >= 200) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
}

function actorBadge(type: ApiActivityLog['actorType']) {
  switch (type) {
    case 'admin':
      return 'bg-[#F5A623]/20 text-[#F5A623] border-[#F5A623]/30'
    case 'user':
      return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    default:
      return 'bg-gray-500/15 text-gray-400 border-gray-500/30'
  }
}

function LogRow({ log }: { log: ApiActivityLog }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[88px_72px_minmax(0,1fr)_88px_140px_80px] gap-1 md:gap-2 px-4 py-2.5 md:py-2 border-b border-gray-800/80 hover:bg-white/[0.03] items-start md:items-center">
      <span className="text-gray-500 tabular-nums">{formatTime(log.timestamp)}</span>
      <span className={`font-bold ${methodClass(log.method)}`}>{log.method}</span>
      <span className="text-gray-300 break-all md:truncate" title={log.path}>
        {log.path}
      </span>
      <span
        className={`inline-flex w-fit justify-center px-2 py-0.5 rounded border text-[11px] font-bold tabular-nums ${statusClass(log.statusCode)}`}
      >
        {log.statusCode || '—'}
      </span>
      <div className="min-w-0">
        <span
          className={`inline-block max-w-full truncate px-1.5 py-0.5 rounded border text-[10px] font-semibold ${actorBadge(log.actorType)}`}
          title={log.actorLabel}
        >
          {log.actorLabel}
        </span>
        {log.ip && (
          <p className="text-[10px] text-gray-600 truncate mt-0.5" title={log.ip}>
            {log.ip}
          </p>
        )}
      </div>
      <span className="text-gray-400 tabular-nums md:text-right">{log.responseTimeMs} ms</span>
    </div>
  )
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ApiActivityLog[]>([])
  const [paused, setPaused] = useState(false)
  const [connected, setConnected] = useState(false)
  const pausedRef = useRef(false)
  const sourceRef = useRef<EventSource | null>(null)

  const prependLog = useCallback((entry: ApiActivityLog) => {
    if (pausedRef.current) return
    setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS))
  }, [])

  const connectStream = useCallback(() => {
    const token = getToken()
    if (!token) return

    sourceRef.current?.close()

    const url = `${API_URL}/admin/logs/stream?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)
    sourceRef.current = source

    source.onopen = () => setConnected(true)
    source.onerror = () => setConnected(false)

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ApiActivityLog
        if (data?.id) prependLog(data)
      } catch {
        // ignore malformed payloads
      }
    }
  }, [prependLog])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const { data } = await api.get<{ logs: ApiActivityLog[] }>('/admin/logs/recent')
        setLogs((data.logs ?? []).slice(0, MAX_LOGS))
      } catch {
        // stream still works without snapshot
      }
    }

    loadRecent()
    connectStream()

    return () => {
      sourceRef.current?.close()
      sourceRef.current = null
    }
  }, [connectStream])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Terminal className="w-5 h-5 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">System Logs</h2>
            <p className="text-sm text-gray-500">
              Aktivitas API real-time · maks. {MAX_LOGS} entri
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'Terhubung' : 'Terputus'}
          </span>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {paused ? (
              <>
                <Play className="w-4 h-4 text-emerald-600" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            )}
          </button>

          <button
            type="button"
            onClick={connectStream}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Activity className="w-4 h-4" /> Reconnect
          </button>

          <button
            type="button"
            onClick={() => setLogs([])}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-[#0d1117] overflow-hidden shadow-lg">
        <div className="hidden md:grid grid-cols-[88px_72px_minmax(0,1fr)_88px_140px_80px] gap-2 px-4 py-2.5 bg-[#161b22] border-b border-gray-800 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span>Waktu</span>
          <span>Method</span>
          <span>Endpoint</span>
          <span>Status</span>
          <span>Actor / IP</span>
          <span className="text-right">Time</span>
        </div>

        <div className="max-h-[calc(100vh-280px)] min-h-[320px] overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-2">
              <Terminal className="w-10 h-10 opacity-40" />
              <p>Menunggu aktivitas API...</p>
              <p className="text-[10px] text-gray-600">
                Lakukan request dari aplikasi user/admin untuk melihat log
              </p>
            </div>
          ) : (
            logs.map((log) => <LogRow key={log.id} log={log} />)
          )}
        </div>
      </div>
    </div>
  )
}
