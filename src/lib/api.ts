import axios from 'axios'
import { API_URL } from './constants'
import { useAuthStore } from '@/store/auth.store' // Import store-nya

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Auto attach token dari Zustand
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token // Ambil dari Zustand
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto handle 401 — redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Gunakan fungsi logout dari Zustand untuk membersihkan storage
      useAuthStore.getState().logout() 
      
      // Ganti baris 30 di api.ts
    if (typeof window !== 'undefined') {
      const isAdminPath = window.location.pathname.startsWith('/admin');
      window.location.href = isAdminPath ? '/admin/login' : '/login';
    }
    }
    return Promise.reject(error)
  }
)

export default api