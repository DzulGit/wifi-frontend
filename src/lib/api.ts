import axios from 'axios'
import { API_URL } from './constants'
import { useAuthStore } from '@/store/auth.store'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // SECURITY FIX: Timeout agar request tidak menggantung selamanya
  timeout: 30000,
})

// ── Request interceptor — attach Bearer token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handle 401 ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Bersihkan state autentikasi
      useAuthStore.getState().logout()

      // SECURITY FIX: Hanya redirect di browser (bukan SSR)
      if (typeof window !== 'undefined') {
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath ? '/admin/login' : '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
