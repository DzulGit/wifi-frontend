'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import api from '@/lib/api'
import { setAuthCookie } from '@/lib/auth-cookie'
import { useAuthStore } from '@/store/auth.store'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Shield, Eye, EyeOff, ArrowRight, Mail, Lock, Wifi, AlertTriangle } from 'lucide-react'

const adminSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
})

function PasswordInput({ field }: { field: any }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
      <Input
        type={show ? 'text' : 'password'}
        placeholder="••••••••"
        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 pr-10 focus:border-white/30 rounded-xl h-12"
        {...field}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  const { setToken, setAdmin, isAuthenticated, isAdmin } = useAuthStore()

  useEffect(() => {
    setMounted(true)
    // Kalau sudah login sebagai admin, langsung redirect
    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, isAdmin, router])

  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof adminSchema>) => {
    try {
      setIsLoading(true)
      const { data } = await api.post('/auth/admin/login', values)
      
      // Set auth cookie for middleware authentication
      setAuthCookie(data.token)
      
      // Store in Zustand for client-side state management
      setToken(data.token)
      setAdmin(data.admin)
      
      toast.success(`Selamat datang, ${data.admin.fullName}`, {
        description: `Login sebagai ${data.admin.role}`
      })
      router.push('/admin/dashboard')
    } catch (error: any) {
      const msg = error.response?.data?.message ?? 'Terjadi kesalahan'
      setFailCount(prev => prev + 1)
      toast.error('Akses Ditolak', { description: msg })

      // Kalau sudah 2x gagal, kasih warning
      if (failCount >= 1) {
        toast.warning('Peringatan', {
          description: `Akun akan terkunci setelah 3 percobaan gagal`
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-white/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/2 rounded-full blur-3xl" />
      </div>

      <div
        className="w-full max-w-sm relative z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.4s ease'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <Wifi className="w-7 h-7 text-white/60" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CAKRANA</h1>
          <p className="text-white/30 text-xs mt-1 tracking-widest uppercase">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          {/* Admin badge */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white/50" />
            </div>
            <div>
              <p className="text-white/80 font-semibold text-sm">Akses Admin</p>
              <p className="text-white/30 text-xs">Hanya untuk administrator sistem</p>
            </div>
          </div>

          {/* Warning kalau sudah beberapa kali gagal */}
          {failCount >= 2 && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs leading-relaxed">
                Percobaan login {failCount}/3. Akun akan terkunci sementara setelah 3 kali gagal.
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Email Admin
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          placeholder="admin@cakrana.id"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 focus:border-white/30 rounded-xl h-12"
                          autoComplete="off"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Password
                    </FormLabel>
                    <FormControl>
                      <PasswordInput field={field} />
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-12 bg-white hover:bg-white/90 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Masuk ke Panel Admin <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </Form>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 mt-4 px-2">
          <Shield className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
          <p className="text-white/20 text-xs">
            Sesi login dipantau. Akun terkunci setelah 3x percobaan gagal.
          </p>
        </div>

        <p className="text-center text-white/15 text-xs mt-4">
          © 2026 CAKRANA · Admin Access Only
        </p>
      </div>
    </div>
  )
}