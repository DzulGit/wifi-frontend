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

// 1. Skema Validasi Zod (Sesuai ERD Terbaru)
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

  // Fetch data paket untuk opsi dropdown
  useEffect(() => {
    // 1. Fetch data paket
    const fetchPackages = async () => {
      try {
        const { data } = await api.get('/packages');
        const pkgs = Array.isArray(data) ? data : data?.data || [];
        setPackages(pkgs);

        // 2. CEK LOCAL STORAGE SAAT PERTAMA LOAD (Jika user refresh web)
        const savedPkgId = localStorage.getItem('selectedPackageId');
        if (savedPkgId && pkgs.some((p: any) => p.id === savedPkgId)) {
          setValue('packageId', savedPkgId, { shouldValidate: true });
        }
      } catch (error) {
        console.error('Gagal load paket untuk form', error);
      }
    };

    fetchPackages();

    // 3. EVENT LISTENER: Cek secara real-time saat tombol di Pricing diklik
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

    return () => {
      window.removeEventListener('packageSelected', handlePackageSelection);
    };
  }, [setValue]);

  // 2. Integrasi Backend (Payload sudah disesuaikan dengan schema database)
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

      toast.success('Pendaftaran Berhasil Terkirim!', {
        description:
          'Tim CAKRANA akan segera menghubungi Anda via WhatsApp untuk proses survei.',
      });

      form.reset();
    } catch (error: any) {
      toast.error('Pendaftaran Gagal', {
        description:
          error.response?.data?.message ||
          'Terjadi kesalahan pada sistem, silakan coba beberapa saat lagi.',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="daftar" className="py-24 bg-[#1A1A1A] text-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1f1f1f] border border-white/10 p-8 md:p-14 rounded-[2rem] shadow-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-[#F5A623] mb-4">
              Mulai Berlangganan
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Isi data diri Anda di bawah ini. Tim teknisi kami akan melakukan
              survei lokasi secepatnya.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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

                    {/* PERHATIKAN BARIS DI BAWAH INI: Tambahkan value={field.value} */}
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
                className="w-full bg-[#F5A623] hover:bg-[#d98f1b] text-white font-bold py-7 text-xl rounded-xl mt-6 transition-all shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)]"
              >
                {isSubmitting
                  ? 'Mengirim Data...'
                  : 'Kirim Formulir Pendaftaran'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
