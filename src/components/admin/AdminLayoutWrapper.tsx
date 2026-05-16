'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AdminLayoutWrapper({ children, title, subtitle }: AdminLayoutWrapperProps) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) { router.push('/admin/login'); return }
    if (!isAdmin) { router.push('/login'); return }
  }, [isAuthenticated, isAdmin, router])

  if (!mounted || !isAuthenticated || !isAdmin) return null

  return (
    <div className="w-full">
      {/* Page header */}
      {(title || subtitle) && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}