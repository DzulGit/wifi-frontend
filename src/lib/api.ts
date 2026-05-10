import axios from 'axios'
import { API_URL } from './constants'
import { useAuthStore } from '@/store/auth.store'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // SECURITY FIX: Timeout agar request tidak menggantung selamanya
  timeout: 30000,
})

// ── REQUEST INTERCEPTOR: Auto attach token ──────────────────
api.interceptors.request.use((config) => {
  // 1. Coba ambil dari memori Zustand terlebih dahulu
  let token = useAuthStore.getState().token

  // 2. FALLBACK (Penyelamat saat Refresh): 
  // Jika token di Zustand kosong, paksa bongkar localStorage
  if (!token && typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('cakrana-auth')
    if (authStorage) {
      try {
        const parsedData = JSON.parse(authStorage)
        token = parsedData?.state?.token
      } catch (error) {
        console.error("Gagal membaca token dari storage:", error)
      }
    }
  }

  // 3. Sisipkan token ke header jika ada
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── RESPONSE INTERCEPTOR: Auto handle 401 (Unauthorized) ────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gunakan fungsi logout dari Zustand untuk membersihkan storage
      useAuthStore.getState().logout() 
      
      // Redirect sesuai halaman (Admin / User)
      if (typeof window !== 'undefined') {
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath ? '/admin/login' : '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
