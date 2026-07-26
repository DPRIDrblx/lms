"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, XCircle, CheckCircle, Gem, ArrowLeft, Loader2 } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GoldenHourPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [result, setResult] = useState<'pending' | 'correct' | 'incorrect'>('pending');
  const [gemsWon, setGemsWon] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const init = async () => {
       if (!profile?.id) return;
       
       // Check if active
       const { data: settings } = await supabase.from("global_settings").select("value").eq("key", "golden_hour_active").single();
       if (!settings || (settings.value !== "true" && settings.value !== true)) {
           setLoading(false);
           return;
       }
       setActive(true);

       // Check if already played today (simple date check based on UTC)
       const today = new Date().toISOString().split('T')[0];
       const { data: attempts } = await supabase
           .from("golden_hour_attempts")
           .select("id, created_at")
           .eq("user_id", profile.id)
           .gte("created_at", `${today}T00:00:00Z`);

       if (attempts && attempts.length > 0) {
           setAlreadyPlayed(true);
           setLoading(false);
           return;
       }

       // Fetch a random multiple-choice question
       const { data: questions } = await supabase
           .from("questions")
           .select("*")
           .eq("question_type", "mcq")
           .limit(50);
           
       if (questions && questions.length > 0) {
           const randIdx = Math.floor(Math.random() * questions.length);
           setQuestion(questions[randIdx]);
       }
       setLoading(false);
    };

    init();
  }, [profile]);

  const handleAnswer = async (index: number) => {
      setSelectedOption(index);
      const isCorrect = question.options[index].is_correct === true;
      
      if (isCorrect) {
          setResult('correct');
          setSpinning(true);
          // Gacha Logic: 10% Jackpot (1000), 30% Epic (500), 60% Normal (100)
          const roll = Math.random();
          let won = 100;
          if (roll < 0.1) won = 1000;
          else if (roll < 0.4) won = 500;
          
          setTimeout(async () => {
              setGemsWon(won);
              setSpinning(false);
              confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors: ['#fbbf24', '#f59e0b', '#fb923c'] });
              
              // Update database
              const currentGems = (profile as any)?.gems || 0;
              await supabase.from("profiles").update({ gems: currentGems + won }).eq("id", profile?.id);
              await supabase.from("golden_hour_attempts").insert({ user_id: profile?.id, gems_won: won, is_correct: true });
          }, 3000); // 3 seconds spin
      } else {
          setResult('incorrect');
          await supabase.from("golden_hour_attempts").insert({ user_id: profile?.id, gems_won: 0, is_correct: false });
      }
  };

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><CenterLoader size="md" /></div>;

  if (!active) {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-6 opacity-50">
                  <Sparkles className="w-16 h-16 text-slate-400" />
              </div>
              <h1 className="text-3xl font-black text-slate-700 mb-2">Portal Tertutup</h1>
              <p className="text-slate-500 text-center max-w-md mb-8">The Golden Hour saat ini tidak aktif. Tunggu instruksi dari pihak TU untuk pembukaan portal selanjutnya!</p>
              <Link href="/courses">
                  <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"><ArrowLeft className="w-5 h-5"/> Kembali</button>
              </Link>
          </div>
      );
  }

  if (alreadyPlayed) {
      return (
          <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
              <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-16 h-16 text-amber-500" />
              </div>
              <h1 className="text-3xl font-black text-slate-700 mb-2">Sudah Main Hari Ini!</h1>
              <p className="text-slate-500 text-center max-w-md mb-8">Kamu sudah mencoba The Golden Hour hari ini. Portal ini hanya bisa dimasuki sekali sehari. Kembalilah besok!</p>
              <Link href="/courses">
                  <button className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30 flex items-center gap-2"><ArrowLeft className="w-5 h-5"/> Kembali</button>
              </Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
       <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute -top-[50%] -left-[10%] w-[100vw] h-[100vw] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></motion.div>
       
       <AnimatePresence mode="wait">
       {result === 'pending' && question ? (
           <motion.div 
               key="question"
               initial={{ opacity: 0, scale: 0.9, y: 50 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
               className="relative z-10 max-w-3xl w-full bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-12 rounded-[3rem] shadow-2xl"
           >
               <div className="flex justify-center mb-8">
                   <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-white font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                       <Sparkles className="w-5 h-5" /> JACKPOT QUESTION
                   </div>
               </div>
               
               <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight mb-12 drop-shadow-md">{question.question_text}</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {question.options?.map((opt: any, idx: number) => (
                       <button
                           key={idx}
                           onClick={() => handleAnswer(idx)}
                           className="p-6 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-amber-400 rounded-2xl text-white font-bold text-xl transition-all hover:scale-105 active:scale-95 text-left flex items-center gap-4"
                       >
                           <span className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center shrink-0 font-black text-amber-400">{['A','B','C','D'][idx]}</span>
                           {opt.text}
                       </button>
                   ))}
               </div>
           </motion.div>
       ) : result === 'correct' ? (
           <motion.div 
               key="correct"
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative z-10 flex flex-col items-center text-center"
           >
               <h1 className="text-5xl md:text-7xl font-black text-emerald-400 mb-8 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]">BENAR!</h1>
               
               <div className="w-64 h-64 relative mb-12 flex items-center justify-center">
                   <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-50 rounded-full"></div>
                   {spinning ? (
                       <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                           <Gem className="w-40 h-40 text-yellow-300 drop-shadow-2xl" />
                       </motion.div>
                   ) : (
                       <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1.2, rotate: 0 }} transition={{ type: "spring", bounce: 0.6 }}>
                           <Gem className="w-48 h-48 text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,1)]" />
                       </motion.div>
                   )}
               </div>
               
               {spinning ? (
                   <p className="text-3xl font-black text-white animate-pulse">ROLLING GACHA...</p>
               ) : (
                   <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                       <p className="text-2xl text-yellow-200 font-bold mb-2">Kamu Mendapatkan</p>
                       <p className="text-7xl font-black text-yellow-400 drop-shadow-md mb-8">{gemsWon} <span className="text-3xl text-yellow-500">GEMS</span></p>
                       <Link href="/courses">
                          <button className="px-10 py-4 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,255,255,0.5)]">Ambil Hadiah</button>
                       </Link>
                   </motion.div>
               )}
           </motion.div>
       ) : result === 'incorrect' ? (
           <motion.div 
               key="incorrect"
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative z-10 flex flex-col items-center text-center"
           >
               <XCircle className="w-40 h-40 text-rose-500 mb-8 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]" />
               <h1 className="text-5xl md:text-7xl font-black text-rose-500 mb-4 drop-shadow-[0_0_30px_rgba(244,63,94,0.8)]">SALAH!</h1>
               <p className="text-2xl text-slate-300 font-medium mb-12">Sayang sekali, kamu melewatkan kesempatan emas hari ini.</p>
               <Link href="/courses">
                  <button className="px-10 py-4 bg-white/10 border border-white/20 text-white rounded-full font-black text-xl hover:bg-white/20 transition-all">Kembali</button>
               </Link>
           </motion.div>
       ) : null}
       </AnimatePresence>
    </div>
  );
}
