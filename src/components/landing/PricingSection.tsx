'use client';

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get('/packages');
        // Urutkan paket berdasarkan harga (termurah ke termahal)
        const sorted = data.sort((a: any, b: any) => a.price - b.price);
        setPackages(sorted);
      } catch (error) {
        console.error("Gagal load paket", error);
      }
    };
    fetchPackages();
  }, []);

  const handleSelectPackage = (pkgId: string) => {
    // 1. Simpan ID ke Local Storage agar tidak hilang
    localStorage.setItem('selectedPackageId', pkgId);
    
    // 2. Tembakkan notifikasi ke Form
    window.dispatchEvent(new Event('packageSelected'));

    // 3. Scroll mulus ke form
    const element = document.getElementById('daftar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="paket" className="py-24 bg-[#F4F4F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-space-grotesk font-bold text-[#1A1A1A] mb-4">
            Pilihan Paket <span className="text-[#F5A623]">Internet</span>
          </h2>
          <p className="text-gray-500 text-lg">Pilih kecepatan yang paling sesuai dengan gaya hidup digital Anda.</p>
        </div>

        {/* Menggunakan Flexbox agar selalu ke tengah (simetris) baik 3 maupun 4 paket */}
        <div className="flex flex-wrap justify-center gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              // W-full pada mobile, lebar fix (350px) pada desktop agar seragam
              className={`relative flex flex-col w-full md:w-[350px] p-8 rounded-3xl border ${
                pkg.isPopular 
                  ? "bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-2xl scale-105 z-10" 
                  : "bg-white border-gray-200 text-[#1A1A1A] shadow-sm mt-0 md:mt-4"
              } transition-all duration-300`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F5A623] text-white px-5 py-1.5 rounded-full text-sm font-bold tracking-wider shadow-md">
                  TERPOPULER
                </div>
              )}

              <div className="mb-6 mt-2">
                <h3 className={`text-xl font-bold mb-2 ${pkg.isPopular ? 'text-white' : 'text-[#1A1A1A]'}`}>
                  {pkg.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold">{pkg.speedDown}</span>
                  <span className={`font-medium ${pkg.isPopular ? 'text-gray-400' : 'text-gray-500'}`}>Mbps</span>
                </div>
                <p className={`mt-3 font-medium ${pkg.isPopular ? 'text-[#F5A623]' : 'text-gray-500'}`}>
                  Rp {pkg.price.toLocaleString('id-ID')} / bulan
                </p>
              </div>

              {/* Flex-1 agar mengisi ruang kosong, sehingga tombol di bawahnya sejajar */}
              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {pkg.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className={`h-5 w-5 mr-3 shrink-0 ${pkg.isPopular ? 'text-[#F5A623]' : 'text-[#1A1A1A]'}`} />
                      <span className={pkg.isPopular ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tombol otomatis di-push ke paling bawah karena ada flex-1 di atasnya */}
              <Button
                onClick={() => handleSelectPackage(pkg.id)}
                className={`w-full py-6 rounded-xl font-bold text-base transition-all mt-auto ${
                  pkg.isPopular
                    ? "bg-[#F5A623] hover:bg-[#d98f1b] text-white shadow-lg shadow-orange-900/50"
                    : "bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]"
                }`}
              >
                Pilih Paket Ini
              </Button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}