"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Activity, AlertTriangle, CheckCircle2, XCircle, Search, FileSymlink } from "lucide-react";
import { useEffect, useState } from "react";

export default function AssessmentValidasi() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [remedials, setRemedials] = useState<any[]>([]);
  const [classAverages, setClassAverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending remedials
    const { data: rData } = await supabase
      .from('ace_remedial_requests')
      .select('*, profiles(full_name)')
      .eq('status', 'pending');
      
    if (rData) setRemedials(rData);

    // Fetch grades for anomaly detection (bell curve simulation)
    const { data: gData } = await supabase.from('ace_student_grades').select('class_name, score');
    if (gData && gData.length > 0) {
      const classMap = new Map();
      gData.forEach((g: any) => {
        if (!classMap.has(g.class_name)) {
          classMap.set(g.class_name, { sum: 0, count: 0, name: g.class_name });
        }
        const c = classMap.get(g.class_name);
        c.sum += g.score;
        c.count += 1;
      });
      
      const avgs = Array.from(classMap.values()).map((c: any) => ({
        name: c.name,
        average: Math.round(c.sum / c.count),
        count: c.count
      })).sort((a: any, b: any) => b.average - a.average);
      
      setClassAverages(avgs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleRemedial = async (id: string, action: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await supabase.from('ace_remedial_requests').update({ status: action }).eq('id', id);
      setRemedials(prev => prev.filter(r => r.id !== id));
      alert(`Remedial berhasil di-${action === 'approved' ? 'setujui' : 'tolak'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!profile || !profile.is_assessment_head) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Validasi & Anomali Nilai</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Anomaly Detection & Remedial Authorization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Distribusi Kurva Normal</h2>
              <p className="text-xs text-slate-500">Deteksi Anomali Ekstrem (Terlalu Tinggi/Rendah)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Menghitung rata-rata...</p>
            ) : classAverages.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data nilai masuk.</p>
            ) : (
              classAverages.map((c, idx) => {
                const isAnomaly = c.average > 95 || c.average < 70;
                return (
                  <div key={idx} className={`p-4 rounded-lg border ${isAnomaly ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'} flex items-center justify-between`}>
                    <div>
                      <h3 className={`font-bold ${isAnomaly ? 'text-rose-700' : 'text-slate-800'}`}>{c.name}</h3>
                      <p className={`text-xs ${isAnomaly ? 'text-rose-600' : 'text-slate-500'}`}>Rata-rata: {c.average} (Terdapat {c.count} entri)</p>
                    </div>
                    {isAnomaly ? (
                      <button className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-white px-3 py-1.5 rounded shadow-sm hover:bg-rose-100 border border-rose-200 transition-colors">
                        <Search className="w-3.5 h-3.5" /> Investigasi Sampel
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">Normal</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileSymlink className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Otorisasi Remedial Ekstrem</h2>
              <p className="text-xs text-slate-500">Validasi bukti pindaian sebelum override nilai akhir</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Memuat permintaan...</p>
            ) : remedials.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada pengajuan perbaikan nilai.</p>
            ) : (
              remedials.map((r) => (
                <div key={r.id} className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col gap-3 hover:border-amber-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800">{r.student_name}</h3>
                      <p className="text-xs text-slate-500">Subjek: {r.subject} | Guru: {r.profiles?.full_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Lama</p>
                        <p className="text-sm font-black text-rose-600">{r.old_score}</p>
                      </div>
                      <div className="w-4 h-px bg-slate-300"></div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Baru</p>
                        <p className="text-sm font-black text-emerald-600">{r.proposed_score}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                    <button className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                      <Search className="w-3.5 h-3.5" /> Lihat Scan Bukti Ujian
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRemedial(r.id, 'rejected')}
                        disabled={processing === r.id}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded disabled:opacity-50"
                        title="Tolak"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemedial(r.id, 'approved')}
                        disabled={processing === r.id}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sahkan
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
