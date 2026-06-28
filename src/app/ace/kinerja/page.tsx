"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { FileSignature, Upload, FileText, CheckCircle2, Lock, Users, AlertCircle, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function ACEKinerja() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("supervisi");
  
  const [password, setPassword] = useState("");
  const [isSigned, setIsSigned] = useState(false);

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length >= 6) {
      setIsSigned(true);
      alert("Dokumen berhasil disahkan secara digital.");
    } else {
      alert("Password salah atau terlalu pendek.");
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Evaluasi Kinerja</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Performance Evaluation & Supervision Room</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'supervisi', label: 'Supervisi Akademik' },
          { id: 'siswa', label: 'Feedback Siswa' },
          { id: 'koreksi', label: 'Log Koreksi & Beban Kerja' }
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

      {activeTab === 'supervisi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Jadwal Observasi Kelas</h2>
                  <p className="text-xs font-medium text-slate-500">Semester Ganjil 2026/2027</p>
                </div>
                <div className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-md border border-indigo-100">
                  15 Agustus 2026
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-500 mb-1">Status RPP / Lesson Plan</p>
                  <p className="font-bold text-sm text-rose-600 flex items-center justify-center sm:justify-start gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Belum Diunggah
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Wajib diunggah maksimal H-2 (13 Agustus 2026). Jika terlambat, nilai kedisiplinan -10%.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-md shadow-sm w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" /> Upload PDF
                </button>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Rubrik Penilaian Digital (Preview)</h3>
                <div className="space-y-2">
                  {["Kesiapan Materi & Media", "Interaksi dengan Siswa", "Penguasaan Kelas", "Ketepatan Waktu"].map(kriteria => (
                    <div key={kriteria} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white border border-slate-200 rounded-md gap-2">
                      <span className="font-semibold text-slate-700 text-xs">{kriteria}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(skor => (
                          <div key={skor} className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {skor}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 rounded-lg border border-indigo-200 bg-indigo-50/50 sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center shrink-0">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Tanda Tangan BAP</h2>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Digital Signature</p>
                </div>
              </div>
              
              <p className="text-xs font-medium text-slate-600 mb-5 leading-relaxed">
                Masukkan kata sandi akun Anda sebagai pengganti tanda tangan basah setelah observasi selesai untuk menyetujui hasil penilaian.
              </p>
              
              {isSigned ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-emerald-700">Telah Disahkan</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Selesai pada {new Date().toLocaleDateString('id-ID')}</p>
                </div>
              ) : (
                <form onSubmit={handleSign} className="space-y-3">
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password Akun Anda" 
                    className="w-full p-2.5 rounded-md border border-indigo-200 bg-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
                    required
                  />
                  <button className="w-full py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-md shadow-sm hover:bg-indigo-700 transition-colors">
                    Sahkan Dokumen
                  </button>
                </form>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'siswa' && (
        <Card className="p-8 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3 text-center">
              <div className="w-24 h-24 mx-auto relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border-[8px] border-emerald-50" />
                <div className="absolute inset-0 rounded-full border-[8px] border-emerald-500 border-t-transparent -rotate-45" />
                <span className="text-3xl font-black text-slate-800">3.8</span>
              </div>
              <h2 className="text-lg font-bold text-slate-800">Indeks Kepuasan Siswa</h2>
              <p className="text-slate-500 text-xs font-semibold mt-1">Skala Likert (Max 4.0)</p>
            </div>
            
            <div className="w-full md:w-2/3 space-y-5">
              <p className="text-xs font-medium text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
                Data ditarik otomatis dari kuesioner akhir semester yang diisi oleh siswa sebelum mereka dapat melihat rapor. Semua data dijamin anonim oleh sistem.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700">Guru menjelaskan dengan jernih</span>
                    <span className="text-emerald-700">3.9 / 4.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[95%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700">Guru adil dalam memberi nilai</span>
                    <span className="text-emerald-700">3.8 / 4.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[90%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700">Tugas yang diberikan relevan</span>
                    <span className="text-emerald-700">3.7 / 4.0</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[85%]" /></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'koreksi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 rounded-lg border border-rose-200 bg-rose-50 shadow-sm">
            <h2 className="text-sm font-bold text-rose-800 mb-1 uppercase tracking-wider">Peringatan Beban Kerja!</h2>
            <p className="text-rose-600/90 text-xs font-medium mb-4">Sistem mendeteksi ada tugas yang belum Anda koreksi lebih dari 7 hari.</p>
            
            <div className="p-3 bg-white rounded-md border border-rose-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-slate-800 leading-tight mb-0.5">Ulangan Harian Bab 1</p>
                <p className="text-[10px] font-bold text-rose-500 uppercase">Telat 9 Hari (Diinput: 10 Juni)</p>
              </div>
              <button className="px-3 py-1.5 bg-rose-100 text-rose-700 font-bold rounded text-[10px] hover:bg-rose-200 transition-colors">Menuju Kelas</button>
            </div>
          </Card>

          <Card className="p-6 rounded-lg border border-slate-200 flex flex-col justify-center text-center bg-white shadow-sm">
            <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-800 mb-1">Statistik Koreksi</h2>
            <p className="text-slate-500 text-xs font-medium">Rata-rata waktu pengembalian tugas ke siswa: <br/><span className="font-bold text-indigo-600 text-sm mt-1 block">4.5 Hari</span></p>
          </Card>
        </div>
      )}
    </div>
  );
}
