"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Loader2, Trophy } from "lucide-react";
import { toast } from "react-hot-toast";

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
         }
         setSession(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_quiz_participants', filter: `id=eq.${participant?.id}` }, (payload: any) => {
         setParticipant(payload.new);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchInitial, supabase, session?.id, session?.current_question_index, participant?.id]);

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
      // Calculate score based on speed (simplification: 1000 pts)
      const newScore = (participant.score || 0) + 1000;
      await supabase.from("live_quiz_participants").update({ score: newScore }).eq("id", participant.id);
    }
  };

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>;

  if (session?.status === "waiting") {
     return (
       <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
             <AlertTriangle className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 text-center">You're in!</h1>
          <p className="text-lg text-slate-500 font-medium text-center">Look at the projector. Waiting for teacher to start...</p>
       </div>
     );
  }

  if (session?.status === "finished") {
     return (
       <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
          <Trophy className="w-32 h-32 text-amber-500 mb-8" />
          <h1 className="text-5xl font-black text-slate-900 mb-4 text-center">Arena Finished!</h1>
          <p className="text-2xl text-slate-600 font-bold mb-8">Your Final Score: <span className="text-indigo-600">{participant?.score}</span></p>
          <Button onClick={() => router.push("/dashboard")} size="lg" className="rounded-2xl">Return to Dashboard</Button>
       </div>
     );
  }

  const currentQ = quiz?.questions?.[session?.current_question_index];
  
  if (!currentQ) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 min-h-[80vh] flex flex-col justify-center">
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
        <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100">
           {isCorrect ? (
             <>
               <div className="w-24 h-24 bg-emerald-100 rounded-full mx-auto flex items-center justify-center mb-6">
                 <CheckCircle className="w-12 h-12 text-emerald-600" />
               </div>
               <h2 className="text-4xl font-black text-emerald-600 mb-2">CORRECT!</h2>
               <p className="text-slate-500 font-bold">+1000 Points</p>
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
        </div>
      )}
    </div>
  );
}
