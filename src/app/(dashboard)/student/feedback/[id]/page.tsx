"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Sparkles, Send, MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentFeedbackForm() {
  const params = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [c1, setC1] = useState(0); // Penjelasan
  const [c2, setC2] = useState(0); // Keadilan nilai
  const [c3, setC3] = useState(0); // Tugas/PR relevan
  const [c4, setC4] = useState(0); // Peduli & membantu (NEW)
  const [c5, setC5] = useState(0); // Memberi semangat/pujian (NEW)
  const [engaging, setEngaging] = useState(0); // Suasana kelas seru
  const [understanding, setUnderstanding] = useState(0); // Manfaat materi
  const [rating, setRating] = useState(0); // Bintang keseluruhan (1-5)
  const [suggestion, setSuggestion] = useState(""); // Saran

  useEffect(() => {
    async function fetchSession() {
      if (!profile || !params.id) return;
      const { data } = await supabase
        .from("ace_feedback_sessions")
        .select("*, profiles!teacher_id(full_name)")
        .eq("id", params.id)
        .single();
        
      if (data) {
        setSession(data);
      }
      setLoading(false);
    }
    fetchSession();
  }, [params.id, profile, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c1 || !c2 || !c3 || !c4 || !c5 || !engaging || !understanding || !rating) {
      alert("Halo! Pastikan kamu sudah mengisi semua pertanyaan pilihan dan memberikan rating bintang ya.");
      return;
    }
    
    setSubmitting(true);
    try {
      await supabase.from("ace_student_feedbacks").insert({
        session_id: session.id,
        teacher_id: session.teacher_id,
        student_id: profile?.id,
        semester: session.semester,
        criteria_1_score: c1,
        criteria_2_score: c2,
        criteria_3_score: c3,
        criteria_4_score: c4,
        criteria_5_score: c5,
        engaging_score: engaging,
        understanding_score: understanding,
        rating: rating,
        suggestion: suggestion.trim() || null
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      alert("Yah, ada error saat mengirim: " + err.message);
      setSubmitting(false);
    }
  };

  const renderEmojiLikert = (val: number, setVal: (v: number) => void, emojis: { icon: string, label: string }[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4">
      {emojis.map((item, index) => {
        const num = index + 1;
        const isSelected = val === num;
        return (
          <button
            key={num}
            type="button"
            onClick={() => setVal(num)}
            className={`py-4 px-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
              isSelected 
                ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 shadow-[0_4px_0_rgb(217,70,239)] -translate-y-1' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-fuchsia-200 hover:bg-fuchsia-50/50 hover:-translate-y-0.5 shadow-sm'
            }`}
          >
            <span className="text-3xl md:text-4xl filter drop-shadow-sm">{item.icon}</span>
            <span className={`text-[11px] md:text-xs text-center leading-tight ${isSelected ? 'font-extrabold' : 'font-semibold'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" /></div>;
  if (!session) return <div className="p-10 text-center font-bold text-slate-500">Sesi Kuesioner tidak ditemukan atau sudah ditutup ya.</div>;

  const standardEmojis = [
    { icon: "😞", label: "Sangat Kurang" },
    { icon: "😕", label: "Kurang" },
    { icon: "🙂", label: "Bagus" },
    { icon: "🤩", label: "Sangat Bagus!" }
  ];

  const funEmojis = [
    { icon: "🥱", label: "Membosankan" },
    { icon: "😐", label: "Biasa Aja" },
    { icon: "😊", label: "Seru" },
    { icon: "🔥", label: "Sangat Seru!" }
  ];
  
  const helpfulEmojis = [
    { icon: "🙅‍♂️", label: "Gak Peduli" },
    { icon: "🤷‍♂️", label: "Kurang" },
    { icon: "👍", label: "Membantu" },
    { icon: "🦸‍♂️", label: "Sangat Peduli!" }
  ];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 font-sans pb-24">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 font-semibold text-sm mb-6 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-12 shadow-2xl border border-emerald-100 text-center flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-3">Terima Kasih Banyak! 🎉</h1>
            <p className="text-slate-500 font-medium max-w-sm text-lg">Masukan kamu sangat berarti dan bikin guru-guru kita makin keren. Kamu akan otomatis kembali ke Dashboard ya...</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 rounded-t-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
              <Sparkles className="absolute top-4 right-4 w-32 h-32 text-white/10" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
                  <MessageCircleHeart className="w-4 h-4" /> Polling Rahasia
                </div>
                <h1 className="text-3xl md:text-4xl font-black mb-2">Suara Kamu Penting! 📣</h1>
                <p className="text-fuchsia-100 font-medium text-base md:text-lg">
                  Yuk, kasih nilai jujur buat: <strong className="bg-white/20 px-2 py-0.5 rounded-md text-white">{session.profiles?.full_name}</strong>
                </p>
              </div>
            </div>
            
            <Card className="rounded-b-[2rem] rounded-t-none border-t-0 p-6 md:p-10 shadow-2xl bg-white border-slate-200">
              <div className="mb-10 p-5 bg-sky-50 border-2 border-sky-100 rounded-2xl flex gap-4 text-sky-800">
                <div className="bg-sky-200 p-2 rounded-full h-fit">
                  <AlertTriangle className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">100% Rahasia & Aman! 🕵️‍♀️</h4>
                  <p className="text-sm font-medium opacity-90 leading-relaxed">
                    Jangan takut buat ngasih penilaian jujur. Guru kamu <strong>nggak akan tahu</strong> siapa yang ngisi ini, dan pastinya <strong>nggak bakal ngaruh</strong> ke nilai rapormu!
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* SECTION 1: LIKERT */}
                <div className="space-y-10">
                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">1.</span> Apakah penjelasan Bapak/Ibu Guru mudah kamu pahami saat belajar?
                    </h3>
                    {renderEmojiLikert(c1, setC1, standardEmojis)}
                  </div>
                  
                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">2.</span> Apakah kamu merasa Bapak/Ibu Guru selalu adil dalam memberikan nilai atau sanksi?
                    </h3>
                    {renderEmojiLikert(c2, setC2, standardEmojis)}
                  </div>
                  
                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">3.</span> Apakah tugas dan PR yang diberikan sesuai dengan apa yang diajarkan di kelas?
                    </h3>
                    {renderEmojiLikert(c3, setC3, standardEmojis)}
                  </div>
                  
                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">4.</span> Bagaimana suasana kelas saat Bapak/Ibu Guru mengajar?
                    </h3>
                    {renderEmojiLikert(engaging, setEngaging, funEmojis)}
                  </div>
                  
                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">5.</span> Apakah materi pelajaran yang diajarkan terasa bermanfaat buat kamu?
                    </h3>
                    {renderEmojiLikert(understanding, setUnderstanding, standardEmojis)}
                  </div>

                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">6.</span> Apakah Bapak/Ibu Guru peduli dan mau membantu kalau kamu kesulitan dalam belajar?
                    </h3>
                    {renderEmojiLikert(c4, setC4, helpfulEmojis)}
                  </div>

                  <div className="group">
                    <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-start gap-2">
                      <span className="text-fuchsia-500">7.</span> Apakah Bapak/Ibu Guru sering memberikan pujian atau kata semangat?
                    </h3>
                    {renderEmojiLikert(c5, setC5, standardEmojis)}
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-10" />

                {/* SECTION 2: RATING & SUGGESTION */}
                <div className="space-y-10 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                  <div className="text-center">
                    <h3 className="font-black text-slate-800 text-xl md:text-2xl mb-4">Kasih Bintang Dong! ⭐️</h3>
                    <p className="text-sm text-slate-500 mb-6 font-medium">Secara keseluruhan, berapa bintang untuk performa mengajar beliau?</p>
                    <div className="flex justify-center gap-2 md:gap-4">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`focus:outline-none transition-all duration-300 ${rating >= star ? 'scale-125' : 'hover:scale-110 opacity-60 hover:opacity-100'}`}
                        >
                          <Star className={`w-12 h-12 md:w-16 md:h-16 ${rating >= star ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' : 'text-slate-300 fill-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                      Ada pesan, saran, atau masukan buat {session.profiles?.full_name}? ✍️
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 font-medium">Boleh cerita, ngasih saran, atau curhat pengalaman belajarmu di kelas. Tenang, ini rahasia kok!</p>
                    <textarea 
                      value={suggestion}
                      onChange={e => setSuggestion(e.target.value)}
                      placeholder="Contoh: 'Cara ngajarnya asik banget, tapi tugasnya dikurangin dikit ya Pak/Bu...'"
                      className="w-full p-5 rounded-2xl border-2 border-slate-200 bg-white focus:bg-white focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 transition-all outline-none resize-none h-40 text-sm md:text-base text-slate-700 font-medium placeholder:text-slate-300 shadow-inner"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full h-16 text-lg font-black rounded-2xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 shadow-[0_6px_0_rgb(67,56,202)] hover:shadow-[0_4px_0_rgb(67,56,202)] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center gap-3 text-white border-none mt-8"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" /> Sedang Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Penilaian Rahasia <Send className="w-6 h-6" />
                    </>
                  )}
                </Button>

              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
