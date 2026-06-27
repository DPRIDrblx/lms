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
  // Use a stable supabase instance
  const [supabase] = useState(() => createClient());
  
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [mode, setMode] = useState<"classic" | "boss_raid" | "battle_royale" | "war_of_factions">("classic");
  const [activeWars, setActiveWars] = useState<any[]>([]);
  const [selectedWarId, setSelectedWarId] = useState<string | null>(null);
  const [activeWarInfo, setActiveWarInfo] = useState<any>(null);
  
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
        current_question_index: -1,
        mode: mode,
        boss_hp: mode === 'boss_raid' ? (qData?.questions.length * 1000) : null,
        max_boss_hp: mode === 'boss_raid' ? (qData?.questions.length * 1000) : null
      }).select().single();
      
      if (error) { toast.error("Failed to create live session"); return; }
      sData = newSession;
    }
    
    setSession(sData);
    
    // Fetch Participants (with class_id via profiles)
    if (sData) {
      const { data: pData } = await supabase.from("live_quiz_participants")
        .select("*, profiles(full_name, class_id)")
        .eq("session_id", sData.id)
        .order("score", { ascending: false });
      if (pData) setParticipants(pData);
    }
    
    // Fetch Active Wars if mode is war_of_factions
    const { data: wData } = await supabase.from("faction_wars").select("*, challenger:classes!faction_wars_challenger_class_id_fkey(name), defender:classes!faction_wars_defender_class_id_fkey(name)").eq("status", "pending");
    if (wData) setActiveWars(wData);
    
    if (sData?.faction_war_id) {
       const { data: cwData } = await supabase.from("faction_wars").select("*, challenger:classes!faction_wars_challenger_class_id_fkey(name), defender:classes!faction_wars_defender_class_id_fkey(name)").eq("id", sData.faction_war_id).single();
       if (cwData) setActiveWarInfo(cwData);
    }
    
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, quizId, mode]);

  useEffect(() => {
    fetchSession();
    
    if (!session) return;
    
    const channel = supabase.channel(`live_arena_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_quiz_participants', filter: `session_id=eq.${session.id}` }, () => {
        // Refresh participants
        supabase.from("live_quiz_participants").select("*, profiles(full_name, class_id)").eq("session_id", session.id).order("score", { ascending: false })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSession, session?.id]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [timeLeft, session?.status, session?.id]);

  const handleModeChange = async (newMode: "classic" | "boss_raid" | "battle_royale" | "war_of_factions") => {
    setMode(newMode);
    if (session) {
      await supabase.from("live_quiz_sessions").update({ 
         mode: newMode,
         boss_hp: newMode === 'boss_raid' ? (quiz?.questions.length * 1000) : null,
         max_boss_hp: newMode === 'boss_raid' ? (quiz?.questions.length * 1000) : null,
         faction_war_id: newMode === 'war_of_factions' ? selectedWarId : null
      }).eq("id", session.id);
    }
  };

  const handleWarSelect = async (warId: string) => {
      setSelectedWarId(warId);
      if (session && mode === 'war_of_factions') {
          await supabase.from("live_quiz_sessions").update({ faction_war_id: warId }).eq("id", session.id);
          // Fetch and set active info
          const { data: cwData } = await supabase.from("faction_wars").select("*, challenger:classes!faction_wars_challenger_class_id_fkey(name), defender:classes!faction_wars_defender_class_id_fkey(name)").eq("id", warId).single();
          if (cwData) setActiveWarInfo(cwData);
      }
  };

  const startQuiz = async () => {
    setTimeLeft(20);
    await supabase.from("live_quiz_sessions").update({ status: "active", current_question_index: 0 }).eq("id", session.id);
    if (session.mode === 'war_of_factions' && session.faction_war_id) {
        await supabase.from("faction_wars").update({ status: 'active', quiz_id: quizId }).eq("id", session.faction_war_id);
    }
  };

  const nextQuestion = async () => {
    if (!quiz || !session) return;
    const isLast = session.current_question_index >= quiz.questions.length - 1;
    if (isLast) {
      await supabase.from("live_quiz_sessions").update({ status: "finished" }).eq("id", session.id);
      if (session.mode === 'war_of_factions' && session.faction_war_id) {
          // Calculate winner and update zone ownership
          const challengerAP = participants.filter(p => p.profiles?.class_id === activeWarInfo?.challenger_class_id).reduce((sum, p) => sum + p.score, 0);
          const defenderAP = participants.filter(p => p.profiles?.class_id === activeWarInfo?.defender_class_id).reduce((sum, p) => sum + p.score, 0);
          
          await supabase.from("faction_wars").update({ 
              status: 'finished',
              challenger_ap: challengerAP,
              defender_ap: defenderAP
          }).eq("id", session.faction_war_id);
          
          if (challengerAP > defenderAP) {
              await supabase.from("territory_zones").update({ controlling_class_id: activeWarInfo?.challenger_class_id }).eq("id", activeWarInfo?.zone_id);
          }
      }
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
    <div className="min-h-screen -m-8 p-8 bg-slate-50 font-sans relative overflow-hidden">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 opacity-80" />
      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-indigo-300/30 rounded-full blur-[120px] mix-blend-multiply" />
      <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -bottom-[20%] right-[10%] w-[50vw] h-[50vw] bg-pink-300/30 rounded-full blur-[100px] mix-blend-multiply" />
      
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
             <div className="w-full text-center p-12 bg-white/70 backdrop-blur-xl rounded-[3rem] shadow-[0_20px_60px_rgba(99,102,241,0.15)] border border-white z-20 max-w-5xl mx-auto mb-16 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-10">
                   <Trophy className="w-80 h-80 text-slate-500" />
                </div>
                <div className="inline-block bg-white px-8 py-3 rounded-full border border-slate-200 mb-8 shadow-sm">
                   <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm">JOIN AT <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">ARENA.LMS</span></h1>
                </div>
                <div className="flex flex-col items-center justify-center">
                   <p className="text-2xl text-slate-500 font-bold mb-2 uppercase tracking-widest">Game PIN:</p>
                   <div className="text-9xl md:text-[12rem] font-black text-slate-900 tracking-[0.1em] drop-shadow-sm">
                      {session?.pin_code}
                   </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-2xl mx-auto">
                  <button 
                    onClick={() => handleModeChange('classic')} 
                    className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${mode === 'classic' ? 'bg-indigo-50 text-indigo-600 border-indigo-500 shadow-[0_4px_0_rgb(79,70,229)]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    🎯 Classic
                  </button>
                  <button 
                    onClick={() => handleModeChange('boss_raid')} 
                    className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${mode === 'boss_raid' ? 'bg-red-50 text-red-600 border-red-500 shadow-[0_4px_0_rgb(239,68,68)]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    🐲 Boss Raid
                  </button>
                  <button 
                    onClick={() => handleModeChange('battle_royale')} 
                    className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${mode === 'battle_royale' ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-500 shadow-[0_4px_0_rgb(217,70,239)]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    ⚔️ Battle Royale
                  </button>
                  <button 
                    onClick={() => handleModeChange('war_of_factions')} 
                    className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${mode === 'war_of_factions' ? 'bg-amber-50 text-amber-600 border-amber-500 shadow-[0_4px_0_rgb(245,158,11)]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
                  >
                    🔥 War of Factions
                  </button>
                </div>
                
                {mode === 'war_of_factions' && (
                    <div className="mt-6 max-w-xl mx-auto bg-amber-50 p-6 rounded-2xl border-2 border-amber-200 shadow-inner">
                        <p className="text-amber-800 font-bold mb-3">Pilih Deklarasi Perang Aktif:</p>
                        {activeWars.length === 0 ? (
                            <p className="text-amber-600 text-sm">Tidak ada deklarasi perang yang tertunda.</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {activeWars.map(war => (
                                    <button 
                                        key={war.id} 
                                        onClick={() => handleWarSelect(war.id)}
                                        className={`w-full p-4 rounded-xl text-left border-2 transition-all ${selectedWarId === war.id ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-slate-700 border-amber-200 hover:border-amber-400'}`}
                                    >
                                        <p className="font-black">{war.challenger?.name} ⚔️ {war.defender?.name || 'Netral'}</p>
                                        <p className={`text-xs ${selectedWarId === war.id ? 'text-amber-200' : 'text-slate-500'}`}>Memperebutkan Zona ID: {war.zone_id.slice(0,8)}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
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
                               <span className="mt-4 font-black text-slate-700 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-sm text-xl tracking-wide border border-slate-200">
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
             
             <div className="fixed bottom-12 left-12 bg-white/80 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] border border-white flex items-center gap-6 shadow-[0_20px_40px_rgba(99,102,241,0.1)]">
                 <Users className="w-12 h-12 text-slate-700" />
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Players</span>
                    <span className="text-5xl font-black text-slate-900 leading-none">{participants.length}</span>
                 </div>
             </div>
             
             <div className="fixed bottom-12 right-12 z-50">
                 <Button onClick={startQuiz} size="lg" className="text-4xl h-32 px-24 rounded-[3rem] bg-emerald-500 text-white font-black hover:scale-105 hover:bg-emerald-400 shadow-[0_20px_60px_rgba(16,185,129,0.6)] border-4 border-white/30 transition-all active:scale-95 animate-bounce">
                    START
                 </Button>
             </div>
         </div>
      ) : (
         <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto z-10 relative">
             {session?.mode === 'boss_raid' && (
               <div className="w-full bg-slate-900 rounded-[2rem] p-6 shadow-2xl border-4 border-slate-700 flex flex-col items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                 <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-4 z-10 uppercase tracking-widest">RAID BOSS: GURU</h2>
                 <div className="w-full h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-600 relative z-10">
                   <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500 shadow-[0_0_20px_rgba(220,38,38,0.8)]" style={{ width: `${Math.max(0, (session.boss_hp / session.max_boss_hp) * 100)}%` }}></div>
                   <div className="absolute inset-0 flex items-center justify-center font-black text-white text-sm text-shadow-sm">
                     {session.boss_hp} / {session.max_boss_hp} HP
                   </div>
                 </div>
               </div>
             )}
             
             {session?.mode === 'war_of_factions' && activeWarInfo && (
                <div className="w-full bg-slate-900 rounded-[2rem] p-6 shadow-2xl border-4 border-slate-700 flex flex-col relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl -ml-20 -mt-20"></div>
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                   
                   <h2 className="text-3xl font-black text-center text-white mb-6 z-10 uppercase tracking-widest flex items-center justify-center gap-4">
                      🔥 WAR OF FACTIONS 🔥
                   </h2>
                   
                   <div className="flex justify-between items-end mb-2 z-10 px-4">
                      <div className="text-left">
                         <p className="text-rose-400 font-bold uppercase text-sm tracking-widest mb-1">Challenger</p>
                         <p className="text-2xl font-black text-white">{activeWarInfo.challenger?.name}</p>
                         <p className="text-xl font-bold text-rose-300 mt-1">
                            {participants.filter(p => p.profiles?.class_id === activeWarInfo.challenger_class_id).reduce((sum, p) => sum + p.score, 0)} AP
                         </p>
                      </div>
                      <div className="text-right">
                         <p className="text-emerald-400 font-bold uppercase text-sm tracking-widest mb-1">Defender</p>
                         <p className="text-2xl font-black text-white">{activeWarInfo.defender?.name || 'Netral'}</p>
                         <p className="text-xl font-bold text-emerald-300 mt-1">
                            {participants.filter(p => p.profiles?.class_id === activeWarInfo.defender_class_id).reduce((sum, p) => sum + p.score, 0)} AP
                         </p>
                      </div>
                   </div>
                   
                   <div className="w-full h-10 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-600 relative z-10 flex shadow-inner">
                      {(() => {
                          const challengerAP = participants.filter(p => p.profiles?.class_id === activeWarInfo.challenger_class_id).reduce((sum, p) => sum + p.score, 0);
                          const defenderAP = participants.filter(p => p.profiles?.class_id === activeWarInfo.defender_class_id).reduce((sum, p) => sum + p.score, 0);
                          const totalAP = challengerAP + defenderAP || 1;
                          const challengerPct = (challengerAP / totalAP) * 100;
                          return (
                             <>
                                <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500 shadow-[0_0_20px_rgba(225,29,72,0.8)]" style={{ width: `${challengerPct}%` }}></div>
                                <div className="h-full bg-gradient-to-l from-emerald-600 to-emerald-400 transition-all duration-500 shadow-[0_0_20px_rgba(16,185,129,0.8)] flex-1"></div>
                             </>
                          );
                      })()}
                   </div>
                </div>
             )}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative w-full">
             <Card className="p-10 border border-white shadow-[0_20px_60px_rgba(99,102,241,0.15)] lg:col-span-2 min-h-[500px] bg-white/70 backdrop-blur-xl rounded-[3rem]">
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
                                <span className="font-black text-white bg-indigo-500 px-4 py-1.5 rounded-full shadow-md text-sm tracking-wide">
                                   {p.profiles?.full_name?.split(" ")[0]}
                                </span>
                                {session?.status !== "waiting" && (
                                   <span className="text-sm font-black text-yellow-600 drop-shadow-sm">{p.score} pts</span>
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
             
             <Card className="p-10 border border-white shadow-[0_20px_60px_rgba(99,102,241,0.15)] flex flex-col justify-center items-center text-center bg-white/70 backdrop-blur-xl rounded-[3rem] min-h-[500px]">
                {session?.status === "active" && (
                   <>
                      <div className="text-9xl font-black text-yellow-500 mb-6 drop-shadow-sm">Q{session.current_question_index + 1}</div>
                      <h3 className="text-3xl font-black mb-8 text-slate-900">
                         {quiz?.questions[session.current_question_index]?.question_text}
                      </h3>
                      {timeLeft <= 5 && <div className="text-rose-500 font-black text-4xl animate-bounce mb-4">{timeLeft} SECONDS!</div>}
                   </>
                )}

                {session?.status === "leaderboard" && (
                   <>
                      <Trophy className="w-24 h-24 text-yellow-500 mb-6 animate-pulse" />
                      <h3 className="text-3xl font-black mb-4 text-slate-900">Scores Updated!</h3>
                      <p className="text-slate-500 font-medium mb-8">Get ready for the next question.</p>
                      <Button onClick={nextQuestion} size="lg" className="w-full text-2xl font-black h-24 rounded-3xl bg-indigo-600 hover:bg-indigo-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:scale-105 transition-all" icon={<ArrowRight className="h-8 w-8" />}>
                         NEXT QUESTION
                      </Button>
                   </>
                )}
                
                {session?.status === "finished" && (
                   <div className="w-full relative min-h-[400px] flex flex-col items-center justify-end pb-8">
                      <h3 className="text-5xl font-black mb-12 text-slate-900 drop-shadow-sm absolute top-0">CHAMPIONS!</h3>
                      
                      {/* PODIUM UI */}
                      <div className="flex items-end justify-center gap-4 h-64 mt-20">
                         {/* 2nd Place */}
                         {participants[1] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex flex-col items-center">
                               <div className="w-24 h-24 rounded-full border-4 border-slate-300 bg-white mb-2 overflow-hidden shadow-[0_10px_20px_rgba(203,213,225,0.5)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[1].avatar_seed || participants[1].profiles?.full_name || "Hero", backgroundColor: ['b6e3f4'] }).toString() }} />
                               <div className="font-bold text-lg text-slate-700">{participants[1].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-600 font-black mb-2">{participants[1].score} pts</div>
                               <div className="w-32 h-40 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-lg flex justify-center pt-4 text-4xl font-black text-white/80 shadow-inner">2</div>
                            </motion.div>
                         )}
                         
                         {/* 1st Place */}
                         {participants[0] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, type: "spring", bounce: 0.6 }} className="flex flex-col items-center relative z-10">
                               <div className="absolute -top-12 text-yellow-500 animate-bounce"><Trophy className="w-12 h-12" /></div>
                               <div className="w-32 h-32 rounded-full border-4 border-yellow-500 bg-white mb-2 overflow-hidden shadow-[0_10px_30px_rgba(250,204,21,0.5)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[0].avatar_seed || participants[0].profiles?.full_name || "Hero", backgroundColor: ['ffdfbf'] }).toString() }} />
                               <div className="font-bold text-2xl text-slate-800">{participants[0].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-600 font-black mb-2">{participants[0].score} pts</div>
                               <div className="w-40 h-56 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg flex justify-center pt-4 text-6xl font-black text-white/80 shadow-inner">1</div>
                            </motion.div>
                         )}
                         
                         {/* 3rd Place */}
                         {participants[2] && (
                            <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: "spring" }} className="flex flex-col items-center">
                               <div className="w-20 h-20 rounded-full border-4 border-amber-500 bg-white mb-2 overflow-hidden shadow-[0_10px_20px_rgba(217,119,6,0.3)]" dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: participants[2].avatar_seed || participants[2].profiles?.full_name || "Hero", backgroundColor: ['ffd5dc'] }).toString() }} />
                               <div className="font-bold text-slate-700">{participants[2].profiles?.full_name?.split(" ")[0]}</div>
                               <div className="text-yellow-600 font-black mb-2">{participants[2].score} pts</div>
                               <div className="w-28 h-32 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex justify-center pt-4 text-3xl font-black text-white/80 shadow-inner">3</div>
                            </motion.div>
                         )}
                      </div>
                      
                      <Button onClick={() => router.push(`/teacher/quizzes`)} variant="secondary" size="lg" className="w-full h-16 rounded-3xl font-black text-xl mt-12 bg-slate-900 text-white hover:bg-slate-800 hover:scale-105 transition-all shadow-md">Back to Quizzes</Button>
                   </div>
                )}
             </Card>
         </div>
         </div>
      )}
      </div>
    </div>
  );
}
