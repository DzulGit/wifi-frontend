'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    if (isAdmin) router.push('/admin/dashboard')
  }, [isAuthenticated, isAdmin, router])

  if (!isAuthenticated) return null

  return <>{children}</>
}