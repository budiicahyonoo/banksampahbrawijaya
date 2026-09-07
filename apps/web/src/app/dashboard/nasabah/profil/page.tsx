'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Pencil, X, Edit3 } from 'lucide-react';
import Image from 'next/image';

export default function NasabahProfil() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  
  // State Mode Edit Global
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Input
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  
  // State Foto Profil
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api.get('/nasabah/profile').then(res => {
      const userData = res.data.user;
      setProfile(userData);
      setPhoneInput(userData.phone || '');
      setAddressInput(userData.address || '');
      setPreviewImage(userData.avatar || null);
    }).catch(console.error);
  };

  const validatePhone = (phone: string) => /^[0-9]{9,}$/.test(phone);
  const isPhoneValid = validatePhone(phoneInput);
  const isAddressValid = addressInput.trim() !== '';
  const isFormValid = isPhoneValid && isAddressValid;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const triggerSaveModal = () => {
    if (!isFormValid) return;
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    setIsModalOpen(false);
    const loadingToast = toast.loading('Memperbarui profil...');
    
    try {
      let base64Avatar = profile.avatar;
      
      if (selectedFile) {
        base64Avatar = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      const payload = { 
        phone: phoneInput, 
        address: addressInput,
        avatar: base64Avatar 
      };
      
      await api.patch('/nasabah/profile', payload);
      
      setProfile((prev: any) => ({ ...prev, ...payload }));
      setPreviewImage(base64Avatar);
      setIsEditing(false);
      setSelectedFile(null);
      
      toast.success('Profil berhasil diperbarui!', { id: loadingToast });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal memperbarui profil';
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg, { id: loadingToast });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (!profile) return <div className="p-8 text-center text-gray-500">Memuat Profil...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-10 relative">
      
      {/* Input File Bersama (Desktop & Mobile) */}
      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

      {/* --- BLOK 1: VERSI DESKTOP (Original, disembunyikan di Mobile) --- */}
      <div className="hidden md:block">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* KARTU KIRI: FOTO PROFIL */}
          <div className="w-full md:w-80 bg-white p-8 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.04)] flex flex-col items-center">
            <div className="relative mb-5">
              <div className="w-32 h-32 bg-[#F5F7F0] rounded-full overflow-hidden border-4 border-white shadow-sm flex items-center justify-center text-4xl text-gray-500 font-bold relative">
                {previewImage ? (
                  <Image src={previewImage} alt="Profile" fill className="object-cover" />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
              {isEditing && (
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 w-8 h-8 bg-[#004d33] rounded-full border-2 border-white flex items-center justify-center text-white hover:bg-[#003322] transition-colors shadow-md">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <h3 className="font-bold text-lg text-gray-900 text-center">{profile.name}</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">{profile.nasabahId}</p>
          </div>

          {/* KARTU KANAN: INFORMASI PRIBADI */}
          <div className="flex-1 w-full bg-white p-8 rounded-xl border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900">Informasi Pribadi</h2>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={() => { setIsEditing(false); setPhoneInput(profile.phone); setAddressInput(profile.address); setPreviewImage(profile.avatar); }} variant="outline" className="h-9 px-4 text-gray-600 border-gray-200">
                    Batal
                  </Button>
                  <Button onClick={triggerSaveModal} disabled={!isFormValid} className="h-9 px-4 bg-[#004d33] hover:bg-[#003322] text-white disabled:bg-gray-300">
                    Simpan Perubahan
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="h-9 px-4 bg-[#004d33] hover:bg-[#003322] text-white gap-2">
                  <Pencil size={14} /> Edit
                </Button>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">ID Nasabah</label>
                <p className="font-medium text-gray-900 bg-gray-50/50 p-2.5 rounded-md border border-transparent">{profile.nasabahId}</p>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Nama Lengkap</label>
                <p className="font-medium text-gray-900 bg-gray-50/50 p-2.5 rounded-md border border-transparent">{profile.name}</p>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Alamat Email</label>
                <p className="font-medium text-gray-900 bg-gray-50/50 p-2.5 rounded-md border border-transparent">{profile.email}</p>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Nomor Telepon</label>
                {isEditing ? (
                  <div>
                    <Input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className={`h-11 shadow-sm ${!isPhoneValid && phoneInput.length > 0 ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200 focus-visible:ring-[#004d33]/20'}`} />
                    {!isPhoneValid && phoneInput.length > 0 && <p className="text-xs text-red-500 mt-1.5">Minimal 9 digit & hanya angka</p>}
                  </div>
                ) : (
                  <p className="font-medium text-gray-900 border-b border-gray-100 pb-2.5 px-2.5">{profile.phone || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Alamat Tempat Tinggal</label>
                {isEditing ? (
                  <div>
                    <textarea value={addressInput} onChange={e => setAddressInput(e.target.value)} className={`w-full min-h-[100px] p-3 text-sm border rounded-md focus:outline-none focus:ring-2 resize-y shadow-sm ${!isAddressValid && addressInput.length > 0 ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#004d33]/20'}`} />
                    {!isAddressValid && addressInput.length > 0 && <p className="text-xs text-red-500 mt-1">Alamat tidak boleh kosong</p>}
                  </div>
                ) : (
                  <p className="font-medium text-gray-900 border-b border-gray-100 pb-2.5 px-2.5">{profile.address || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => { Cookies.remove('token'); router.push('/auth/login'); }} className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 h-10 rounded-lg">
            Keluar Akun
          </Button>
        </div>
      </div>

      {/* --- BLOK 2: VERSI MOBILE (Sesuai Desain Baru, disembunyikan di Desktop) --- */}
      <div className="md:hidden flex flex-col pt-2">
        {/* KARTU FOTO PROFIL */}
        <div className="bg-white p-6 rounded-[16px] border border-gray-200 shadow-sm flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 bg-[#F5F7F0] rounded-full overflow-hidden flex items-center justify-center text-3xl text-gray-500 font-bold relative border border-gray-100">
              {previewImage ? (
                <Image src={previewImage} alt="Profile" fill className="object-cover" />
              ) : (
                getInitials(profile.name)
              )}
            </div>
            {isEditing && (
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 bg-[#004d33] rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                <Pencil size={14} />
              </button>
            )}
          </div>
          <h3 className="font-bold text-[18px] text-gray-900 text-center leading-tight">{profile.name}</h3>
          <p className="text-[13px] text-gray-500 font-medium mt-1">{profile.nasabahId}</p>
        </div>

        {/* HEADER INFORMASI PRIBADI */}
        <div className="flex justify-between items-center mt-6 mb-3 px-1">
          <h2 className="text-[17px] font-bold text-gray-900">Informasi Pribadi</h2>
          {isEditing ? (
            <Button onClick={triggerSaveModal} disabled={!isFormValid} className="h-8 px-4 bg-[#004d33] hover:bg-[#003322] text-white rounded-md text-xs font-medium disabled:bg-gray-300">
              Simpan
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="h-8 px-3 bg-[#004d33] hover:bg-[#003322] text-white rounded-md text-xs font-medium flex items-center gap-1.5">
              <Edit3 size={14} /> Edit
            </Button>
          )}
        </div>

        {/* KARTU INFORMASI */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <p className="text-[12px] text-gray-500 mb-1 font-medium">ID Nasabah</p>
            <p className={`font-semibold text-[15px] ${isEditing ? 'text-gray-400' : 'text-gray-900'}`}>{profile.nasabahId}</p>
          </div>
          <div className="p-4 border-b border-gray-100">
            <p className="text-[12px] text-gray-500 mb-1 font-medium">Nama</p>
            <p className={`font-semibold text-[15px] ${isEditing ? 'text-gray-400' : 'text-gray-900'}`}>{profile.name}</p>
          </div>
          <div className="p-4 border-b border-gray-100">
            <p className="text-[12px] text-gray-500 mb-1 font-medium">Email</p>
            <p className={`font-semibold text-[15px] ${isEditing ? 'text-gray-400' : 'text-gray-900'}`}>{profile.email}</p>
          </div>

          {/* Nomor Telepon */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-[12px] text-gray-500 mb-1 font-medium">Nomor Telepon</p>
            {isEditing ? (
              <div>
                <Input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className="h-9 mt-1 text-sm border-gray-300 rounded-md font-semibold text-gray-900 px-3" />
                {!isPhoneValid && phoneInput.length > 0 && <p className="text-xs text-red-500 mt-1">Tidak valid</p>}
              </div>
            ) : (
              <p className="font-semibold text-[15px] text-gray-900">{profile.phone || '-'}</p>
            )}
          </div>

          {/* Alamat */}
          <div className="p-4">
            <p className="text-[12px] text-gray-500 mb-1 font-medium">Alamat</p>
            {isEditing ? (
              <div>
                <textarea value={addressInput} onChange={e => setAddressInput(e.target.value)} className="w-full min-h-[60px] p-3 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#004d33] font-semibold text-gray-900" />
                {!isAddressValid && addressInput.length > 0 && <p className="text-xs text-red-500 mt-1">Wajib diisi</p>}
              </div>
            ) : (
              <p className="font-semibold text-[15px] text-gray-900 leading-snug">{profile.address || '-'}</p>
            )}
          </div>
        </div>

        {/* Tombol Keluar Mobile */}
        <div className="mt-6 mb-2">
          <Button onClick={() => { Cookies.remove('token'); router.push('/auth/login'); }} className="w-full bg-[#E50000] hover:bg-red-700 text-white font-semibold py-6 h-auto rounded-[10px] text-[16px]">
            Keluar
          </Button>
        </div>
      </div>

      {/* Modal Konfirmasi Edit (Berlaku untuk Desktop & Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-[340px] md:max-w-[400px] bg-white rounded-2xl shadow-xl overflow-hidden p-6 relative text-center">
            
            {/* Header Modal - Tanpa Border Bawah Sesuai Gambar 3 */}
            <h3 className="text-xl font-bold text-gray-900 mb-5 text-center">Edit Profil</h3>
            
            <div className="w-14 h-14 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-200">
              <Pencil size={24} />
            </div>
            
            <p className="text-[15px] font-bold text-gray-900 mb-1 leading-snug">Anda yakin ingin mengubah data profil anda</p>
            <p className="text-[13px] text-gray-500 mb-8">Data yang diubah akan tersimpan</p>
            
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 font-semibold h-11 border-gray-200 bg-gray-50 text-gray-700 rounded-lg">Batal</Button>
              <Button onClick={handleUpdate} className="flex-1 bg-[#004d33] hover:bg-[#003322] text-white font-semibold h-11 rounded-lg">Simpan</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}