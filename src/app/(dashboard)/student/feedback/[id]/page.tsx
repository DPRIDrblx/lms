"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, CheckCircle2, AlertTriangle, ArrowLeft, Loader2, Sparkles, Send } from "lucide-react";
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
  const [c1, setC1] = useState(0); // Guru menjelaskan dengan jernih (1-4)
  const [c2, setC2] = useState(0); // Guru adil dalam memberi nilai (1-4)
  const [c3, setC3] = useState(0); // Tugas relevan (1-4)
  const [engaging, setEngaging] = useState(0); // Menyenangkan/Interaktif (1-4)
  const [understanding, setUnderstanding] = useState(0); // Mudah dipahami (1-4)
  const [rating, setRating] = useState(0); // Bintang (1-5)
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
    if (!c1 || !c2 || !c3 || !engaging || !understanding || !rating) {
      alert("Mohon isi semua skala penilaian dan rating bintang.");
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
      alert("Error: " + err.message);
      setSubmitting(false);
    }
  };

  const renderLikert = (val: number, setVal: (v: number) => void, labels: string[]) => (
    <div className="flex justify-between items-center gap-2 mt-3">
      {[1, 2, 3, 4].map(num => (
        <button
          key={num}
          type="button"
          onClick={() => setVal(num)}
          className={`flex-1 py-3 px-2 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
            val === num 
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_4px_0_rgb(99,102,241)] translate-y-[-2px]' 
              : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/30'
          }`}
        >
          <span className="font-bold text-lg">{num}</span>
          <span className="text-[10px] font-medium text-center leading-tight">{labels[num-1]}</span>
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!session) return <div className="p-10 text-center font-bold text-slate-500">Sesi Kuesioner tidak ditemukan atau sudah ditutup.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 font-sans pb-24">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-10 shadow-xl border border-emerald-100 text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Terima Kasih! 🎉</h1>
            <p className="text-slate-500 font-medium max-w-sm">Feedback kamu sangat berarti bagi pengembangan sekolah kita. Kamu akan dialihkan kembali ke Dashboard...</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-t-3xl p-8 text-white relative overflow-hidden">
              <Sparkles className="absolute top-4 right-4 w-24 h-24 text-white/10" />
              <h1 className="text-2xl font-black mb-2 relative z-10">Kuesioner Siswa</h1>
              <p className="text-indigo-100 font-medium relative z-10">Evaluasi untuk: <strong>{session.profiles?.full_name}</strong></p>
            </div>
            
            <Card className="rounded-b-3xl rounded-t-none border-t-0 p-6 sm:p-8 shadow-xl bg-white border-slate-200">
              <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800 text-sm font-medium">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <p>Jawablah dengan jujur. Semua jawaban yang kamu berikan <strong>100% anonim</strong> dan tidak akan memengaruhi nilai rapormu sama sekali.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* SECTION 1: LIKERT */}
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">1. Seberapa jernih guru dalam menjelaskan materi pelajaran?</h3>
                    {renderLikert(c1, setC1, ["Tidak Jelas", "Kurang", "Jelas", "Sangat Jelas"])}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">2. Apakah guru objektif dan adil dalam memberikan nilai?</h3>
                    {renderLikert(c2, setC2, ["Tidak Adil", "Kurang", "Adil", "Sangat Adil"])}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">3. Apakah tugas yang diberikan relevan dengan materi?</h3>
                    {renderLikert(c3, setC3, ["Tidak Relevan", "Kurang", "Relevan", "Sangat Relevan"])}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">4. Seberapa interaktif dan menyenangkan suasana kelas?</h3>
                    {renderLikert(engaging, setEngaging, ["Membosankan", "Kurang", "Menyenangkan", "Sangat Seru"])}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">5. Seberapa mudah materi dapat dipahami?</h3>
                    {renderLikert(understanding, setUnderstanding, ["Sangat Sulit", "Sulit", "Mudah", "Sangat Mudah"])}
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* SECTION 2: RATING & SUGGESTION */}
                <div className="space-y-8">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-3 text-center">Beri Rating Keseluruhan</h3>
                    <div className="flex justify-center gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-100'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-2">Ada saran atau masukan untuk Bapak/Ibu Guru? (Opsional)</h3>
                    <textarea 
                      value={suggestion}
                      onChange={e => setSuggestion(e.target.value)}
                      placeholder="Tuliskan saran yang membangun..."
                      className="w-full p-4 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none h-32 text-sm text-slate-700"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full h-14 text-base font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-[0_4px_0_rgb(67,56,202)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Kirim Kuesioner
                </Button>

              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
