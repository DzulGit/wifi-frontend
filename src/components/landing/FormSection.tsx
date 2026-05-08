'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Tambahkan import icon dari lucide-react untuk UI Success
import {
  CheckCircle2,
  MapPin,
  Wrench,
  MailCheck,
  ArrowRight,
} from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  phone: z.string().min(10, { message: 'Nomor WhatsApp tidak valid' }),
  district: z.string().min(3, { message: 'Kecamatan wajib diisi' }),
  city: z.string().min(3, { message: 'Kota/Kabupaten wajib diisi' }),
  address: z
    .string()
    .min(10, { message: 'Alamat lengkap wajib diisi untuk keperluan survei' }),
  packageId: z
    .string()
    .min(1, { message: 'Silakan pilih paket internet Anda' }),
  notes: z.string().optional(),
});

export default function FormSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  // State baru untuk mengontrol tampilan sukses
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      district: '',
      city: '',
      address: '',
      packageId: '',
      notes: '',
    },
  });

  const { setValue } = form;

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get('/packages');
        const pkgs = Array.isArray(data) ? data : data?.data || [];
        setPackages(pkgs);

        const savedPkgId = localStorage.getItem('selectedPackageId');
        if (savedPkgId && pkgs.some((p: any) => p.id === savedPkgId)) {
          setValue('packageId', savedPkgId, { shouldValidate: true });
        }
      } catch (error) {
        console.error('Gagal load paket untuk form', error);
      }
    };

    fetchPackages();

    const handlePackageSelection = () => {
      const selectedId = localStorage.getItem('selectedPackageId');
      if (selectedId) {
        setValue('packageId', selectedId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    };

    window.addEventListener('packageSelected', handlePackageSelection);
    return () =>
      window.removeEventListener('packageSelected', handlePackageSelection);
  }, [setValue]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      await api.post('/registrations', {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        district: values.district,
        city: values.city,
        address: values.address,
        packageId: values.packageId,
        notes: values.notes,
      });

      // Jika berhasil, ubah state ini jadi true (Form akan hilang, UI Success muncul)
      setIsSuccess(true);
      toast.success('Berhasil!', {
        description: 'Data Anda telah masuk ke sistem kami.',
      });

      // Bersihkan local storage pilihan paket
      localStorage.removeItem('selectedPackageId');
      form.reset();
    } catch (error: any) {
      toast.error('Pendaftaran Gagal', {
        description:
          error.response?.data?.message ||
          'Terjadi kesalahan pada sistem, silakan coba lagi.',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="daftar"
      className="py-24 bg-[#1A1A1A] text-white relative scroll-mt-20"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1f1f1f] border border-white/10 p-8 md:p-14 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* JIKA BERHASIL DAFTAR (TAMPILAN SUCCESS) */}
          {isSuccess ? (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/10 rounded-full mb-8 border border-green-500/20">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>

              <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-white mb-4">
                Pendaftaran Berhasil Diterima!
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
                Terima kasih telah memilih CAKRANA. Data Anda sudah masuk ke
                sistem kami. Mohon tunggu, tim kami akan segera memprosesnya.
              </p>

              {/* Grid Langkah Selanjutnya */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left mb-12">
                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 relative">
                  <div className="absolute top-6 right-6 text-white/10 text-5xl font-black">
                    1
                  </div>
                  <MapPin className="w-8 h-8 text-[#F5A623] mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-white">
                    Survei Lokasi
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Teknisi kami akan menghubungi Anda via WhatsApp untuk
                    melakukan survei jaringan ke lokasi rumah Anda.
                  </p>
                </div>

                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 relative">
                  <div className="absolute top-6 right-6 text-white/10 text-5xl font-black">
                    2
                  </div>
                  <Wrench className="w-8 h-8 text-[#F5A623] mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-white">
                    Instalasi Perangkat
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Jika lokasi terjangkau jaringan, kami akan langsung
                    melakukan penarikan kabel dan pemasangan router WiFi.
                  </p>
                </div>

                <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 relative">
                  <div className="absolute top-6 right-6 text-white/10 text-5xl font-black">
                    3
                  </div>
                  <MailCheck className="w-8 h-8 text-[#F5A623] mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-white">
                    Aktivasi Akun
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Setelah aktif, Anda akan menerima email untuk login ke
                    Portal Pelanggan guna memantau tagihan dan layanan.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsSuccess(false)}
                className="bg-transparent border-2 border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-[#1A1A1A] px-8 py-6 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(245,166,35,0.1)] hover:shadow-[0_0_25px_rgba(245,166,35,0.3)]"
              >
                Tutup & Kembali ke Beranda
              </Button>
            </div>
          ) : (
            /* JIKA BELUM DAFTAR (TAMPILAN FORM NORMAL) */
            <div className="animate-in fade-in duration-500">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-[#F5A623] mb-4">
                  Mulai Berlangganan
                </h2>
                <p className="text-gray-400 text-lg max-w-xl mx-auto">
                  Isi data diri Anda di bawah ini. Tim teknisi kami akan
                  melakukan survei lokasi secepatnya.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {/* ... SELURUH INPUT FORM SAMA SEPERTI SEBELUMNYA ... */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 font-medium ml-1">
                          Nama Lengkap
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sesuai KTP (Contoh: Budi Santoso)"
                            className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 ml-1" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-medium ml-1">
                            Alamat Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="budi@email.com"
                              className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 text-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 ml-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-medium ml-1">
                            Nomor WhatsApp
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="081234567890"
                              className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 text-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 ml-1" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-medium ml-1">
                            Kota/Kabupaten
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Depok"
                              className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 text-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 ml-1" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 font-medium ml-1">
                            Kecamatan
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Contoh: Beji"
                              className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 text-lg"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 ml-1" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 font-medium ml-1">
                          Alamat Detail (Jalan, RT/RW, No. Rumah)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contoh: Jl. Margonda Raya No. 12, RT 01/RW 02..."
                            className="w-full rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 py-4 text-lg resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 ml-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel className="text-gray-300 font-medium ml-1">
                          Pilih Paket Internet
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full h-14 rounded-xl bg-[#1A1A1A] border-white/10 text-white focus:ring-[#F5A623] px-5 text-lg">
                              <SelectValue placeholder="-- Klik untuk memilih paket --" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#1f1f1f] border-white/10 text-white rounded-xl">
                            {packages.map((pkg) => (
                              <SelectItem
                                key={pkg.id}
                                value={pkg.id}
                                className="focus:bg-[#F5A623] focus:text-white py-3 text-base cursor-pointer"
                              >
                                {pkg.name} — {pkg.speedDown} Mbps (Rp{' '}
                                {pkg.price.toLocaleString('id-ID')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400 ml-1" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 font-medium ml-1">
                          Catatan Tambahan / Patokan (Opsional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Contoh: Rumah cat hijau, pagar hitam di depan masjid..."
                            className="w-full rounded-xl bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#F5A623] px-5 py-4 text-base resize-none min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 ml-1" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-black font-bold py-7 text-xl rounded-xl mt-6 transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Kirim Formulir Pendaftaran{' '}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
