"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback } from "react";
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, PlayCircle, Star, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [needsManualGrading, setNeedsManualGrading] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  // Drag and drop state for matching
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const initExam = useCallback(async () => {
    if (!profile) return;
    
    const [qData, qsData] = await Promise.all([
      supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
      supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })
    ]);

    if (qData.data) setQuiz(qData.data);
    if (qsData.data) {
      let qList = qsData.data as any[];
      if (qData.data?.shuffle_questions) {
        qList = [...qList].sort(() => Math.random() - 0.5);
      }
      setQuestions(qList);
    }

    const { data: existing } = await supabase.from("exam_sessions").select("*").eq("student_id", profile.id).eq("quiz_id", id).single();
    
    if (existing) {
      if (existing.status === 'submitted') { 
        const { data: scoreCheck } = await supabase
          .from("student_scores")
          .select("score, is_graded")
          .eq("student_id", profile.id)
          .eq("target_id", id)
          .eq("target_type", "quiz")
          .single();
          
        if (!scoreCheck) {
          await supabase.from("exam_sessions").delete().eq("id", existing.id);
          window.location.reload();
          return;
        }

        setFinalScore(scoreCheck.score);
        setNeedsManualGrading(!scoreCheck.is_graded);
        setIsFinished(true); 
        setLoading(false); 
        return; 
      }
      setSession(existing);
      setTimeLeft(existing.time_left_seconds);
      
      const { data: resp } = await supabase.from("quiz_responses").select("*").eq("student_id", profile.id).eq("quiz_id", id);
      if (resp) {
        const initialResp: Record<string, any> = {};
        const initialFlags: Record<string, boolean> = {};
        resp.forEach((r: any) => {
          if (r.metadata?.answer) {
             initialResp[r.question_id] = r.metadata.answer;
          }
          initialFlags[r.question_id] = r.is_flagged;
        });
        setResponses(initialResp);
        setFlags(initialFlags);
      }
    } else {
      const { data: newSession } = await supabase.from("exam_sessions").insert({
        student_id: profile.id,
        quiz_id: id,
        time_left_seconds: (qData.data?.time_limit || qData.data?.time_limit_minutes || 60) * 60,
        status: 'in_progress',
        metadata: { started_at: new Date().toISOString() }
      }).select().single();
      
      if (newSession) {
        setSession(newSession);
        setTimeLeft(newSession.time_left_seconds);
      }
    }
    
    setLoading(false);
  }, [profile, id, supabase]);

  useEffect(() => { initExam(); }, [initExam]);

  useEffect(() => {
    if (!profile || !id) return;
    
    const channel = supabase.channel(`room:exam_${id}`, {
      config: { presence: { key: profile.id } },
    });

    channel.on('presence', { event: 'sync' }, () => {});

    channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          student_id: profile.id,
          student_name: profile.full_name,
          status: 'Active',
          warnings: cheatWarnings,
          last_ping: new Date().toISOString()
        });
      }
    });

    setPresenceChannel(channel);
    return () => { supabase.removeChannel(channel); };
  }, [profile, id, supabase]);

  useEffect(() => {
    if (timeLeft <= 0 || loading || isFinished) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); submitExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, isFinished]);

  useEffect(() => {
    const handleBlur = () => {
      if (!isFinished && !loading) {
        setCheatWarnings(prev => {
          const newWarnings = prev + 1;
          
          if (presenceChannel) {
             presenceChannel.track({
               student_id: profile?.id,
               student_name: profile?.full_name,
               status: 'Warning: Tab Switched',
               warnings: newWarnings,
               last_ping: new Date().toISOString()
             });
          }

          if (quiz?.allow_leave_exam === false) {
             alert("PELANGGARAN KECURANGAN: Ujian ini tidak mengizinkan Anda meninggalkan halaman! Ujian Anda disubmit otomatis.");
             submitExam();
          } else {
             alert("PERINGATAN KECURANGAN: Anda telah meninggalkan halaman ujian! Aktivitas dicatat.");
          }
          
          return newWarnings;
        });
      }
    };
    
    const handleFocus = () => {
       if (!isFinished && !loading && presenceChannel && profile) {
           presenceChannel.track({
             student_id: profile.id,
             student_name: profile.full_name,
             status: 'Active',
             warnings: cheatWarnings,
             last_ping: new Date().toISOString()
           });
       }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    return () => {
       window.removeEventListener("blur", handleBlur);
       window.removeEventListener("focus", handleFocus);
    }
  }, [isFinished, loading, quiz, presenceChannel, profile, cheatWarnings]);

  const saveAnswer = async (qId: string, answer: any) => {
    const newResponses = { ...responses, [qId]: answer };
    setResponses(newResponses);
    
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id,
      quiz_id: id,
      question_id: qId,
      metadata: { answer },
      is_flagged: flags[qId] || false
    }, { onConflict: 'student_id,question_id' });
  };

  const setFlag = async (qId: string) => {
    const val = !flags[qId];
    const newFlags = { ...flags, [qId]: val };
    setFlags(newFlags);
    
    await supabase.from("quiz_responses").update({ is_flagged: val }).eq("student_id", profile?.id).eq("question_id", qId);
  };

  const submitExam = async () => {
    if (timeLeft > 0 && !confirm("Apakah Anda yakin ingin mengakhiri ujian ini?")) return;
    
    if (timeLeft > 0 && quiz?.min_time_to_submit > 0) {
      const totalTimeSeconds = (quiz?.time_limit || quiz?.time_limit_minutes || 60) * 60;
      const elapsedSeconds = totalTimeSeconds - timeLeft;
      const minTimeSeconds = quiz.min_time_to_submit * 60;
      if (elapsedSeconds < minTimeSeconds) {
        alert(`Anda belum dapat mengumpulkan ujian. Waktu pengerjaan minimal adalah ${quiz.min_time_to_submit} menit.`);
        return;
      }
    }
    
    await supabase.from("exam_sessions").update({ status: 'submitted', time_left_seconds: 0 }).eq("id", session?.id);
    
    if (presenceChannel) {
      presenceChannel.track({
        student_id: profile?.id,
        student_name: profile?.full_name,
        status: 'Submitted',
        warnings: cheatWarnings,
        last_ping: new Date().toISOString()
      });
    }

    let totalScore = 0;
    let maxScore = 0;
    let hasEssay = false;

    questions.forEach(q => {
      maxScore += q.points;
      const ans = responses[q.id];
      if (!ans) return;

      if (q.question_type === "mcq") {
        const correctOpt = q.options?.find((o: any) => o.is_correct);
        if (ans === correctOpt?.text) totalScore += q.points;
      } else if (q.question_type === "complex_mcq") {
        const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
        const isCorrect = Array.isArray(ans) && ans.length === correctOpts.length && ans.every(a => correctOpts.includes(a));
        if (isCorrect) totalScore += q.points;
      } else if (q.question_type === "matching") {
        let matches = 0;
        let totalPairs = q.options?.length || 1;
        q.options?.forEach((opt: any) => {
          if (ans[opt.text] === opt.match_pair) matches++;
        });
        totalScore += (matches / totalPairs) * q.points;
      } else if (q.question_type === "essay") {
        hasEssay = true;
      }
    });

    const finalPercentage = Math.round((totalScore / maxScore) * 100);

    await supabase.from("student_scores").insert({
      student_id: profile?.id,
      target_id: id,
      target_type: "quiz",
      score: finalPercentage,
      is_graded: !hasEssay,
      metadata: { responses }, 
      graded_at: hasEssay ? null : new Date().toISOString()
    });

    if (quiz?.course_id) {
       await supabase.from("course_progress").upsert({
          student_id: profile?.id,
          course_id: quiz.course_id,
          lesson_id: id,
          completed: true,
          completed_at: new Date().toISOString()
       }, { onConflict: "student_id,lesson_id" });
    }

    setFinalScore(finalPercentage);
    setNeedsManualGrading(hasEssay);
    setIsFinished(true);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isFinished) {
    const isPassed = finalScore !== null && finalScore >= (quiz?.passing_score || 0);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
         <motion.div 
           initial={{ opacity: 0, scale: 0.9, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           className="bg-white p-8 md:p-12 max-w-lg w-full text-center rounded-3xl shadow-xl border-2 border-slate-200"
         >
            <div className="flex justify-center mb-6">
              {needsManualGrading ? (
                <div className="w-24 h-24 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center border-4 border-yellow-200">
                  <Clock className="w-12 h-12" />
                </div>
              ) : isPassed ? (
                <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center border-4 border-green-200">
                  <Target className="w-12 h-12" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center border-4 border-red-200">
                  <AlertCircle className="w-12 h-12" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-2">
              {needsManualGrading ? "UJIAN SELESAI!" : isPassed ? "LUAR BIASA!" : "TETAP SEMANGAT!"}
            </h1>
            <p className="text-slate-500 mb-8 font-medium">Jawabanmu sudah berhasil tersimpan.</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 mb-8">
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Nilai Akhir</p>
               {needsManualGrading ? (
                  <div>
                    <div className="text-5xl font-black text-yellow-500">
                      {finalScore !== null ? finalScore : "?"} <span className="text-2xl text-slate-300">/ 100</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-4 font-bold bg-yellow-100/50 p-2 rounded-xl inline-block">
                      Menunggu Penilaian Guru (Ada Soal Essay)
                    </p>
                  </div>
               ) : (
                  <div>
                    <div className={`text-6xl font-black ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                      {finalScore} <span className="text-2xl text-slate-300">/ 100</span>
                    </div>
                  </div>
               )}
            </div>

            <button 
              onClick={() => router.push(quiz?.course_id ? `/courses/${quiz.course_id}` : '/dashboard')}
              className="w-full py-4 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 active:translate-y-1 text-white font-bold rounded-2xl border-b-4 border-blue-700 transition-all text-lg"
            >
              LANJUTKAN
            </button>
         </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* HEADER PROGRESS (Duolingo Style) */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-100 px-4 py-4 md:px-8 flex items-center gap-4 md:gap-8 shadow-sm">
        <button 
          onClick={() => { if(confirm("Kembali ke dashboard? Ujian akan tetap berjalan.")) router.push('/dashboard') }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-8 h-8" strokeWidth={3} />
        </button>
        
        {/* Progress Bar */}
        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
          >
            <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
          </motion.div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold border-2 ${
          timeLeft < 300 
            ? 'border-red-200 bg-red-50 text-red-600' 
            : 'border-slate-200 bg-white text-slate-600'
        }`}>
          <Clock className={`w-5 h-5 ${timeLeft < 300 ? 'animate-pulse' : ''}`} />
          <span className="text-lg font-mono tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8">
        
        {/* LEFT PANEL: QUESTION CONTENT */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full pb-32 lg:pb-0">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              Soal {currentIndex + 1}
            </h2>
            <div className="px-3 py-1 bg-blue-100 text-blue-600 rounded-xl text-sm font-bold border-2 border-blue-200">
              {currentQ?.question_type?.toUpperCase().replace("_", " ")}
            </div>
          </div>

          <div className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed mb-8">
            <div dangerouslySetInnerHTML={{ __html: currentQ?.question_text }} />
          </div>

          {/* RENDER QUESTION BY TYPE */}
          <div className="flex-1">
            {/* MCQ */}
            {currentQ?.question_type === 'mcq' && (
              <div className="grid gap-3">
                {currentQ.options?.map((opt: any, i: number) => {
                  const isSelected = responses[currentQ.id] === opt.text;
                  return (
                    <button
                      key={i}
                      onClick={() => saveAnswer(currentQ.id, opt.text)}
                      className={`text-left w-full p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      style={{
                        borderBottomWidth: isSelected ? '2px' : '4px',
                        transform: isSelected ? 'translateY(2px)' : 'none'
                      }}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border-2 ${
                        isSelected ? 'border-blue-500 text-blue-600 bg-white' : 'border-slate-300 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className={`text-lg font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* COMPLEX MCQ */}
            {currentQ?.question_type === 'complex_mcq' && (
              <div className="grid gap-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Pilih semua yang benar
                </p>
                {currentQ.options?.map((opt: any, i: number) => {
                  const selectedArr = responses[currentQ.id] || [];
                  const isSelected = selectedArr.includes(opt.text);
                  
                  const toggleSelect = () => {
                    let newArr = [...selectedArr];
                    if (isSelected) newArr = newArr.filter((item: string) => item !== opt.text);
                    else newArr.push(opt.text);
                    saveAnswer(currentQ.id, newArr);
                  };

                  return (
                    <button
                      key={i}
                      onClick={toggleSelect}
                      className={`text-left w-full p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      style={{
                        borderBottomWidth: isSelected ? '2px' : '4px',
                        transform: isSelected ? 'translateY(2px)' : 'none'
                      }}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 ${
                        isSelected ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className={`text-lg font-medium ${isSelected ? 'text-green-900' : 'text-slate-700'}`}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MATCHING (Simple Drag and Drop) */}
            {currentQ?.question_type === 'matching' && (() => {
              const answersMap = responses[currentQ.id] || {}; // { term: definition }
              const terms = currentQ.options?.map((o: any) => o.text) || [];
              const defs = currentQ.options?.map((o: any) => o.match_pair) || [];
              const availableDefs = defs.filter((d: string) => !Object.values(answersMap).includes(d)).sort();

              return (
                <div>
                  <div className="bg-blue-50 border-2 border-blue-100 p-4 rounded-2xl flex gap-3 mb-6">
                    <PlayCircle className="w-6 h-6 text-blue-500 shrink-0" />
                    <p className="text-sm font-bold text-blue-700">Tarik kotak definisi di bawah ke area kosong di sebelah masing-masing pertanyaan.</p>
                  </div>
                  
                  {/* Definitions Bank */}
                  <div className="flex flex-wrap gap-2 mb-8 p-4 bg-slate-50 border-2 border-slate-200 rounded-3xl min-h-[100px]">
                    <div className="w-full text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Pilihan Jawaban:
                    </div>
                    {availableDefs.map((def: string, i: number) => (
                      <div 
                        key={i}
                        draggable
                        onDragStart={() => setDraggedItem(def)}
                        className="px-4 py-3 bg-white border-2 border-slate-300 border-b-4 rounded-2xl cursor-grab active:cursor-grabbing font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all select-none"
                      >
                        {def}
                      </div>
                    ))}
                    {availableDefs.length === 0 && (
                      <div className="w-full flex flex-col items-center justify-center text-green-500 py-4 opacity-50">
                        <Star className="w-8 h-8 mb-2" />
                        <span className="font-bold">Semua terpasang!</span>
                      </div>
                    )}
                  </div>

                  {/* Terms Column */}
                  <div className="grid gap-4">
                    {terms.map((term: string, i: number) => {
                      const matchedDef = answersMap[term];
                      return (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border-2 border-slate-200 rounded-2xl bg-white">
                          <div className="md:w-5/12 font-bold text-slate-700 text-lg">
                            {term}
                          </div>
                          <div className="hidden md:block text-slate-300">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              if (draggedItem) {
                                const newAnswers = { ...answersMap, [term]: draggedItem };
                                saveAnswer(currentQ.id, newAnswers);
                                setDraggedItem(null);
                              }
                            }}
                            className={`flex-1 min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center ${
                              matchedDef 
                                ? 'border-blue-400 bg-blue-50 cursor-pointer' 
                                : 'border-slate-300 bg-slate-50'
                            }`}
                            onClick={() => {
                              if (matchedDef) {
                                const newAnswers = { ...answersMap };
                                delete newAnswers[term];
                                saveAnswer(currentQ.id, newAnswers);
                              }
                            }}
                          >
                            {matchedDef ? (
                              <div className="font-bold text-blue-700 text-center">{matchedDef}</div>
                            ) : (
                              <span className="text-slate-400 font-bold text-sm">Tarik jawaban ke sini</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ESSAY */}
            {currentQ?.question_type === 'essay' && (
              <div>
                <textarea 
                  value={responses[currentQ.id] || ""}
                  onChange={(e) => saveAnswer(currentQ.id, e.target.value)}
                  className="w-full min-h-[300px] p-6 rounded-2xl border-2 border-slate-200 text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all resize-y shadow-sm"
                  placeholder="Ketikkan jawabanmu di sini..."
                  maxLength={currentQ.criteria?.maxLength > 0 ? currentQ.criteria.maxLength : undefined}
                />
                <div className="flex justify-between text-sm font-bold text-slate-400 mt-4 px-2">
                  <span>
                    Min: {currentQ.criteria?.minLength || 0} karakter
                    {currentQ.criteria?.maxLength > 0 ? ` • Max: ${currentQ.criteria.maxLength}` : ''}
                  </span>
                  <span className={(responses[currentQ.id] || "").length < (currentQ.criteria?.minLength || 0) ? 'text-red-400' : 'text-green-500'}>
                    {(responses[currentQ.id] || "").length} karakter
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: NUMBER GRID (Desktop) */}
        <div className="hidden lg:flex flex-col w-80 shrink-0">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm sticky top-28">
            <h3 className="font-black text-slate-700 mb-6 uppercase tracking-widest text-sm flex items-center justify-between">
              Navigasi Soal
              <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs">{questions.length} total</span>
            </h3>
            
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q, i) => {
                const ans = responses[q.id];
                let isAnswered = false;
                if (q.question_type === 'mcq' || q.question_type === 'essay') {
                  isAnswered = !!ans && ans.length > 0;
                } else if (q.question_type === 'complex_mcq') {
                  isAnswered = Array.isArray(ans) && ans.length > 0;
                } else if (q.question_type === 'matching') {
                  isAnswered = ans && Object.keys(ans).length > 0;
                }

                const isFlagged = flags[q.id];
                
                let btnStyle = "border-slate-200 text-slate-500 hover:border-slate-300 bg-white";
                if (isFlagged) {
                  btnStyle = "border-yellow-500 bg-yellow-400 text-yellow-900 border-b-4";
                } else if (isAnswered) {
                  btnStyle = "border-blue-500 bg-blue-400 text-white border-b-4";
                }

                if (currentIndex === i) {
                  btnStyle += " ring-4 ring-slate-200 scale-110 z-10";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={`aspect-square rounded-xl font-black text-sm flex items-center justify-center border-2 transition-all ${btnStyle}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-3 text-sm font-bold text-slate-500">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-blue-400 border-2 border-blue-500" />
                Sudah Dijawab
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-yellow-400 border-2 border-yellow-500" />
                Ragu-ragu
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-white border-2 border-slate-200" />
                Belum Dijawab
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 p-4 md:px-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              disabled={currentIndex === 0} 
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className={`p-3 md:px-6 md:py-4 rounded-2xl font-bold border-b-4 transition-all flex items-center gap-2 ${
                currentIndex === 0 
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 active:translate-y-1 active:border-b-0'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
              <span className="hidden md:inline">SEBELUMNYA</span>
            </button>
            
            <button 
              onClick={() => setFlag(currentQ.id)}
              className={`p-3 md:px-6 md:py-4 rounded-2xl font-bold border-b-4 transition-all flex items-center gap-2 ${
                flags[currentQ.id]
                  ? 'bg-yellow-400 text-yellow-900 border-yellow-600 active:translate-y-1 active:border-b-0'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 active:translate-y-1 active:border-b-0'
              }`}
            >
              <Flag className={`w-6 h-6 ${flags[currentQ.id] ? 'fill-current' : ''}`} />
              <span className="hidden md:inline">RAGU-RAGU</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile indicator */}
            <div className="lg:hidden text-sm font-bold text-slate-400">
              {currentIndex + 1} / {questions.length}
            </div>

            {currentIndex === questions.length - 1 ? (
              <button 
                onClick={submitExam} 
                className="px-8 py-4 rounded-2xl font-bold text-white bg-green-500 border-b-4 border-green-700 hover:bg-green-400 active:translate-y-1 active:border-b-0 transition-all flex items-center gap-2 text-lg shadow-lg shadow-green-500/30"
              >
                <span>SELESAI</span>
                <CheckCircle2 className="w-6 h-6" />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentIndex(i => i + 1)}
                className="px-8 py-4 rounded-2xl font-bold text-white bg-blue-500 border-b-4 border-blue-700 hover:bg-blue-400 active:translate-y-1 active:border-b-0 transition-all flex items-center gap-2 text-lg shadow-lg shadow-blue-500/30"
              >
                <span>LANJUT</span>
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
