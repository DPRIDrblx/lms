"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Activity, AlertCircle, BarChart3, TrendingDown, Target, BrainCircuit } from "lucide-react";
import { useState } from "react";

export default function HoDAkademik() {
  const { profile } = useAuth();
  
  const [showIntervention, setShowIntervention] = useState(false);

  if (!profile || !profile.is_hod) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dasbor Analisis Kesenjangan Nilai</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Departmental Academic Scoreboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-indigo-900 text-white md:col-span-2 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <BarChart3 className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-1">Rata-Rata Departemen</h2>
                <p className="text-4xl font-black mb-1">82.4 <span className="text-lg font-medium text-indigo-300">/ 100</span></p>
                <p className="text-xs text-indigo-200">Berdasarkan Ujian Tengah Semester (Mid-Term)</p>
              </div>
              <div className="p-3 bg-indigo-800 rounded-lg">
                <Target className="w-6 h-6 text-indigo-300" />
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xs font-bold text-indigo-300 uppercase mb-3">Grade Distribution Tracker</h3>
              <div className="flex gap-2 items-end h-24">
                <div className="flex-1 bg-indigo-500 rounded-t opacity-50 hover:opacity-100 transition-opacity" style={{ height: '40%' }}></div>
                <div className="flex-1 bg-indigo-500 rounded-t opacity-50 hover:opacity-100 transition-opacity" style={{ height: '60%' }}></div>
                <div className="flex-1 bg-emerald-500 rounded-t" style={{ height: '100%' }}></div>
                <div className="flex-1 bg-indigo-500 rounded-t opacity-50 hover:opacity-100 transition-opacity" style={{ height: '80%' }}></div>
                <div className="flex-1 bg-rose-500 rounded-t relative group" style={{ height: '30%' }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-rose-600 text-[10px] font-bold px-2 py-1 rounded shadow hidden group-hover:block whitespace-nowrap">
                    10B: 65.2 (Di Bawah KKM)
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 text-[10px] font-bold text-indigo-400 text-center">
                <div className="flex-1">10A</div>
                <div className="flex-1">11A</div>
                <div className="flex-1 text-emerald-300">12A</div>
                <div className="flex-1">11B</div>
                <div className="flex-1 text-rose-300">10B</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-rose-200 shadow-sm bg-rose-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-800">Flagging Standar Deviasi</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-white border border-rose-200 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-slate-800 text-sm">Kelas 10B</p>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-bold uppercase">Anjlok</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">Guru: Bpk. Hermawan</p>
              <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Rata-rata 65.2 (KKM: 75)
              </p>
              <button 
                onClick={() => setShowIntervention(true)}
                className="w-full mt-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded transition-colors"
              >
                Susun Rencana Intervensi
              </button>
            </div>
          </div>
        </Card>
      </div>

      {showIntervention && (
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Intervention Action Plan Form</h2>
              <p className="text-xs text-slate-500 font-medium">Langkah perbaikan akademis terukur (Dilaporkan ke Kepala Sekolah)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Target Kelas</label>
              <input type="text" disabled value="10B (Bpk. Hermawan)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm text-slate-500 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Metode Intervensi</label>
              <select className="w-full p-3 bg-white border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>Pilih metode...</option>
                <option>Kelas Remedial Tambahan</option>
                <option>Perubahan Metode ke Praktikum</option>
                <option>Peer-Tutoring (Tutor Sebaya)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Detail Langkah Perbaikan (Actionable Steps)</label>
              <textarea 
                className="w-full p-3 bg-white border border-slate-200 rounded text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Misal: Akan dilakukan review ulang bab 3 menggunakan alat peraga visual..."
              />
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={() => setShowIntervention(false)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded shadow-sm hover:bg-slate-50">Batal</button>
            <button className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded shadow-sm hover:bg-indigo-700 flex items-center gap-2">
              Kirim ke Pleno Kepsek <Activity className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
