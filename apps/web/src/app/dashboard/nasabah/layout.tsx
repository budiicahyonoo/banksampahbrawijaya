'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { LayoutGrid, History, User, LogOut, Bell } from 'lucide-react';

export default function NasabahLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{name: string, nasabahId: string, avatar?: string} | null>(null);

  useEffect(() => {
    api.get('/nasabah/dashboard').then(res => setUser(res.data.user)).catch(() => {});
  }, []);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Beranda', path: '/dashboard/nasabah', icon: LayoutGrid },
    { name: 'History', path: '/dashboard/nasabah/history', icon: History },
    { name: 'Profil', path: '/dashboard/nasabah/profil', icon: User },
  ];

  const getPageTitle = () => {
    if (pathname === '/dashboard/nasabah') return { title: `Selamat Datang, ${user?.name?.split(' ')[0] || ''}`, subtitle: 'Selamat Datang Kembali' };
    if (pathname === '/dashboard/nasabah/history') return { title: 'Riwayat Transaksi', subtitle: 'Daftar seluruh riwayat transaksi' };
    if (pathname === '/dashboard/nasabah/profil') return { title: 'Profil Saya', subtitle: 'Kelola informasi pribadi Anda' };
    if (pathname === '/dashboard/nasabah/notifikasi') return { title: 'Notifikasi', subtitle: 'Dapatkan informasi terbaru' };
    return { title: 'Dashboard', subtitle: 'Panel kontrol Bank Sampah' };
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="flex h-screen bg-white md:bg-gray-50/50 overflow-hidden">
      
      {/* SIDEBAR DESKTOP (Tetap original, disembunyikan di Mobile) */}
      <aside className="hidden md:flex inset-y-0 left-0 z-50 w-64 bg-[#004d33] text-white flex-col shadow-lg shrink-0">
        <div className="p-6 flex items-center justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative shrink-0">
               <Image src="/logo.png" alt="Logo Bank Sampah" fill sizes="40px" className="object-contain" />
            </div>
            <div>
              <h2 className="font-bold tracking-wide text-sm leading-tight">BANK SAMPAH</h2>
              <p className="text-[10px] text-green-200 leading-tight">Sobat Banjar Arum<br/>Berseri</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 text-[10px] uppercase tracking-wider font-semibold text-green-300 mt-2">
          Menu Utama
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-[#006644] font-medium text-white shadow-sm' : 'text-green-100 hover:bg-[#006644]/50 hover:text-white'
                }`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-green-100 hover:bg-[#006644]/50 hover:text-white transition-colors">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER DESKTOP (Sesuai kode awal) */}
        <header className="hidden md:flex h-24 bg-[#FCFDF9] border-b border-[#F2F4E6] px-8 items-center justify-between shrink-0 z-10">
          <div>
            <p className="text-gray-500 text-sm mb-1">{subtitle}</p>
            <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard/nasabah/profil" className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-[#004d33] transition-colors">{user?.name || 'Memuat...'}</p>
                <p className="text-[11px] text-gray-500 font-medium">{user?.nasabahId || '-'}</p>
              </div>
              <div className="relative">
                <div className="w-11 h-11 bg-[#F5F7F0] rounded-full flex items-center justify-center font-bold text-gray-700 text-base border border-[#E8EBE0] group-hover:border-[#004d33] transition-colors shadow-sm overflow-hidden relative">
                  {user?.avatar ? <Image src={user.avatar} alt="Profile" fill className="object-cover" /> : getInitials(user?.name)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
            </Link>
            <Link href="/dashboard/nasabah/notifikasi" className="relative w-11 h-11 rounded-full flex items-center justify-center transition-colors border shadow-sm bg-[#F5F7F0] text-[#004d33] border-[#E8EBE0] hover:bg-[#E8EBE0]">
              <Bell size={20} strokeWidth={pathname === '/dashboard/nasabah/notifikasi' ? 2.5 : 2} />
            </Link>
          </div>
        </header>

        {/* HEADER MOBILE (Desain Baru: Avatar Kiri, Nama & ID, Bell Kanan) */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white shrink-0 z-10 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-[#F5F7F0] rounded-full flex items-center justify-center font-bold text-gray-700 text-sm border border-gray-200 overflow-hidden relative">
                {user?.avatar ? <Image src={user.avatar} alt="Profile" fill className="object-cover" /> : getInitials(user?.name)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 text-[15px] leading-tight">{user?.name || 'Memuat...'}</span>
              <span className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">{user?.nasabahId || '-'}</span>
            </div>
          </div>
          <Link href="/dashboard/nasabah/notifikasi" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#004d33] border border-gray-200 shadow-sm">
            <Bell size={18} />
          </Link>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-white p-4 pb-28 md:p-8 relative">
          {children}
        </main>

        {/* BOTTOM NAVIGATION MOBILE (Kapsul Hijau Tua) */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-max bg-[#002b1c] rounded-full p-1.5 flex items-center gap-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#004d33] text-white px-5 py-2.5' : 'text-green-300 hover:text-white px-4 py-2.5'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && <span className="ml-2 text-xs font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}