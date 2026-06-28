"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Activity, AlertCircle, BarChart3, TrendingDown, Target, BrainCircuit } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function HoDAkademik() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [showIntervention, setShowIntervention] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [classAverages, setClassAverages] = useState<{className: string, avg: number, teacher: string}[]>([]);
  const [deptAvg, setDeptAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.from('ace_student_grades').select('*, profiles(full_name)');
      
      if (data && data.length > 0) {
        setGrades(data);
        
        // Calculate dept average
        const totalScore = data.reduce((sum: number, curr: any) => sum + curr.score, 0);
        setDeptAvg(Math.round((totalScore / data.length) * 10) / 10);

        // Group by class
        const classMap = new Map();
        data.forEach((g: any) => {
          if (!classMap.has(g.class_name)) {
            classMap.set(g.class_name, { sum: 0, count: 0, teacher: g.profiles?.full_name || 'Unknown' });
          }
          const c = classMap.get(g.class_name);
          c.sum += g.score;
          c.count += 1;
        });

        const averages = Array.from(classMap.entries()).map(([className, stats]) => ({
          className,
          avg: Math.round((stats.sum / stats.count) * 10) / 10,
          teacher: stats.teacher
        }));
        
        setClassAverages(averages);
      }
      setLoading(false);
    };

    if (profile) fetchData();
  }, [profile]);

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
                <p className="text-4xl font-black mb-1">{deptAvg} <span className="text-lg font-medium text-indigo-300">/ 100</span></p>
                <p className="text-xs text-indigo-200">Berdasarkan Ujian Tengah Semester (Mid-Term)</p>
              </div>
              <div className="p-3 bg-indigo-800 rounded-lg">
                <Target className="w-6 h-6 text-indigo-300" />
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xs font-bold text-indigo-300 uppercase mb-3">Grade Distribution Tracker</h3>
              {classAverages.length > 0 ? (
                <>
                  <div className="flex gap-2 items-end h-24">
                    {classAverages.map((c, i) => (
                      <div key={i} className={`flex-1 rounded-t relative group transition-opacity ${c.avg < 75 ? 'bg-rose-500' : (c.avg > 85 ? 'bg-emerald-500' : 'bg-indigo-500 opacity-70 hover:opacity-100')}`} style={{ height: `${c.avg}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow hidden group-hover:block whitespace-nowrap z-50">
                          {c.className}: {c.avg} {c.avg < 75 && '(Di Bawah KKM)'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2 text-[10px] font-bold text-center">
                    {classAverages.map((c, i) => (
                      <div key={i} className={`flex-1 ${c.avg < 75 ? 'text-rose-300' : (c.avg > 85 ? 'text-emerald-300' : 'text-indigo-400')}`}>{c.className}</div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-indigo-300">Belum ada data nilai.</p>
              )}
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
            {classAverages.filter(c => c.avg < 75).length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3">Tidak ada kelas di bawah KKM.</p>
            ) : classAverages.filter(c => c.avg < 75).map((c, i) => (
              <div key={i} className="p-3 bg-white border border-rose-200 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <p className="font-bold text-slate-800 text-sm">Kelas {c.className}</p>
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-bold uppercase">Anjlok</span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Guru: {c.teacher}</p>
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Rata-rata {c.avg} (KKM: 75)
                </p>
                <button 
                  onClick={() => setShowIntervention(true)}
                  className="w-full mt-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded transition-colors"
                >
                  Susun Rencana Intervensi
                </button>
              </div>
            ))}
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
