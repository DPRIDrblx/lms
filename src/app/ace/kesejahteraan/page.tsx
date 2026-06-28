"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Receipt, Lock, FileText, ScanLine, Wallet, CheckCircle2, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function ACEKesejahteraan() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("slip");
  
  // Slip State
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // Claim State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [ocrResult, setOcrResult] = useState<null | 'match' | 'mismatch'>(null);

  if (!profile) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "123456") {
      setUnlocked(true);
    } else {
      alert("PIN Salah! Coba lagi (Hint: 123456)");
    }
  };

  const handleUploadOCR = (e: any) => {
    // Simulate OCR Scan
    setOcrLoading(true);
    setTimeout(() => {
      // Mock: If user typed 150000, it matches the fake scanned receipt
      if (claimAmount === "150000") {
        setOcrResult('match');
      } else {
        setOcrResult('mismatch');
      }
      setOcrLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kesejahteraan & Finansial</h1>
        <p className="text-slate-500 font-medium mt-1">Compensation, Benefits, & Payroll Room</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'slip', label: 'E-Slip Gaji (PIN)' },
          { id: 'tunjangan', label: 'Pilihan Paket Tunjangan' },
          { id: 'klaim', label: 'Klaim Pengobatan (OCR)' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'slip' && (
        <div className="max-w-3xl mx-auto">
          {!unlocked ? (
            <Card className="p-10 rounded-3xl border-0 bg-slate-900 text-white shadow-2xl text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]" />
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-slate-700 shadow-inner">
                <Lock className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black mb-2">Dokumen Finansial Terkunci</h2>
              <p className="text-slate-400 font-medium text-sm mb-8 px-6">Masukkan 6-digit PIN keamanan Anda untuk membuka brankas slip gaji digital bulan ini. (Hint: 123456)</p>
              
              <form onSubmit={handleUnlock} className="flex flex-col items-center">
                <input 
                  type="password" 
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g,''))}
                  className="w-48 p-4 text-center tracking-[0.5em] text-2xl font-black rounded-xl bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 text-white mb-6" 
                  placeholder="••••••"
                />
                <button className="px-8 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700">
                  Buka Brankas
                </button>
              </form>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">Brankas Terbuka</h2>
                <button onClick={() => { setUnlocked(false); setPin(""); }} className="text-rose-500 font-bold text-sm bg-rose-50 px-4 py-2 rounded-lg">Kunci Kembali</button>
              </div>
              <Card className="p-6 border-2 border-emerald-200 bg-emerald-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl"><Receipt className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-slate-800">Slip Gaji Juni 2026</h3>
                    <p className="text-sm font-medium text-emerald-600">Ditarik dari Data Kehadiran per 25 Juni</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl shadow-sm hover:bg-emerald-100">Unduh PDF</button>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tunjangan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-8 rounded-3xl bg-indigo-600 text-white border-0 relative overflow-hidden">
              <Wallet className="w-12 h-12 text-indigo-300 mb-4" />
              <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">Plafon Tunjangan 2026</p>
              <h2 className="text-4xl font-black mb-4">Rp 10.000.000</h2>
              <div className="w-full bg-indigo-900/50 h-3 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-emerald-400 rounded-full" />
              </div>
              <p className="text-xs text-indigo-200 mt-2 font-medium">Sisa Plafon: Rp 6.500.000</p>
            </Card>

            <Card className="p-6 rounded-2xl border-2 border-slate-200">
              <h3 className="font-black text-slate-800 mb-4">Pilih Paket Benefit Anda</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600" />
                  <div>
                    <p className="font-bold text-slate-800">Asuransi Kelas A + Subsidi Kacamata</p>
                    <p className="text-xs text-slate-500 font-medium">Memotong plafon Rp 3.500.000</p>
                  </div>
                </label>
                <label className="flex items-start gap-4 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded text-indigo-600" />
                  <div>
                    <p className="font-bold text-slate-800">Subsidi Buku Mengajar & Pelatihan Luar</p>
                    <p className="text-xs text-slate-500 font-medium">Memotong plafon Rp 2.000.000</p>
                  </div>
                </label>
              </div>
              <button className="w-full mt-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700">Kunci Pilihan Tahun Ini</button>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'klaim' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 rounded-3xl border-2 border-slate-200">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Klaim Pengobatan (OCR)</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">Sistem menggunakan teknologi pembaca teks untuk mencocokkan nominal yang Anda ketik dengan angka asli di kuitansi fisik.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nominal Klaim (Ketikan Manual)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                  <input 
                    type="number" 
                    value={claimAmount}
                    onChange={e => setClaimAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 font-bold" 
                    placeholder="Contoh: 150000" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Foto Kuitansi Fisik</label>
                <div className="relative p-6 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 cursor-pointer overflow-hidden group">
                  <input type="file" onChange={handleUploadOCR} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center text-indigo-500">
                      <ScanLine className="w-8 h-8 mb-2 animate-bounce" />
                      <span className="text-xs font-black uppercase tracking-widest">Membaca Teks (OCR)...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <FileText className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold">Klik untuk Pilih Foto Kuitansi</span>
                    </div>
                  )}
                </div>
              </div>

              {ocrResult === 'match' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">Hasil OCR Valid! Nominal Rp {claimAmount} cocok dengan kuitansi fisik. Klaim diteruskan ke TU Keuangan.</p>
                </div>
              )}

              {ocrResult === 'mismatch' && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 text-rose-700">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">Ditolak! Sistem mendeteksi angka di foto kuitansi adalah Rp 150.000, sedangkan Anda mengetik Rp {claimAmount}. Silakan perbaiki.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
