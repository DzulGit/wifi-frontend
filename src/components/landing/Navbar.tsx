"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#121212] text-white py-4 px-6 fixed w-full z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
          <Image src="/cakrana-logo.png" alt="CAKRANA Logo" width={30} height={30} className="object-contain" />
          CAKRANA
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 text-sm text-gray-300">
          <Link href="#" className="text-amber-500 font-semibold">Beranda</Link>
          <Link href="#fitur" className="hover:text-white transition">Fitur</Link>
          <Link href="#paket" className="hover:text-white transition">Daftar Paket</Link>
          <Link href="#cara-daftar" className="hover:text-white transition">Cara Daftar</Link>
        </div>

        {/* CTA Desktop */}
        <Link href="#daftar" className="hidden md:block bg-amber-500 text-black px-6 py-2 rounded-md font-semibold text-sm hover:bg-yellow-500 transition">
          DAFTAR SEKARANG
        </Link>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-300 hover:text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#121212] border-t border-gray-800 mt-4 absolute left-0 w-full px-6 py-4 flex flex-col space-y-4 shadow-xl">
          <Link href="#" onClick={() => setIsOpen(false)} className="text-amber-500 font-semibold">Beranda</Link>
          <Link href="#fitur" onClick={() => setIsOpen(false)} className="text-gray-300">Fitur</Link>
          <Link href="#paket" onClick={() => setIsOpen(false)} className="text-gray-300">Daftar Paket</Link>
          <Link href="#cara" onClick={() => setIsOpen(false)} className="text-gray-300">Cara Daftar</Link>
          <Link href="#daftar" onClick={() => setIsOpen(false)} className="bg-amber-500 text-black px-4 py-2 rounded-md font-semibold text-center mt-2">DAFTAR SEKARANG</Link>
        </div>
      )}
    </nav>
  );
}