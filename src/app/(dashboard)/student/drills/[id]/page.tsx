"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { X, Check, ArrowRight, Loader2, Trophy, Heart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function StudentDrillExecutionPage() {
  const { id } = useParams() as { id: string };
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [drill, setDrill] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && profile?.id) {
      loadData();
    }
  }, [id, profile?.id]);

  const loadData = async () => {
    setLoading(true);
    
    // Check if already completed
    const { data: sub } = await supabase.from("drill_submissions").select("*").eq("drill_id", id).eq("student_id", profile?.id).single();
    if (sub?.is_completed) {
      toast.error("Drill ini sudah Anda kerjakan!");
      router.push("/dashboard");
      return;
    }

    const { data: dl } = await supabase.from("drills").select("*").eq("id", id).single();
    if (dl) setDrill(dl);
      
    const { data: qs } = await supabase.from("drill_questions").select("*").eq("drill_id", id).order("created_at", { ascending: true });
    if (qs && qs.length > 0) {
      setQuestions(qs);
    } else {
      toast.error("Belum ada soal untuk drill ini.");
      router.push("/dashboard");
    }
    
    setLoading(false);
  };

  const handleCheck = () => {
    if (selectedOption === null) return;
    
    const correct = questions[currentIndex].correct_index === selectedOption;
    setIsCorrect(correct);
    setIsAnswered(true);
    
    if (correct) {
      setScore(prev => prev + 1);
    } else {
      setHearts(prev => Math.max(0, prev - 1));
    }
  };

  const handleNext = async () => {
    if (hearts === 0) {
      handleFinish(false);
      return;
    }
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      handleFinish(true);
    }
  };

  const handleFinish = async (completed: boolean) => {
    setIsFinished(true);
    setSubmitting(true);
    
    const finalScore = completed ? Math.round((score / questions.length) * 100) : 0;
    const gainedXp = completed ? drill?.xp_reward : 0;

    await supabase.from("drill_submissions").insert({
      drill_id: id,
      student_id: profile?.id,
      score: finalScore,
      is_completed: true
    });
    
    if (completed) {
      await supabase.from("profiles").update({ xp: (profile?.xp || 0) + gainedXp }).eq("id", profile?.id);
      toast.success(`Selamat! Kamu mendapatkan ${gainedXp} XP!`);
      refreshProfile();
    }
    
    setSubmitting(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-teal-500" /></div>;
  if (!drill || questions.length === 0) return null;

  if (isFinished) {
    const passed = hearts > 0;
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 shadow-2xl ${passed ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'}`}>
          <Trophy className="w-16 h-16" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-4">{passed ? "Luar Biasa!" : "Jangan Menyerah!"}</h1>
        <p className="text-xl text-slate-500 font-bold mb-8">
          {passed ? `Kamu telah menyelesaikan Drill Mingguan dan mencetak skor ${Math.round((score / questions.length) * 100)}!` : "Nyawa kamu habis. Coba pelajari materi lagi ya!"}
        </p>
        
        <div className="bg-amber-100 border-2 border-amber-200 text-amber-700 px-6 py-3 rounded-2xl font-black text-xl flex items-center gap-2 mb-12">
          <Flame className="w-6 h-6" /> +{passed ? drill.xp_reward : 0} XP
        </div>
        
        <button 
          onClick={() => router.push("/dashboard")}
          disabled={submitting}
          className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white font-black text-xl py-4 rounded-2xl active:border-b-0 active:translate-y-[4px] transition-all"
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "LANJUTKAN"}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col pt-8">
      {/* Top Bar */}
      <div className="max-w-4xl mx-auto w-full px-6 flex items-center gap-6 mb-12">
        <button onClick={() => confirm("Yakin ingin keluar? Progres tidak akan disimpan.") && router.push("/dashboard")} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-8 h-8" />
        </button>
        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex items-center gap-2 text-rose-500 font-black text-xl">
          <Heart className="w-7 h-7 fill-rose-500" /> {hearts}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 flex flex-col">
        <h2 className="text-3xl font-black text-slate-800 mb-10 leading-tight">
          {currentQ.question}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((opt: string, i: number) => {
            const isSelected = selectedOption === i;
            let btnClass = "border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-[0_4px_0_rgb(226,232,240)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none";
            
            if (isSelected && !isAnswered) {
              btnClass = "border-2 border-indigo-400 bg-indigo-50 text-indigo-700 shadow-[0_4px_0_rgb(129,140,248)] -translate-y-1";
            } else if (isAnswered) {
              if (i === currentQ.correct_index) {
                btnClass = "border-2 border-emerald-500 bg-emerald-100 text-emerald-700 shadow-[0_4px_0_rgb(16,185,129)]";
              } else if (isSelected) {
                btnClass = "border-2 border-rose-500 bg-rose-100 text-rose-700 shadow-[0_4px_0_rgb(244,63,94)] opacity-50";
              } else {
                btnClass = "border-2 border-slate-200 bg-white text-slate-400 shadow-[0_4px_0_rgb(226,232,240)] opacity-50";
              }
            }

            return (
              <button 
                key={i}
                disabled={isAnswered}
                onClick={() => setSelectedOption(i)}
                className={`p-6 rounded-2xl font-bold text-lg text-left transition-all ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className={`mt-auto w-full border-t-2 ${!isAnswered ? 'border-slate-200 bg-white' : isCorrect ? 'border-emerald-200 bg-emerald-100' : 'border-rose-200 bg-rose-100'} p-6 transition-colors`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {isAnswered && (
              <div className={`flex items-center gap-3 text-2xl font-black ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isCorrect ? (
                  <><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-emerald-500"><Check className="w-6 h-6" /></div> Luar Biasa!</>
                ) : (
                  <><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500"><X className="w-6 h-6" /></div> Jawaban yang Benar: {currentQ.options[currentQ.correct_index]}</>
                )}
              </div>
            )}
          </div>
          
          {!isAnswered ? (
            <button 
              onClick={handleCheck}
              disabled={selectedOption === null}
              className={`px-12 py-4 rounded-2xl font-black text-xl transition-all ${
                selectedOption !== null 
                ? 'bg-emerald-500 hover:bg-emerald-600 border-b-4 border-emerald-700 text-white active:border-b-0 active:translate-y-[4px]' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              PERIKSA
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className={`px-12 py-4 rounded-2xl font-black text-xl transition-all border-b-4 active:border-b-0 active:translate-y-[4px] text-white ${
                isCorrect 
                ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700' 
                : 'bg-rose-500 hover:bg-rose-600 border-rose-700'
              }`}
            >
              LANJUTKAN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
