'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { TrendingUp, ArrowDownRight } from 'lucide-react'; // Tambahkan ikon untuk mobile

export default function NasabahHistory() {
  const [activeTab, setActiveTab] = useState<'SEMUA' | 'SETORAN' | 'PENARIKAN'>('SEMUA');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/nasabah/history').then(res => {
      setHistory(res.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filteredHistory = history.filter(h => activeTab === 'SEMUA' || h.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      {/* Judul Halaman Khusus Mobile Sesuai Desain */}
      <h2 className="md:hidden text-[19px] font-bold text-gray-900 mt-2 mb-4">Riwayat Transaksi</h2>

      {/* Tab Switcher - Dibuat full-width di mobile, normal di desktop */}
      <div className="flex bg-[#002d1e] md:bg-[#004d33] rounded-[10px] md:rounded-lg p-1.5 md:p-1 text-[13px] md:text-sm font-medium shadow-sm w-full md:w-auto md:inline-flex">
        <button 
          onClick={() => setActiveTab('SEMUA')} 
          className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-2 rounded-[8px] md:rounded-md transition-colors ${activeTab === 'SEMUA' ? 'bg-[#006644] text-white shadow-sm' : 'text-green-100/80 hover:text-white'}`}
        >
          Semua
        </button>
        <button 
          onClick={() => setActiveTab('SETORAN')} 
          className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-2 rounded-[8px] md:rounded-md transition-colors ${activeTab === 'SETORAN' ? 'bg-[#006644] text-white shadow-sm' : 'text-green-100/80 hover:text-white'}`}
        >
          Setoran
        </button>
        <button 
          onClick={() => setActiveTab('PENARIKAN')} 
          className={`flex-1 md:flex-none px-4 md:px-8 py-2.5 md:py-2 rounded-[8px] md:rounded-md transition-colors ${activeTab === 'PENARIKAN' ? 'bg-[#006644] text-white shadow-sm' : 'text-green-100/80 hover:text-white'}`}
        >
          Penarikan
        </button>
      </div>

      {/* --- BLOK 1: TABEL VERSI DESKTOP (Original, disembunyikan di Mobile) --- */}
      <div className="hidden md:block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)]">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/80 text-gray-900 border-b border-gray-100">
            {activeTab === 'SEMUA' ? (
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px]">Jenis Transaksi</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Deskripsi</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-[13px] text-right">Nominal</th>
              </tr>
            ) : activeTab === 'SETORAN' ? (
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px]">Jenis Sampah</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Berat</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Waktu</th>
                <th className="px-6 py-4 font-semibold text-[13px] text-right">Nominal</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-4 font-semibold text-[13px]">Jenis Transaksi</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-[13px]">Waktu</th>
                <th className="px-6 py-4 font-semibold text-[13px] text-right">Nominal</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
            ) : filteredHistory.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Belum ada transaksi.</td></tr>
            ) : (
              filteredHistory.map((item, idx) => {
                const date = new Date(item.date);
                const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                const nominalColor = item.type === 'SETORAN' ? 'text-green-600' : 'text-red-500';
                const sign = item.type === 'SETORAN' ? '+' : '-';
                
                if (activeTab === 'SEMUA') {
                  const desc = item.type === 'SETORAN' ? item.items.map((i:any) => `${i.name} - ${i.weight} kg`).join(', ') : 'Penarikan tunai';
                  return (
                    <tr key={item.id+idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">{item.type === 'SETORAN' ? 'Setoran' : 'Penarikan'}</td>
                      <td className="px-6 py-4">{desc}</td>
                      <td className="px-6 py-4 text-gray-500">{dateStr}</td>
                      <td className={`px-6 py-4 text-right font-medium ${nominalColor}`}>{sign} Rp {item.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  );
                }

                if (activeTab === 'SETORAN' && item.type === 'SETORAN') {
                  return item.items.map((i:any, j:number) => (
                    <tr key={`${item.id}-${j}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">{i.name}</td>
                      <td className="px-6 py-4">{i.weight} kg</td>
                      <td className="px-6 py-4 text-gray-500">{dateStr}</td>
                      <td className="px-6 py-4 text-gray-500">{timeStr}</td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">+ Rp {i.subtotal?.toLocaleString('id-ID') || 0}</td>
                    </tr>
                  ));
                }

                if (activeTab === 'PENARIKAN' && item.type === 'PENARIKAN') {
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">Penarikan tunai</td>
                      <td className="px-6 py-4 text-gray-500">{dateStr}</td>
                      <td className="px-6 py-4 text-gray-500">{timeStr}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-500">- Rp {item.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  );
                }
                return null;
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- BLOK 2: LIST VERSI MOBILE (Sesuai Desain Baru, disembunyikan di Desktop) --- */}
      <div className="md:hidden flex flex-col pb-8">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Belum ada transaksi.</div>
        ) : (
          filteredHistory.map((item, idx) => {
            const date = new Date(item.date);
            const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            if (activeTab === 'SEMUA') {
              const desc = item.type === 'SETORAN' ? item.items.map((i:any) => `${i.name} - ${i.weight} kg`).join(', ') : 'Penarikan tunai';
              return (
                <div key={item.id+idx} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden pr-2">
                    <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      {item.type === 'SETORAN' 
                        ? <TrendingUp size={18} className="text-[#004d33]" /> 
                        : <ArrowDownRight size={18} className="text-red-500" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-semibold text-gray-900 text-[15px]">{item.type === 'SETORAN' ? 'Setoran' : 'Penarikan'}</p>
                      <p className="text-[13px] text-gray-500 truncate mt-0.5">{desc} · {dateStr}, {timeStr}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-[14px] shrink-0 ${item.type === 'SETORAN' ? 'text-[#004d33]' : 'text-red-600'}`}>
                    {item.type === 'SETORAN' ? '+' : '-'} Rp {item.nominal.toLocaleString('id-ID')}
                  </div>
                </div>
              );
            }
            
            if (activeTab === 'SETORAN' && item.type === 'SETORAN') {
              return item.items.map((i:any, j:number) => (
                <div key={`${item.id}-${j}`} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <TrendingUp size={18} className="text-[#004d33]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-semibold text-gray-900 text-[15px]">Setoran</p>
                      <p className="text-[13px] text-gray-500 truncate mt-0.5">{i.name} - {i.weight} kg · {dateStr}, {timeStr}</p>
                    </div>
                  </div>
                  <div className="font-bold text-[14px] shrink-0 text-[#004d33]">
                    + Rp {i.subtotal?.toLocaleString('id-ID') || 0}
                  </div>
                </div>
              ));
            }

            if (activeTab === 'PENARIKAN' && item.type === 'PENARIKAN') {
              return (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 overflow-hidden pr-2">
                    <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                      <ArrowDownRight size={18} className="text-red-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="font-semibold text-gray-900 text-[15px]">Penarikan</p>
                      <p className="text-[13px] text-gray-500 truncate mt-0.5">Penarikan tunai · {dateStr}, {timeStr}</p>
                    </div>
                  </div>
                  <div className="font-bold text-[14px] shrink-0 text-red-600">
                    - Rp {item.nominal.toLocaleString('id-ID')}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>

    </div>
  );
}