'use client';

import { Menu, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  user: any;
  unreadCount: number;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Header({
  title,
  user,
  unreadCount,
  setIsSidebarOpen,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="h-20 bg-[#1A1A1A]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg text-white/60 hover:bg-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white hidden sm:block">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-5">
        {/* Tombol Lonceng Notifikasi */}
        <button
          onClick={() => router.push('/dashboard/notifikasi')}
          className="relative p-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#1A1A1A] flex items-center justify-center animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-white/10"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">
              {user?.fullName || 'Pelanggan'}
            </p>
            <p className="text-xs text-[#F5A623] font-mono">
              {user?.customerCode || 'ID: -'}
            </p>
          </div>
          {user?.profilePhoto ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              <img
                src={user.profilePhoto}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#F5A623] flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#F5A623]/20">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
