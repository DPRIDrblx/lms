"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Users, CheckCircle, ArrowRight, Trophy, Volume2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import confetti from "canvas-confetti";

export default function TeacherLiveArenaPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params?.id as string;
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(20);
  
  const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

  const fetchSession = useCallback(async () => {
    if (!profile) return;
    
    // Get Quiz Info
    const { data: qData } = await supabase.from("quizzes").select("*, questions(*)").eq("id", quizId).single();
    if (qData) setQuiz(qData);

    // Get Active Session
    let { data: sData } = await supabase.from("live_quiz_sessions")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("teacher_id", profile.id)
      .neq("status", "finished")
      .single();
      
    if (!sData) {
      // Create new session
      const { data: newSession, error } = await supabase.from("live_quiz_sessions").insert({
        quiz_id: quizId,
        teacher_id: profile.id,
        pin_code: generatePin(),
        status: "waiting",
        current_question_index: -1
      }).select().single();
      
      if (error) { toast.error("Failed to create live session"); return; }
      sData = newSession;
    }
    
    setSession(sData);
    
    // Fetch Participants
    if (sData) {
      const { data: pData } = await supabase.from("live_quiz_participants")
        .select("*, profiles(full_name)")
        .eq("session_id", sData.id)
        .order("score", { ascending: false });
      if (pData) setParticipants(pData);
    }
    
    setLoading(false);
  }, [profile, quizId, supabase]);

  useEffect(() => {
    fetchSession();
    
    if (!session) return;
    
    const channel = supabase.channel(`live_arena_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_quiz_participants', filter: `session_id=eq.${session.id}` }, () => {
        // Refresh participants
        supabase.from("live_quiz_participants").select("*, profiles(full_name)").eq("session_id", session.id).order("score", { ascending: false })
          .then(({ data }: { data: any }) => data && setParticipants(data));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_quiz_sessions', filter: `id=eq.${session.id}` }, (payload: any) => {
         setSession(payload.new);
         if (payload.new.status === "finished") {
             // Fire confetti when finished
             const duration = 3 * 1000;
             const animationEnd = Date.now() + duration;
             const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
             const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
             const interval: any = setInterval(function() {
               const timeLeft = animationEnd - Date.now();
               if (timeLeft <= 0) return clearInterval(interval);
               const particleCount = 50 * (timeLeft / duration);
               confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
               confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
             }, 250);
         }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchSession, supabase, session?.id]);

  // Timer Effect
  useEffect(() => {
     if (session?.status !== "active" || timeLeft <= 0) return;
     const interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
     }, 1000);
     return () => clearInterval(interval);
  }, [session?.status, timeLeft]);

  // Transition to Leaderboard when time is up
  useEffect(() => {
     if (session?.status === "active" && timeLeft === 0) {
        supabase.from("live_quiz_sessions")
           .update({ status: "leaderboard" })
           .eq("id", session.id)
           .then(({ error }: { error: any }) => {
              if (error) {
                 console.error("Failed to update status to leaderboard:", error);
                 alert("GAGAL PINDAH KE LEADERBOARD! Pastikan kamu sudah menjalankan perintah SQL ALTER TABLE di Supabase untuk mengizinkan status 'leaderboard'. Error: " + error.message);
              }
           });
     }
  }, [timeLeft, session?.status, session?.id, supabase]);

  const startQuiz = async () => {
    setTimeLeft(20);
    await supabase.from("live_quiz_sessions").update({ status: "active", current_question_index: 0 }).eq("id", session.id);
  };

  const nextQuestion = async () => {
    if (!quiz || !session) return;
    const isLast = session.current_question_index >= quiz.questions.length - 1;
    if (isLast) {
      await supabase.from("live_quiz_sessions").update({ status: "finished" }).eq("id", session.id);
    } else {
      setTimeLeft(20);
      await supabase.from("live_quiz_sessions").update({ 
         current_question_index: session.current_question_index + 1,
         status: "active"
      }).eq("id", session.id);
    }
  };

  const endQuizEarly = async () => {
    if (confirm("Are you sure you want to end this quiz early?")) {
      await supabase.from("live_quiz_sessions").update({ status: "finished" }).eq("id", session.id);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Initializing Arena...</div>;

  return (
    <div className="min-h-screen -m-8 p-8 bg-slate-900 font-sans relative overflow-hidden">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-90" />
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen" />
      <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-pink-500/20 rounded-full blur-[100px] mix-blend-screen" />
      
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="max-w-[90rem] mx-auto space-y-12 relative z-10">
      {/* Audio Players */}
      {session?.status === "waiting" && (
         <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3?filename=lofi-study-112191.mp3" />
      )}
      {session?.status === "active" && (
         <audio autoPlay loop src="https://cdn.pixabay.com/download/audio/2022/10/18/audio_31c2730ebb.mp3?filename=sneaky-snitch-114995.mp3" />
      )}
      {session?.status === "finished" && (
         <audio autoPlay src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3" />
      )}

      {session?.status === "waiting" ? (
         <div className="flex flex-col items-center justify-start min-h-[85vh] relative z-20 w-full pt-12">
             <div className="w-full text-center p-12 bg-white/10 backdrop-blur-3xl rounded-[3rem] shadow-[0_0_80px_rgba(99,102,241,0.2)] border border-white/20 z-20 max-w-5xl mx-auto mb-16 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-10">
                   <Trophy className="w-80 h-80" />
                </div>
                <div className="inline-block bg-white/10 px-8 py-3 rounded-full border border-white/20 mb-8">
                   <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">JOIN AT <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">ARENA.LMS</span></h1>
                </div>
                <div className="flex flex-col items-center justify-center">
                   <p className="text-2xl text-indigo-200 font-bold mb-2 uppercase tracking-widest">Game PIN:</p>
                   <div className="text-9xl md:text-[12rem] font-black text-white tracking-[0.1em] drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                      {session?.pin_code}
                   </div>
                </div>
             </div>
             
             {/* Participant floating area */}
             <div className="w-full relative flex flex-wrap content-start justify-center gap-8 px-12 pb-32">
                 <AnimatePresence>
                     {participants.map((p, idx) => {
                         const avatarSvg = createAvatar(adventurer, { seed: p.avatar_seed || p.profiles?.full_name || "Hero", backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffdfbf','ffd5dc'] }).toString();
                         return (
                            <motion.div 
                              key={p.id}
                              initial={{ scale: 0, y: 150, rotate: (Math.random() - 0.5) * 60 }}
                              animate={{ scale: 1, y: 0, rotate: (Math.random() - 0.5) * 10 }}
                              exit={{ scale: 0, opacity: 0 }}
                              whileHover={{ scale: 1.2, rotate: 0, zIndex: 50 }}
                              transition={{ type: "spring", stiffness: 150, damping: 12, delay: Math.min(idx * 0.05, 0.5) }}
                              className="flex flex-col items-center cursor-pointer"
                            >
                               <div 
                                 className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white border-8 border-indigo-400 shadow-[0_15px_35px_rgba(0,0,0,0.4)] overflow-hidden flex items-center justify-center transform transition-all"
                                 dangerouslySetInnerHTML={{ __html: avatarSvg }}
                               />
                               <span className="mt-4 font-black text-white bg-indigo-900/90 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-xl text-xl tracking-wide border-2 border-white/20">
                                  {p.profiles?.full_name?.split(" ")[0]}
                               </span>
                            </motion.div>
                         );
                     })}
                 </AnimatePresence>
                 {participants.length === 0 && (
                    <div className="text-white/40 font-bold text-4xl mt-16 animate-pulse">Waiting for players to join...</div>
                 )}
             </div>
             
             <div className="fixed bottom-12 left-12 bg-white/10 backdrop-blur-2xl px-10 py-5 rounded-[2.5rem] border border-white/20 flex items-center gap-6 shadow-2xl">
                 <Users className="w-12 h-12 text-white" />
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-white/70 uppercase tracking-widest">Players</span>
                    <span className="text-5xl font-black text-white leading-none">{participants.length}</span>
                 </div>
             </div>
             
             <div className="fixed bottom-12 right-12 z-50">
                 <Button onClick={startQuiz} size="lg" className="text-4xl h-32 px-24 rounded-[3rem] bg-emerald-500 text-white font-black hover:scale-105 hover:bg-emerald-400 shadow-[0_20px_60px_rgba(16,185,129,0.6)] border-4 border-white/30 transition-all active:scale-95 animate-bounce">
                    START
                 </Button>
             </div>
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 w-full mx-auto">
             <Card className="p-10 border border-white/10 shadow-2xl lg:col-span-2 min-h-[500px] bg-white/10 backdrop-blur-2xl rounded-[3rem]">
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800">
                      <Users className="text-indigo-500 w-8 h-8" /> Participants ({participants.length})
                   </h2>
                   {session?.status === "active" && (
                      <div className="flex items-center gap-4 bg-indigo-50 px-6 py-3 rounded-full">
                         <span className="font-bold text-indigo-900">TIME LEFT:</span>
                         <span className={`text-3xl font-black ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-indigo-600'}`}>
                            {timeLeft}s
                         </span>
                      </div>
                   )}
                </div>
                
                {session?.status !== "leaderboard" && (
                   <div className="flex flex-wrap gap-6 justify-center">
                      <AnimatePresence>
                        {participants.map(p => {
                           const avatarSvg = createAvatar(adventurer, { seed: p.avatar_seed || p.profiles?.full_name || "Hero", backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffdfbf','ffd5dc'] }).toString();
                           return (
                             <motion.div 
                               key={p.id}
                               initial={{ scale: 0, y: 50, opacity: 0 }}
                               animate={{ scale: 1, y: 0, opacity: 1 }}
                               exit={{ scale: 0, opacity: 0 }}
                               whileHover={{ scale: 1.1, y: -10 }}
                               transition={{ type: "spring", stiffness: 300, damping: 15 }}
                               className="flex flex-col items-center gap-3"
                             >
                                <div 
                                  className="w-32 h-32 rounded-full border-4 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] overflow-hidden bg-white flex items-center justify-center"
                                  dangerouslySetInnerHTML={{ __html: avatarSvg }}
                                />
                                <span className="font-black text-white bg-indigo-600 px-4 py-1.5 rounded-full shadow-lg text-sm tracking-wide">
                                   {p.profiles?.full_name?.split(" ")[0]}
                                </span>
                                {session?.status !== "waiting" && (
                                   <span className="text-sm font-black text-yellow-400 drop-shadow-md">{p.score} pts</span>
                                )}
                             </motion.div>
                           );
                        })}
                      </AnimatePresence>
                   </div>
                )}

                {session?.status === "leaderboard" && (
                   <div className="w-full max-w-2xl mx-auto space-y-4">
                      <h3 className="text-3xl font-black text-center mb-8 text-indigo-900 drop-shadow-sm">TOP RANKINGS</h3>
                      <div className="flex flex-col gap-3">
                         <AnimatePresence>
                            {participants.slice(0, 5).map((p, index) => {
                               const avatarSvg = createAvatar(adventurer, { seed: p.avatar_seed || p.profiles?.full_name || "Hero", backgroundColor: ['b6e3f4','c0aede','d1d4f9','ffdfbf','ffd5dc'] }).toString();
                               return (
                                  <motion.div
                                     key={p.id}
                                     layout
                                     initial={{ opacity: 0, x: -50 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     exit={{ opacity: 0, scale: 0.5 }}
                                     transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                     className={`flex items-center justify-between p-4 rounded-2xl shadow-md ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-200 border-2 border-yellow-500' : 'bg-white border border-slate-100'}`}
                                  >
                                     <div className="flex items-center gap-4">
                                        <div className="font-black text-2xl w-8 text-center text-slate-400">{index + 1}</div>
                                        <div className="w-16 h-16 rounded-full bg-white shadow-inner overflow-hidden border-2 border-slate-200" dangerouslySetInnerHTML={{ __html: avatarSvg }} />
                                        <span className={`text-xl font-black ${index === 0 ? 'text-yellow-900' : 'text-slate-700'}`}>{p.profiles?.full_name}</span>
                                     </div>
                                     <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-700' : 'text-indigo-600'}`}>{p.score} pts</span>
                                  </motion.div>
                               );
                            })}
                         </AnimatePresence>
                      </div>
                   </div>
                )}

                {/* End Quiz Button for Teacher */}
                {session?.status !== "waiting" && session?.status !== "finished" && (
                   <div className="mt-8 flex justify-end">
                      <Button onClick={endQuizEarly} variant="danger" className="font-bold border-2 border-red-200">
                         End Quiz Early
                      </Button>
                   </div>
                )}
             </Card>
             
             <Card className="p-10 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col justify-center items-center text-center bg-white/10 backdrop-blur-3xl rounded-[3rem] min-h-[500px]">
                {session?.status === "active" && (
                   <>
                      <div className="text-9xl font-black text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">Q{session.current_question_index + 1}</div>
                      <h3 className="text-3xl font-black mb-8 text-white">
                         {quiz?.questions[session.current_question_index]?.question_text}
                      </h3>
                      {timeLeft <= 5 && <div className="text-rose-400 font-black text-4xl animate-bounce mb-4">{timeLeft} SECONDS!</div>}
                   </>
                )}

                {session?.status === "leaderboard" && (
                   <>
                      <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-pulse" />
                      <h3 className="text-3xl font-black mb-4 text-white">Scores Updated!</h3>
                      <p className="text-indigo-200 font-medium mb-8">Get ready for the next question.</p>
                      <Button onClick={nextQuestion} size="lg" className="w-full text-2xl font-black h-24 rounded-3xl bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.5)] hover:scale-105 transition-all" icon={<ArrowRight className="h-8 w-8" />}>
                         NEXT QUESTION
                      </Button>
                   </>
                )}
                
                {session?.status === "finished" && (
                   <div className="w-full relative min-h-[400px] flex flex-col items-center justify-end pb-8">
                      <h3 className="text-5xl font-black mb-12 text-white drop-shadow-lg absolute top-0">CHAMPIONS!</h3>
                      
                      {/* PODIUM UI */}
                      <div className="flex items-end justify-center gap-4 h-64 mt-20">
                         {/* 2nd Place */}
                         {participants[1] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex flex-col items-center">
                               <div className="w-24 h-24 rounded-full border-4 border-slate-300 bg-white mb-2 overflow-hidden shadow-[0_0_20px_rgba(203,213,225,0.8)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[1].avatar_seed || participants[1].profiles?.full_name || "Hero", backgroundColor: ['b6e3f4'] }).toString() }} />
                               <div className="font-bold text-lg">{participants[1].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-400 font-black mb-2">{participants[1].score} pts</div>
                               <div className="w-32 h-40 bg-gradient-to-t from-slate-400 to-slate-300 rounded-t-lg flex justify-center pt-4 text-4xl font-black text-white/50 shadow-inner">2</div>
                            </motion.div>
                         )}
                         
                         {/* 1st Place */}
                         {participants[0] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, type: "spring", bounce: 0.6 }} className="flex flex-col items-center relative z-10">
                               <div className="absolute -top-12 text-yellow-400 animate-bounce"><Trophy className="w-12 h-12" /></div>
                               <div className="w-32 h-32 rounded-full border-4 border-yellow-400 bg-white mb-2 overflow-hidden shadow-[0_0_40px_rgba(250,204,21,1)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[0].avatar_seed || participants[0].profiles?.full_name || "Hero", backgroundColor: ['ffdfbf'] }).toString() }} />
                               <div className="font-bold text-2xl">{participants[0].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-400 font-black mb-2">{participants[0].score} pts</div>
                               <div className="w-40 h-56 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex justify-center pt-4 text-6xl font-black text-white/50 shadow-inner">1</div>
                            </motion.div>
                         )}
                         
                         {/* 3rd Place */}
                         {participants[2] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex flex-col items-center">
                               <div className="w-20 h-20 rounded-full border-4 border-amber-600 bg-white mb-2 overflow-hidden shadow-[0_0_20px_rgba(217,119,6,0.8)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[2].avatar_seed || participants[2].profiles?.full_name || "Hero", backgroundColor: ['ffd5dc'] }).toString() }} />
                               <div className="font-bold">{participants[2].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-400 font-black mb-2">{participants[2].score} pts</div>
                               <div className="w-28 h-32 bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-lg flex justify-center pt-4 text-3xl font-black text-white/50 shadow-inner">3</div>
                            </motion.div>
                         )}
                      </div>
                      
                      <Button onClick={() => router.push(`/teacher/quizzes`)} variant="secondary" size="lg" className="w-full h-16 rounded-3xl font-black text-xl mt-12 bg-white text-indigo-900 hover:bg-slate-200 hover:scale-105 transition-all">Back to Quizzes</Button>
                   </div>
                )}
             </Card>
         </div>
      )}
      </div>
    </div>
  );
}
