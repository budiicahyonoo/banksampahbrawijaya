'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { Calendar, Download, Plus, FolderOpen, ChevronLeft, ChevronRight, X, ChevronDown, Eye, Search, Filter, TrendingUp, Scale } from 'lucide-react';

interface WasteItemInput {
  wasteTypeId: string;
  weight: string;
}

// --- Komponen Custom Searchable Dropdown ---
function SearchableSelect({ options, value, onChange, placeholder }: { options: {value: string, label: string}[], value: string, onChange: (v: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selected = options.find(o => o.value === value);
  const displayValue = isOpen ? search : (selected ? selected.label : '');
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <Input 
        value={displayValue}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); onChange(''); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full bg-white h-11 pr-10 shadow-sm border-gray-200 focus-visible:ring-[#004d33]/20"
        required={!value}
      />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.slice(0, 10).map(o => (
            <div 
              key={o.value} 
              className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
              onMouseDown={() => { onChange(o.value); setSearch(''); setIsOpen(false); }}
            >
              {o.label}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-3 text-sm text-gray-500 text-center">Tidak ditemukan</div>}
        </div>
      )}
    </div>
  );
}

export default function AdminSetoranPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [nasabahList, setNasabahList] = useState<any[]>([]);
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterNasabahId, setFilterNasabahId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Paginasi State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);

  // Form & Submit States
  const [selectedNasabahId, setSelectedNasabahId] = useState('');
  const [depositItems, setDepositItems] = useState<WasteItemInput[]>([{ wasteTypeId: '', weight: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [depRes, userRes, wasteRes] = await Promise.all([
        api.get('/deposits'),
        api.get('/users'),
        api.get('/waste-types')
      ]);
      const sortedDeposits = depRes.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDeposits(sortedDeposits);
      setNasabahList(userRes.data.filter((u: any) => u.status === 'AKTIF'));
      setWasteTypes(wasteRes.data);
    } catch (error) {
      toast.error('Gagal memuat data setoran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, filterNasabahId, itemsPerPage, searchQuery]);

  const filteredDeposits = deposits.filter(d => {
    const dDate = d.createdAt.split('T')[0];
    const matchStartDate = startDate ? dDate >= startDate : true;
    const matchEndDate = endDate ? dDate <= endDate : true;
    const matchNasabah = filterNasabahId ? (d.nasabahId === filterNasabahId || d.nasabah?.id === filterNasabahId) : true;
    const matchSearch = searchQuery ? d.nasabah?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchStartDate && matchEndDate && matchNasabah && matchSearch;
  });

  const totalItems = filteredDeposits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentDeposits = filteredDeposits.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleItemChange = (index: number, field: keyof WasteItemInput, value: string) => {
    const newItems = [...depositItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setDepositItems(newItems);
  };

  const removeItemRow = (index: number) => {
    if (depositItems.length > 1) {
      setDepositItems(depositItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; 

    if (!selectedNasabahId) {
      toast.error('Pilih nasabah terlebih dahulu');
      return;
    }

    const formattedItems = depositItems.map(item => {
      const waste = wasteTypes.find(w => w.id === item.wasteTypeId);
      const weight = parseFloat(item.weight) || 0;
      return { 
        wasteTypeId: item.wasteTypeId, 
        weight: weight, 
        subtotal: waste ? Math.round(weight * waste.pricePerKg) : 0 
      };
    }).filter(item => item.wasteTypeId && item.weight > 0);

    if (formattedItems.length === 0) {
      toast.error('Masukkan minimal 1 jenis sampah dengan berat lebih dari 0 kg');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Menyimpan setoran...');
    
    try {
      await api.post('/deposits', { nasabahId: selectedNasabahId, items: formattedItems });
      setIsAddModalOpen(false);
      setSelectedNasabahId('');
      setDepositItems([{ wasteTypeId: '', weight: '' }]);
      fetchData();
      toast.success('Setoran sampah berhasil dicatat!', { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mencatat setoran';
      toast.error(errorMsg, { id: loadingToast });
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredDeposits.map((d) => {
      const date = new Date(d.createdAt);
      return {
        'Tanggal': date.toLocaleDateString('id-ID'),
        'Waktu': date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'ID Nasabah': d.nasabah.nasabahId,
        'Nama': d.nasabah.name,
        'Total Berat (Kg)': d.totalWeight,
        'Total Harga (Rp)': d.totalAmount
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Setoran");
    worksheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
    XLSX.writeFile(workbook, `Data_Setoran_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const nasabahOptions = nasabahList.map(n => ({ value: n.id, label: `${n.name} (${n.nasabahId})` }));

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      <div className="md:hidden">
        <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Setoran</h2>
        <p className="text-[13px] text-gray-500 mt-1">Daftar seluruh transaksi setoran nasabah.</p>
      </div>

      <div className="hidden md:flex justify-between items-center bg-white p-2 rounded-lg mb-2">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center border border-gray-200 px-3 py-2 rounded-md shadow-sm text-sm bg-white h-11">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-7 border-none shadow-none text-sm w-[115px] px-1 focus-visible:ring-0 text-gray-600" />
            <span className="text-gray-400">-</span>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-7 border-none shadow-none text-sm w-[115px] px-1 focus-visible:ring-0 text-gray-600" />
          </div>
          <div className="relative w-64">
             <SearchableSelect options={[{value: '', label: 'Semua Nasabah'}, ...nasabahOptions]} value={filterNasabahId} onChange={setFilterNasabahId} placeholder="Cari Nasabah..." />
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportExcel} 
            disabled={!startDate || !endDate || filteredDeposits.length === 0} 
            className="flex gap-2 items-center border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 h-11"
          >
            <Download size={16} /> Eksport
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex gap-2 items-center bg-[#004d33] hover:bg-[#003322] text-white shadow-sm h-11">
            <Plus size={16} /> Catat Setoran
          </Button>
        </div>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            type="text"
            placeholder="Cari nama nasabah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-12 bg-gray-100 border-transparent focus-visible:ring-[#004d33]/20 rounded-[10px]"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 gap-2 bg-[#002b1c] hover:bg-[#004d33] text-white shadow-sm h-11 rounded-[8px] font-medium text-sm">
            <Plus size={16} /> Catat Setoran
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportExcel} 
            disabled={!startDate || !endDate || filteredDeposits.length === 0} 
            className="flex-1 gap-2 border-gray-200 shadow-sm text-[#002b1c] bg-white h-11 rounded-[8px] font-medium text-sm disabled:opacity-50"
          >
            <Download size={16} /> Eksport
          </Button>
          <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="px-3 border-gray-200 shadow-sm text-gray-700 bg-gray-100/50 h-11 rounded-[8px]">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Memuat data...</div>
      ) : filteredDeposits.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-16 md:p-24 bg-white/50">
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 mb-4">
            <FolderOpen size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Belum ada data setoran</h3>
          <p className="text-sm text-gray-500 mb-6 text-center">Buat catatan setoran untuk menampilkan<br/>data ditabel</p>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex gap-2 items-center bg-[#004d33] hover:bg-[#003322] text-white h-11">
            <Plus size={16} /> Catat Setoran
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
                  <thead className="bg-gray-50/80 text-gray-900 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-[13px]">Tanggal</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Waktu</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">ID</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Nama</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Total Berat</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Total Harga</th>
                      <th className="px-6 py-4 font-semibold text-[13px] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentDeposits.map((item) => {
                      const date = new Date(item.createdAt);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">{date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                          <td className="px-6 py-4">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.nasabah?.nasabahId || '-'}</td>
                          <td className="px-6 py-4">{item.nasabah?.name || '-'}</td>
                          <td className="px-6 py-4 uppercase font-medium">{item.totalWeight}KG</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.totalAmount.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => { setSelectedDeposit(item); setIsDetailModalOpen(true); }} className="p-1.5 text-gray-900 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors inline-flex">
                              <Eye size={18} strokeWidth={1.8} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white text-sm">
                <span className="text-gray-500 font-medium">
                  Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{endIndex} dari {totalItems} data
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors">
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 font-medium">...</span>
                    ) : (
                      <button key={idx} onClick={() => setCurrentPage(pageNum as number)} className={`w-8 h-8 rounded-md flex items-center justify-center font-semibold transition-colors text-[13px] ${currentPage === pageNum ? 'bg-[#004d33] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                        {pageNum}
                      </button>
                    )
                  ))}
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                  <div className="relative ml-4">
                    <select className="appearance-none h-8 rounded-md border border-gray-200 bg-white pl-3 pr-8 text-[13px] outline-none shadow-sm cursor-pointer text-gray-700 font-semibold" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                      <option value={10}>10/Halaman</option>
                      <option value={50}>50/Halaman</option>
                      <option value={100}>100/Halaman</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:hidden flex flex-col gap-4">
            {currentDeposits.map((item, index, arr) => {
              const date = new Date(item.createdAt);
              const dateStr = date.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
              
              const prevDate = index > 0 ? new Date(arr[index - 1].createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '';
              const showDateHeader = dateStr !== prevDate;

              return (
                <div key={item.id}>
                  {showDateHeader && (
                    <h3 className="text-[14px] font-semibold text-gray-500 mb-3 ml-1 mt-1">{dateStr}</h3>
                  )}
                  
                  <div className="bg-white p-4 rounded-[12px] border border-gray-200 shadow-sm mb-3">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                          <TrendingUp size={18} className="text-gray-600" />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-900 text-[15px] leading-tight">{item.nasabah?.name || '-'}</p>
                          <p className="text-[12px] text-gray-500 mt-1">{item.nasabah?.nasabahId} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="font-bold text-[15px] text-[#004d33]">
                        + Rp {item.totalAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 bg-[#004d33] text-white px-3 py-1 rounded-full">
                        <Scale size={12} />
                        <span className="text-[11px] font-semibold">{item.totalWeight}kg</span>
                      </div>
                      <button onClick={() => { setSelectedDeposit(item); setIsDetailModalOpen(true); }} className="text-gray-900 hover:text-gray-700">
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2 pb-6">
               <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white disabled:opacity-50">
                 Sebelumnya
               </button>
               <span className="text-sm text-gray-500 font-medium">Hal {currentPage} / {totalPages}</span>
               <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 bg-white disabled:opacity-50">
                 Selanjutnya
               </button>
            </div>
          </div>
        </>
      )}

      {isMobileFilterOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Filter</h2>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 pb-10 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2.5">
                <label className="text-[14px] font-semibold text-gray-900">Tanggal</label>
                <div className="flex gap-2 items-center border border-gray-200 px-3 rounded-md shadow-sm h-11 bg-white">
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-full border-none shadow-none text-[13px] w-full px-0" />
                  <span className="text-gray-400">-</span>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-full border-none shadow-none text-[13px] w-full px-0" />
                </div>
              </div>
              <div className="space-y-2.5">
                <label className="text-[14px] font-semibold text-gray-900">Nasabah</label>
                <SearchableSelect options={[{value: '', label: 'Semua Nasabah'}, ...nasabahOptions]} value={filterNasabahId} onChange={setFilterNasabahId} placeholder="Cari Nasabah..." />
              </div>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
              <Button variant="outline" onClick={() => setIsMobileFilterOpen(false)} className="flex-1 font-medium bg-gray-50 border-gray-200 text-gray-700 h-11">Batal</Button>
              <Button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 bg-[#002b1c] hover:bg-[#004d33] text-white font-medium h-11">Simpan</Button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Tambah Setoran</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-10 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[15px] font-semibold text-gray-900">Nama</label>
                  <SearchableSelect options={nasabahOptions} value={selectedNasabahId} onChange={setSelectedNasabahId} placeholder="Pilih nama nasabah" />
                </div>
                <div className="space-y-3">
                  <label className="text-[15px] font-semibold text-gray-900">Jenis & Berat Sampah</label>
                  {depositItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 md:gap-3">
                      
                      <div className="relative flex-1">
                        <select className="appearance-none w-full h-11 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm outline-none shadow-sm focus:ring-1 focus:ring-[#004d33] cursor-pointer text-gray-700 font-medium" value={item.wasteTypeId} onChange={(e) => handleItemChange(idx, 'wasteTypeId', e.target.value)} required>
                          <option value="">Pilih jenis sampah</option>
                          {wasteTypes.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                      
                      <span className="text-gray-400 font-medium text-sm px-1"></span>
                      
                      <div className="relative w-20 md:w-28 shrink-0">
                        <Input type="number" step="0.1" min="0.1" placeholder="0" value={item.weight} onChange={(e) => handleItemChange(idx, 'weight', e.target.value)} required className="h-11 pr-7 md:pr-8 shadow-sm border-gray-200 text-sm" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">kg</span>
                      </div>

                      {depositItems.length > 1 && (
                        <button type="button" onClick={() => removeItemRow(idx)} className="text-gray-400 hover:text-red-500 p-1.5 shrink-0 transition-colors">
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button type="button" onClick={() => setDepositItems([...depositItems, { wasteTypeId: '', weight: '' }])} className="w-full h-11 mt-3 bg-[#002b1c] text-white rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center justify-center">
                    Tambah jenis sampah
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 md:flex-none font-medium bg-gray-50 border-gray-200 text-gray-700 h-11">Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none bg-[#002b1c] hover:bg-[#004d33] text-white disabled:opacity-70 disabled:cursor-not-allowed font-medium px-8 h-11 shadow-sm transition-all">
                  {isSubmitting ? 'Memproses...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailModalOpen && selectedDeposit && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-white shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Detail Setoran</h2>
                <p className="text-[13px] text-gray-500 font-medium mt-0.5">{selectedDeposit.nasabah?.name} - {selectedDeposit.nasabah?.nasabahId}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>

            <div className="p-6 pb-10 space-y-6 flex-1 overflow-y-auto">
              <div className="flex justify-between md:justify-start md:gap-12 text-sm border-b border-gray-100 pb-5">
                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-1">Tanggal</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedDeposit.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 font-medium mb-1">Waktu</p>
                  <p className="font-semibold text-gray-900">{new Date(selectedDeposit.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[12px] text-gray-500 font-medium mb-1">Nama</p>
                  <p className="font-semibold text-gray-900">{selectedDeposit.nasabah?.name}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-[13px] text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="pb-3 font-medium">Jenis Sampah</th>
                      <th className="pb-3 font-medium text-center">Berat (kg)</th>
                      <th className="pb-3 font-medium text-center">Harga/kg</th>
                      <th className="pb-3 font-medium text-right">Sub Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedDeposit.items?.map((item: any) => (
                      <tr key={item.id} className="text-gray-900 font-medium">
                        <td className="py-4">{item.wasteType?.name}</td>
                        <td className="py-4 text-center">{item.weight}</td>
                        <td className="py-4 text-center">Rp. {item.weight > 0 ? (item.subtotal / item.weight).toLocaleString('id-ID') : '0'}</td>
                        <td className="py-4 text-right">Rp. {item.subtotal?.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center text-sm pt-2">
                <span className="text-gray-500 font-medium">Total Berat</span>
                <span className="font-semibold text-gray-900">{selectedDeposit.totalWeight}kg</span>
              </div>
            </div>

            <div className="bg-[#002b1c] px-6 py-6 flex justify-between items-center text-white shrink-0">
              <span className="font-medium text-[16px]">Total harga</span>
              <span className="font-bold text-2xl tracking-tight">Rp. {selectedDeposit.totalAmount?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}