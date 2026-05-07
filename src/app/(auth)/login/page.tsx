'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Wifi, Shield, Eye, EyeOff, ArrowRight, Mail, Lock, User } from 'lucide-react';

// ── Schemas ────────────────────────────────────────────────────
const passwordSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

const otpSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  otp: z.string().optional(),
});

const adminSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

// ── Animated background dots ───────────────────────────────────
function BackgroundGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#F5A623 1px, transparent 1px),
            linear-gradient(90deg, #F5A623 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Glow blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F5A623]/3 rounded-full blur-3xl" />
    </div>
  );
}

// ── Password Input with toggle ─────────────────────────────────
function PasswordInput({ field, placeholder }: { field: any; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 pr-10 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20 rounded-xl h-12"
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
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [activeRole, setActiveRole] = useState<'user' | 'admin'>('user');
  const [mounted, setMounted] = useState(false);
  const { setToken, setUser, setAdmin } = useAuthStore();

  useEffect(() => { setMounted(true); }, []);

  const formPassword = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const formOtp = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: '', otp: '' },
  });

  const formAdmin = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Handler User Login Password ────────────────────────────
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/login', values);
      setToken(data.token);
      setUser(data.user);
      toast.success('Login berhasil!', { description: `Selamat datang, ${data.user.fullName}` });
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Login Gagal', {
        description: error.response?.data?.message || 'Email atau password salah.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler Send OTP ───────────────────────────────────────
  const onSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    const email = formOtp.getValues('email');
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      formOtp.setError('email', { message: 'Format email tidak valid' });
      return;
    }
    try {
      setIsLoading(true);
      await api.post('/auth/send-otp', { email });
      setOtpSent(true);
      toast.success('OTP Terkirim!', { description: 'Cek kotak masuk Gmail Anda.' });
    } catch (error: any) {
      toast.error('Gagal mengirim OTP', {
        description: error.response?.data?.message || 'Pastikan email terdaftar.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler Verify OTP ─────────────────────────────────────
  const onVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    if (!values.otp || values.otp.length < 4) {
      formOtp.setError('otp', { message: 'Kode OTP tidak valid' });
      return;
    }
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/verify-otp', {
        email: values.email,
        code: values.otp,
      });
      setToken(data.token);
      setUser(data.user);
      toast.success('Login berhasil!', { description: 'Verifikasi OTP sukses.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Verifikasi Gagal', {
        description: error.response?.data?.message || 'Kode OTP salah atau kadaluarsa.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handler Admin Login ────────────────────────────────────
  const onAdminSubmit = async (values: z.infer<typeof adminSchema>) => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/admin/login', values);
      setToken(data.token);
      setAdmin(data.admin);
      toast.success('Login Admin berhasil!', { description: `Selamat datang, ${data.admin.fullName}` });
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error('Login Gagal', {
        description: error.response?.data?.message || 'Email atau password admin salah.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative">
      <BackgroundGrid />

      <div
        className="w-full max-w-md relative z-10 transition-all duration-500"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/20 mb-4">
            <Wifi className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wider">CAKRANA</h1>
          <p className="text-white/40 text-sm mt-1 tracking-widest uppercase">Kendali Koneksi, Tanpa Batas</p>
        </div>

        {/* ── Role Switcher ───────────────────────────────── */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl mb-6 border border-white/5">
          <button
            onClick={() => setActiveRole('user')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeRole === 'user'
                ? 'bg-[#F5A623] text-black shadow-lg shadow-[#F5A623]/20'
                : 'text-white/40 hover:text-white/60'
              }
            `}
          >
            <User className="w-4 h-4" />
            Portal Pelanggan
          </button>
          <button
            onClick={() => setActiveRole('admin')}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeRole === 'admin'
                ? 'bg-white/10 text-white border border-white/10 shadow-lg'
                : 'text-white/40 hover:text-white/60'
              }
            `}
          >
            <Shield className="w-4 h-4" />
            Admin Panel
          </button>
        </div>

        {/* ── Card ───────────────────────────────────────── */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">

          {/* ── USER LOGIN ─────────────────────────────── */}
          {activeRole === 'user' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-white font-bold text-xl">Masuk ke Akun</h2>
                <p className="text-white/40 text-sm mt-1">Pilih metode masuk yang Anda inginkan</p>
              </div>

              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5 rounded-xl p-1 border border-white/5">
                  <TabsTrigger
                    value="password"
                    className="rounded-lg text-white/50 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-medium transition-all"
                  >
                    Password
                  </TabsTrigger>
                  <TabsTrigger
                    value="otp"
                    className="rounded-lg text-white/50 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-sm font-medium transition-all"
                  >
                    OTP Email
                  </TabsTrigger>
                </TabsList>

                {/* Tab Password */}
                <TabsContent value="password">
                  <Form {...formPassword}>
                    <form onSubmit={formPassword.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={formPassword.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                  placeholder="email@contoh.com"
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 focus:border-[#F5A623]/50 rounded-xl h-12"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formPassword.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Password</FormLabel>
                            <FormControl>
                              <PasswordInput field={field} placeholder="••••••••" />
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 h-12 bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#F5A623]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>Masuk <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Tab OTP */}
                <TabsContent value="otp">
                  <Form {...formOtp}>
                    <form onSubmit={formOtp.handleSubmit(onVerifyOtp)} className="space-y-4">
                      <FormField
                        control={formOtp.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <Input
                                  placeholder="email@contoh.com"
                                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 focus:border-[#F5A623]/50 rounded-xl h-12 disabled:opacity-50"
                                  disabled={otpSent}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-400 text-xs" />
                          </FormItem>
                        )}
                      />

                      {otpSent && (
                        <FormField
                          control={formOtp.control}
                          name="otp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Kode OTP</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="_ _ _ _ _ _"
                                  className="bg-white/5 border-[#F5A623]/30 text-white placeholder:text-white/20 text-center tracking-[0.5em] font-bold text-xl focus:border-[#F5A623]/60 rounded-xl h-14"
                                  maxLength={6}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-red-400 text-xs" />
                              <p className="text-white/30 text-xs text-center">Kode berlaku 5 menit</p>
                            </FormItem>
                          )}
                        />
                      )}

                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={onSendOtp}
                          disabled={isLoading}
                          className="w-full mt-2 h-12 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>Kirim Kode OTP <Mail className="w-4 h-4" /></>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-2 mt-2">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#F5A623]/20 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>Verifikasi & Masuk <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setOtpSent(false)}
                            className="w-full h-10 text-white/40 hover:text-white/60 text-sm transition-colors"
                          >
                            Ganti Email / Kirim Ulang
                          </button>
                        </div>
                      )}
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── ADMIN LOGIN ─────────────────────────────── */}
          {activeRole === 'admin' && (
            <div className="p-8">
              {/* Admin badge */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4.5 h-4.5 text-white/60" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Admin Panel</p>
                  <p className="text-white/40 text-xs">Akses terbatas untuk admin sistem</p>
                </div>
              </div>

              <Form {...formAdmin}>
                <form onSubmit={formAdmin.handleSubmit(onAdminSubmit)} className="space-y-4">
                  <FormField
                    control={formAdmin.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Email Admin</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <Input
                              placeholder="admin@cakrana.id"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10 focus:border-white/30 rounded-xl h-12"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formAdmin.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/60 text-xs font-semibold uppercase tracking-wider">Password</FormLabel>
                        <FormControl>
                          <PasswordInput field={field} placeholder="••••••••" />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 h-12 bg-white text-black hover:bg-white/90 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <p className="text-center text-white/20 text-xs mt-6">
          © 2026 CAKRANA ISP Management · Kendali Koneksi, Tanpa Batas
        </p>
      </div>
    </div>
  );
}