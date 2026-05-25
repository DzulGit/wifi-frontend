'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import AdminNavbar from '@/components/admin/AdminNavbar'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AdminLayoutWrapper({ 
  children, 
  title, 
  subtitle 
}: AdminLayoutWrapperProps) {
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
    <div className="flex flex-col min-h-full">
      {/* Navbar tetap ada dengan notifikasi sidebar */}
      <AdminNavbar title={title} subtitle={subtitle} />
      
      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}