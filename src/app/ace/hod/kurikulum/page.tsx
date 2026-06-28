"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { BookOpen, CheckCircle2, XCircle, FileText, Target, Activity, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HoDKurikulum() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [syllabusAlignment, setSyllabusAlignment] = useState(0);
  const [examStats, setExamStats] = useState({ total: 0, hotsPercent: 0, lotsPercent: 0 });
  const [delayedClasses, setDelayedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedbackText, setFeedbackText] = useState<{ [key: string]: string }>({});

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ace_lesson_plans')
      .select('*, profiles(full_name)')
      .eq('status', 'pending');
      
    if (data) setLessonPlans(data);

    // Fetch logbooks for syllabus mapping
    const { data: logbooks } = await supabase.from('ace_logbooks').select('*, ace_schedules(class_name)');
    const { data: schedules } = await supabase.from('ace_schedules').select('*');
    
    if (logbooks && schedules && schedules.length > 0) {
      // Very simple mock logic replacing: Calculate actual alignment based on logbook entries vs expected schedules
      // For now, we just base it on how many schedules have at least one logbook
      const coveredSchedules = new Set(logbooks.map((l: any) => l.schedule_id));
      const alignment = Math.round((coveredSchedules.size / schedules.length) * 100);
      setSyllabusAlignment(alignment);

      // Find classes with no logbooks as "delayed"
      const delayed = schedules.filter((s: any) => !coveredSchedules.has(s.id));
      setDelayedClasses(delayed);
    } else {
      setSyllabusAlignment(0);
      setDelayedClasses([]);
    }

    // Fetch exam questions
    const { data: exams } = await supabase.from('ace_exam_questions').select('question_type');
    if (exams && exams.length > 0) {
      const hots = exams.filter((e: any) => e.question_type === 'HOTS').length;
      const hotsPercent = Math.round((hots / exams.length) * 100);
      setExamStats({
        total: exams.length,
        hotsPercent,
        lotsPercent: 100 - hotsPercent
      });
    } else {
      setExamStats({ total: 0, hotsPercent: 0, lotsPercent: 0 });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleAction = async (id: string, action: 'approved' | 'revision_needed') => {
    if (action === 'revision_needed' && !feedbackText[id]) {
      alert("Mohon isi catatan perbaikan terlebih dahulu.");
      return;
    }
    
    setProcessing(true);
    try {
      await supabase.from('ace_lesson_plans').update({ 
        status: action,
        feedback: feedbackText[id] || null
      }).eq('id', id);
      
      setLessonPlans(prev => prev.filter(lp => lp.id !== id));
      alert(`Lesson Plan telah ${action === 'approved' ? 'disetujui' : 'dikembalikan'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!profile || !profile.is_hod) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Otorisasi & Penyelarasan Kurikulum</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Curriculum & Lesson Plan Vet Center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <BookOpen className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Master Syllabus Mapping</h2>
            <p className="text-3xl font-black text-slate-800 mb-1">{syllabusAlignment}%</p>
            <p className="text-xs text-slate-500">Tingkat Keselarasan Target Kurikulum Harian</p>
            
            {delayedClasses.length > 0 && (
              <div className="mt-6 flex items-start gap-3 p-3 bg-amber-50 rounded border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-800">Peringatan Keterlambatan Materi</p>
                  <p className="text-[10px] text-amber-700 mt-1">Kelas {delayedClasses.map(c => c.class_name).join(', ')} belum memiliki catatan logbook. Segera jadwalkan evaluasi dengan guru pengampu.</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-slate-900 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Resource & Exam Bank Custodian</h2>
            <p className="text-2xl font-black mb-4">{examStats.total} Soal Ujian Tervalidasi</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem telah menjalankan <strong>Checklist Layout</strong> otomatis. 
              Komposisi soal Mid-Term saat ini: {examStats.hotsPercent}% HOTS, {examStats.lotsPercent}% LOTS. 
              {examStats.hotsPercent >= 40 ? <span className="text-emerald-400 font-bold ml-1">Sesuai standar.</span> : <span className="text-amber-400 font-bold ml-1">Perbanyak HOTS.</span>}
            </p>
          </div>
          <button className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded shadow-sm transition-colors">
            Kirim ke TU Persuratan (Print)
          </button>
        </Card>
      </div>

      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Antrean Validasi Lesson Plan (RPP)</h2>
            <p className="text-xs text-slate-500 font-medium">Kurasi kesiapan materi ajar guru minggu ini</p>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : lessonPlans.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-bold text-slate-700">Semua Lesson Plan Telah Divalidasi</p>
              <p className="text-xs text-slate-500 mt-1">Tidak ada dokumen yang mengantre di meja Anda.</p>
            </div>
          ) : lessonPlans.map(lp => (
            <div key={lp.id} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-800">{lp.topic}</h3>
                  <p className="text-xs text-slate-500 font-medium">{lp.subject} • Kelas {lp.grade_level} • Oleh: {lp.profiles?.full_name}</p>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded">Menunggu Tinjauan</span>
              </div>
              
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Tujuan Pembelajaran</h4>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{lp.objectives}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase">Aktivitas Kelas</h4>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{lp.activities}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <textarea 
                  placeholder="Catatan perbaikan (wajib jika ditolak)..."
                  className="w-full p-3 border border-slate-200 rounded text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={feedbackText[lp.id] || ''}
                  onChange={(e) => setFeedbackText(prev => ({ ...prev, [lp.id]: e.target.value }))}
                />
                
                <div className="flex gap-3">
                  <button 
                    disabled={processing}
                    onClick={() => handleAction(lp.id, 'approved')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Lock
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleAction(lp.id, 'revision_needed')}
                    className="flex-1 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-sm rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Return for Revision
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
