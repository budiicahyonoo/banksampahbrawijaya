'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { api } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Eye, EyeOff } from 'lucide-react'; // Tambahan Eye dan EyeOff

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State untuk toggle password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.access_token) {
        Cookies.set('token', response.data.access_token, { expires: 7 });
        
        const role = response.data.user?.role || response.data.role;

        if (role === 'ADMIN' || role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/nasabah');
        }
      }
    } catch (err: any) {
      // Menangkap pesan spesifik dari backend (termasuk saat akun NONAKTIF)
      setError(err.response?.data?.message || 'Email atau kata sandi tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Pesan Khusus Lupa Kata Sandi
  const waMsgLupaPassword = "Halo%20Admin%20Bank%20Sampah%20Sobat%20Banjar%20Arum%20Berseri%2C%0A%0ASaya%20%5B...Isi%20Nama%20Anda...%5D%20ingin%20meminta%20bantuan%20karena%20saya%20lupa%20kata%20sandi%20dan%20tidak%20bisa%20masuk%20ke%20akun%20saya.%0A%0AMohon%20arahannya%20agar%20saya%20bisa%20mereset%20password%20dan%20login%20kembali.%0A%0ATerima%20kasih.";
  const waLinkLupaPassword = `https://wa.me/6285769042975?text=${waMsgLupaPassword}`;

  // 2. Pesan Umum untuk "Hubungi Admin Desa"
  const waMsgBantuan = "Halo%20Admin%20Bank%20Sampah%20Sobat%20Banjar%20Arum%20Berseri%2C%0A%0ASaya%20%5B...Isi%20Nama%20Anda...%5D%20ingin%20bertanya%20atau%20meminta%20bantuan%20terkait%20aplikasi%20Bank%20Sampah.%0A%0A%5B...Tuliskan%20pertanyaan%2Fkendala%20Anda%20di%20sini...%5D%0A%0ATerima%20kasih.";
  const waLinkBantuan = `https://wa.me/6285769042975?text=${waMsgBantuan}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 relative overflow-hidden">
      
      {/* Ornamen Background (Opsional untuk estetika) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#004d33]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#004d33]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Kiri Atas */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="w-10 h-10 relative shrink-0">
          <Image src="/logo2.png" alt="Logo Bank Sampah" fill sizes="40px" className="object-contain" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-gray-900 leading-tight text-sm">BANK SAMPAH</h2>
          <p className="text-[10px] font-medium text-[#004d33]">Sobat Banjar Arum<br/>Berseri</p>
        </div>
      </div>

      <div className="w-full max-w-[400px] p-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 z-10">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 relative mb-5">
            <Image src="/logo2.png" alt="Logo Bank Sampah" fill sizes="64px" className="object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-[22px] font-bold font-heading text-gray-900 mb-1 tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Masuk ke akun Bank Sampah Anda
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50/80 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">Email</label>
            <Input 
              type="email" 
              placeholder="sitiaminah@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#004d33]/20 focus-visible:border-[#004d33] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#004d33]/20 focus-visible:border-[#004d33] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>


          <div className="flex items-center justify-between text-sm pt-1 pb-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#004d33] focus:ring-[#004d33] cursor-pointer" />
              <span className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Ingat saya</span>
            </label>
            <a 
              href={waLinkLupaPassword}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#004d33] hover:text-[#003322] hover:underline font-semibold transition-colors relative z-10"
            >
              Lupa Kata Sandi?
            </a>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-[15px] font-semibold rounded-xl bg-[#004d33] hover:bg-[#003322] transition-colors shadow-sm"
            disabled={loading}
          >
            {loading ? 'Memvalidasi...' : 'Masuk ke Akun'}
          </Button>
        </form>


        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500 font-medium">
          Belum memiliki akun atau butuh bantuan? <br/>
          <a 
            href={waLinkBantuan}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#004d33] hover:text-[#003322] hover:underline font-bold mt-1 inline-block transition-colors relative z-10"
          >
            Hubungi Admin Desa
          </a>
        </div>
      </div>
    </div>
  );
}