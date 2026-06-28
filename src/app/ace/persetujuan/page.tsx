"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ShieldCheck, Check, X, CalendarClock, Briefcase, FileSignature } from "lucide-react";

export default function ACEPersetujuan() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [performances, setPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Fetch pending leaves
    const { data: leavesData } = await supabase
      .from('ace_leaves')
      .select('*, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Fetch performances awaiting observation/scoring
    const { data: perfData } = await supabase
      .from('ace_performances')
      .select('*, profiles(full_name)')
      .eq('phase', 'pelaksanaan')
      .order('updated_at', { ascending: false });

    if (leavesData) setLeaves(leavesData);
    if (perfData) setPerformances(perfData);
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'principal' || profile?.role === 'tu') {
      fetchData();
    }
  }, [profile]);

  const handleLeaveAction = async (id: string, action: 'approved' | 'rejected') => {
    await supabase.from('ace_leaves').update({ status: action }).eq('id', id);
    fetchData(); // refresh
  };

  const handleScorePerformance = async (id: string, score: number, notes: string) => {
    await supabase.from('ace_performances').update({ 
      phase: 'penilaian',
      principal_score: score,
      observation_notes: notes
    }).eq('id', id);
    fetchData(); // refresh
  };

  if (profile?.role !== 'principal' && profile?.role !== 'tu') {
    return <div className="p-10 text-center font-bold">Akses Ditolak. Khusus Kepala Sekolah & TU.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pusat Persetujuan</h1>
        <p className="text-slate-500 font-medium mt-1">Tinjau permohonan pendidik dan berikan evaluasi akhir</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Kolom Cuti & Dinas Luar */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">Cuti & Dinas Luar</h2>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{leaves.length}</span>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-slate-400 font-medium">Memuat...</p> : leaves.length === 0 ? (
              <Card className="p-8 text-center bg-slate-50 border-dashed shadow-none">
                <p className="text-slate-400 font-medium">Tidak ada permohonan yang menunggu persetujuan.</p>
              </Card>
            ) : leaves.map(leave => (
              <Card key={leave.id} className="p-5 border-2 border-slate-200 rounded-2xl hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${leave.type === 'cuti' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                      {leave.type === 'cuti' ? <CalendarClock className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{leave.profiles.full_name}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">{leave.type.replace('_', ' ')}</p>
                      <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                        <span className="font-bold block text-xs text-slate-400 uppercase mb-1">Alasan:</span>
                        {leave.reason}
                      </div>
                      <p className="text-xs font-bold text-slate-500">{leave.start_date} s/d {leave.end_date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => handleLeaveAction(leave.id, 'rejected')} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors">
                    <X className="w-4 h-4" /> Tolak
                  </button>
                  <button onClick={() => handleLeaveAction(leave.id, 'approved')} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-colors">
                    <Check className="w-4 h-4" /> Setujui
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Kolom E-Kinerja */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><FileSignature className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">Evaluasi E-Kinerja</h2>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{performances.length}</span>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-slate-400 font-medium">Memuat...</p> : performances.length === 0 ? (
              <Card className="p-8 text-center bg-slate-50 border-dashed shadow-none">
                <p className="text-slate-400 font-medium">Belum ada dokumen observasi yang perlu dinilai.</p>
              </Card>
            ) : performances.map(perf => (
              <ScorePerformanceCard key={perf.id} perf={perf} onScore={handleScorePerformance} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component to handle local state for scoring
function ScorePerformanceCard({ perf, onScore }: { perf: any, onScore: (id: string, score: number, notes: string) => void }) {
  const [score, setScore] = useState(85);
  const [notes, setNotes] = useState("");

  return (
    <Card className="p-5 border-2 border-slate-200 rounded-2xl">
      <h3 className="font-bold text-slate-800">{perf.profiles.full_name}</h3>
      <p className="text-xs text-slate-500 font-bold mb-4">Siklus {perf.year}</p>
      
      <div className="text-sm text-slate-600 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-4">
        <span className="font-bold block text-xs text-emerald-600 uppercase mb-2">Target Perencanaan Guru:</span>
        "{perf.plan_document?.target}"
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Observasi (0-100)</label>
          <input type="number" min="0" max="100" value={score} onChange={e => setScore(Number(e.target.value))} className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-black text-slate-800 focus:border-indigo-500 focus:ring-0" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Kepala Sekolah</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Berikan umpan balik yang membangun..." className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-medium text-sm focus:border-indigo-500 focus:ring-0" />
        </div>
        
        <button onClick={() => onScore(perf.id, score, notes)} disabled={!notes} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors disabled:opacity-50">
          Kirim Penilaian
        </button>
      </div>
    </Card>
  );
}
