'use client';

import { useState } from 'react';
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

// Schema untuk Login Password
const passwordSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

// Schema untuk Login OTP
const otpSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  otp: z.string().optional(), // Opsional karena di tahap awal hanya kirim email
});

export default function UserLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false); // State untuk melacak apakah OTP sudah dikirim
  const { setToken, setUser } = useAuthStore();

  const formPassword = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: '', password: '' },
  });

  const formOtp = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: '', otp: '' },
  });

  // Handler Login Password
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/login', values);

      setToken(data.token);
      setUser(data.user);
      
      toast.success('Login berhasil!', { description: 'Selamat datang kembali.' });
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Login Gagal', {
        description: error.response?.data?.message || 'Email atau password salah.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler Kirim OTP
  const onSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    const email = formOtp.getValues('email');
    
    // Validasi email manual sebelum kirim OTP
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

  // Handler Verifikasi OTP
  const onVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    if (!values.otp || values.otp.length < 4) {
      formOtp.setError('otp', { message: 'Kode OTP tidak valid' });
      return;
    }

    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/verify-otp', {
        email: values.email,
        otp: values.otp
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

  return (
    <div className="min-h-screen bg-[#F4F4F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 bg-white text-center border-b border-gray-100">
          <div className="flex justify-center mb-2">
            <span className="text-[#F5A623] font-space-grotesk font-bold text-3xl tracking-wide">
              CAKRANA
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Portal Pelanggan</h1>
          <p className="text-gray-500 text-sm mt-1">Pilih metode masuk ke akun Anda</p>
        </div>

        <div className="p-8">
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-lg p-1">
              <TabsTrigger value="password" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">
                Password
              </TabsTrigger>
              <TabsTrigger value="otp" className="rounded-md data-[state=active]:bg-white data-[state=active]:text-[#1A1A1A] data-[state=active]:shadow-sm">
                OTP Email
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: LOGIN DENGAN PASSWORD */}
            <TabsContent value="password">
              <Form {...formPassword}>
                <form onSubmit={formPassword.handleSubmit(onPasswordSubmit)} className="space-y-5">
                  <FormField
                    control={formPassword.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="email@contoh.com" className="bg-gray-50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formPassword.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="bg-gray-50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-6 mt-4 bg-[#F5A623] hover:bg-[#d98f1b] text-white font-bold text-md rounded-xl"
                  >
                    {isLoading ? 'Memproses...' : 'Masuk dengan Password'}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            {/* TAB 2: LOGIN DENGAN OTP */}
            <TabsContent value="otp">
              <Form {...formOtp}>
                <form onSubmit={formOtp.handleSubmit(onVerifyOtp)} className="space-y-5">
                  <FormField
                    control={formOtp.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="email@contoh.com" 
                            className="bg-gray-50" 
                            disabled={otpSent} // Disable input email kalau OTP sudah dikirim
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {otpSent && (
                    <FormField
                      control={formOtp.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Kode OTP (Cek Email)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="Masukkan kode OTP" className="bg-gray-50 text-center tracking-widest font-bold" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!otpSent ? (
                    <Button 
                      type="button" 
                      onClick={onSendOtp}
                      disabled={isLoading}
                      className="w-full py-6 mt-4 bg-[#1A1A1A] hover:bg-black text-white font-bold text-md rounded-xl"
                    >
                      {isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                    </Button>
                  ) : (
                    <div className="space-y-3 mt-4">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-6 bg-[#F5A623] hover:bg-[#d98f1b] text-white font-bold text-md rounded-xl"
                      >
                        {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => setOtpSent(false)}
                        className="w-full text-sm text-gray-500 hover:text-[#1A1A1A]"
                      >
                        Ganti Email / Kirim Ulang
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
}