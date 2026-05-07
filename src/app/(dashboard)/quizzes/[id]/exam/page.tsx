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
  AlertCircle,
  Loader2,
  LayoutGrid,
  Menu,
  ShieldAlert,
  Save
} from "lucide-react";
import { useEffect, useState, use, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProfessionalCBTPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // State Management
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Persistence Ref
  const lastSavedResponse = useRef<string>("");

  // 1. Initial Data Fetching & Session Recovery
  const fetchExamData = useCallback(async () => {
    if (!profile) return;

    // Fetch Quiz & Questions
    const [quizRes, qRes] = await Promise.all([
      supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
      supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })
    ]);

    if (quizRes.data) setQuiz(quizRes.data);
    if (qRes.data) setQuestions(qRes.data);

    // 2. Session Management (Persistence)
    const { data: existingSession } = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("student_id", profile.id)
      .eq("quiz_id", id)
      .single();

    if (existingSession) {
      if (existingSession.status === 'submitted') {
        setIsFinished(true);
        setLoading(false);
        return;
      }
      setSession(existingSession);
      setTimeLeft(existingSession.time_left_seconds);
      setFlags(existingSession.metadata?.flags || {});
      // Fetch responses
      const { data: respData } = await supabase.from("quiz_responses").select("*").eq("student_id", profile.id).eq("quiz_id", id);
      if (respData) {
        const respMap: Record<string, any> = {};
        respData.forEach((r: any) => {
          try {
            respMap[r.question_id] = JSON.parse(r.answer_text);
          } catch {
            respMap[r.question_id] = r.answer_text;
          }
        });
        setResponses(respMap);
      }
    } else {
      // Create new session
      const initialTime = (quizRes.data?.time_limit_minutes || 60) * 60;
      const { data: newSession } = await supabase
        .from("exam_sessions")
        .insert({
          student_id: profile.id,
          quiz_id: id,
          time_left_seconds: initialTime,
          status: 'ongoing'
        })
        .select()
        .single();
      setSession(newSession);
      setTimeLeft(initialTime);
    }
    setLoading(false);
  }, [id, profile, supabase]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  // 3. Timer & Auto-Save Loop
  useEffect(() => {
    if (timeLeft <= 0 || loading || isFinished || isReviewMode) {
      if (timeLeft === 0 && !loading && !isFinished) handleForceSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next % 30 === 0) { // Sync to DB every 30 seconds
           supabase.from("exam_sessions").update({ time_left_seconds: next }).eq("id", session?.id);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isFinished, isReviewMode, session, supabase]);

  // 4. Anti-Cheat Logic
  useEffect(() => {
    const handleBlur = () => {
      if (!isFinished && !loading) {
         toast.error("WARNING: Activity outside exam window detected!", {
           duration: 5000,
           icon: <ShieldAlert className="text-red-500" />
         });
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isFinished, loading]);

  // 5. Response Handling & Real-time Persistence
  const handleResponseChange = async (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-save to Supabase
    const stringified = JSON.stringify(value);
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id,
      quiz_id: id,
      question_id: questionId,
      answer_text: stringified,
      is_flagged: flags[questionId] || false
    });
    
    // Update session current question
    await supabase.from("exam_sessions").update({ current_question_id: questionId }).eq("id", session?.id);
  };

  const toggleFlag = async (questionId: string) => {
    const newFlag = !flags[questionId];
    const newFlags = { ...flags, [questionId]: newFlag };
    setFlags(newFlags);
    
    await supabase.from("exam_sessions").update({ 
      metadata: { ...session?.metadata, flags: newFlags } 
    }).eq("id", session?.id);
    
    await supabase.from("quiz_responses").update({ is_flagged: newFlag }).eq("student_id", profile?.id).eq("question_id", questionId);
  };

  // 6. Submission Logic
  const handleForceSubmit = async () => {
    toast.error("Time is up! Submitting exam automatically...");
    await executeSubmission();
  };

  const executeSubmission = async () => {
    setSubmitting(true);
    // Mark session as submitted
    await supabase.from("exam_sessions").update({ status: 'submitted', time_left_seconds: 0 }).eq("id", session?.id);
    
    // Finalizing scores (MCQ Only, Essay Pending)
    let totalScore = 0;
    questions.forEach(q => {
      const resp = responses[q.id];
      if (q.question_type === 'mcq') {
        const correctOpt = q.options?.find((o: any) => o.is_correct);
        if (resp === correctOpt?.text) totalScore += q.points;
      }
    });

    await supabase.from("student_scores").upsert({
      student_id: profile?.id,
      target_id: id,
      target_type: "quiz",
      score: totalScore,
      is_graded: false,
      graded_at: new Date().toISOString()
    }, { onConflict: 'student_id,target_id' });

    setIsFinished(true);
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2" /> Initializing Secure Session...</div>;

  if (isFinished) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-100 text-center p-8">
         <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md bg-white p-12 rounded-3xl shadow-2xl border border-slate-200">
            <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-slate-900 mb-4">Ujian Selesai</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
               Terima kasih, {profile?.full_name}. Jawaban Anda telah berhasil dienkripsi dan disimpan di server Academy. 
               Nilai akan diproses setelah verifikasi guru.
            </p>
            <Button className="w-full h-12 rounded-xl font-bold bg-slate-900" onClick={() => router.push('/dashboard')}>Kembali ke Dashboard</Button>
         </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* 1. UNBK Style Header */}
      <header className="bg-slate-900 text-white p-4 sm:p-6 shadow-xl sticky top-0 z-50">
         <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
               <div className="flex flex-col border-r border-slate-700 pr-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Peserta</span>
                  <span className="text-sm font-black uppercase truncate max-w-[200px]">{profile?.full_name}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mata Pelajaran</span>
                  <span className="text-sm font-black uppercase">{quiz?.title}</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className={`px-8 py-3 rounded-xl border-2 transition-all flex flex-col items-center ${timeLeft < 300 ? "bg-red-600 border-red-500 animate-pulse" : "bg-slate-800 border-slate-700"}`}>
                  <span className="text-[10px] font-black uppercase opacity-60">Sisa Waktu</span>
                  <span className="text-3xl font-black font-mono leading-none mt-1">{formatTime(timeLeft)}</span>
               </div>
               <Button variant="ghost" className="text-white hover:bg-white/10 hidden lg:flex" icon={<LayoutGrid className="h-5 w-5" />}>Daftar Soal</Button>
            </div>
         </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
         {/* 2. Content Area */}
         <div className="flex-1 space-y-6">
            <AnimatePresence mode="wait">
               {isReviewMode ? (
                 <motion.div key="review" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <Card className="p-12 border-none shadow-xl bg-white">
                       <h2 className="text-2xl font-black text-slate-900 mb-8 border-b-2 border-slate-100 pb-4">Konfirmasi Selesai Ujian</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                             <p className="text-xs font-black uppercase text-slate-400 mb-2">Statistik Jawaban</p>
                             <div className="flex justify-between items-center">
                                <span className="text-sm font-bold">Terjawab</span>
                                <span className="text-xl font-black">{Object.keys(responses).length} / {questions.length}</span>
                             </div>
                             <div className="flex justify-between items-center mt-2">
                                <span className="text-sm font-bold">Ragu-Ragu</span>
                                <span className="text-xl font-black text-amber-500">{Object.values(flags).filter(Boolean).length}</span>
                             </div>
                          </div>
                          <div className="flex flex-col justify-center gap-3">
                             <Button size="lg" className="h-14 font-black text-base bg-emerald-600 hover:bg-emerald-700 text-white" onClick={executeSubmission} loading={submitting}>SUBMIT SEKARANG</Button>
                             <Button variant="ghost" size="lg" className="h-14 font-bold text-slate-500" onClick={() => setIsReviewMode(false)}>Kembali ke Soal</Button>
                          </div>
                       </div>
                    </Card>
                 </motion.div>
               ) : (
                 <motion.div key={currentIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <Card className="p-8 sm:p-12 min-h-[600px] flex flex-col border-none shadow-xl bg-white">
                       {/* Question Header */}
                       <div className="flex justify-between items-center mb-10 border-b-2 border-slate-50 pb-6">
                          <div className="flex items-center gap-4">
                             <span className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                                {currentIndex + 1}
                             </span>
                             <Badge variant="info" className="uppercase font-black text-[10px] px-3 py-1 bg-slate-100 text-slate-600 border-none tracking-widest">
                                {currentQ?.question_type}
                             </Badge>
                          </div>
                          <button 
                            onClick={() => toggleFlag(currentQ.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                              flags[currentQ.id] ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                             <Flag className={`h-4 w-4 ${flags[currentQ.id] ? "fill-white" : ""}`} /> Ragu-Ragu
                          </button>
                       </div>

                       {/* Question Text */}
                       <div className="flex-1">
                          <div className="text-xl font-bold text-slate-800 leading-relaxed mb-12" dangerouslySetInnerHTML={{ __html: currentQ?.question_text }} />

                          {/* Dynamic Inputs */}
                          <div className="space-y-4">
                             {currentQ?.question_type === 'mcq' && currentQ.options?.map((opt: any, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => handleResponseChange(currentQ.id, opt.text)}
                                  className={`w-full flex items-center gap-5 p-6 rounded-2xl border-2 transition-all text-left ${
                                    responses[currentQ.id] === opt.text 
                                    ? "border-slate-900 bg-slate-900 text-white" 
                                    : "border-slate-100 hover:border-slate-300 bg-white text-slate-600"
                                  }`}
                                >
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                                      responses[currentQ.id] === opt.text ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"
                                   }`}>
                                      {String.fromCharCode(65 + i)}
                                   </div>
                                   <span className="text-base font-bold">{opt.text}</span>
                                </button>
                             ))}

                             {currentQ?.question_type === 'complex-mcq' && currentQ.options?.map((opt: any, i: number) => {
                                const currentResp = responses[currentQ.id] || [];
                                const isSelected = currentResp.includes(opt.text);
                                return (
                                  <button
                                    key={i}
                                    onClick={() => {
                                       const next = isSelected ? currentResp.filter((r: string) => r !== opt.text) : [...currentResp, opt.text];
                                       handleResponseChange(currentQ.id, next);
                                    }}
                                    className={`w-full flex items-center gap-5 p-6 rounded-2xl border-2 transition-all text-left ${
                                      isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 hover:border-slate-300 bg-white text-slate-600"
                                    }`}
                                  >
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                                        isSelected ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"
                                     }`}>
                                        {isSelected ? <CheckCircle2 className="h-5 w-5" /> : String.fromCharCode(65 + i)}
                                     </div>
                                     <span className="text-base font-bold">{opt.text}</span>
                                  </button>
                                );
                             })}

                             {currentQ?.question_type === 'matching' && (
                                <div className="grid grid-cols-1 gap-4">
                                   {currentQ.metadata?.pairs?.map((pair: any, i: number) => (
                                      <div key={i} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                         <div className="flex-1 font-bold text-slate-800">{pair.left}</div>
                                         <div className="h-0.5 w-12 bg-slate-300 hidden md:block" />
                                         <select 
                                           value={responses[currentQ.id]?.[pair.left] || ""}
                                           onChange={(e) => {
                                              const prev = responses[currentQ.id] || {};
                                              handleResponseChange(currentQ.id, { ...prev, [pair.left]: e.target.value });
                                           }}
                                           className="flex-1 h-12 px-4 rounded-xl bg-white border-2 border-slate-200 font-bold focus:border-slate-900 outline-none"
                                         >
                                            <option value="">Pilih Pasangan...</option>
                                            {currentQ.metadata?.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                         </select>
                                      </div>
                                   ))}
                                </div>
                             )}

                             {currentQ?.question_type === 'essay' && (
                                <textarea
                                  value={responses[currentQ.id] || ""}
                                  onChange={(e) => handleResponseChange(currentQ.id, e.target.value)}
                                  placeholder="Ketik jawaban lengkap Anda di sini..."
                                  className="w-full min-h-[350px] p-8 rounded-3xl bg-slate-50 border-2 border-slate-100 text-lg font-medium focus:border-slate-900 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                />
                             )}
                          </div>
                       </div>

                       {/* Footer Navigation */}
                       <div className="flex items-center justify-between pt-12 mt-12 border-t-2 border-slate-50">
                          <Button 
                            variant="ghost" 
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(prev => prev - 1)}
                            className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:text-slate-900"
                            icon={<ChevronLeft className="h-5 w-5" />}
                          >
                             SOAL SEBELUMNYA
                          </Button>
                          
                          {currentIndex === questions.length - 1 ? (
                            <Button 
                              onClick={() => setIsReviewMode(true)}
                              className="h-14 px-12 rounded-2xl font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                            >
                               SELESAI & REVIEW
                            </Button>
                          ) : (
                            <Button 
                              className="h-14 px-12 rounded-2xl font-black bg-slate-900 text-white shadow-xl shadow-slate-900/20"
                              onClick={() => setCurrentIndex(i => i + 1)}
                            >
                               SOAL BERIKUTNYA <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                          )}
                       </div>
                    </Card>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* 3. Navigation Grid (Sidebar) */}
         <aside className="w-full lg:w-96 flex flex-col gap-6">
            <Card className="p-8 border-none shadow-xl bg-white sticky top-32">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><LayoutGrid className="h-5 w-5" /></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Navigasi Soal</h3>
               </div>
               
               <div className="grid grid-cols-5 gap-3">
                  {questions.map((q, i) => {
                    const isAnswered = responses[q.id] && (typeof responses[q.id] === 'string' ? responses[q.id].trim() !== "" : Object.keys(responses[q.id]).length > 0);
                    const isFlagged = flags[q.id];
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => { setCurrentIndex(i); setIsReviewMode(false); }}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all relative border-2 ${
                          currentIndex === i ? "ring-2 ring-slate-900 ring-offset-4" : ""
                        } ${
                          isFlagged 
                            ? "bg-amber-500 border-amber-600 text-white" 
                            : isAnswered 
                              ? "bg-slate-900 border-slate-900 text-white" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                         {i + 1}
                      </button>
                    );
                  })}
               </div>

               <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                     <span>Progres Ujian</span>
                     <span className="text-slate-900">{Object.keys(responses).length} / {questions.length}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-slate-900 transition-all duration-1000" 
                       style={{ width: `${(Object.keys(responses).length / questions.length) * 100}%` }}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-slate-900" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Terjawab</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ragu-Ragu</span>
                     </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4 mt-6">
                     <Save className="h-5 w-5 text-blue-600 shrink-0" />
                     <p className="text-[10px] text-blue-700 leading-relaxed font-bold uppercase">
                        Sistem sedang melakukan sinkronisasi otomatis ke cloud server...
                     </p>
                  </div>
               </div>
            </Card>
         </aside>
      </main>
    </div>
  );
}
