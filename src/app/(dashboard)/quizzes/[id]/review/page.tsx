"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft,
  LayoutDashboard,
  Trophy,
  BarChart3,
  Search,
  BookOpen
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function QuizReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [score, setScore] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [scoreRes, quizRes, questionsRes, responsesRes] = await Promise.all([
        supabase.from("student_scores").select("*").eq("student_id", profile?.id).eq("target_id", id).single(),
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true }),
        supabase.from("quiz_responses").select("*").eq("student_id", profile?.id).eq("quiz_id", id)
      ]);
      
      if (scoreRes.data) setScore(scoreRes.data);
      if (quizRes.data) setQuiz(quizRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (responsesRes.data) setResponses(responsesRes.data);
      
      setLoading(false);
    };
    if (profile) fetchData();
  }, [id, profile, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse">Calculating Final Results...</div>;
  if (!score) return <div className="text-center py-20">Score record not found. Please complete the quiz first.</div>;

  const percentage = Math.round((score.score / (quiz?.total_points || 100)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 p-6">
      <header className="flex items-center justify-between">
         <Link href={quiz?.course_id ? `/courses/${quiz.course_id}` : "/courses"}>
            <Button variant="ghost" className="flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Kembali</Button>
         </Link>
         <Badge variant="info" className="px-4 py-1.5 font-bold">{quiz?.title}</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <Card className="md:col-span-2 p-12 flex flex-col items-center justify-center text-center bg-[var(--bg-secondary)] border-none shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy className="h-40 w-40" /></div>
           
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-[var(--accent)] flex flex-col items-center justify-center mb-8 bg-white shadow-xl">
                 {quiz?.show_score === false ? (
                   <span className="text-4xl font-black text-slate-400">???</span>
                 ) : (
                   <span className="text-6xl font-black text-[var(--accent)]">{percentage}%</span>
                 )}
                 <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Final Mastery</span>
              </div>
           </motion.div>

           <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
              {quiz?.show_score === false ? "Ujian Selesai!" : percentage >= 75 ? "Luar Biasa!" : percentage >= 50 ? "Kerja Bagus!" : "Terus Semangat!"}
           </h2>
           <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
              {quiz?.show_score === false 
                ? "Nilai akhir Anda disembunyikan oleh pengajar." 
                : "Ujian Anda telah disubmit. Nilai essay (jika ada) akan diperbarui setelah dinilai oleh guru."}
           </p>

           {quiz?.show_score !== false && (
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                   <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Total Poin</p>
                   <p className="text-xl font-bold text-[var(--text-primary)]">{score.score} / {quiz?.max_score || 100}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                   <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Status</p>
                   <Badge variant={score.is_graded ? "success" : "warning"} className="font-bold bg-blue-100 text-blue-700">
                      {score.is_graded ? "Selesai" : "Menunggu Review"}
                   </Badge>
                </div>
             </div>
           )}
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="p-6 bg-[var(--accent)] text-white border-none shadow-xl shadow-[var(--accent)]/30">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Award /></div>
                 <h3 className="font-bold">Sertifikasi</h3>
              </div>
              <p className="text-xs opacity-80 leading-relaxed mb-6">
                 Selesaikan modul dan dapatkan nilai di atas batas lulus untuk mendapatkan lencana kelulusan.
              </p>
           </Card>
        </div>
      </div>

      {/* Review Section */}
      {(quiz?.show_answers || quiz?.show_explanation) && (
        <div className="mt-12 space-y-8">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--accent)]" /> Pembahasan Soal
          </h3>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              const resp = responses.find(r => r.question_id === q.id);
              const studentAnswer = resp?.metadata?.answer;

              return (
                <Card key={q.id} className="p-6 border-[var(--border)] shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                      
                      <div className="mt-4 space-y-3">
                        {q.question_type === 'mcq' || q.question_type === 'complex_mcq' ? (
                          q.options?.map((opt: any, oIdx: number) => {
                            let isStudentChoice = false;
                            if (q.question_type === 'mcq') isStudentChoice = studentAnswer === opt.text;
                            if (q.question_type === 'complex_mcq') isStudentChoice = Array.isArray(studentAnswer) && studentAnswer.includes(opt.text);

                            let bgColor = "bg-white dark:bg-[var(--bg-secondary)] border-[var(--border)]";
                            if (quiz.show_answers) {
                              if (opt.is_correct && isStudentChoice) bgColor = "bg-green-50 border-green-200 text-green-800";
                              else if (opt.is_correct) bgColor = "bg-green-50 border-green-200 text-green-800 opacity-70";
                              else if (isStudentChoice) bgColor = "bg-red-50 border-red-200 text-red-800";
                            } else {
                              if (isStudentChoice) bgColor = "bg-blue-50 border-blue-200 text-blue-800";
                            }

                            return (
                              <div key={oIdx} className={`p-3 rounded-xl border ${bgColor} flex items-center gap-3 transition-all`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isStudentChoice ? 'border-current bg-current' : 'border-slate-300'}`}>
                                  {isStudentChoice && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className="flex-1 font-medium">{opt.text}</span>
                                {quiz.show_answers && opt.is_correct && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                                {quiz.show_answers && !opt.is_correct && isStudentChoice && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                              </div>
                            );
                          })
                        ) : q.question_type === 'matching' ? (
                          <div className="space-y-2">
                            {q.options?.map((opt: any, oIdx: number) => {
                              const studentMatch = studentAnswer ? studentAnswer[opt.text] : null;
                              return (
                                <div key={oIdx} className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                                    {opt.text}
                                  </div>
                                  <div className={`p-3 border rounded-xl font-medium ${quiz.show_answers ? (studentMatch === opt.match_pair ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800') : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                    Jawaban Anda: {studentMatch || <span className="text-slate-400 italic">Kosong</span>}
                                    {quiz.show_answers && studentMatch !== opt.match_pair && (
                                      <div className="text-xs text-slate-500 mt-1 border-t pt-1 border-current/20">
                                        Seharusnya: {opt.match_pair}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jawaban Anda (Essay)</p>
                            <p className="text-slate-700">{studentAnswer || <span className="italic text-slate-400">Tidak ada jawaban</span>}</p>
                          </div>
                        )}
                      </div>

                      {quiz?.show_explanation && q.explanation && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                          <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Pembahasan
                          </p>
                          <div className="prose prose-sm max-w-none text-blue-900" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
