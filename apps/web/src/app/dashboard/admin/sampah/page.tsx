'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { ChevronDown, Download, Plus, FolderOpen, SquarePen, Trash2, ChevronLeft, ChevronRight, X, Leaf, Banknote, Search, Filter } from 'lucide-react'; // Tambahan Search & Filter icon

interface WasteType {
  id: string;
  name: string;
  category: 'ORGANIK' | 'ANORGANIK';
  pricePerKg: number;
  totalWeight: number;
  totalAmount: number;
}

export default function AdminSampahPage() {
  const [wastes, setWastes] = useState<WasteType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState(''); // Tambahan state pencarian untuk mobile

  // Paginasi State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); // Modal filter mobile
  const [selectedWaste, setSelectedWaste] = useState<WasteType | null>(null);

  // Form Data
  const [formData, setFormData] = useState({ name: '', category: 'ANORGANIK', price: '' });

  const fetchWastes = async () => {
    try {
      const res = await api.get('/waste-types');
      setWastes(res.data);
    } catch (error) {
      toast.error('Gagal memuat data sampah');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWastes(); }, []);

  // Reset Halaman jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, itemsPerPage, searchQuery]);

  // Logika Filter
  const filteredWastes = wastes.filter(w => {
    const matchCategory = categoryFilter === 'Semua' || w.category === categoryFilter;
    const matchSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Logika Paginasi
  const totalItems = filteredWastes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentWastes = filteredWastes.slice(startIndex, endIndex);

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
  const isFormValid = formData.name.trim() !== '' && formData.price !== '' && formData.category !== '';

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    const loadingToast = toast.loading('Menyimpan jenis sampah...');
    try {
      await api.post('/waste-types', {
        name: formData.name,
        category: formData.category,
        pricePerKg: parseFloat(formData.price),
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', category: 'ANORGANIK', price: '' });
      fetchWastes();
      toast.success('Jenis sampah berhasil ditambahkan!', { id: loadingToast });
    } catch (error) {
      toast.error('Gagal menambah jenis sampah', { id: loadingToast });
    }
  };

  const openEditModal = (waste: WasteType) => {
    setSelectedWaste(waste);
    setFormData({ name: waste.name, category: waste.category, price: waste.pricePerKg.toString() });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaste || !isFormValid) return;
    const loadingToast = toast.loading('Memperbarui data...');
    try {
      await api.patch(`/waste-types/${selectedWaste.id}`, {
        name: formData.name,
        category: formData.category,
        pricePerKg: parseFloat(formData.price),
      });
      setIsEditModalOpen(false);
      fetchWastes();
      toast.success('Data sampah diperbarui!', { id: loadingToast });
    } catch (error) {
      toast.error('Gagal mengedit jenis sampah', { id: loadingToast });
    }
  };

  const openDeleteModal = (waste: WasteType) => {
    setSelectedWaste(waste);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWaste) return;
    const loadingToast = toast.loading('Menghapus data...');
    try {
      await api.delete(`/waste-types/${selectedWaste.id}`);
      setIsDeleteModalOpen(false);
      fetchWastes();
      toast.success('Jenis sampah dihapus!', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus jenis sampah', { id: loadingToast });
      setIsDeleteModalOpen(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredWastes.map((w, i) => ({
      'No': i + 1,
      'Jenis Sampah': w.name,
      'Kategori': w.category === 'ANORGANIK' ? 'Anorganik' : 'Organik',
      'Satuan': 'kg',
      'Harga/Satuan (Rp)': w.pricePerKg,
      'Total Sampah (kg)': w.totalWeight,
      'Total Saldo (Rp)': w.totalAmount
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Sampah");
    worksheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.writeFile(workbook, `Master_Sampah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalKeseluruhanSampah = filteredWastes.reduce((sum, w) => sum + w.totalWeight, 0);
  const totalKeseluruhanSaldo = filteredWastes.reduce((sum, w) => sum + w.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      {/* Teks Sapaan Khusus Mobile */}
      <div className="md:hidden">
        <h2 className="text-[22px] font-bold text-gray-900 leading-tight">Sampah</h2>
        <p className="text-[13px] text-gray-500 mt-1">Kelola data jenis sampah yang diterima.</p>
      </div>

      {/* --- BLOK 1: TOOLBAR VERSI DESKTOP --- */}
      <div className="hidden md:flex justify-between items-center bg-white p-2 rounded-lg mb-2">
        <div className="relative w-56">
          <select 
            className="appearance-none w-full h-11 rounded-md border border-gray-200 bg-white pl-4 pr-10 text-sm outline-none shadow-sm focus:ring-2 focus:ring-[#004d33]/20 cursor-pointer text-gray-600 font-medium"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="Semua">Semua Sampah</option>
            <option value="ORGANIK">Organik</option>
            <option value="ANORGANIK">Anorganik</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportExcel} className="flex gap-2 items-center border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 h-11">
            <Download size={16} /> Eksport
          </Button>
          <Button onClick={() => {
            setFormData({ name: '', category: 'ANORGANIK', price: '' });
            setIsAddModalOpen(true);
          }} className="flex gap-2 items-center bg-[#004d33] hover:bg-[#003322] text-white shadow-sm h-11">
            <Plus size={16} /> Tambah jenis sampah
          </Button>
        </div>
      </div>

      {/* --- BLOK 2: TOOLBAR VERSI MOBILE --- */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            type="text"
            placeholder="Cari jenis sampah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-12 bg-gray-100 border-transparent focus-visible:ring-[#004d33]/20 rounded-[10px]"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormData({ name: '', category: 'ANORGANIK', price: '' }); setIsAddModalOpen(true); }} className="flex-1 gap-2 bg-[#002b1c] hover:bg-[#004d33] text-white shadow-sm h-11 rounded-[8px] font-medium text-sm">
            <Plus size={16} /> Tambah Sampah
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="flex-1 gap-2 border-gray-200 shadow-sm text-[#002b1c] bg-white h-11 rounded-[8px] font-medium text-sm">
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
      ) : filteredWastes.length === 0 ? (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-16 md:p-24 bg-white/50">
          <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 mb-4">
            <FolderOpen size={24} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Belum ada data jenis sampah</h3>
          <p className="text-sm text-gray-500 mb-6 text-center">Tambah jenis sampah untuk menampilkan<br/>data ditabel</p>
          <Button onClick={() => {
            setFormData({ name: '', category: 'ANORGANIK', price: '' });
            setIsAddModalOpen(true);
          }} className="flex gap-2 items-center bg-[#002b1c] hover:bg-[#004d33] md:bg-[#004d33] text-white h-11">
            <Plus size={16} /> Tambah Jenis Sampah
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
                      <th className="px-6 py-4 font-semibold text-[13px] w-16">No</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Jenis Sampah</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Kategori</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Satuan</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Harga/Satuan (Rp)</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Total Sampah (kg)</th>
                      <th className="px-6 py-4 font-semibold text-[13px]">Total Saldo (Rp)</th>
                      <th className="px-6 py-4 font-semibold text-[13px] text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentWastes.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">{startIndex + idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 capitalize">{item.category.toLowerCase()}</td>
                        <td className="px-6 py-4">kg</td>
                        <td className="px-6 py-4">Rp. {item.pricePerKg.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 font-medium">{item.totalWeight}kg</td>
                        <td className="px-6 py-4 font-medium text-gray-900">Rp. {item.totalAmount.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => openEditModal(item)} 
                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-100 transition-colors inline-flex mr-2" 
                            title="Edit Sampah"
                          >
                            <SquarePen size={16} />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(item)} 
                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors inline-flex" 
                            title="Hapus Sampah"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
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

            {/* Banner Summary Desktop Sesuai Figma */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-5 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#004d33] rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                  <Leaf size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 font-semibold mb-0.5">Total Keseluruhan Sampah (kg)</p>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{totalKeseluruhanSampah.toLocaleString('id-ID')} kg</h3>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-5 flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0">
                  <Banknote size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 font-semibold mb-0.5">Total Keseluruhan Saldo (Rp)</p>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Rp. {totalKeseluruhanSaldo.toLocaleString('id-ID')}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* LIST VERSI MOBILE */}
          <div className="md:hidden flex flex-col gap-4">
            {currentWastes.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-[12px] border border-gray-200 shadow-sm">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-[16px] leading-tight mb-1">{item.name}</h3>
                    <p className="text-[13px] text-gray-500 capitalize">{item.category.toLowerCase()} • kg</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <SquarePen size={18} />
                    </button>
                    <button onClick={() => openDeleteModal(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Harga/satuan (Rp)</p>
                    <p className="font-bold text-gray-900">Rp. {item.pricePerKg.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Total Sampah (kg)</p>
                    <p className="font-bold text-gray-900">{item.totalWeight}kg</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium mb-1">Total Saldo (Rp)</p>
                    <p className="font-bold text-gray-900">Rp. {item.totalAmount.toLocaleString('id-ID')}</p>
                  </div>
                </div>

              </div>
            ))}

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
            <div className="p-6 pb-10 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2.5">
                <label className="text-[14px] font-semibold text-gray-900">Sampah</label>
                <div className="relative">
                  <select 
                    className="appearance-none h-11 w-full rounded-md border border-gray-200 bg-white pl-4 pr-10 text-sm outline-none shadow-sm focus:ring-1 focus:ring-[#004d33] cursor-pointer text-gray-900 font-medium"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="Semua">Semua Sampah</option>
                    <option value="ORGANIK">Organik</option>
                    <option value="ANORGANIK">Anorganik</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
              <Button variant="outline" onClick={() => setIsMobileFilterOpen(false)} className="flex-1 font-medium bg-gray-50 border-gray-200 text-gray-700 h-11">Batal</Button>
              <Button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 bg-[#002b1c] hover:bg-[#004d33] text-white font-medium h-11">Simpan</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-xl md:text-lg font-bold text-gray-900">{isEditModalOpen ? 'Edit Harga' : 'Tambah Jenis Sampah'}</h2>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 pb-10 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[15px] font-semibold text-gray-900">Jenis Sampah</label>
                  <Input placeholder="Contoh: Plastik" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`h-11 shadow-sm border-gray-200 text-[14px] focus-visible:ring-[#004d33]/20 ${isEditModalOpen ? 'bg-gray-50 text-gray-500' : ''}`} required />
                </div>
                <div className="space-y-3">
                  <label className="text-[15px] font-semibold text-gray-900">Kategori sampah</label>
                  <div className="flex flex-col gap-4 border border-gray-200 p-4 rounded-lg shadow-sm">
                    <label className={`flex items-center gap-3 ${isEditModalOpen ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="radio" name="category" value="ORGANIK" checked={formData.category === 'ORGANIK'} onChange={e => setFormData({...formData, category: 'ORGANIK'})} disabled={isEditModalOpen} className="w-4 h-4 text-[#004d33] focus:ring-[#004d33]" />
                      <span className="text-[14px] font-medium text-gray-900">Organik</span>
                    </label>
                    <label className={`flex items-center gap-3 ${isEditModalOpen ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="radio" name="category" value="ANORGANIK" checked={formData.category === 'ANORGANIK'} onChange={e => setFormData({...formData, category: 'ANORGANIK'})} disabled={isEditModalOpen} className="w-4 h-4 text-[#004d33] focus:ring-[#004d33]" />
                      <span className="text-[14px] font-medium text-gray-900">Anorganik</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[15px] font-semibold text-gray-900">Harga</label>
                  <div className="relative">
                    <Input type="number" placeholder="5.000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="h-11 shadow-sm border-gray-200 text-[14px] focus-visible:ring-[#004d33]/20 pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400 font-medium">/kg</span>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1">{isEditModalOpen ? 'Edit harga dari jenis sampah' : 'Masukkan harga dari jenis sampah'}</p>
                </div>
              </div>
              
              <div className="px-6 py-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
                <Button variant="outline" type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 md:flex-none font-medium bg-gray-50 border-gray-200 text-gray-700 h-11">Batal</Button>
                <Button type="submit" disabled={!isFormValid} className="flex-1 md:flex-none bg-[#002b1c] hover:bg-[#004d33] text-white disabled:bg-gray-300 font-medium px-8 h-11 shadow-sm transition-colors">
                  {isEditModalOpen ? 'Simpan Perubahan' : 'Simpan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus (Pop-up di Tengah) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] md:max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden p-6 relative text-center">
            
            {/* Judul dipindah ke atas */}
            <h3 className="text-[18px] font-bold text-gray-900 mb-4">Hapus Jenis Sampah</h3>
            
            {/* Ikon di tengah */}
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 size={24} />
            </div>
            
            {/* Teks dirapikan agar tidak berulang/terlalu panjang */}
            <p className="text-[14px] font-semibold text-gray-900 mb-1">
              Anda yakin ingin menghapus jenis sampah ini?
            </p>
            <p className="text-[13px] text-gray-500 mb-8 leading-relaxed px-2">
              Data yang sudah dihapus tidak dapat dikembalikan.
            </p>
            
            {/* Tombol ditukar: Batal (Kiri), Hapus (Kanan) */}
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 font-semibold h-11 border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-[8px]">
                Batal
              </Button>
              <Button onClick={handleDeleteConfirm} className="flex-1 bg-[#E50000] hover:bg-red-700 text-white font-semibold h-11 rounded-[8px]">
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}