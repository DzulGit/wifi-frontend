'use client';

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Package {
  id: string | number;
  name: string;
  speed: number;
  price: number;
  features?: string[];
}

export default function PricingSection() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get('/packages');
        // Sesuaikan dengan response interceptor/struktur JSON backendmu
        setPackages(Array.isArray(data) ? data : data?.data || []);
      } catch (error) {
        console.error("Gagal mengambil data paket:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="paket" className="py-24 bg-[#F4F4F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-space-grotesk font-bold text-[#1A1A1A] mb-4">
            Pilih Paket Internet Anda
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            Tersedia berbagai pilihan kecepatan untuk memenuhi kebutuhan digital rumah tangga Anda.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5A623]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {packages.map((pkg) => {
              const isPro = pkg.name.toLowerCase().includes('pro');

              return (
                <div 
                  key={pkg.id} 
                  className={`relative p-8 rounded-3xl transition-transform hover:-translate-y-2 ${
                    isPro 
                      ? 'bg-[#1A1A1A] text-white shadow-xl shadow-[#1A1A1A]/20 md:scale-105 border border-[#F5A623]/30' 
                      : 'bg-white text-[#1A1A1A] border border-gray-200'
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                      TERPOPULER
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-space-grotesk font-bold mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-5xl font-space-grotesk font-bold">{pkg.speed}</span>
                      <span className={`text-lg ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>Mbps</span>
                    </div>
                    <p className={`text-xl font-semibold text-[#F5A623]`}>
                      {formatRupiah(pkg.price)} <span className="text-sm font-normal text-gray-500">/bulan</span>
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
                      <span className={isPro ? 'text-gray-300' : 'text-gray-600'}>100% Fiber Optic</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
                      <span className={isPro ? 'text-gray-300' : 'text-gray-600'}>Gratis Peminjaman Router</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#F5A623]" />
                      <span className={isPro ? 'text-gray-300' : 'text-gray-600'}>Bantuan Teknis Prioritas</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => document.getElementById('daftar')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`w-full py-6 text-lg rounded-xl font-semibold ${
                      isPro 
                        ? 'bg-[#F5A623] hover:bg-[#d98f1b] text-white' 
                        : 'bg-[#1A1A1A] hover:bg-black text-white'
                    }`}
                  >
                    Pilih Paket ini
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}