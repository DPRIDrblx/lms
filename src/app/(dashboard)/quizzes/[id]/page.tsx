"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Trophy,
  ArrowRight
} from "lucide-react";
import { useEffect, useState, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "essay";
  options: { text: string; is_correct: boolean }[] | null;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  time_limit_minutes: number | null;
  passing_score: number;
  questions: Question[];
  show_score?: boolean;
  allow_practice_mode?: boolean;
  practice_time_limit_minutes?: number;
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [scoreRecord, setScoreRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select(`*`)
        .eq("id", quizId)
        .single();

      if (quizData) {
        setQuiz(quizData as Quiz);
        
        if (profile) {
           const { data: scoreData } = await supabase
             .from("student_scores")
             .select("score, is_graded")
             .eq("student_id", profile.id)
             .eq("target_id", quizId)
             .eq("target_type", "quiz")
             .single();
             
           if (scoreData) {
             setScoreRecord(scoreData);
           }
        }
      }
      setLoading(false);
    };
    if (profile) fetchQuiz();
  }, [quizId, profile, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;
  if (!quiz) return <div className="py-20 text-center text-[var(--text-tertiary)]">Quiz not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="text-center p-12 border-none shadow-2xl bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10" />
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Portal Ujian</h1>
          <h2 className="text-xl font-bold text-slate-700 mb-8">{quiz.title}</h2>
          
          <div className="flex justify-center gap-6 mb-10">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Durasi Ujian</p>
              <p className="text-xl font-black text-slate-800">{quiz.time_limit_minutes || 0} Menit</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[120px]">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Batas Lulus</p>
              <p className="text-xl font-black text-slate-800">{quiz.passing_score}%</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-10 text-left text-sm space-y-2">
            <p className="font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4" /> PERHATIAN PESERTA:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Pastikan koneksi internet stabil.</li>
              <li>Ujian menggunakan mode layar penuh (Focus Mode).</li>
              <li>Jawaban akan tersimpan otomatis.</li>
              <li>Sistem mencatat segala indikasi kecurangan.</li>
            </ul>
          </div>

          {scoreRecord ? (
            <div className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-xl">
               <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Nilai Ujian Anda</p>
               {quiz.show_score === false ? (
                 <div className="text-2xl font-black text-slate-500 py-4">
                   Nilai Anda disembunyikan oleh Guru.
                 </div>
               ) : !scoreRecord.is_graded ? (
                  <div>
                    <div className="text-4xl font-black text-amber-500">{scoreRecord.score !== null ? scoreRecord.score : "?"} <span className="text-xl text-slate-400">/ 100</span></div>
                    <p className="text-xs font-bold text-amber-700 mt-2">Menunggu Penilaian Guru (Ada Soal Essay)</p>
                  </div>
               ) : (
                  <div>
                    <div className={`text-5xl font-black ${scoreRecord.score !== null && scoreRecord.score >= (quiz.passing_score || 0) ? 'text-green-600' : 'text-red-500'}`}>
                       {scoreRecord.score !== null ? scoreRecord.score : "?"} <span className="text-2xl text-slate-400">/ 100</span>
                    </div>
                  </div>
               )}
            </div>
          ) : null}

          {scoreRecord ? (
            <Link href={`/quizzes/${quizId}/exam`}>
              <Button size="lg" className="w-full text-lg h-14 uppercase tracking-widest font-black" icon={<ArrowRight className="h-5 w-5" />}>
                LIHAT RUANG CBT
              </Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-4">
              <Link href={`/quizzes/${quizId}/exam`}>
                <Button size="lg" className="w-full text-lg h-14 uppercase tracking-widest font-black" icon={<ArrowRight className="h-5 w-5" />}>
                  MASUK KE RUANG UJIAN (CBT)
                </Button>
              </Link>
              {quiz.allow_practice_mode && (
                <Link href={`/quizzes/${quizId}/exam?mode=practice`}>
                  <Button variant="secondary" size="lg" className="w-full text-lg h-14 uppercase tracking-widest font-black border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white" icon={<ArrowRight className="h-5 w-5" />}>
                    MULAI LATIHAN (PRACTICE)
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
