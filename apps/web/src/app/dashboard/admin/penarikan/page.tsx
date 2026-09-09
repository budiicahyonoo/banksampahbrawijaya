'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/axios';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { Calendar, Download, Plus, FolderOpen, ChevronLeft, ChevronRight, X, ChevronDown, Search, Filter, ArrowUpFromLine } from 'lucide-react';

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

export default function AdminPenarikanPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [nasabahList, setNasabahList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [startDate, setStartDate] = useState(''); 
  const [endDate, setEndDate] = useState('');
  const [filterNasabahId, setFilterNasabahId] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State pencarian mobile

  // Paginasi State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // Modal filter mobile
  const [selectedNasabahId, setSelectedNasabahId] = useState('');
  const [amountInput, setAmountInput] = useState('');

  const fetchData = async () => {
    try {
      const [wdRes, userRes] = await Promise.all([
        api.get('/withdrawals'),
        api.get('/users')
      ]);
      const sortedWithdrawals = wdRes.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawals(sortedWithdrawals);
      setNasabahList(userRes.data.filter((u: any) => u.status === 'AKTIF'));
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Reset Paginasi jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, filterNasabahId, itemsPerPage, searchQuery]);

  // Logika Filter
  const filteredWithdrawals = withdrawals.filter(w => {
    const wDate = w.createdAt.split('T')[0];
    const matchStartDate = startDate ? wDate >= startDate : true;
    const matchEndDate = endDate ? wDate <= endDate : true;
    const matchNasabah = filterNasabahId ? w.nasabahId === filterNasabahId : true;
    const matchSearch = searchQuery ? w.nasabah?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchStartDate && matchEndDate && matchNasabah && matchSearch;
  });

  // Logika Paginasi
  const totalItems = filteredWithdrawals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

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

  // Validasi Form
  const selectedNasabah = useMemo(() => nasabahList.find(n => n.id === selectedNasabahId), [selectedNasabahId, nasabahList]);
  const currentBalance = selectedNasabah?.balance || 0;
  const withdrawAmount = parseFloat(amountInput) || 0;
  const isInsufficient = withdrawAmount > currentBalance;
  const isSubmitDisabled = !selectedNasabahId || withdrawAmount <= 0 || isInsufficient;

  const nasabahOptions = nasabahList.map(n => ({ value: n.id, label: `${n.name} (${n.nasabahId})` }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    const loadingToast = toast.loading('Memproses penarikan...');
    try {
      await api.post('/withdrawals', { nasabahId: selectedNasabahId, amount: withdrawAmount });
      setIsModalOpen(false);
      setSelectedNasabahId('');
      setAmountInput('');
      fetchData();
      toast.success('Penarikan berhasil dicatat!', { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal memproses penarikan';
      toast.error(errorMsg, { id: loadingToast });
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredWithdrawals.map((w) => {
      const date = new Date(w.createdAt);
      return {
        'Tanggal': date.toLocaleDateString('id-ID'),
        'Waktu': date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        'ID Nasabah': w.nasabah.nasabahId,
        'Nama': w.nasabah.name,
        'Saldo Ditarik (Rp)': w.amount,
        'Sisa Saldo (Rp)': w.remainingBalance
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penarikan");
    XLSX.writeFile(workbook, `Data_Penarikan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      {/* Teks Sapaan Khusus Mobile */}
      <div className="md:hidden">
        <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Penarikan</h2>
        <p className="text-[13px] text-gray-500 mt-1">Daftar seluruh transaksi penarikan saldo.</p>
      </div>

      {/* --- BLOK 1: TOOLBAR VERSI DESKTOP --- */}
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
          <Button variant="outline" onClick={handleExportExcel} disabled={!startDate || !endDate} className="flex gap-2 items-center border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 h-11">
            <Download size={16} /> Eksport
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex gap-2 items-center bg-[#004d33] hover:bg-[#003322] text-white shadow-sm h-11">
            <Plus size={16} /> Catat Penarikan
          </Button>
        </div>
      </div>

      {/* --- BLOK 2: TOOLBAR VERSI MOBILE --- */}
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
          <Button onClick={() => setIsModalOpen(true)} className="flex-1 gap-2 bg-[#002b1c] hover:bg-[#004d33] text-white shadow-sm h-11 rounded-[8px] font-medium text-sm">
            <Plus size={16} /> Catat Penarikan
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={!startDate || !endDate} className="flex-1 gap-2 border-gray-200 shadow-sm text-[#002b1c] bg-white h-11 rounded-[8px] font-medium text-sm">
            <Download size={16} /> Eksport
          </Button>
          <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="px-3 border-gray-200 shadow-sm text-gray-700 bg-gray-100/50 h-11 rounded-[8px]">
            <Filter size={18} />
          </Button>
        </div>
      </div>

      {/* --- AREA DATA --- */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Memuat data...</div>
      ) : filteredWithdrawals.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-16 md:p-24 bg-white/50">
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 mb-4">
            <FolderOpen size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Belum ada catatan penarikan</h3>
          <p className="text-sm text-gray-500 mb-6 text-center">Buat catatan penarikan untuk menampilkan<br/>data ditabel</p>
          <Button onClick={() => setIsModalOpen(true)} className="flex gap-2 items-center bg-[#004d33] hover:bg-[#003322] text-white h-11">
            <Plus size={16} /> Catat Penarikan
          </Button>
        </div>
      ) : (
        <>
          {/* TABEL VERSI DESKTOP (Original) */}
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
                      <th className="px-6 py-4 font-semibold text-[13px]">Saldo Ditarik</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Sisa Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentWithdrawals.map((item) => {
                      const date = new Date(item.createdAt);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">{date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</td>
                          <td className="px-6 py-4">{date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.nasabah.nasabahId}</td>
                          <td className="px-6 py-4">{item.nasabah.name}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{item.amount.toLocaleString('id-ID')}</td>
                          <td className="px-6 py-4 text-gray-500">{item.remainingBalance.toLocaleString('id-ID')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Paginasi Desktop */}
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
                    <select className="appearance-none h-8 rounded-md border border-gray-200 bg-white pl-3 pr-8 text-[13px] outline-none shadow-sm focus:ring-2 focus:ring-[#004d33]/20 cursor-pointer text-gray-700 font-semibold" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
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

          {/* LIST VERSI MOBILE */}
          <div className="md:hidden flex flex-col gap-4">
            {currentWithdrawals.map((item, index, arr) => {
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
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                          <ArrowUpFromLine size={18} className="text-red-500" />
                        </div>
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-900 text-[15px] leading-tight">{item.nasabah?.name || '-'}</p>
                          <p className="text-[12px] text-gray-500 mt-1">{item.nasabah?.nasabahId} • {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="font-bold text-[15px] text-red-600">
                        - Rp {item.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-[13px] text-gray-500 font-medium">Sisa Saldo</span>
                      <span className="text-[13px] font-medium text-gray-500">Rp. {item.remainingBalance.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Paginasi Mobile */}
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

      {/* MODAL FILTER MOBILE */}
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
              <Button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 bg-[#002b1c] text-white font-medium h-11">Simpan</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATAT PENARIKAN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Catat Penarikan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-10 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[15px] font-semibold text-gray-900">Nama</label>
                  <SearchableSelect options={nasabahOptions} value={selectedNasabahId} onChange={setSelectedNasabahId} placeholder="Pilih nama untuk catat penarikan" />
                </div>
                <div className="space-y-1">
                  <label className="text-[15px] font-semibold text-gray-900">Sisa Saldo</label>
                  <div className="text-[40px] leading-none font-bold text-gray-900 tracking-tight py-2 border-b border-gray-100 pb-6">
                    {selectedNasabah ? currentBalance.toLocaleString('id-ID') : '0'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[15px] font-semibold text-gray-900">Tarik Saldo</label>
                  <Input type="number" placeholder="Masukkan jumlah saldo yang ingin ditarik" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} required className={`h-11 shadow-sm transition-colors text-sm ${isInsufficient ? "border-red-500 focus-visible:ring-red-500 bg-red-50/30 text-red-900" : "border-gray-200 focus-visible:ring-[#004d33]/20"}`} />
                  {isInsufficient && <p className="text-xs font-medium text-red-500 mt-1.5">Jumlah saldo tidak mencukupi</p>}
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="flex-1 md:flex-none font-medium bg-gray-50 border-gray-200 text-gray-700 h-11 border-transparent">Batal</Button>
                <Button type="submit" disabled={isSubmitDisabled} className="flex-1 md:flex-none bg-[#002b1c] hover:bg-[#004d33] text-white disabled:bg-gray-300 font-medium px-8 h-11 shadow-sm transition-colors">
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}