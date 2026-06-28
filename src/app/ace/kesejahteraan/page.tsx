"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Receipt, Lock, FileText, ScanLine, Wallet, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ACEKesejahteraan() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("slip");
  
  // Slip State
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // Claim State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [claimAmount, setClaimAmount] = useState("");
  const [ocrResult, setOcrResult] = useState<null | 'match' | 'mismatch'>(null);

  // Benefits State
  const [loadingBenefit, setLoadingBenefit] = useState(false);
  const [benefitSaved, setBenefitSaved] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState("");

  useEffect(() => {
    if (profile && activeTab === 'tunjangan') {
      supabase.from('ace_benefits').select('*').eq('teacher_id', profile.id).eq('year', new Date().getFullYear()).single()
        .then(({ data }: any) => {
          if (data) {
            setBenefitSaved(true);
            setSelectedBenefit(data.package_name);
          }
        });
    }
  }, [profile, activeTab]);

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
    setOcrLoading(true);
    setTimeout(() => {
      if (claimAmount === "150000") {
        setOcrResult('match');
      } else {
        setOcrResult('mismatch');
      }
      setOcrLoading(false);
    }, 2000);
  };

  const handleSaveBenefit = async () => {
    if (!profile || !selectedBenefit) return;
    setLoadingBenefit(true);
    try {
      await supabase.from('ace_benefits').insert({
        teacher_id: profile.id,
        year: new Date().getFullYear(),
        package_name: selectedBenefit,
        max_plafond: 10000000
      });
      setBenefitSaved(true);
      alert("Paket tunjangan berhasil dikunci untuk tahun ini.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingBenefit(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kesejahteraan & Finansial</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Compensation, Benefits, & Payroll Room</p>
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
            className={`px-4 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'slip' && (
        <div className="max-w-2xl mx-auto">
          {!unlocked ? (
            <Card className="p-8 rounded-lg border border-slate-200 bg-white text-center shadow-sm relative overflow-hidden">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Dokumen Finansial Terkunci</h2>
              <p className="text-slate-500 font-medium text-xs mb-6 px-6">Masukkan 6-digit PIN keamanan Anda untuk membuka brankas slip gaji digital bulan ini. (Hint: 123456)</p>
              
              <form onSubmit={handleUnlock} className="flex flex-col items-center">
                <input 
                  type="password" 
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g,''))}
                  className="w-40 p-3 text-center tracking-[0.5em] text-xl font-bold rounded-md border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-4" 
                  placeholder="••••••"
                />
                <button className="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700 transition-colors">
                  Buka Brankas
                </button>
              </form>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-800">Brankas Terbuka</h2>
                <button onClick={() => { setUnlocked(false); setPin(""); }} className="text-rose-600 font-semibold text-xs bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-md hover:bg-rose-100 transition-colors">Kunci Kembali</button>
              </div>
              <Card className="p-4 border border-emerald-200 bg-emerald-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-md"><Receipt className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Slip Gaji Juni 2026</h3>
                    <p className="text-xs font-medium text-emerald-700">Ditarik dari Data Kehadiran per 25 Juni</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white text-emerald-700 border border-emerald-200 font-bold text-xs rounded-md shadow-sm hover:bg-emerald-50 transition-colors">Unduh PDF</button>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tunjangan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-6 rounded-lg bg-indigo-600 text-white border-0 shadow-sm relative overflow-hidden">
              <Wallet className="w-8 h-8 text-indigo-300 mb-4" />
              <p className="text-indigo-200 font-bold uppercase tracking-wider text-[10px] mb-1">Plafon Tunjangan 2026</p>
              <h2 className="text-3xl font-bold mb-4">Rp 10.000.000</h2>
              <div className="w-full bg-indigo-900/50 h-2 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-emerald-400 rounded-full" />
              </div>
              <p className="text-[11px] text-indigo-200 mt-2 font-medium">Sisa Plafon: Rp 6.500.000</p>
            </Card>

            <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Pilih Paket Benefit Tahunan</h3>
              {benefitSaved ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                  <p className="text-sm font-bold text-emerald-800 mb-1">Terkunci</p>
                  <p className="text-xs text-emerald-700 font-medium">Anda telah memilih paket: <b>{selectedBenefit}</b> untuk tahun 2026. Perubahan tidak dapat dilakukan hingga tahun depan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="benefit" value="Asuransi Kelas A + Subsidi Kacamata" onChange={(e) => setSelectedBenefit(e.target.value)} className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">Asuransi Kelas A + Subsidi Kacamata</p>
                      <p className="text-[11px] text-slate-500 font-medium">Memotong plafon Rp 3.500.000</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="benefit" value="Subsidi Buku Mengajar & Pelatihan Luar" onChange={(e) => setSelectedBenefit(e.target.value)} className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800">Subsidi Buku Mengajar & Pelatihan Luar</p>
                      <p className="text-[11px] text-slate-500 font-medium">Memotong plafon Rp 2.000.000</p>
                    </div>
                  </label>
                  <button 
                    disabled={!selectedBenefit || loadingBenefit}
                    onClick={handleSaveBenefit}
                    className="w-full py-2.5 bg-slate-800 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-slate-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                  >
                    {loadingBenefit && <Loader2 className="w-3 h-3 animate-spin" />}
                    Kunci Pilihan Tahun Ini
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'klaim' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-1">Klaim Pengobatan (OCR)</h2>
            <p className="text-xs font-medium text-slate-500 mb-5 leading-relaxed">Sistem menggunakan pembaca teks otomatis untuk mencocokkan nominal kuitansi.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Klaim</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input 
                    type="number" 
                    value={claimAmount}
                    onChange={e => setClaimAmount(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold" 
                    placeholder="Contoh: 150000" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Kuitansi Fisik</label>
                <div className="relative p-6 border border-dashed border-slate-300 rounded-md text-center bg-slate-50 cursor-pointer overflow-hidden group hover:bg-slate-100 hover:border-indigo-300 transition-colors">
                  <input type="file" onChange={handleUploadOCR} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center text-indigo-600">
                      <ScanLine className="w-6 h-6 mb-2 animate-bounce" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Membaca Teks (OCR)...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <FileText className="w-6 h-6 mb-2" />
                      <span className="text-xs font-semibold">Pilih Foto Kuitansi (Simulasi OCR)</span>
                    </div>
                  )}
                </div>
              </div>

              {ocrResult === 'match' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">Hasil valid! Nominal Rp {claimAmount} cocok dengan kuitansi fisik. Klaim diteruskan ke TU.</p>
                </div>
              )}

              {ocrResult === 'mismatch' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex gap-2 text-rose-800">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">Ditolak! Sistem mendeteksi Rp 150.000 pada kuitansi, tetapi Anda memasukkan Rp {claimAmount}.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
