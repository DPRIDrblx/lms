"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Users, BookOpen, UserCircle2, CheckCircle2, Edit2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrincipalMutu() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [performances, setPerformances] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editScoreId, setEditScoreId] = useState<string | null>(null);
  const [tempScore, setTempScore] = useState<string>("");
  const [savingScore, setSavingScore] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch performances
    const { data: perfData } = await supabase
      .from('ace_performances')
      .select('*, profiles(full_name)');
      
    if (perfData) setPerformances(perfData);

    // Fetch student feedbacks (mock aggregation)
    const { data: fbData } = await supabase
      .from('ace_student_feedbacks')
      .select('*, profiles(full_name)');
      
    if (fbData) setFeedbacks(fbData);
    
    setLoading(false);
  };

  const handleSaveScore = async (id: string) => {
    setSavingScore(true);
    const parsedScore = parseInt(tempScore.replace(/\D/g, '')) || 0;
    try {
      await supabase.from('ace_performances').update({ 
        principal_score: parsedScore,
        phase: 'penilaian'
      }).eq('id', id);
      
      setPerformances(prev => prev.map(p => 
        p.id === id ? { ...p, principal_score: parsedScore, phase: 'penilaian' } : p
      ));
      setEditScoreId(null);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingScore(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  if (!profile || profile.role !== 'principal') return null;

  // Aggregate stats
  const underperforming = performances.filter(p => p.principal_score !== null && p.principal_score < 70);
  const excellent = performances.filter(p => p.principal_score !== null && p.principal_score >= 90);
  
  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rapor Mutu Guru</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Academic Quality Monitoring & Supervision</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Excellent Teachers</h2>
          </div>
          <p className="text-3xl font-black text-slate-800">{excellent.length}</p>
          <p className="text-xs text-slate-500 mt-1">Skor Supervisi {'>'}= 90</p>
        </Card>
        
        <Card className="p-6 rounded-lg border border-rose-200 shadow-sm bg-rose-50">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-800">Prioritas Pembinaan</h2>
          </div>
          <p className="text-3xl font-black text-rose-700">{underperforming.length}</p>
          <p className="text-xs text-rose-600 mt-1">Underperforming (Skor {'<'} 70)</p>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Total Kuesioner Siswa</h2>
          </div>
          <p className="text-3xl font-black text-slate-800">{feedbacks.length}</p>
          <p className="text-xs text-slate-500 mt-1">Umpan balik terkumpul semester ini</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Master Scoreboard Supervisi</h2>
              <p className="text-xs text-slate-500 font-medium">Hasil Observasi Kepala Departemen / Kepsek</p>
            </div>
            <BookOpen className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : performances.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada data supervisi.</p>
            ) : performances.map(perf => (
              <div key={perf.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <UserCircle2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{perf.profiles?.full_name}</h3>
                    <p className="text-xs text-slate-500">Fase: <span className="capitalize">{perf.phase}</span></p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  {editScoreId === perf.id ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        className="w-14 p-1.5 border border-indigo-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center" 
                        value={tempScore}
                        onChange={(e) => setTempScore(e.target.value)}
                        disabled={savingScore}
                        placeholder="0-100"
                      />
                      <button disabled={savingScore} onClick={() => handleSaveScore(perf.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition-colors"><Check className="w-4 h-4" /></button>
                      <button disabled={savingScore} onClick={() => setEditScoreId(null)} className="p-1 bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="group flex flex-col items-end cursor-pointer" onClick={() => { setEditScoreId(perf.id); setTempScore(perf.principal_score?.toString() || ""); }}>
                      <div className="flex items-center gap-1">
                        <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                        <div className="text-lg font-black text-slate-800">{perf.principal_score || '-'}</div>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-indigo-500 transition-colors">Skor</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Underperforming Teacher Red-Flag</h2>
              <p className="text-xs text-slate-500 font-medium">Sistem Deteksi Otomatis untuk Tindakan Defensif</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : underperforming.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-emerald-200 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Kualitas Terjaga</p>
                <p className="text-xs mt-1">Tidak ada guru yang terdeteksi underperforming saat ini.</p>
              </div>
            ) : underperforming.map(perf => (
              <div key={perf.id} className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-rose-800 text-sm">{perf.profiles?.full_name}</h3>
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px] font-bold uppercase">Red Flag</span>
                </div>
                <p className="text-xs text-rose-700 mb-4">Skor supervisi berada di bawah standar (Nilai: {perf.principal_score}). Mohon segera jadwalkan pembinaan dengan Wakasek Kurikulum.</p>
                
                <button className="w-full px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded shadow-sm hover:bg-rose-700 transition-colors">
                  Instruksikan Pembinaan Khusus
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
