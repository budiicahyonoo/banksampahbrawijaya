'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { TrendingUp, Wallet, ArrowDownRight, Package, ShoppingBag, FileText, Database, GlassWater, Leaf, Recycle } from 'lucide-react';

export default function NasabahBeranda() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/nasabah/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-500">Memuat...</div>;
  const { user, summary, prices } = data;

  const getIconForWaste = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('plastik')) return <ShoppingBag size={20} strokeWidth={1.5} />;
    if (lowerName.includes('kardus')) return <Package size={20} strokeWidth={1.5} />;
    if (lowerName.includes('kertas')) return <FileText size={20} strokeWidth={1.5} />;
    if (lowerName.includes('aluminium') || lowerName.includes('besi') || lowerName.includes('logam')) return <Database size={20} strokeWidth={1.5} />;
    if (lowerName.includes('kaca') || lowerName.includes('botol')) return <GlassWater size={20} strokeWidth={1.5} />;
    if (lowerName.includes('organik')) return <Leaf size={20} strokeWidth={1.5} />;
    return <Recycle size={20} strokeWidth={1.5} />; 
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 md:space-y-6">
      
      {/* Sapaan Teks Khusus Mobile */}
      <div className="md:hidden">
        <h2 className="text-lg font-bold text-gray-900">Selamat datang, {user.name}</h2>
      </div>

      <div className="bg-[#004d33] text-white rounded-2xl md:rounded-xl p-6 md:p-8 shadow-md">
        <p className="text-green-100 text-sm mb-1.5 md:mb-2 font-medium">Saldo Tabungan</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Rp {user.balance.toLocaleString('id-ID')}</h2>
      </div>

      {/* --- BLOK 1: KARTU VERSI DESKTOP (Original, disembunyikan di Mobile) --- */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col bg-white">
          <div className="bg-blue-500 text-white p-3.5 text-sm font-medium flex gap-2 items-center">
            <TrendingUp size={16} /> Total Setoran Sampah
          </div>
          <div className="p-5 flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{summary.totalSetoranKg} Kg</h3>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium">Sampah yang telah disetorkan</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col bg-white">
          <div className="bg-[#004d33] text-white p-3.5 text-sm font-medium flex gap-2 items-center">
            <Wallet size={16} /> Total Saldo Setoran
          </div>
          <div className="p-5 flex-1">
            <h3 className="text-2xl font-bold text-gray-900">Rp {summary.totalSetoranRp.toLocaleString('id-ID')}</h3>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium">Akumulasi hasil setoran</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col bg-white">
          <div className="bg-orange-500 text-white p-3.5 text-sm font-medium flex gap-2 items-center">
            <ArrowDownRight size={16} /> Total Penarikan
          </div>
          <div className="p-5 flex-1">
            <h3 className="text-2xl font-bold text-gray-900">Rp {summary.totalPenarikanRp.toLocaleString('id-ID')}</h3>
            <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium">Saldo yang telah dicairkan</p>
          </div>
        </div>
      </div>

      {/* --- BLOK 2: KARTU VERSI MOBILE (Sesuai Desain Baru, disembunyikan di Desktop) --- */}
      <div className="grid md:hidden grid-cols-3 gap-2">
        <div className="bg-orange-50/70 rounded-xl p-3 flex flex-col justify-between border border-orange-100/50 shadow-sm min-h-[110px]">
          <TrendingUp size={18} className="text-orange-500 mb-2" />
          <div>
            <p className="text-[10px] text-gray-600 leading-tight mb-2">Total Setoran Sampah</p>
            <h3 className="text-[13px] font-bold text-gray-900">{summary.totalSetoranKg} Kg</h3>
          </div>
        </div>
        <div className="bg-blue-50/70 rounded-xl p-3 flex flex-col justify-between border border-blue-100/50 shadow-sm min-h-[110px]">
          <Wallet size={18} className="text-blue-500 mb-2" />
          <div>
            <p className="text-[10px] text-gray-600 leading-tight mb-2">Total Saldo Setoran</p>
            <h3 className="text-[13px] font-bold text-gray-900">Rp{summary.totalSetoranRp.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-red-50/70 rounded-xl p-3 flex flex-col justify-between border border-red-100/50 shadow-sm min-h-[110px]">
          <ArrowDownRight size={18} className="text-red-500 mb-2" />
          <div>
            <p className="text-[10px] text-gray-600 leading-tight mb-2">Total Penarikan</p>
            <h3 className="text-[13px] font-bold text-gray-900">Rp{summary.totalPenarikanRp.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="pt-3 md:pt-2">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1">Harga Sampah Hari Ini</h3>
        <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">Daftar estimasi harga penukaran sampah per kilogram terbaru</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {prices.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl md:rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 md:border-gray-100 p-4 md:p-5 flex flex-col text-left">
              <div className="mb-3 text-[#004d33]">
                {getIconForWaste(p.name)}
              </div>
              <p className="text-[15px] md:text-sm text-gray-900 md:text-gray-600 font-medium mb-1">{p.name}</p>
              <h4 className="text-[13px] md:text-lg font-medium md:font-bold text-gray-500 md:text-gray-900">Rp {p.pricePerKg.toLocaleString('id-ID')}/kg</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}