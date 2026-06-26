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
import { funEmoji } from '@dicebear/collection';

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
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchSession, supabase, session?.id]);

  const startQuiz = async () => {
    await supabase.from("live_quiz_sessions").update({ status: "active", current_question_index: 0 }).eq("id", session.id);
  };

  const nextQuestion = async () => {
    if (!quiz || !session) return;
    const nextIdx = session.current_question_index + 1;
    if (nextIdx >= quiz.questions.length) {
      await supabase.from("live_quiz_sessions").update({ status: "finished" }).eq("id", session.id);
    } else {
      await supabase.from("live_quiz_sessions").update({ current_question_index: nextIdx }).eq("id", session.id);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Initializing Arena...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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

      <div className="text-center p-12 bg-indigo-600 rounded-3xl shadow-2xl text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy className="w-48 h-48" />
         </div>
         <h1 className="text-5xl font-black tracking-tight mb-4">JOIN AT: ARENA.LMS</h1>
         <p className="text-xl font-bold opacity-80 mb-6">Enter this PIN Code:</p>
         <div className="inline-block px-12 py-6 bg-white text-indigo-900 rounded-3xl text-7xl font-black tracking-widest shadow-inner">
            {session?.pin_code}
         </div>
      </div>
      
      {session?.status === "waiting" && (
        <div className="text-center mb-8">
           <Button onClick={startQuiz} size="lg" className="text-2xl h-20 px-16 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 font-black animate-pulse">
              START ARENA
           </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="p-8 border-none shadow-xl lg:col-span-2 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <Users className="text-indigo-500 w-8 h-8" /> Participants ({participants.length})
               </h2>
            </div>
            
            <div className="flex flex-wrap gap-6 justify-center">
               <AnimatePresence>
                 {participants.map(p => {
                    const avatarSvg = createAvatar(funEmoji, { seed: p.avatar_seed || p.profiles?.full_name || "Hero" }).toString();
                    return (
                      <motion.div 
                        key={p.id}
                        initial={{ scale: 0, y: 50, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="flex flex-col items-center gap-2"
                      >
                         <div 
                           className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
                           dangerouslySetInnerHTML={{ __html: avatarSvg }}
                         />
                         <span className="font-black text-slate-700 bg-white px-3 py-1 rounded-full shadow-sm text-sm">
                            {p.profiles?.full_name?.split(" ")[0]}
                         </span>
                         {session?.status !== "waiting" && (
                            <span className="text-xs font-bold text-indigo-600">{p.score} pts</span>
                         )}
                      </motion.div>
                    );
                 })}
               </AnimatePresence>
               {participants.length === 0 && (
                  <div className="text-slate-400 font-bold text-xl w-full text-center py-20 flex flex-col items-center">
                     <Users className="w-16 h-16 opacity-20 mb-4" />
                     Waiting for players to join...
                  </div>
               )}
            </div>
         </Card>
         
         <Card className="p-8 border-none shadow-xl flex flex-col justify-center items-center text-center bg-gradient-to-b from-indigo-50 to-white">
            {session?.status === "waiting" && (
               <>
                  <Volume2 className="w-16 h-16 text-indigo-300 mb-6 animate-pulse" />
                  <h3 className="text-2xl font-bold mb-2 text-indigo-900">Lobby Music</h3>
                  <p className="text-indigo-500/70 font-medium">Turn up the volume and wait for everyone to jump in!</p>
               </>
            )}
            
            {session?.status === "active" && (
               <>
                  <div className="text-8xl font-black text-indigo-600 mb-6 drop-shadow-md">Q{session.current_question_index + 1}</div>
                  <h3 className="text-2xl font-bold mb-8 text-slate-800">
                     {quiz?.questions[session.current_question_index]?.question_text}
                  </h3>
                  <Button onClick={nextQuestion} size="lg" className="w-full text-xl font-black h-20 rounded-3xl shadow-xl shadow-indigo-600/20" icon={<ArrowRight className="h-6 w-6" />}>
                     NEXT QUESTION
                  </Button>
               </>
            )}
            
            {session?.status === "finished" && (
               <>
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
                     <Trophy className="w-32 h-32 text-amber-500 mb-6 drop-shadow-xl" />
                  </motion.div>
                  <h3 className="text-4xl font-black mb-4 text-slate-800">Arena Finished!</h3>
                  <p className="text-slate-500 font-medium mb-8">Review results on the dashboard.</p>
                  <Button onClick={() => router.push(`/teacher/quizzes`)} variant="secondary" size="lg" className="w-full h-16 rounded-2xl font-bold">Back to Quizzes</Button>
               </>
            )}
         </Card>
      </div>
    </div>
  );
}
