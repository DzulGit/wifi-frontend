'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar' // Sesuaikan path ini dengan letak komponen kamu

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar Component */}
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        pendingCount={12} // Nanti ini diganti dengan data API kamu
        paymentCount={3}
      />

      {/* Main Content (Bergeser 260px ke kanan di layar besar) */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen w-full transition-all duration-300">
        
        {/* Header Mobile (Hanya muncul di HP/Tablet) */}
        <header className="h-16 bg-white border-b flex items-center px-4 sticky top-0 z-30 lg:hidden shadow-sm">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2 mr-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
           <h1 className="font-bold text-lg text-[#F5A623]">CAKRANA</h1>
        </header>

        {/* Render Konten Halaman Aktif (seperti dashboard, pelanggan, dll) */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}