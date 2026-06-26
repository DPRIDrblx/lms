"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Users, CheckCircle, ArrowRight, Trophy } from "lucide-react";
import { toast } from "react-hot-toast";

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
    <div className="max-w-4xl mx-auto space-y-8">
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card className="p-8 border-none shadow-xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
               <Users className="text-indigo-500" /> Participants ({participants.length})
            </h2>
            <div className="space-y-3">
               {participants.map(p => (
                 <div key={p.id} className="p-4 rounded-xl bg-slate-50 font-bold flex justify-between items-center">
                    <span>{p.profiles?.full_name}</span>
                    <span className="text-indigo-600">{p.score} pts</span>
                 </div>
               ))}
               {participants.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Waiting for students...</p>}
            </div>
         </Card>
         
         <Card className="p-8 border-none shadow-xl flex flex-col justify-center items-center text-center">
            {session?.status === "waiting" && (
               <>
                  <Play className="w-16 h-16 text-emerald-500 mb-6" />
                  <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
                  <p className="text-slate-500 mb-8">Make sure everyone is in before starting.</p>
                  <Button onClick={startQuiz} size="lg" className="w-full text-lg h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600">
                     START ARENA
                  </Button>
               </>
            )}
            
            {session?.status === "active" && (
               <>
                  <div className="text-6xl font-black text-indigo-600 mb-6">Q{session.current_question_index + 1}</div>
                  <h3 className="text-xl font-bold mb-8">
                     {quiz?.questions[session.current_question_index]?.question_text}
                  </h3>
                  <Button onClick={nextQuestion} size="lg" className="w-full text-lg h-16 rounded-2xl" icon={<ArrowRight className="h-5 w-5" />}>
                     NEXT QUESTION
                  </Button>
               </>
            )}
            
            {session?.status === "finished" && (
               <>
                  <Trophy className="w-24 h-24 text-amber-500 mb-6" />
                  <h3 className="text-3xl font-black mb-4">Arena Finished!</h3>
                  <Button onClick={() => router.push(`/teacher/quizzes`)} variant="secondary" className="w-full">Back to Quizzes</Button>
               </>
            )}
         </Card>
      </div>
    </div>
  );
}
