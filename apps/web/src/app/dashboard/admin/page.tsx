'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Scale, Wallet, ArrowDownRight, Calendar } from 'lucide-react';

const COLORS = ['#3b82f6', '#92400e', '#fcd34d', '#6b7280', '#e5e7eb', '#22c55e', '#14b8a6'];

export default function AdminBerandaPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setDate(lastMonth.getDate() - 30);
  
  const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/summary?startDate=${startDate}&endDate=${endDate}`);
      setData(res.data);
    } catch (error) {
      console.error("Gagal memuat ringkasan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  if (!data && loading) return <div className="p-8 text-center text-gray-500">Memuat dasbor...</div>;
  const { summary, chartData } = data || {};

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm font-medium">
          {data.name} {data.weight} Kg
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md text-sm font-medium">
          {label}: {payload[0].value} kg
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-full pb-8">
      <div className="space-y-5 md:space-y-6 flex-1">
        
        {/* Teks Sapaan Khusus Mobile Sesuai Desain */}
        <div className="md:hidden">
          <h2 className="text-lg font-medium text-gray-900">Selamat datang, Admin Pengelola</h2>
        </div>

        {/* Hero Card Saldo */}
        <div className="bg-[#004d33] text-white rounded-2xl md:rounded-xl p-6 md:p-8 shadow-md">
          <p className="text-green-100 text-sm mb-1.5 md:mb-2 font-medium">Saldo Saat Ini</p>
          <h2 className="text-[32px] md:text-4xl font-bold tracking-tight">
            Rp. {summary?.saldoSistemSaatIni?.toLocaleString('id-ID') || 0}
          </h2>
        </div>

        {/* Ringkasan Header & Filter (Stack di Mobile) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-4 md:mt-8 border-b border-gray-100 pb-4 gap-3 md:gap-0">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 md:mb-1">Ringkasan Bank Sampah</h3>
            <p className="text-xs md:text-sm text-gray-500">Pantau data nasabah dan transaksi pada periode terpilih</p>
          </div>
          <div className="flex gap-2 items-center bg-white border border-gray-200 px-3 py-2 md:py-1.5 rounded-lg shadow-sm text-sm w-full md:w-auto justify-between md:justify-start">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <Input 
              type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} 
              className="h-7 border-none shadow-none text-xs md:text-sm w-full md:w-[110px] px-0 focus-visible:ring-0 bg-transparent text-center"
            />
            <span className="text-gray-400">-</span>
            <Input 
              type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} 
              className="h-7 border-none shadow-none text-xs md:text-sm w-full md:w-[110px] px-0 focus-visible:ring-0 bg-transparent text-center"
            />
          </div>
        </div>

        {loading && data ? (
           <div className="text-center text-sm text-gray-500 py-4">Memperbarui data...</div>
        ) : (
          <>
            {/* 4 Cards Statistik Sesuai Figma (Grid 2 Kolom di Mobile, Urutan Disesuaikan CSS) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              
              {/* Nasabah */}
              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col order-1 md:order-1">
                <div className="bg-[#004d33] text-white p-3 md:p-3.5 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Users size={16} /> <span className="truncate">Nasabah</span>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                  <div className="text-[22px] md:text-3xl font-bold text-gray-900">{summary?.totalNasabah || 0}</div>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium leading-tight">Total Nasabah yang Melakukan Setoran</p>
                </div>
              </div>

              {/* Setoran */}
              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col order-3 md:order-2">
                <div className="bg-blue-500 text-white p-3 md:p-3.5 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Scale size={16} /> <span className="truncate">Setoran</span>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                  <div className="text-[22px] md:text-3xl font-bold text-gray-900">{summary?.totalBeratSetoran || 0}kg</div>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium leading-tight">Total Setoran Sampah</p>
                </div>
              </div>

              {/* Saldo Setoran */}
              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col order-2 md:order-3">
                <div className="bg-[#16a34a] text-white p-3 md:p-3.5 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <Wallet size={16} /> <span className="truncate">Saldo Setoran</span>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                  <div className="text-[22px] md:text-3xl font-bold text-gray-900">Rp. {summary?.totalSaldoSetoran?.toLocaleString('id-ID') || 0}</div>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium leading-tight">Total Saldo Setoran</p>
                </div>
              </div>

              {/* Saldo Penarikan */}
              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col order-4 md:order-4">
                <div className="bg-orange-500 text-white p-3 md:p-3.5 flex items-center gap-2 text-xs md:text-sm font-medium">
                  <ArrowDownRight size={16} /> <span className="truncate">Saldo Penarikan</span>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                  <div className="text-[22px] md:text-3xl font-bold text-gray-900">Rp. {summary?.totalSaldoPenarikan?.toLocaleString('id-ID') || 0}</div>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-medium leading-tight">Total Saldo yang Ditarik</p>
                </div>
              </div>
            </div>

            {/* Area Grafik */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-2">
              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-4 md:p-6 flex flex-col">
                <div className="text-[11px] md:text-xs text-gray-500 mb-4 md:mb-6 font-medium">(Kg)</div>
                {/* PERBAIKAN: Menambahkan min-h agar chart ter-render di mobile */}
                <div className="h-56 md:h-64 min-h-[220px] w-full flex-1">
                  {chartData?.monthly?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.monthly} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dx={-10} />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
                        <Bar dataKey="weight" fill="#004d33" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">Tidak ada data setoran</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm md:shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-4 md:p-6 flex flex-col">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Komposisi Jenis Sampah</h3>
                <div className="flex items-center h-56 md:h-64 flex-1">
                  {/* PERBAIKAN: Memastikan rasio Pie Chart 1:1 agar tidak gepeng */}
                  <div className="w-1/2 h-full relative aspect-square flex items-center justify-center">
                    {chartData?.composition?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          {/* outerRadius menggunakan persentase agar dinamis dan bulat sempurna */}
                          <Pie data={chartData.composition} cx="50%" cy="50%" innerRadius={0} outerRadius="80%" dataKey="weight" stroke="white" strokeWidth={2}>
                            {chartData.composition.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">Data kosong</div>
                    )}
                  </div>
                  
                  <div className="w-1/2 flex flex-col gap-3 md:gap-4 pl-4 md:pl-6 overflow-y-auto max-h-full">
                    {chartData?.composition?.map((item: any, index: number) => (
                      <div key={item.name} className="flex justify-between items-center text-[12px] md:text-sm">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-gray-600 font-medium truncate max-w-[70px] md:max-w-none">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900 shrink-0">{item.weight} Kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Copyright Sesuai Figma */}
      <div className="pt-8 md:pt-10 text-center">
        <p className="text-[10px] md:text-[11px] text-gray-400 font-medium tracking-wide">
          © 2026 Bank Sampah Sobat Banjar Arum Berseri. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}