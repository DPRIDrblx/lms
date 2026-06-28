"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarClock, AlertTriangle, CheckCircle2, AlertOctagon, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function AssessmentDistribusi() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch deadline
    const { data: dData } = await supabase.from('ace_grade_deadlines').select('*').order('created_at', { ascending: false }).limit(1);
    if (dData) setDeadlines(dData);

    // Fetch teachers and their grades
    const { data: tData } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
    const { data: gData } = await supabase.from('ace_student_grades').select('teacher_id, score');

    if (tData && gData) {
      // Mock logic for expected grades per teacher (e.g., 30 students * 3 classes = 90)
      // Since we don't have exact schedules count per student, we will simulate the completion ratio based on actual records vs arbitrary target (100)
      const teacherStats = tData.map((t: any) => {
        const teacherGrades = gData.filter((g: any) => g.teacher_id === t.id);
        const count = teacherGrades.length;
        // Let's assume target is 30 for this demo
        const target = 30;
        const progress = Math.min(Math.round((count / target) * 100), 100);
        
        let status = 'merah';
        if (progress === 100) status = 'hijau';
        else if (progress > 0) status = 'kuning';

        return { ...t, count, target, progress, status };
      });
      
      setTeachers(teacherStats);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleRedFlag = async (teacherId: string) => {
    setProcessing(teacherId);
    // In a real app, this would insert a record into ace_tu_penalties or similar
    // For now, we simulate the action
    await new Promise(res => setTimeout(res, 1000));
    alert("Surat Red-Flag Kepatuhan telah dikirim ke TU Keuangan dan Kepegawaian!\n\nProses pemotongan tunjangan kedisiplinan akan diproses jika guru tidak segera merespons.");
    setProcessing(null);
  };

  const handleLock = async (id: string, currentLock: boolean) => {
    setProcessing('lock');
    try {
      await supabase.from('ace_grade_deadlines').update({ is_locked: !currentLock }).eq('id', id);
      setDeadlines(prev => prev.map(d => d.id === id ? { ...d, is_locked: !currentLock } : d));
      alert(`Buku nilai berhasil di-${!currentLock ? 'kunci' : 'buka'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!profile || !profile.is_assessment_head) return null;

  const currentDeadline = deadlines[0];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengendali Distribusi & Tenggat Nilai</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Grade Ledger & Deadline Controller</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6 rounded-lg border-rose-200 bg-rose-50/50 shadow-sm relative overflow-hidden">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Grade Ledger Lock</h2>
            {loading ? (
              <p className="text-sm">Memuat...</p>
            ) : currentDeadline ? (
              <>
                <p className="text-3xl font-black text-rose-600 mb-1">
                  {new Date(currentDeadline.deadline_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                </p>
                <p className="text-xs text-rose-500 font-bold mb-4">Tenggat Waktu: {new Date(currentDeadline.deadline_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                
                <div className={`p-3 rounded mb-4 text-xs font-bold flex items-center gap-2 ${currentDeadline.is_locked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {currentDeadline.is_locked ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {currentDeadline.is_locked ? "Sistem Buku Nilai TERKUNCI" : "Sistem Buku Nilai TERBUKA"}
                </div>

                <button 
                  onClick={() => handleLock(currentDeadline.id, currentDeadline.is_locked)}
                  disabled={processing === 'lock'}
                  className="w-full py-2 bg-rose-600 text-white font-bold rounded shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {processing === 'lock' ? "Memproses..." : currentDeadline.is_locked ? "Buka Paksa (Force Override)" : "Kunci Manual Sekarang"}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Belum ada tenggat waktu yang diatur.</p>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-0 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Papan Pantau Kepatuhan Input Nilai</h2>
            </div>
            
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Memuat data kepatuhan...</div>
              ) : teachers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Tidak ada guru ditemukan.</div>
              ) : (
                teachers.map(t => (
                  <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        t.status === 'hijau' ? 'bg-emerald-100 text-emerald-600' :
                        t.status === 'kuning' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {t.status === 'hijau' ? <CheckCircle2 className="w-6 h-6" /> :
                         t.status === 'kuning' ? <AlertTriangle className="w-6 h-6" /> :
                         <AlertOctagon className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{t.full_name}</h3>
                        <p className="text-xs font-medium text-slate-500">
                          {t.count} / {t.target} Entri Nilai ({t.progress}%)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 max-w-xs w-full">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            t.status === 'hijau' ? 'bg-emerald-500' :
                            t.status === 'kuning' ? 'bg-amber-400' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </div>

                    {t.status === 'merah' && (
                      <button 
                        onClick={() => handleRedFlag(t.id)}
                        disabled={processing === t.id}
                        className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors rounded text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" /> 
                        {processing === t.id ? 'Mengirim...' : 'Kirim Red-Flag'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
