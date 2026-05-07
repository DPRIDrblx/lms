"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  Loader2,
  LayoutGrid,
  ShieldAlert,
  Save,
  Monitor
} from "lucide-react";
import { useEffect, useState, use, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function IndustrialCBTPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // State
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [session, setSession] = useState<any>(null);

  // 1. Data Fetching
  const initExam = useCallback(async () => {
    if (!profile) return;
    
    const [qData, qsData] = await Promise.all([
      supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
      supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })
    ]);

    if (qData.data) setQuiz(qData.data);
    if (qsData.data) setQuestions(qsData.data);

    // Session Persistence
    const { data: existing } = await supabase.from("exam_sessions").select("*").eq("student_id", profile.id).eq("quiz_id", id).single();
    
    if (existing) {
      if (existing.status === 'submitted') { setIsFinished(true); setLoading(false); return; }
      setSession(existing);
      setTimeLeft(existing.time_left_seconds);
      setFlags(existing.metadata?.flags || {});
      
      const { data: resp } = await supabase.from("quiz_responses").select("*").eq("student_id", profile.id).eq("quiz_id", id);
      const rMap: Record<string, any> = {};
      resp?.forEach((r: any) => { try { rMap[r.question_id] = JSON.parse(r.answer_text); } catch { rMap[r.question_id] = r.answer_text; } });
      setResponses(rMap);
    } else {
      const initialTime = (qData.data?.time_limit_minutes || 60) * 60;
      const { data: newS } = await supabase.from("exam_sessions").insert({
        student_id: profile.id, quiz_id: id, time_left_seconds: initialTime, status: 'ongoing'
      }).select().single();
      setSession(newS);
      setTimeLeft(initialTime);
    }
    setLoading(false);
  }, [id, profile, supabase]);

  useEffect(() => { initExam(); }, [initExam]);

  // 2. Timer & Auto-Save
  useEffect(() => {
    if (timeLeft <= 0 || loading || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next % 10 === 0) supabase.from("exam_sessions").update({ time_left_seconds: next }).eq("id", session?.id);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, isFinished, session, supabase]);

  // 3. Anti-Cheat
  useEffect(() => {
    const onBlur = () => { if (!isFinished && !loading) toast.error("PERINGATAN: Perpindahan jendela terdeteksi!", { duration: 5000, icon: <ShieldAlert className="text-red-600" /> }); };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [isFinished, loading]);

  // 4. Persistence
  const saveAnswer = async (qId: string, val: any) => {
    setResponses(prev => ({ ...prev, [qId]: val }));
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id, quiz_id: id, question_id: qId, answer_text: JSON.stringify(val), is_flagged: flags[qId] || false
    });
  };

  const setFlag = async (qId: string) => {
    const val = !flags[qId];
    const newFlags = { ...flags, [qId]: val };
    setFlags(newFlags);
    await supabase.from("exam_sessions").update({ metadata: { ...session?.metadata, flags: newFlags } }).eq("id", session?.id);
    await supabase.from("quiz_responses").update({ is_flagged: val }).eq("student_id", profile?.id).eq("question_id", qId);
  };

  const submitExam = async () => {
    if (!confirm("Apakah Anda yakin ingin mengakhiri ujian ini?")) return;
    await supabase.from("exam_sessions").update({ status: 'submitted', time_left_seconds: 0 }).eq("id", session?.id);
    setIsFinished(true);
  };

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-mono uppercase tracking-widest"><Loader2 className="animate-spin mr-3" /> Mempersiapkan Lingkungan Ujian...</div>;

  if (isFinished) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-8">
         <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 max-w-lg">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-slate-900 mb-2">Ujian Selesai</h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-8">Data Telah Berhasil Disinkronisasi</p>
            <p className="text-slate-600 mb-8 leading-relaxed">Terima kasih <strong>{profile?.full_name}</strong>. Jawaban Anda telah tersimpan secara permanen di cloud Nusantara Academy.</p>
            <Button className="w-full h-14 rounded-xl bg-slate-900 font-bold" onClick={() => router.push('/dashboard')}>Kembali ke Dashboard</Button>
         </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans select-none">
      {/* INDUSTRIAL HEADER */}
      <header className="bg-slate-800 text-white border-b-4 border-blue-600 sticky top-0 z-50 px-6 py-4">
         <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
               <div className="flex flex-col border-r border-slate-600 pr-8">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peserta</span>
                  <span className="text-sm font-black uppercase text-blue-400">{profile?.full_name}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mata Pelajaran</span>
                  <span className="text-sm font-black uppercase">{quiz?.title}</span>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className={`px-10 py-3 rounded-lg border-2 flex flex-col items-center transition-all ${timeLeft < 300 ? "bg-red-600 border-red-400 animate-pulse" : "bg-slate-700 border-slate-600"}`}>
                  <span className="text-[9px] font-black uppercase opacity-60">Sisa Waktu</span>
                  <span className="text-3xl font-black font-mono leading-none mt-1 tracking-tighter">{formatTime(timeLeft)}</span>
               </div>
               <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-lg border border-slate-600">
                  <Monitor className="h-4 w-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Secure Client v2.0.4</span>
               </div>
            </div>
         </div>
      </header>

      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col lg:flex-row gap-6">
         {/* QUESTION AREA */}
         <div className="flex-1 flex flex-col gap-6">
            <Card className="flex-1 p-10 bg-white rounded-xl border-none shadow-xl flex flex-col relative overflow-hidden">
               {/* Watermark */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-30deg] text-9xl font-black pointer-events-none select-none uppercase">Confidential</div>
               
               <div className="flex justify-between items-center mb-8 border-b-2 border-slate-50 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">
                        {currentIndex + 1}
                     </div>
                     <Badge className="bg-slate-100 text-slate-500 border-none uppercase text-[10px] font-black px-3 py-1">Tipe: {currentQ?.question_type}</Badge>
                  </div>
                  <button 
                    onClick={() => setFlag(currentQ.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${flags[currentQ.id] ? "bg-amber-400 text-slate-900 shadow-lg" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                  >
                     <Flag className={`h-4 w-4 ${flags[currentQ.id] ? "fill-slate-900" : ""}`} /> Ragu-Ragu
                  </button>
               </div>

               <div className="flex-1">
                  <div className="text-xl font-bold text-slate-800 leading-relaxed mb-12 select-none" dangerouslySetInnerHTML={{ __html: currentQ?.question_text }} />

                  <div className="grid grid-cols-1 gap-4">
                     {currentQ?.question_type === 'mcq' && currentQ.options?.map((opt: any, i: number) => {
                        const isSelected = responses[currentQ.id] === opt.text;
                        return (
                           <button
                             key={i}
                             onClick={() => saveAnswer(currentQ.id, opt.text)}
                             className={`group w-full flex items-center gap-6 p-6 rounded-xl border-2 transition-all text-left ${isSelected ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"}`}
                           >
                              <div className={`w-10 h-10 rounded flex items-center justify-center font-black text-lg transition-all ${isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-400 border border-slate-200 group-hover:border-slate-400"}`}>
                                 {String.fromCharCode(65 + i)}
                              </div>
                              <span className="text-base font-bold uppercase">{opt.text}</span>
                           </button>
                        );
                     })}

                     {currentQ?.question_type === 'essay' && (
                        <textarea 
                           value={responses[currentQ.id] || ""}
                           onChange={(e) => saveAnswer(currentQ.id, e.target.value)}
                           className="w-full min-h-[300px] p-8 rounded-xl bg-slate-50 border-2 border-slate-200 text-lg font-medium focus:border-blue-600 focus:bg-white outline-none transition-all resize-none"
                           placeholder="Ketikkan jawaban essay Anda secara lengkap di sini..."
                        />
                     )}
                  </div>
               </div>

               <div className="mt-12 pt-8 border-t-2 border-slate-50 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    disabled={currentIndex === 0} 
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="h-14 px-8 rounded-lg font-black text-slate-400 hover:text-slate-900"
                    icon={<ChevronLeft className="h-5 w-5" />}
                  >
                     SOAL SEBELUMNYA
                  </Button>

                  {currentIndex === questions.length - 1 ? (
                    <Button onClick={submitExam} className="h-14 px-12 rounded-lg font-black bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-700">AKHIRI UJIAN</Button>
                  ) : (
                    <Button 
                       onClick={() => setCurrentIndex(i => i + 1)}
                       className="h-14 px-12 rounded-lg font-black bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                    >
                       SOAL BERIKUTNYA <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
               </div>
            </Card>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-4 text-blue-700">
               <Save className="h-5 w-5" />
               <p className="text-[10px] font-black uppercase tracking-widest">Sistem telah mensinkronisasi jawaban terakhir ke server secara otomatis.</p>
            </div>
         </div>

         {/* SIDEBAR NAVIGATION GRID */}
         <aside className="w-full lg:w-96">
            <Card className="p-8 bg-white rounded-xl border-none shadow-xl sticky top-[108px]">
               <div className="flex items-center gap-3 mb-8">
                  <LayoutGrid className="h-5 w-5 text-slate-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Navigasi Soal</h3>
               </div>

               <div className="grid grid-cols-5 gap-3">
                  {questions.map((q, i) => {
                     const isAnswered = responses[q.id] && responses[q.id].length > 0;
                     const isFlagged = flags[q.id];
                     return (
                        <button
                           key={q.id}
                           onClick={() => setCurrentIndex(i)}
                           className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2 ${
                              currentIndex === i ? "ring-2 ring-blue-600 ring-offset-4" : ""
                           } ${
                              isFlagged ? "bg-amber-400 border-amber-500 text-slate-900" :
                              isAnswered ? "bg-blue-600 border-blue-700 text-white" :
                              "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300"
                           }`}
                        >
                           {i + 1}
                        </button>
                     );
                  })}
               </div>

               <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                     <span>Terjawab</span>
                     <span className="text-slate-900 font-black">{Object.keys(responses).length} / {questions.length}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${(Object.keys(responses).length / questions.length) * 100}%` }} />
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-600" /><span className="text-[9px] font-bold text-slate-400 uppercase">Sudah Terisi</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-400" /><span className="text-[9px] font-bold text-slate-400 uppercase">Ragu-Ragu</span></div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /><span className="text-[9px] font-bold text-slate-400 uppercase">Kosong</span></div>
                  </div>
               </div>
            </Card>
         </aside>
      </main>
    </div>
  );
}
