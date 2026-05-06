import type { Metadata } from "next";
import { Inter, Space_Grotesk } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Setup Fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "CAKRANA | WiFi Management System",
  description: "Kendali Koneksi, Tanpa Batas.",
};

// ROOT LAYOUT: Wajib ada <html> dan <body> di sini
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans bg-[#F4F4F5] text-[#1A1A1A] antialiased`}>
        {children}
        
        {/* Toaster dipasang di root agar toast.success/error bisa dipakai di halaman manapun */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}