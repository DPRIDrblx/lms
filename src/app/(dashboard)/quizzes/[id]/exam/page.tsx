"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback, useRef } from "react";
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, PlayCircle, Star, Target, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "@/lib/audio";
import { updateQuestProgress } from "@/lib/gamification";
import { Mascot } from "@/components/ui/mascot";

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
  const [isPaused, setIsPaused] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [needsManualGrading, setNeedsManualGrading] = useState(false);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);
  const [cheatAlert, setCheatAlert] = useState<{show: boolean, type: 'warning' | 'fatal'}>({show: false, type: 'warning'});
  const [confirmModal, setConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void, isAlert?: boolean}>({show: false, title: '', message: '', onConfirm: () => {}});
  const isAlertOpen = useRef(false);

  const [reportModal, setReportModal] = useState<{ show: boolean, description: string }>({ show: false, description: '' });

  // Drag and drop state for matching
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const [isSubmittingToAI, setIsSubmittingToAI] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<Record<string, boolean>>({});
  
  // New Practice Mode states
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");

  const initExam = useCallback(async () => {
    if (!profile) return;
    
    const [qData, qsData] = await Promise.all([
      supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
      supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })
    ]);

    if (qData.data) setQuiz(qData.data);
    let qList = qsData.data ? (qsData.data as any[]) : [];

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
      
      const mode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
      const isPractice = mode === 'practice';
      setIsPracticeMode(isPractice);

      let totalSeconds;
      if (isPractice) {
         totalSeconds = qData.data?.practice_time_limit_minutes > 0 ? qData.data.practice_time_limit_minutes * 60 : -1;
      } else {
         totalSeconds = qData.data?.time_limit_minutes > 0 ? qData.data.time_limit_minutes * 60 : (qData.data?.time_limit > 0 ? qData.data.time_limit * 60 : -1);
      }

      if (isPractice) {
         qList = qList.filter(q => q.question_type !== 'essay');
      }

      const startedAt = existing.metadata?.started_at ? new Date(existing.metadata.started_at).getTime() : Date.now();
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setTimeLeft(totalSeconds === -1 ? -1 : Math.max(0, totalSeconds - elapsedSeconds));
      
      if (qData.data?.shuffle_questions) {
        const savedOrder = existing.metadata?.question_order;
        if (savedOrder && Array.isArray(savedOrder)) {
          qList.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        } else {
          qList = [...qList].sort(() => Math.random() - 0.5);
        }
      }
      setQuestions(qList);
      
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
      const mode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mode') : null;
      const isPractice = mode === 'practice';
      setIsPracticeMode(isPractice);

      let totalSeconds;
      if (isPractice) {
         totalSeconds = qData.data?.practice_time_limit_minutes > 0 ? qData.data.practice_time_limit_minutes * 60 : -1;
      } else {
         totalSeconds = qData.data?.time_limit_minutes > 0 ? qData.data.time_limit_minutes * 60 : (qData.data?.time_limit > 0 ? qData.data.time_limit * 60 : -1);
      }

      if (isPractice) {
         qList = qList.filter(q => q.question_type !== 'essay');
      }

      if (qData.data?.shuffle_questions) {
        qList = [...qList].sort(() => Math.random() - 0.5);
      }
      setQuestions(qList);
      
      const questionOrder = qList.map(q => q.id);

      const { data: newSession } = await supabase.from("exam_sessions").insert({
        student_id: profile.id,
        quiz_id: id,
        time_left_seconds: totalSeconds === -1 ? 999999 : totalSeconds,
        status: 'in_progress',
        metadata: { started_at: new Date().toISOString(), question_order: questionOrder, is_practice: isPractice }
      }).select().single();
      
      if (newSession) {
        setSession(newSession);
        setTimeLeft(totalSeconds);
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

    channel.on('broadcast', { event: 'exam_pause' }, (payload: any) => {
      setIsPaused(payload.payload.isPaused);
    });

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
    if (timeLeft < 0 || loading || isFinished || isPaused) return; // -1 means unlimited
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); submitExam(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, isFinished, isPaused]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isFinished && !loading) {
        e.preventDefault();
        e.returnValue = '';
        
        setCheatWarnings(prev => {
          const newWarnings = prev + 1;
          if (presenceChannel && profile) {
             presenceChannel.track({
               student_id: profile.id,
               student_name: profile.full_name,
               status: 'Warning: Page Refresh Attempted',
               warnings: newWarnings,
               last_ping: new Date().toISOString()
             });
          }
          return newWarnings;
        });
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFinished, loading, presenceChannel, profile]);

  useEffect(() => {
    const handleBlur = () => {
      if (!isFinished && !loading && !isAlertOpen.current && !isPracticeMode) {
        isAlertOpen.current = true;
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
             setCheatAlert({ show: true, type: 'fatal' });
             submitExam(true);
          } else {
             setCheatAlert({ show: true, type: 'warning' });
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
    playSound('click');
    const newResponses = { ...responses, [qId]: answer };
    setResponses(newResponses);
    
    // Practice Mode auto-reveal removed for linear mode
    
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id,
      quiz_id: id,
      question_id: qId,
      metadata: { answer },
      is_flagged: flags[qId] || false
    }, { onConflict: 'student_id,question_id' });
  };

  const setFlag = async (qId: string) => {
    playSound('click');
    const val = !flags[qId];
    const newFlags = { ...flags, [qId]: val };
    setFlags(newFlags);
    
    await supabase.from("quiz_responses").update({ is_flagged: val }).eq("student_id", profile?.id).eq("question_id", qId);
  };

  const handleCheckAnswer = () => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIndex];
    const answer = responses[currentQ.id];
    if (!answer) return;

    let correct = false;
    if (currentQ.question_type === 'mcq') {
      const correctOpt = currentQ.options?.find((o: any) => o.is_correct);
      if (correctOpt && correctOpt.id === answer) correct = true;
    } else if (currentQ.question_type === 'complex_mcq') {
      const correctIds = currentQ.options?.filter((o: any) => o.is_correct).map((o: any) => o.id).sort().join(',');
      const answerIds = [...answer].sort().join(',');
      if (correctIds === answerIds) correct = true;
    } else if (currentQ.question_type === 'matching') {
      const answersMap = answer || {};
      const defs = currentQ.options?.map((o: any) => o.match_pair);
      let allCorrect = true;
      currentQ.options?.forEach((o: any) => {
        if (answersMap[o.text] !== o.match_pair) allCorrect = false;
      });
      if (allCorrect) correct = true;
    }

    setIsCorrect(correct);
    setHasChecked(true);
    setIsAnswerRevealed(prev => ({ ...prev, [currentQ.id]: true }));
    playSound(correct ? 'correct' : 'incorrect');
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setHasChecked(false);
      setIsCorrect(null);
      setIsChatOpen(false);
      setChatMessages([]);
    }
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || aiChatLoading) return;

    const currentQ = questions[currentIndex];
    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setAiChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionContext: {
            text: currentQ.text,
            options: JSON.stringify(currentQ.options),
            studentAnswer: JSON.stringify(responses[currentQ.id]),
            correctAnswer: currentQ.question_type === 'mcq' ? currentQ.options?.find((o: any) => o.is_correct)?.text : 'Lihat opsi benar',
            explanation: currentQ.explanation
          },
          messages: newMessages
        })
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages([...newMessages, { role: 'model', content: data.message }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiChatLoading(false);
    }
  };


  const submitExam = async (skipConfirm = false) => {
    if (!skipConfirm && timeLeft > 0) {
      setConfirmModal({
        show: true,
        title: 'Kumpulkan Ujian?',
        message: 'Apakah Anda yakin ingin mengakhiri ujian ini? Anda tidak bisa mengubah jawaban setelah dikumpulkan.',
        onConfirm: () => {
          setConfirmModal(prev => ({...prev, show: false}));
          submitExam(true);
        }
      });
      return;
    }
    
    if (timeLeft > 0 && quiz?.min_time_to_submit > 0) {
      const totalTimeSeconds = (quiz?.time_limit || quiz?.time_limit_minutes || 60) * 60;
      const elapsedSeconds = totalTimeSeconds - timeLeft;
      const minTimeSeconds = quiz.min_time_to_submit * 60;
      if (elapsedSeconds < minTimeSeconds) {
        setConfirmModal({
          show: true,
          title: 'Belum Bisa Kumpul',
          message: `Anda belum dapat mengumpulkan ujian. Waktu pengerjaan minimal adalah ${quiz.min_time_to_submit} menit.`,
          onConfirm: () => setConfirmModal(prev => ({...prev, show: false})),
          isAlert: true
        });
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
        if (responses[q.id] === correctOpt?.text) totalScore += q.points;
      } else if (q.question_type === "complex_mcq") {
        const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
        const userOpts = responses[q.id] || [];
        if (correctOpts.length > 0 && correctOpts.every((c: any) => userOpts.includes(c)) && userOpts.every((u: string) => correctOpts.includes(u))) {
          totalScore += q.points;
        }
      } else if (q.question_type === "matching") {
        const userMatches = responses[q.id] || {};
        const totalPairs = q.options?.length || 1;
        let matches = 0;
        q.options?.forEach((o: any) => {
          if (userMatches[o.text] === o.match_pair) matches++;
        });
        totalScore += (matches / totalPairs) * q.points;
      } else if (q.question_type === "essay") {
        hasEssay = true;
      }
    });

    // finalizeSubmission is defined below and will be called appropriately.
    if (hasEssay) {
      setIsSubmittingToAI(true);
      let isFinalizedLocally = false;
      
      const intervalId = setInterval(() => {
        if (isFinalizedLocally) {
          clearInterval(intervalId);
          return;
        }
        setConfirmModal({
          show: true,
          title: 'Koreksi AI Butuh Waktu',
          message: 'AI masih sibuk mengoreksi jawaban essay Anda. Klik BATAL untuk tetap menunggu, atau klik YA, LANJUTKAN untuk kumpulkan tanpa koreksi AI (guru akan mengoreksi manual).',
          onConfirm: () => {
            isFinalizedLocally = true;
            clearInterval(intervalId);
            setConfirmModal(prev => ({...prev, show: false}));
            finalizeSubmission(totalScore, hasEssay, null);
          },
          isAlert: false
        });
      }, 15000); // Popup every 15 seconds

      try {
        const res = await fetch('/api/ai/grade-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizTitle: quiz?.title,
            questions,
            responses,
            studentName: profile?.full_name
          })
        });

        clearInterval(intervalId);

        if (!isFinalizedLocally) {
          isFinalizedLocally = true;
          setConfirmModal(prev => ({...prev, show: false})); // close modal if it was currently open
          if (res.ok) {
            const aiData = await res.json();
            if (aiData.essayScores) {
              Object.values(aiData.essayScores).forEach((score: any) => {
                totalScore += Number(score) || 0;
              });
            }
            finalizeSubmission(totalScore, hasEssay, aiData);
          } else {
            finalizeSubmission(totalScore, hasEssay, null);
          }
        }
      } catch (error) {
        clearInterval(intervalId);
        if (!isFinalizedLocally) {
          isFinalizedLocally = true;
          console.error("AI grading failed", error);
          finalizeSubmission(totalScore, hasEssay, null);
        }
      }
    } else {
      finalizeSubmission(totalScore, false, null);
    }
  };

  const finalizeSubmission = async (totalScore: number, hasEssay: boolean, aiData: any) => {
    setIsSubmittingToAI(false);

    let finalResponses = { ...responses };
    if (aiData?.essayFeedback) {
      // Append feedback to responses metadata
      Object.keys(aiData.essayFeedback).forEach(qId => {
        if (!finalResponses[qId]) finalResponses[qId] = {};
        if (typeof finalResponses[qId] === 'string') {
          finalResponses[qId] = { answer: finalResponses[qId], ai_feedback: aiData.essayFeedback[qId], ai_score: aiData.essayScores?.[qId] };
        } else {
          finalResponses[qId].ai_feedback = aiData.essayFeedback[qId];
          if (aiData.essayScores?.[qId] !== undefined) finalResponses[qId].ai_score = aiData.essayScores[qId];
        }
      });
    }

    const isGraded = aiData ? true : !hasEssay;

    const payload: any = {
      student_id: profile?.id,
      target_id: id,
      target_type: isPracticeMode ? "quiz_practice" : "quiz",
      score: totalScore,
      is_graded: isGraded,
      metadata: { 
        responses: finalResponses,
        ai_analysis: aiData?.generalAnalysis || null,
        flags,
        cheatWarnings,
        submitted_at: new Date().toISOString()
      }, 
      graded_at: isGraded ? new Date().toISOString() : null
    };

    if (isPracticeMode && quiz?.save_practice_scores === false) {
       // Do not save to student_scores if save_practice_scores is false
    } else {
       await supabase.from("student_scores").upsert(payload, { onConflict: "student_id,target_id" });
    }
    if (quiz?.course_id) {
       await supabase.from("course_progress").upsert({
          student_id: profile?.id,
          course_id: quiz.course_id,
          lesson_id: id,
          completed: true,
          completed_at: new Date().toISOString()
       }, { onConflict: "student_id,lesson_id" });
    }

    setFinalScore(totalScore);
    // User requested: "Selesai tapi guru masih bisa edit nilai essay". So needsManualGrading is false since it's "Selesai"
    setNeedsManualGrading(!isGraded);
    setIsFinished(true);
    playSound('finish');
    
    if (profile?.id) {
      updateQuestProgress(supabase, profile.id, 'score_cbt', 1).catch(console.error);
    }
  };

  const submitReport = async () => {
    if (!reportModal.description.trim()) return;
    try {
      await supabase.from('question_reports').insert({
        question_id: currentQ.id,
        student_id: profile?.id,
        description: reportModal.description
      });
      setReportModal({ show: false, description: '' });
      playSound('correct');
      setConfirmModal({ 
        show: true, 
        isAlert: true, 
        title: 'Laporan Terkirim', 
        message: 'Terima kasih atas laporan Anda. Guru akan segera meninjaunya.', 
        onConfirm: () => setConfirmModal(prev => ({...prev, show: false})) 
      });
    } catch (e) {
      console.error(e);
      setConfirmModal({ 
        show: true, 
        isAlert: true, 
        title: 'Gagal', 
        message: 'Laporan gagal dikirim.', 
        onConfirm: () => setConfirmModal(prev => ({...prev, show: false})) 
      });
    }
  };

  const refreshQuestion = async (qId: string) => {
    try {
      const { data } = await supabase.from('questions').select('*').eq('id', qId).single();
      if (data) {
        setQuestions(prev => prev.map(q => q.id === qId ? data : q));
        playSound('click');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (loading || isSubmittingToAI) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-4 text-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        {isSubmittingToAI && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xs">
            <h3 className="font-bold text-slate-800 text-lg mb-2">AI Sedang Mengoreksi...</h3>
            <p className="text-sm text-slate-500">Gemini AI sedang membaca dan memberikan penilaian pada jawaban essay Anda. Mohon tunggu sebentar.</p>
          </motion.div>
        )}
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
               {quiz?.show_score === false ? (
                 <div className="text-2xl font-black text-slate-500 py-4">
                   Nilai Anda disembunyikan oleh Guru.
                 </div>
               ) : needsManualGrading ? (
                  <div>
                    <div className="text-5xl font-black text-yellow-500">
                      {finalScore !== null ? finalScore : "?"} <span className="text-2xl text-slate-300">/ {quiz?.max_score}</span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-4 font-bold bg-yellow-100/50 p-2 rounded-xl inline-block">
                      Menunggu Penilaian Guru (Ada Soal Essay)
                    </p>
                  </div>
               ) : (
                  <div>
                    <div className={`text-6xl font-black ${isPassed ? 'text-green-500' : 'text-red-500'}`}>
                      {finalScore} <span className="text-2xl text-slate-300">/ {quiz?.max_score}</span>
                    </div>
                  </div>
               )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => router.push(quiz?.course_id ? `/courses/${quiz.course_id}` : '/dashboard')}
                className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 active:translate-y-1 text-slate-700 font-bold rounded-2xl border-b-4 border-slate-400 transition-all text-lg"
              >
                KEMBALI
              </button>
              {(quiz?.show_answers || quiz?.show_explanation) && (
                <button 
                  onClick={() => router.push(`/quizzes/${id}/review`)}
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 active:translate-y-1 text-white font-bold rounded-2xl border-b-4 border-blue-700 transition-all text-lg"
                >
                  LIHAT PEMBAHASAN
                </button>
              )}
            </div>
         </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col relative overflow-hidden">
      
      {/* BACKGROUND WATERMARK (REPEATING TILE ON TOP) */}
      <div 
        className="fixed inset-0 z-[60] pointer-events-none select-none opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-size='32' font-family='sans-serif' font-weight='900' fill='%23000' text-anchor='middle' dominant-baseline='middle' transform='rotate(-45 200 200)'%3EIGNITE - ${encodeURIComponent(profile?.full_name || 'STUDENT')}%3C/text%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '400px 400px'
        }}
      />

      {/* PAUSE MODAL */}
      <AnimatePresence>
        {isPaused && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-2xl border-2 border-slate-200 text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-yellow-100 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                Ujian Di-Pause
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Guru sedang menjeda ujian ini. Waktu Anda juga terhenti sementara. Harap tunggu instruksi selanjutnya.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHEAT WARNING MODAL */}
      <AnimatePresence>
        {cheatAlert.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl border-4 border-red-500 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                {cheatAlert.type === 'fatal' ? 'PELANGGARAN!' : 'PERINGATAN KECURANGAN!'}
              </h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                {cheatAlert.type === 'fatal' 
                  ? 'Ujian ini tidak mengizinkan Anda meninggalkan halaman! Ujian Anda telah dikumpulkan secara otomatis.' 
                  : 'Anda terdeteksi telah meninggalkan halaman ujian. Aktivitas ini telah dicatat oleh sistem pengawas.'}
              </p>
              
              {cheatAlert.type === 'warning' && (
                <button 
                  onClick={() => {
                    setCheatAlert({ show: false, type: 'warning' });
                    // Use a small timeout before allowing blur events again to prevent immediate re-trigger
                    setTimeout(() => { isAlertOpen.current = false; }, 500);
                  }}
                  className="w-full py-4 bg-red-500 hover:bg-red-400 active:bg-red-600 active:translate-y-1 text-white font-bold rounded-2xl border-b-4 border-red-700 transition-all text-lg"
                >
                  SAYA MENGERTI
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM MODAL (Duolingo Style) */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-2xl border-2 border-slate-200 text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                {confirmModal.title}
              </h2>
              <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                {confirmModal.message}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    confirmModal.onConfirm();
                  }}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 active:translate-y-1 text-white font-bold rounded-2xl border-b-4 border-blue-700 transition-all text-lg"
                >
                  {confirmModal.isAlert ? 'SAYA MENGERTI' : 'YA, LANJUTKAN'}
                </button>
                
                {!confirmModal.isAlert && (
                  <button 
                    onClick={() => setConfirmModal(prev => ({...prev, show: false}))}
                    className="w-full py-4 bg-white hover:bg-slate-50 active:bg-slate-100 active:translate-y-1 text-slate-500 font-bold rounded-2xl border-2 border-slate-200 border-b-4 transition-all text-lg"
                  >
                    TIDAK, BATAL
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT QUESTION MODAL */}
      <AnimatePresence>
        {reportModal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl border-2 border-slate-200 relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                <Flag className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                Laporkan Soal
              </h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                Apakah ada masalah dengan soal ini (misal: gambar tidak muncul, jawaban salah semua, atau soal ambigu)? Jelaskan kendalanya.
              </p>
              
              <textarea
                value={reportModal.description}
                onChange={(e) => setReportModal(prev => ({...prev, description: e.target.value}))}
                className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all resize-none mb-6 text-sm"
                placeholder="Ketikkan laporan Anda di sini..."
              />
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={submitReport}
                  disabled={!reportModal.description.trim()}
                  className="w-full py-4 bg-red-500 hover:bg-red-400 active:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl border-b-4 border-red-700 transition-all text-sm"
                >
                  KIRIM LAPORAN
                </button>
                <button 
                  onClick={() => setReportModal({ show: false, description: '' })}
                  className="w-full py-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-500 font-bold rounded-2xl border-2 border-slate-200 border-b-4 transition-all text-sm"
                >
                  BATAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER PROGRESS (Duolingo Style) */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-slate-100 px-4 py-4 md:px-8 flex items-center gap-4 md:gap-8 shadow-sm">
        <button 
          onClick={() => setConfirmModal({
            show: true, 
            title: 'Keluar Ujian?', 
            message: 'Kembali ke dashboard? Ujian akan tetap berjalan dan waktu terus berjalan.', 
            onConfirm: () => router.push('/dashboard')
          })}
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

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 md:p-8 gap-8 relative z-10">
        
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

          <div className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed mb-8 relative">
            <div dangerouslySetInnerHTML={{ __html: currentQ?.question_text }} />
            {currentQ?.id && (
              <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => refreshQuestion(currentQ.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors opacity-80 hover:opacity-100 font-sans font-bold"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                  <button 
                    onClick={() => setReportModal({ show: true, description: '' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors opacity-80 hover:opacity-100 font-sans font-bold"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Laporkan Soal
                  </button>
                </div>
                <div className="flex items-center gap-1 opacity-60">
                  <span>ID Soal:</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{currentQ.id}</span>
                </div>
              </div>
            )}
          </div>

          {/* RENDER QUESTION BY TYPE */}
          <div className="flex-1">
            {/* MCQ */}
            {currentQ?.question_type === 'mcq' && (
              <div className="grid gap-3">
                {currentQ.options?.map((opt: any, i: number) => {
                  const isSelected = responses[currentQ.id] === opt.text;
                  const isRevealed = isPracticeMode && isAnswerRevealed[currentQ.id];
                  
                  let btnColorClass = isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                  let letterColorClass = isSelected ? 'border-blue-500 text-blue-600 bg-white' : 'border-slate-300 text-slate-500';
                  let textColorClass = isSelected ? 'text-blue-900' : 'text-slate-700';

                  if (isRevealed) {
                    if (opt.is_correct) {
                      btnColorClass = 'border-green-500 bg-green-50';
                      letterColorClass = 'border-green-500 text-green-600 bg-white';
                      textColorClass = 'text-green-900 font-bold';
                    } else if (isSelected) {
                      btnColorClass = 'border-red-500 bg-red-50';
                      letterColorClass = 'border-red-500 text-red-600 bg-white';
                      textColorClass = 'text-red-900 line-through opacity-70';
                    } else {
                      btnColorClass = 'border-slate-200 bg-slate-50 opacity-50';
                      letterColorClass = 'border-slate-300 text-slate-400';
                      textColorClass = 'text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isRevealed}
                      onClick={() => saveAnswer(currentQ.id, opt.text)}
                      className={`text-left w-full p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${btnColorClass}`}
                      style={{
                        borderBottomWidth: isSelected && !isRevealed ? '2px' : '4px',
                        transform: isSelected && !isRevealed ? 'translateY(2px)' : 'none'
                      }}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border-2 ${letterColorClass}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className={`text-lg font-medium flex-1 ${textColorClass}`}>
                        {opt.text}
                      </span>
                      {isRevealed && opt.is_correct && <CheckCircle2 className="w-6 h-6 text-green-500" />}
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
                  const isRevealed = isPracticeMode && isAnswerRevealed[currentQ.id];
                  
                  const toggleSelect = () => {
                    let newArr = [...selectedArr];
                    if (isSelected) newArr = newArr.filter((item: string) => item !== opt.text);
                    else newArr.push(opt.text);
                    saveAnswer(currentQ.id, newArr);
                  };

                  let btnColorClass = isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                  let iconClass = isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white';
                  let textColorClass = isSelected ? 'text-blue-900' : 'text-slate-700';

                  if (isRevealed) {
                    if (opt.is_correct) {
                       btnColorClass = 'border-green-500 bg-green-50';
                       iconClass = 'border-green-500 bg-green-500 text-white';
                       textColorClass = 'text-green-900 font-bold';
                    } else if (isSelected) {
                       btnColorClass = 'border-red-500 bg-red-50';
                       iconClass = 'border-red-500 bg-red-500 text-white';
                       textColorClass = 'text-red-900 line-through opacity-70';
                    } else {
                       btnColorClass = 'border-slate-200 bg-slate-50 opacity-50';
                       iconClass = 'border-slate-300 bg-white';
                       textColorClass = 'text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isRevealed}
                      onClick={toggleSelect}
                      className={`text-left w-full p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${btnColorClass}`}
                      style={{
                        borderBottomWidth: isSelected && !isRevealed ? '2px' : '4px',
                        transform: isSelected && !isRevealed ? 'translateY(2px)' : 'none'
                      }}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 ${iconClass}`}>
                        {(isSelected || (isRevealed && opt.is_correct)) && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className={`text-lg font-medium flex-1 ${textColorClass}`}>
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
                      const correctDef = currentQ.options?.find((o: any) => o.text === term)?.match_pair;
                      const isCorrect = matchedDef === correctDef;
                      const isRevealed = isPracticeMode && isAnswerRevealed[currentQ.id];

                      let boxClass = matchedDef ? 'border-blue-400 bg-blue-50 cursor-pointer' : 'border-slate-300 bg-slate-50';
                      let textClass = 'text-blue-700';

                      if (isRevealed) {
                        if (isCorrect) {
                           boxClass = 'border-green-500 bg-green-50';
                           textClass = 'text-green-700 font-bold';
                        } else if (matchedDef) {
                           boxClass = 'border-red-500 bg-red-50';
                           textClass = 'text-red-700 line-through opacity-80';
                        }
                      }

                      return (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-4 border-2 border-slate-200 rounded-2xl bg-white">
                          <div className="md:w-5/12 font-bold text-slate-700 text-lg">
                            {term}
                          </div>
                          <div className="hidden md:block text-slate-300">
                            <ChevronRight className="w-6 h-6" />
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <div 
                              onDragOver={(e) => !isRevealed && e.preventDefault()}
                              onDrop={(e) => {
                                if (draggedItem && !isRevealed) {
                                  const newAnswers = { ...answersMap, [term]: draggedItem };
                                  saveAnswer(currentQ.id, newAnswers);
                                  setDraggedItem(null);
                                }
                              }}
                              className={`min-h-[60px] p-3 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center ${boxClass}`}
                            >
                              {matchedDef ? (
                                <div className="flex items-center justify-between w-full">
                                  <span className={`font-bold ${textClass}`}>{matchedDef}</span>
                                  {!isRevealed && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newAnswers = { ...answersMap };
                                        delete newAnswers[term];
                                        saveAnswer(currentQ.id, newAnswers);
                                      }}
                                      className="text-blue-400 hover:text-red-500 p-1 bg-white rounded-full shadow-sm ml-2"
                                    >
                                      X
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-medium text-sm">Tarik ke sini</span>
                              )}
                            </div>
                            {isRevealed && !isCorrect && (
                              <div className="text-sm font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-200 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Benar: {correctDef}
                              </div>
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

        {/* RIGHT PANEL: NUMBER GRID (Mobile & Desktop) */}
        {!isPracticeMode && (
        <div className="flex flex-col w-full lg:w-80 shrink-0">
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
        )}

      </main>

      {/* BOTTOM ACTION BAR (CBT MODE) */}
      {!isPracticeMode && (
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
              <div className="lg:hidden text-sm font-bold text-slate-400">
                {currentIndex + 1} / {questions.length}
              </div>

              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={() => {
                    const answeredCount = questions.filter(q => {
                      const ans = responses[q.id];
                      if (q.question_type === 'mcq' || q.question_type === 'essay') return !!ans && ans.length > 0;
                      if (q.question_type === 'complex_mcq') return Array.isArray(ans) && ans.length > 0;
                      if (q.question_type === 'matching') return ans && Object.keys(ans).length > 0;
                      return false;
                    }).length;

                    if (answeredCount < questions.length) {
                      setConfirmModal({
                        show: true,
                        isAlert: true,
                        title: 'Belum Selesai!',
                        message: `Ada ${questions.length - answeredCount} soal yang belum dijawab. Harap jawab semua soal sebelum mengumpulkan.`,
                        onConfirm: () => setConfirmModal(prev => ({...prev, show: false}))
                      });
                    } else {
                      setConfirmModal({
                        show: true,
                        title: 'Kumpulkan Ujian?',
                        message: 'Anda yakin ingin mengumpulkan ujian ini? Anda tidak dapat mengubah jawaban lagi.',
                        onConfirm: () => {
                          setConfirmModal(prev => ({...prev, show: false}));
                          submitExam();
                        }
                      });
                    }
                  }} 
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
      )}

      {/* BOTTOM ACTION BAR (PRACTICE MODE) */}
      {isPracticeMode && currentQ && (
        <div className={`fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300 ${
          hasChecked ? (isCorrect ? 'bg-green-100 border-t-2 border-green-300' : 'bg-red-100 border-t-2 border-red-300') : 'bg-white border-t-2 border-slate-200'
        } shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-8">
            {hasChecked ? (
              <div className="flex items-start gap-4">
                <Mascot state={isCorrect ? 'correct' : 'incorrect'} className="hidden md:block w-20 h-20 shrink-0 -mt-8" />
                <div className="flex flex-col gap-1">
                  <div className={`font-black text-2xl ${isCorrect ? 'text-green-700' : 'text-red-700'} flex items-center gap-2`}>
                    {isCorrect ? <><CheckCircle2 className="w-7 h-7" /> Luar Biasa!</> : <><AlertTriangle className="w-7 h-7" /> Yah, Kurang Tepat!</>}
                  </div>
                  <div className={`text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {currentQ.explanation ? (
                      <span dangerouslySetInnerHTML={{ __html: currentQ.explanation }} />
                    ) : (
                      <span>{isCorrect ? 'Kerja bagus, kamu paham konsepnya.' : 'Jawabanmu belum sesuai dengan kunci.'}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}
            
            <div className="flex items-center gap-3 self-end md:self-auto shrink-0 mt-4 md:mt-0">
              {!hasChecked ? (
                <button
                  disabled={!responses[currentQ.id] || (Array.isArray(responses[currentQ.id]) && responses[currentQ.id].length === 0)}
                  onClick={handleCheckAnswer}
                  className="px-8 py-4 rounded-2xl font-bold text-white bg-green-500 border-b-4 border-green-700 hover:bg-green-400 active:translate-y-1 active:border-b-0 transition-all flex items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  CEK JAWABAN
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-white border-2 border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Tanya AI
                  </button>
                  {currentIndex === questions.length - 1 ? (
                    <button
                      onClick={() => submitExam()}
                      className={`px-8 py-4 rounded-2xl font-bold text-white ${isCorrect ? 'bg-green-500 border-b-4 border-green-700 hover:bg-green-400' : 'bg-red-500 border-b-4 border-red-700 hover:bg-red-400'} active:translate-y-1 active:border-b-0 transition-all flex items-center gap-2 text-lg`}
                    >
                      SELESAI
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className={`px-8 py-4 rounded-2xl font-bold text-white ${isCorrect ? 'bg-green-500 border-b-4 border-green-700 hover:bg-green-400' : 'bg-red-500 border-b-4 border-red-700 hover:bg-red-400'} active:translate-y-1 active:border-b-0 transition-all flex items-center gap-2 text-lg`}
                    >
                      LANJUT
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI CHAT MODAL */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border-4 border-indigo-100"
            >
              {/* Header */}
              <div className="bg-indigo-500 p-4 md:p-6 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl">Tutor AI</h3>
                    <p className="text-indigo-100 text-sm font-medium">Bahas soal ini bersama AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="bg-indigo-600/50 hover:bg-indigo-600 p-2 rounded-xl transition-colors"
                >
                  <AlertCircle className="w-6 h-6 rotate-45" /> {/* Use as close icon */}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                    <Mascot state="idle" className="w-24 h-24" />
                    <div>
                      <p className="font-bold text-slate-500">Ada yang bingung dari penjelasan tadi?</p>
                      <p className="text-sm text-slate-400">Tanyakan saja padaku!</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-500 text-white rounded-br-sm'
                        : 'bg-white border-2 border-slate-200 text-slate-700 rounded-bl-sm'
                    }`}>
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                ))}
                {aiChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={sendChatMessage} className="p-4 bg-white border-t-2 border-slate-100 shrink-0">
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border-2 border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tanya soal ini..."
                    className="flex-1 bg-transparent px-4 py-2 outline-none text-slate-700 font-medium"
                    disabled={aiChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || aiChatLoading}
                    className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
