'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { LayoutGrid, Scale, CreditCard, Users, Recycle, LogOut, Menu, X, Bell } from 'lucide-react'; // Bell ditambahkan kembali untuk mobile

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/auth/login');
  };

  const navItems = [
    { name: 'Beranda', path: '/dashboard/admin', icon: LayoutGrid },
    { name: 'Setoran', path: '/dashboard/admin/setoran', icon: Scale },
    { name: 'Penarikan', path: '/dashboard/admin/penarikan', icon: CreditCard },
    { name: 'Nasabah', path: '/dashboard/admin/nasabah', icon: Users },
    { name: 'Sampah', path: '/dashboard/admin/sampah', icon: Recycle },
  ];

  const getPageTitle = () => {
    if (pathname === '/dashboard/admin') return { title: 'Admin Pengelola', subtitle: 'Selamat datang kembali,' };
    if (pathname === '/dashboard/admin/setoran') return { title: 'Setoran', subtitle: 'Daftar seluruh transaksi setoran sampah' };
    if (pathname === '/dashboard/admin/penarikan') return { title: 'Penarikan', subtitle: 'Daftar seluruh transaksi penarikan saldo' };
    if (pathname === '/dashboard/admin/nasabah') return { title: 'Data Nasabah', subtitle: 'Kelola data seluruh nasabah' };
    if (pathname === '/dashboard/admin/sampah') return { title: 'Katalog Sampah', subtitle: 'Kelola harga dan jenis sampah' };
    return { title: 'Dashboard Admin', subtitle: 'Panel kontrol utama' };
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
          <div className="flex items-center cursor-pointer group">
            <div className="text-right mr-3">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#004d33] transition-colors">Admin Pengelola</p>
            </div>
            <div className="relative">
              <div className="w-11 h-11 bg-[#F5F7F0] rounded-full flex items-center justify-center font-bold text-gray-700 text-base border border-[#E8EBE0] group-hover:border-[#004d33] transition-colors shadow-sm">
                AD
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </header>

        {/* HEADER MOBILE (Desain Baru) */}
        <header className="md:hidden flex items-center justify-between p-5 bg-white shrink-0 z-10 border-b border-gray-100/50">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-[#F5F7F0] rounded-full flex items-center justify-center font-bold text-gray-700 text-sm border border-gray-200">
                AD
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <span className="font-medium text-gray-900 text-[15px] leading-tight">Admin Pengelola</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#004d33] border border-gray-200 shadow-sm">
            <Bell size={18} />
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-white md:bg-transparent p-4 pb-28 md:p-8 relative">
          {children}
        </main>

        {/* BOTTOM NAVIGATION MOBILE (Kapsul Hijau Tua) */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-[#002b1c] rounded-full p-1.5 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`flex items-center justify-center rounded-full transition-all duration-300 ${isActive ? 'bg-[#004d33] text-white px-4 py-2.5' : 'text-green-300 hover:text-white px-3 py-2.5'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && <span className="ml-2 text-[11px] font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}