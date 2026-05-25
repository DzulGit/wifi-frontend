'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  // 1. Ambil _hasHydrated dari store
  const { isAuthenticated, isAdmin, _hasHydrated } = useAuthStore()
  const router = useRouter()
  
  // 2. Tambahkan isMounted
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // 3. TAHAN! Jangan lakukan apa-apa sebelum Zustand & Next.js siap
    if (!isMounted || !_hasHydrated) return

    // 4. Baru jalankan logika tendang
    if (!isAuthenticated) {
      router.push('/login')
    } else if (isAdmin) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, isAdmin, router, isMounted, _hasHydrated])

  // 5. Selama belum siap, jangan render apa-apa (tahan blank screen sejenak)
  if (!isMounted || !_hasHydrated) return null

  // Jika memang tidak login, biarkan null supaya router.push jalan dengan mulus
  if (!isAuthenticated) return null

  return <>{children}</>
}