"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { FileSignature, CheckCircle2, ChevronRight, Target, Users, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ACEKinerja() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for Phase 1 Form
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (!profile) return;
    const fetchPerformance = async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase.from('ace_performances').select('*').eq('teacher_id', profile.id).eq('year', year).maybeSingle();
      
      if (data) {
        setPerformance(data);
      } else {
        // Create initial record
        const { data: newData } = await supabase.from('ace_performances').insert({
          teacher_id: profile.id,
          year: year,
          phase: 'perencanaan',
          plan_document: { target: "" }
        }).select().single();
        setPerformance(newData);
      }
      setLoading(false);
    };
    fetchPerformance();
  }, [profile, supabase]);

  const savePerencanaan = async () => {
    if (!performance) return;
    setLoading(true);
    const { data } = await supabase.from('ace_performances')
      .update({ plan_document: { target }, phase: 'pelaksanaan' })
      .eq('id', performance.id)
      .select().single();
    if (data) setPerformance(data);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 font-bold text-slate-500">Memuat data kinerja...</div>;

  const currentPhase = performance?.phase || 'perencanaan';
  const steps = [
    { id: 'perencanaan', title: 'Perencanaan', desc: 'Isi Sasaran Kinerja', icon: Target },
    { id: 'pelaksanaan', title: 'Pelaksanaan', desc: 'Observasi Kelas', icon: Users },
    { id: 'penilaian', title: 'Penilaian', desc: 'Evaluasi Kepala Sekolah', icon: Award }
  ];

  const activeIndex = steps.findIndex(s => s.id === currentPhase);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pengelolaan Kinerja</h1>
        <p className="text-slate-500 font-medium mt-1">Siklus Evaluasi Pendidik Tahun {new Date().getFullYear()}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative px-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full" />
        <div className="absolute top-1/2 left-0 h-1 bg-indigo-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }} />
        
        {steps.map((step, idx) => {
          const isCompleted = activeIndex > idx;
          const isActive = activeIndex === idx;
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black border-4 transition-colors ${isCompleted ? 'bg-indigo-600 border-indigo-200 text-white' : isActive ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <p className={`mt-3 font-bold text-sm ${isActive ? 'text-indigo-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{step.title}</p>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Content based on Phase */}
      <Card className="p-8 border-2 border-slate-200 rounded-3xl mt-12 bg-white shadow-sm">
        {currentPhase === 'perencanaan' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <Target className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Tahap Perencanaan</h2>
              <p className="text-slate-500 mt-2">Silakan tuliskan target kinerja utama Anda untuk siklus ini. Sasaran ini akan diobservasi oleh Kepala Sekolah.</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sasaran Kinerja & Upaya Peningkatan</label>
              <textarea 
                rows={5} 
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-slate-700 font-medium transition-all"
                placeholder="Contoh: Saya akan menerapkan disiplin positif di kelas melalui diskusi kesepakatan kelas..."
              />
            </div>
            
            <button 
              onClick={savePerencanaan}
              disabled={!target.trim() || loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Kirim Perencanaan <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentPhase === 'pelaksanaan' && (
          <div className="text-center py-12 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Menunggu Observasi</h2>
            <p className="text-slate-500">Perencanaan Anda telah dikirim. Saat ini Anda berada dalam tahap Pelaksanaan. Kepala Sekolah akan melakukan observasi dan penilaian terhadap target yang telah Anda buat.</p>
            
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Anda:</h3>
              <p className="font-medium text-slate-700">{performance.plan_document?.target}</p>
            </div>
          </div>
        )}

        {currentPhase === 'penilaian' && (
          <div className="text-center py-12 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Penilaian Selesai</h2>
            <p className="text-slate-500 mb-8">Selamat! Rangkaian pengelolaan kinerja Anda tahun ini telah selesai dievaluasi oleh Kepala Sekolah.</p>
            
            <div className="p-8 bg-emerald-500 text-white rounded-3xl shadow-xl shadow-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <p className="text-emerald-100 font-bold mb-2">Nilai Akhir Anda</p>
              <h1 className="text-6xl font-black">{performance.principal_score}</h1>
              <p className="mt-4 font-medium italic opacity-90">"{performance.observation_notes}"</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
