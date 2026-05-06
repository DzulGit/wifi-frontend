import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="beranda" className="pt-32 pb-20 bg-[#1A1A1A] text-white min-h-[85vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row items-center gap-12">
        
        {/* Konten Teks */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 text-sm font-medium text-[#F5A623]">
            <Zap className="w-4 h-4 fill-[#F5A623]" />
            #1 Tercepat di 2024
          </div>
          
          <h1 className="text-5xl md:text-6xl font-space-grotesk font-bold leading-[1.1]">
            Internet Cepat & Stabil <br /> untuk Rumah Anda
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
            Mulai dari Rp100.000/bulan. Tanpa FUP, rasakan pengalaman streaming dan gaming tanpa batas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="bg-[#F5A623] hover:bg-[#d98f1b] text-white font-semibold px-8 py-6 text-lg rounded-xl">
              <Link href="#paket">Pilih Paket</Link>
            </Button>
          </div>
        </div>

        {/* Gambar Ilustrasi */}
        <div className="flex-1 w-full relative">
          <div className="relative aspect-video md:aspect-square w-full max-w-lg mx-auto flex items-center justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-[#F5A623]/20 to-transparent rounded-full blur-3xl absolute -z-10"></div>
            {/* Pastikan file logo.svg ada di folder public */}
            <Image 
              src="/hero-image.png" 
              alt="CAKRANA Hero" 
              width={400} 
              height={400}
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}