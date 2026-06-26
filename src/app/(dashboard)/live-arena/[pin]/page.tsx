"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Loader2, Trophy, Shuffle } from "lucide-react";
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

     return (
       <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          
          <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", bounce: 0.5 }}
             className="relative z-10 flex flex-col items-center p-12 bg-white/10 backdrop-blur-xl border border-white/30 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-lg"
          >
             <motion.div 
                animate={{ y: [0, -15, 0] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="w-48 h-48 rounded-full border-8 border-white/50 shadow-2xl overflow-hidden bg-white mb-8"
                dangerouslySetInnerHTML={{ __html: avatarSvg }}
             />
             <h1 className="text-4xl font-black text-white mb-2 text-center drop-shadow-md">You're in, {profile?.full_name?.split(" ")[0]}!</h1>
             <p className="text-xl text-white/80 font-medium text-center mb-8 drop-shadow-sm">Look at the projector. We are waiting for the teacher to start...</p>
             <Button onClick={shuffleAvatar} size="lg" className="rounded-2xl h-16 px-8 text-xl font-black bg-white text-indigo-600 hover:bg-slate-100 hover:scale-105 transition-all shadow-xl" icon={<Shuffle className="w-6 h-6" />}>
                SHUFFLE AVATAR
             </Button>
          </motion.div>
          
          <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3?filename=lofi-study-112191.mp3" />
       </div>
     );
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
     return (
       <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
          <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-3xl p-12 text-center max-w-lg w-full shadow-2xl"
          >
             <h2 className="text-4xl font-black text-indigo-900 mb-4">TIME IS UP!</h2>
             {hasAnswered ? (
                isCorrect ? (
                   <>
                      <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-emerald-600 mb-2">CORRECT</p>
                      <p className="text-xl font-bold text-slate-500">+{pointsEarned} Points</p>
                   </>
                ) : (
                   <>
                      <AlertTriangle className="w-20 h-20 text-rose-500 mx-auto mb-4" />
                      <p className="text-2xl font-bold text-rose-600 mb-2">INCORRECT</p>
                   </>
                )
             ) : (
                <>
                   <p className="text-2xl font-bold text-slate-500 mb-2">You didn't answer in time!</p>
                </>
             )}
             <div className="mt-8 pt-8 border-t-2 border-slate-100">
                <p className="text-lg font-bold text-slate-400">Total Score: <span className="text-indigo-600">{participant?.score}</span></p>
                <p className="text-slate-500 mt-2">Look at the projector for rankings!</p>
             </div>
          </motion.div>
       </div>
     );
  }

  const currentQ = quiz?.questions?.[session?.current_question_index];
  
  if (!currentQ) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
      <motion.div 
        key={session.current_question_index}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
        transition={{ type: "spring", duration: 0.6 }}
        className="max-w-4xl w-full mx-auto space-y-8"
      >
        <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/10/18/audio_31c2730ebb.mp3?filename=sneaky-snitch-114995.mp3" />
        
        {/* Timer Bar */}
        <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden shadow-inner">
           <motion.div 
              className={`h-full ${timeLeft <= 5 ? 'bg-rose-500' : 'bg-indigo-500'}`}
              initial={{ width: "100%" }}
              animate={{ width: `${(timeLeft / 20) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
           />
        </div>

        {!hasAnswered ? (
        <>
          <div className="text-center mb-8">
             <div className="inline-block px-6 py-2 bg-indigo-100 text-indigo-800 rounded-full font-black text-lg mb-6">
                Question {session.current_question_index + 1} of {quiz.questions.length}
             </div>
             <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{currentQ.question_text}</h2>
          </div>
          
          <div className="w-full text-left">
             {currentQ.question_type === "mcq" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {currentQ.options?.map((opt: any, idx: number) => {
                     const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                     const colorClass = colors[idx % colors.length];
                     return (
                       <button 
                         key={idx}
                         onClick={() => submitAnswer(idx)}
                         className={`w-full p-8 rounded-3xl ${colorClass} hover:opacity-90 transition-all text-white font-black text-2xl shadow-xl shadow-slate-200 min-h-[160px] active:scale-95`}
                       >
                         {opt.text}
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
                           className={`w-full p-6 rounded-3xl border-4 transition-all font-bold text-xl min-h-[100px] ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}
                         >
                           {opt.text}
                         </button>
                       );
                     })}
                   </div>
                   <Button onClick={() => submitAnswer()} size="lg" className="w-full h-16 text-xl rounded-2xl bg-indigo-600">Submit Answers</Button>
                </div>
             )}

             {currentQ.question_type === "essay" && (
                <div className="space-y-4">
                   <textarea
                     value={essayAnswer}
                     onChange={(e) => setEssayAnswer(e.target.value)}
                     placeholder="Type your answer here..."
                     className="w-full h-48 p-6 rounded-3xl border-2 border-slate-200 text-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                   />
                   <Button onClick={() => submitAnswer()} disabled={!essayAnswer.trim()} size="lg" className="w-full h-16 text-xl rounded-2xl bg-indigo-600">Submit Essay</Button>
                </div>
             )}

             {currentQ.question_type === "matching" && (
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                   {currentQ.options?.map((opt: any, idx: number) => (
                     <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="flex-1 font-bold text-lg text-slate-800">{opt.text}</div>
                        <select
                          value={matchingAnswers[idx] || ""}
                          onChange={(e) => setMatchingAnswers({ ...matchingAnswers, [idx]: e.target.value })}
                          className="flex-1 p-3 rounded-xl border-2 border-slate-200 outline-none focus:border-indigo-500"
                        >
                          <option value="" disabled>Select match...</option>
                          {/* Shuffle visually or just show all match_pairs */}
                          {currentQ.options.map((o: any, oIdx: number) => (
                             <option key={oIdx} value={o.match_pair}>{o.match_pair}</option>
                          ))}
                        </select>
                     </div>
                   ))}
                   <Button onClick={() => submitAnswer()} size="lg" className="w-full h-16 text-xl rounded-2xl bg-indigo-600 mt-4">Submit Matches</Button>
                </div>
             )}
          </div>
        </>
      ) : (
        <motion.div 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100"
        >
           {isCorrect ? (
             <>
               <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-6">
                 <CheckCircle className="w-12 h-12 text-emerald-600" />
               </div>
               <h2 className="text-4xl font-black text-emerald-600 mb-2">CORRECT!</h2>
               <p className="text-slate-500 font-bold">+{pointsEarned} Points</p>
             </>
           ) : (
             <>
               <div className="w-24 h-24 bg-rose-100 rounded-full mx-auto flex items-center justify-center mb-6">
                 <AlertTriangle className="w-12 h-12 text-rose-600" />
               </div>
               <h2 className="text-4xl font-black text-rose-600 mb-2">INCORRECT</h2>
               <p className="text-slate-500 font-bold">Better luck next question!</p>
             </>
           )}
            <p className="mt-8 font-medium text-slate-400">Waiting for teacher...</p>
        </motion.div>
      )}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
