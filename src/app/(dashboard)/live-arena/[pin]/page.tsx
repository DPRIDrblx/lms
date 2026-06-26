"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Loader2, Trophy, Shuffle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import confetti from "canvas-confetti";

export default function LiveArenaPlayPage() {
  const params = useParams();
  const router = useRouter();
  const pin = params?.pin as string;
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [session, setSession] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [complexSelection, setComplexSelection] = useState<number[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [pointsEarned, setPointsEarned] = useState(0);

  const fetchInitial = useCallback(async () => {
    if (!profile) return;
    
    // 1. Get Session by PIN
    const { data: sData, error: sError } = await supabase.from("live_quiz_sessions").select("*").eq("pin_code", pin).single();
    if (sError || !sData) {
      toast.error("Invalid PIN code.");
      router.push("/live-arena");
      return;
    }
    setSession(sData);

    // 2. Fetch Quiz
    const { data: qData } = await supabase.from("quizzes").select("*, questions(*)").eq("id", sData.quiz_id).single();
    if (qData) setQuiz(qData);
    
    // 3. Join Participant
    let { data: pData } = await supabase.from("live_quiz_participants").select("*").eq("session_id", sData.id).eq("student_id", profile.id).single();
    if (!pData) {
       const { data: newParticipant } = await supabase.from("live_quiz_participants").insert({
         session_id: sData.id,
         student_id: profile.id,
         score: 0
       }).select().single();
       pData = newParticipant;
    }
    setParticipant(pData);
    setLoading(false);
  }, [profile, pin, router, supabase]);

  useEffect(() => {
    fetchInitial();
    
    if (!session?.id) return;
    
    const channel = supabase.channel(`live_arena_${session.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_quiz_sessions', filter: `id=eq.${session.id}` }, (payload: any) => {
         // If question changes, reset answer state
         if (payload.new.current_question_index !== session.current_question_index) {
            setHasAnswered(false);
            setIsCorrect(null);
            setEssayAnswer("");
            setComplexSelection([]);
            setMatchingAnswers({});
            setTimeLeft(20);
         }
         
         // If status becomes active, make sure time is 20
         if (payload.new.status === "active" && session.status !== "active") {
            setTimeLeft(20);
         }

         setSession(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_quiz_participants', filter: `id=eq.${participant?.id}` }, (payload: any) => {
         setParticipant(payload.new);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchInitial, supabase, session?.id, session?.current_question_index, participant?.id, session?.status]);

  // Timer Effect for Student
  useEffect(() => {
     if (session?.status !== "active" || timeLeft <= 0 || hasAnswered) return;
     const interval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
     }, 1000);
     return () => clearInterval(interval);
  }, [session?.status, timeLeft, hasAnswered]);

  const submitAnswer = async (selectedOptionIndex?: number) => {
    if (hasAnswered || !quiz || !session || !participant) return;
    
    const currentQ = quiz.questions[session.current_question_index];
    if (!currentQ) return;
    
    let correct = false;

    if (currentQ.question_type === "mcq") {
       const selectedOpt = currentQ.options[selectedOptionIndex!];
       correct = selectedOpt?.is_correct === true;
    } else if (currentQ.question_type === "essay") {
       correct = essayAnswer.length > 10; // Simple validation for essay
    } else if (currentQ.question_type === "complex_mcq") {
       const correctIndices = currentQ.options.map((o: any, i: number) => o.is_correct ? i : -1).filter((i: number) => i !== -1);
       correct = complexSelection.length === correctIndices.length && complexSelection.every(i => correctIndices.includes(i));
    } else if (currentQ.question_type === "matching") {
       correct = currentQ.options.every((opt: any, idx: number) => matchingAnswers[idx] === opt.match_pair);
    }

    setIsCorrect(correct);
    setHasAnswered(true);
    
    if (correct) {
      // Calculate score based on speed: base 500 + speed up to 500
      const speedBonus = Math.max(0, Math.round((timeLeft / 20) * 500));
      const earned = 500 + speedBonus;
      setPointsEarned(earned);
      const newScore = (participant.score || 0) + earned;
      await supabase.from("live_quiz_participants").update({ score: newScore }).eq("id", participant.id);
    } else {
      setPointsEarned(0);
    }
  };

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>;

  if (session?.status === "waiting") {
     const avatarSvg = createAvatar(adventurer, { seed: participant?.avatar_seed || profile?.full_name || "Hero", backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffdfbf','ffd5dc'] }).toString();
     
     const shuffleAvatar = async () => {
        const newSeed = Math.random().toString(36).substring(7);
        await supabase.from("live_quiz_participants").update({ avatar_seed: newSeed }).eq("id", participant?.id);
     };

       <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900 font-sans">
          {/* Animated Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-80" />
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen" />
          <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-pink-500/20 rounded-full blur-[100px] mix-blend-screen" />
          
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
             className="relative z-10 flex flex-col items-center p-12 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] shadow-[0_0_80px_rgba(99,102,241,0.3)] w-full max-w-lg"
          >
             <motion.div 
                whileHover={{ scale: 1.1, rotate: 10 }}
                animate={{ y: [0, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-48 h-48 rounded-[3rem] border-4 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm mb-8 relative p-2"
             >
                <div className="absolute inset-0 bg-white/10 rounded-[3rem] blur-xl animate-pulse" />
                <div 
                   className="w-full h-full rounded-[2.5rem] bg-white overflow-hidden relative z-10"
                   dangerouslySetInnerHTML={{ __html: avatarSvg }}
                />
             </motion.div>
             <h1 className="text-5xl font-black text-white mb-3 text-center drop-shadow-lg tracking-tight">You're in, <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">{profile?.full_name?.split(" ")[0]}!</span></h1>
             <p className="text-xl text-indigo-200 font-medium text-center mb-10 drop-shadow-sm">Look at the projector. We are waiting for the teacher to start...</p>
             <Button onClick={shuffleAvatar} size="lg" className="rounded-full h-16 px-10 text-xl font-black bg-white/10 hover:bg-white/20 border border-white/30 text-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur-md" icon={<Shuffle className="w-6 h-6" />}>
                SHUFFLE AVATAR
             </Button>
          </motion.div>
          
          <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3?filename=lofi-study-112191.mp3" />
       </div>
  }

  if (session?.status === "finished") {
     if (participant?.score > 0) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
     }
     
     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
          
          <motion.div 
             initial={{ scale: 0.5, opacity: 0, y: 100 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             transition={{ type: "spring", damping: 12, stiffness: 100 }}
             className="relative z-10 flex flex-col items-center bg-white/10 backdrop-blur-2xl p-16 rounded-[4rem] border border-white/20 shadow-[0_0_100px_rgba(79,70,229,0.5)]"
          >
             <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Trophy className="w-40 h-40 text-yellow-400 mb-8 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
             </motion.div>
             <h1 className="text-6xl font-black mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600">EPIC FINISH!</h1>
             <p className="text-3xl font-bold mb-10 text-slate-300">Total Score: <span className="text-yellow-400 text-5xl font-black ml-2">{participant?.score}</span></p>
             <Button onClick={() => router.push("/dashboard")} size="lg" className="rounded-3xl h-20 px-12 text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-110 transition-all shadow-2xl">Return to Dashboard</Button>
          </motion.div>
          
          <audio autoPlay src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3" />
       </div>
     );
  }

  if (session?.status === "leaderboard") {
       <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
          {/* Animated Gradient Mesh for Leaderboard */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-purple-900 to-slate-900 animate-gradient-xy opacity-80"></div>
          <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen" />
          
          <motion.div 
             initial={{ scale: 0, opacity: 0, y: 50 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
             className="relative z-10 bg-white/10 backdrop-blur-2xl rounded-[3rem] p-12 md:p-16 text-center max-w-2xl w-full shadow-[0_0_80px_rgba(99,102,241,0.2)] border border-white/20"
          >
             <h2 className="text-3xl font-black text-indigo-200 mb-12 tracking-widest uppercase drop-shadow-sm">Time is up!</h2>
             {hasAnswered ? (
                isCorrect ? (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                      <div className="relative inline-block mb-8">
                         <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-50 rounded-full" />
                         <CheckCircle className="w-32 h-32 md:w-40 md:h-40 text-emerald-400 relative z-10 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                      </div>
                      <p className="text-5xl md:text-6xl font-black text-emerald-300 mb-2 tracking-widest uppercase drop-shadow-md">CORRECT</p>
                      <p className="text-3xl font-bold text-emerald-100/80 bg-emerald-900/30 inline-block px-6 py-2 rounded-full border border-emerald-500/30 mt-4">+{pointsEarned} Points</p>
                   </motion.div>
                ) : (
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                      <div className="relative inline-block mb-8">
                         <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-50 rounded-full" />
                         <AlertTriangle className="w-32 h-32 md:w-40 md:h-40 text-rose-500 relative z-10 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
                      </div>
                      <p className="text-5xl md:text-6xl font-black text-rose-400 mb-2 tracking-widest uppercase drop-shadow-md">INCORRECT</p>
                   </motion.div>
                )
             ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                   <div className="relative inline-block mb-8">
                      <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-50 rounded-full" />
                      <Clock className="w-32 h-32 md:w-40 md:h-40 text-amber-500 relative z-10 drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]" />
                   </div>
                   <p className="text-5xl md:text-6xl font-black text-amber-400 mb-2 tracking-widest uppercase drop-shadow-md">TOO SLOW!</p>
                </motion.div>
             )}
             
             <div className="mt-16 pt-8 border-t border-white/10 flex flex-col items-center">
                <p className="text-xl font-bold text-white/50 uppercase tracking-widest mb-4">Total Score</p>
                <div className="bg-slate-900/50 border border-white/10 px-12 py-4 rounded-full shadow-inner">
                   <p className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">{participant?.score}</p>
                </div>
                <p className="text-indigo-300 mt-8 font-medium animate-pulse">Look at the projector for rankings...</p>
             </div>
          </motion.div>
       </div>
  }

  const currentQ = quiz?.questions?.[session?.current_question_index];
  
  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 opacity-90" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      
      <AnimatePresence mode="wait">
      <motion.div 
        key={session.current_question_index}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
        transition={{ type: "spring", duration: 0.6 }}
        className="max-w-4xl w-full mx-auto space-y-6 relative z-10 flex flex-col h-[90vh]"
      >
        <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/10/18/audio_31c2730ebb.mp3?filename=sneaky-snitch-114995.mp3" />
        
        {/* Timer Bar */}
        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner border border-white/10 shrink-0">
           <motion.div 
              className={`h-full ${timeLeft <= 5 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)]' : 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]'}`}
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / 20) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
           />
        </div>

        {!hasAnswered ? (
        <>
          <div className="text-center shrink-0 mt-4">
             <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md text-indigo-200 border border-white/20 rounded-full font-black text-sm mb-4 tracking-widest uppercase shadow-sm">
                Question {session.current_question_index + 1} of {quiz.questions.length}
             </div>
             <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">{currentQ.question_text}</h2>
          </div>
          
          <div className="w-full flex-1 flex flex-col justify-end pb-8">
             {currentQ.question_type === "mcq" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                    {currentQ.options?.map((opt: any, idx: number) => {
                     // Vibrant Pop Colors
                     const colors = [
                        'from-rose-500 to-rose-600 border-rose-700 shadow-[0_10px_0_rgb(190,18,60)]', 
                        'from-sky-500 to-sky-600 border-sky-700 shadow-[0_10px_0_rgb(3,105,161)]', 
                        'from-amber-400 to-amber-500 border-amber-600 shadow-[0_10px_0_rgb(217,119,6)]', 
                        'from-emerald-500 to-emerald-600 border-emerald-700 shadow-[0_10px_0_rgb(4,120,87)]'
                     ];
                     const hoverColors = [
                        'hover:from-rose-400 hover:to-rose-500', 
                        'hover:from-sky-400 hover:to-sky-500', 
                        'hover:from-amber-300 hover:to-amber-400', 
                        'hover:from-emerald-400 hover:to-emerald-500'
                     ];
                     const colorClass = colors[idx % colors.length];
                     const hoverClass = hoverColors[idx % colors.length];
                     return (
                       <button 
                         key={idx}
                         onClick={() => submitAnswer(idx)}
                         className={`w-full p-8 rounded-[2rem] bg-gradient-to-b ${colorClass} ${hoverClass} transition-all text-white font-black text-3xl md:text-4xl active:translate-y-2 active:shadow-[0_0px_0_rgb(0,0,0)] border-t border-x border-white/20 flex flex-col items-center justify-center drop-shadow-xl group min-h-[160px]`}
                       >
                         <span className="relative z-10">{opt.text}</span>
                       </button>
                     );
                    })}
                </div>
             )}

             {currentQ.question_type === "complex_mcq" && (
                <div className="space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {currentQ.options?.map((opt: any, idx: number) => {
                       const isSelected = complexSelection.includes(idx);
                       return (
                         <button 
                           key={idx}
                           onClick={() => setComplexSelection(prev => isSelected ? prev.filter(i => i !== idx) : [...prev, idx])}
                           className={`w-full p-6 rounded-3xl border-4 transition-all font-bold text-xl min-h-[100px] shadow-lg ${isSelected ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'}`}
                         >
                           {opt.text}
                         </button>
                       );
                     })}
                   </div>
                   <Button onClick={() => submitAnswer()} size="lg" className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 shadow-[0_8px_0_rgb(67,56,202)] active:translate-y-2 active:shadow-[0_0px_0_rgb(67,56,202)] border-t border-white/20 transition-all text-white">SUBMIT ANSWERS</Button>
                </div>
             )}

             {currentQ.question_type === "essay" && (
                <div className="space-y-4">
                   <textarea
                     value={essayAnswer}
                     onChange={(e) => setEssayAnswer(e.target.value)}
                     placeholder="Type your answer here..."
                     className="w-full h-48 p-8 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md text-white text-2xl font-bold placeholder:text-white/30 focus:border-indigo-500 focus:bg-white/20 focus:ring-4 focus:ring-indigo-500/30 outline-none resize-none shadow-inner"
                   />
                   <Button onClick={() => submitAnswer()} disabled={!essayAnswer.trim()} size="lg" className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 shadow-[0_8px_0_rgb(67,56,202)] active:translate-y-2 active:shadow-[0_0px_0_rgb(67,56,202)] border-t border-white/20 transition-all text-white disabled:bg-slate-700 disabled:shadow-[0_8px_0_rgb(51,65,85)] disabled:opacity-50">SUBMIT ESSAY</Button>
                </div>
             )}

             {currentQ.question_type === "matching" && (
                <div className="space-y-4 bg-white/10 backdrop-blur-md p-6 md:p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
                   {currentQ.options?.map((opt: any, idx: number) => (
                     <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex-1 font-bold text-xl text-white">{opt.text}</div>
                        <select
                          value={matchingAnswers[idx] || ""}
                          onChange={(e) => setMatchingAnswers({ ...matchingAnswers, [idx]: e.target.value })}
                          className="flex-1 p-4 rounded-xl border border-white/20 bg-slate-900 text-white font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                        >
                          <option value="" disabled className="text-slate-500">Select match...</option>
                          {currentQ.options.map((o: any, oIdx: number) => (
                             <option key={oIdx} value={o.match_pair}>{o.match_pair}</option>
                          ))}
                        </select>
                     </div>
                   ))}
                   <Button onClick={() => submitAnswer()} size="lg" className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 shadow-[0_8px_0_rgb(67,56,202)] active:translate-y-2 active:shadow-[0_0px_0_rgb(67,56,202)] border-t border-white/20 transition-all text-white mt-8">SUBMIT MATCHES</Button>
                </div>
             )}
          </div>
        </>
      ) : (
        <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-full max-w-4xl mx-auto flex items-center justify-center h-full"
        >
           <div className="text-center p-12 md:p-24 bg-white/10 backdrop-blur-3xl rounded-[3rem] shadow-[0_0_80px_rgba(99,102,241,0.2)] relative overflow-hidden border border-white/20 w-full">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <Loader2 className="w-32 h-32 text-indigo-400 animate-spin mx-auto mb-10 drop-shadow-lg" />
             <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">WAITING FOR OTHERS...</h2>
             <p className="text-indigo-200 text-xl md:text-2xl font-bold mt-6">You're fast! Sit tight until time runs out.</p>
           </div>
        </motion.div>
      )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
