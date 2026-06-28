"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { FileSignature, Upload, FileText, CheckCircle2, Lock, Users, AlertCircle, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function ACEKinerja() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("supervisi");

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Evaluasi Kinerja</h1>
        <p className="text-slate-500 font-medium mt-1">Performance Evaluation & Supervision Room</p>
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
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'supervisi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8 rounded-3xl border-2 border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Jadwal Observasi Kelas</h2>
                  <p className="text-sm font-medium text-slate-500">Semester Ganjil 2026/2027</p>
                </div>
                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 font-black rounded-xl">
                  15 Agustus 2026
                </div>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-500 mb-1">Status RPP / Lesson Plan</p>
                  <p className="font-black text-rose-500 flex items-center justify-center sm:justify-start gap-2">
                    <AlertCircle className="w-5 h-5" /> Belum Diunggah
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Wajib diunggah maksimal H-2 (13 Agustus 2026). Jika terlambat, nilai kedisiplinan -10%.</p>
                </div>
                <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md w-full sm:w-auto flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload PDF
                </button>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-black text-slate-800 mb-4">Rubrik Penilaian Digital (Preview)</h3>
                <div className="space-y-3">
                  {["Kesiapan Materi & Media", "Interaksi dengan Siswa", "Penguasaan Kelas", "Ketepatan Waktu"].map(kriteria => (
                    <div key={kriteria} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                      <span className="font-bold text-slate-600 text-sm">{kriteria}</span>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(skor => (
                          <div key={skor} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
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
            <Card className="p-6 rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 sticky top-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <FileSignature className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-800 mb-2">Tanda Tangan Berita Acara</h2>
              <p className="text-sm font-medium text-slate-600 mb-6">Masukkan kata sandi akun Anda sebagai pengganti tanda tangan basah setelah observasi selesai.</p>
              
              <input type="password" placeholder="Masukkan Password Akun..." className="w-full p-4 rounded-xl border-2 border-indigo-200 bg-white mb-4" />
              <button className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 opacity-50 cursor-not-allowed">
                Sahkan Dokumen
              </button>
              <p className="text-xs text-center text-slate-400 font-bold mt-4">Belum tersedia hingga hari H observasi</p>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'siswa' && (
        <Card className="p-8 rounded-3xl border-2 border-slate-200">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/3 text-center">
              <div className="w-32 h-32 mx-auto relative flex items-center justify-center mb-4">
                <div className="absolute inset-0 rounded-full border-[10px] border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent -rotate-45" />
                <span className="text-4xl font-black text-slate-800">3.8</span>
              </div>
              <h2 className="text-xl font-black text-slate-800">Indeks Kepuasan Siswa</h2>
              <p className="text-slate-500 text-sm font-bold">Skala Likert (Max 4.0)</p>
            </div>
            
            <div className="w-full md:w-2/3 space-y-4">
              <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                Data ditarik otomatis dari kuesioner akhir semester yang diisi oleh siswa sebelum mereka dapat melihat rapor. Semua data dijamin anonim oleh sistem.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-slate-700">Guru menjelaskan dengan jernih</span>
                    <span className="text-emerald-600">3.9 / 4.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[95%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-slate-700">Guru adil dalam memberi nilai</span>
                    <span className="text-emerald-600">3.8 / 4.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[90%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-slate-700">Tugas yang diberikan relevan</span>
                    <span className="text-emerald-600">3.7 / 4.0</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full w-[85%]" /></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'koreksi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 rounded-3xl border-2 border-rose-200 bg-rose-50/50">
            <h2 className="text-xl font-black text-rose-800 mb-2">Peringatan Beban Kerja!</h2>
            <p className="text-rose-600/80 text-sm font-medium mb-6">Sistem mendeteksi ada tugas yang belum Anda koreksi lebih dari 7 hari.</p>
            
            <div className="p-4 bg-white rounded-2xl border border-rose-200 flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-800">Ulangan Harian Bab 1</p>
                <p className="text-xs font-bold text-rose-500">Telat 9 Hari (Diinput: 10 Juni)</p>
              </div>
              <button className="px-4 py-2 bg-rose-100 text-rose-700 font-black rounded-lg text-xs">Menuju Kelas</button>
            </div>
          </Card>

          <Card className="p-8 rounded-3xl border-2 border-slate-200 flex flex-col justify-center text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-black text-slate-800">Statistik Koreksi</h2>
            <p className="text-slate-500 font-medium">Rata-rata waktu pengembalian tugas ke siswa: <span className="font-black text-indigo-600">4.5 Hari</span></p>
          </Card>
        </div>
      )}
    </div>
  );
}
