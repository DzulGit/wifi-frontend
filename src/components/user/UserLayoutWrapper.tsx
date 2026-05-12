'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import Sidebar from './Sidebar'; // Sesuaikan path import jika berbeda
import Header from './Header';   // Sesuaikan path import jika berbeda

export default function UserLayoutWrapper({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const pathname = usePathname();
  const router = useRouter();
  
  const { user, logout, isAuthenticated, isAdmin, _hasHydrated } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── FETCH UNREAD NOTIFICATIONS ──
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/notifications', { params: { userId: user.id } });
        const notifs = data?.data || data || [];
        const unread = notifs.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Gagal get notif header");
      }
    };

    fetchUnread();
  }, [isAuthenticated, user?.id, pathname]);

  // ── LOGOUT LOGIC ──
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // ── GUARD LOGIC ──
  useEffect(() => {
    if (!isMounted || !_hasHydrated) return;

    let hasLocalToken = false;
    const authStorage = localStorage.getItem('cakrana-auth');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        hasLocalToken = !!parsed?.state?.token;
      } catch (e) { hasLocalToken = false; }
    }

    if (!isAuthenticated && !hasLocalToken) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isAdmin) {
      router.push('/admin/dashboard');
      return;
    }
  }, [isMounted, _hasHydrated, isAuthenticated, isAdmin, router]);

  // ── LOADING STATE ──
  if (!isMounted || !_hasHydrated || (!isAuthenticated && typeof window !== 'undefined' && localStorage.getItem('cakrana-auth'))) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#F5A623] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex font-sans">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        pathname={pathname} 
        unreadCount={unreadCount} 
        handleLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={title} 
          user={user} 
          unreadCount={unreadCount} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <h1 className="text-2xl font-bold text-white sm:hidden mb-6">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}