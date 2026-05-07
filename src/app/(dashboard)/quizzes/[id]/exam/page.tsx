"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  HelpCircle,
  LayoutDashboard,
  Timer,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useEffect, useState, use, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CBTExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchExamData = useCallback(async () => {
    const { data: quizData } = await supabase.from("quizzes").select("*").eq("id", id).single();
    const { data: qData } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true });
    
    if (quizData) {
      setQuiz(quizData);
      setTimeLeft(quizData.time_limit_minutes * 60);
    }
    if (qData) setQuestions(qData);
    
    // Fetch existing responses if any
    if (profile) {
      const { data: existing } = await supabase.from("quiz_responses").select("*").eq("student_id", profile.id).eq("quiz_id", id);
      if (existing) {
        const respMap: Record<string, any> = {};
        const flagMap: Record<string, boolean> = {};
        existing.forEach((r: any) => {
          respMap[r.question_id] = r.answer_text;
          flagMap[r.question_id] = r.is_flagged;
        });
        setResponses(respMap);
        setFlags(flagMap);
      }
    }
    setLoading(false);
  }, [id, profile, supabase]);

  useEffect(() => {
    fetchExamData();
  }, [fetchExamData]);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 || loading) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  const handleResponseChange = async (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Persist to DB
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id,
      quiz_id: id,
      question_id: questionId,
      answer_text: typeof value === 'string' ? value : JSON.stringify(value),
      is_flagged: flags[questionId] || false
    });
  };

  const toggleFlag = async (questionId: string) => {
    const newFlag = !flags[questionId];
    setFlags(prev => ({ ...prev, [questionId]: newFlag }));
    await supabase.from("quiz_responses").update({ is_flagged: newFlag }).eq("student_id", profile?.id).eq("question_id", questionId);
  };

  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to finish the exam?")) return;
    setSubmitting(true);
    
    // Logic: Calculate auto-score for MCQ, set essay to pending
    let totalScore = 0;
    questions.forEach(q => {
      const resp = responses[q.id];
      if (q.question_type === 'mcq') {
        const correctOpt = q.options?.find((o: any) => o.is_correct);
        if (resp === correctOpt?.text) totalScore += q.points;
      }
    });

    const { error } = await supabase.from("student_scores").insert({
      student_id: profile?.id,
      target_id: id,
      target_type: "quiz",
      score: totalScore,
      is_graded: false, // Pending for Teacher review of Essays
      graded_at: new Date().toISOString()
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Exam submitted successfully!");
      router.push(`/quizzes/${id}/review`);
    }
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Initializing CBT Environment...</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 sm:p-8">
      {/* Exam Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 mb-8">
         <div className="flex-1 flex items-center justify-between bg-[var(--bg-secondary)] p-6 rounded-3xl shadow-lg border border-[var(--border)]">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><Timer /></div>
               <div>
                  <h1 className="text-xl font-black text-[var(--text-primary)]">{quiz.title}</h1>
                  <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Exam Session: {profile?.full_name}</p>
               </div>
            </div>
            <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 ${timeLeft < 300 ? "bg-red-500 text-white animate-pulse" : "bg-[var(--bg-tertiary)] text-[var(--accent)]"}`}>
               <Clock className="h-5 w-5" />
               <span className="text-2xl font-black font-mono">{formatTime(timeLeft)}</span>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Question Area */}
         <div className="lg:col-span-3 space-y-6">
            <Card className="p-8 sm:p-12 min-h-[500px] flex flex-col">
               <div className="flex justify-between items-start mb-8">
                  <Badge variant="info" className="px-4 py-1.5 rounded-full font-bold">Question {currentIndex + 1} of {questions.length}</Badge>
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`rounded-full h-10 w-10 p-0 ${flags[currentQ.id] ? "bg-orange-100 text-orange-500 hover:bg-orange-200" : "text-[var(--text-tertiary)]"}`}
                  >
                     <Flag className={`h-5 w-5 ${flags[currentQ.id] ? "fill-orange-500" : ""}`} />
                  </Button>
               </div>

               <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8 leading-relaxed">
                     {currentQ.question_text}
                  </h2>

                  <div className="space-y-3">
                     {currentQ.question_type === 'mcq' && currentQ.options?.map((opt: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleResponseChange(currentQ.id, opt.text)}
                          className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                            responses[currentQ.id] === opt.text 
                            ? "border-[var(--accent)] bg-[var(--accent-light)]/50" 
                            : "border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-primary)]"
                          }`}
                        >
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              responses[currentQ.id] === opt.text ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                           }`}>
                              {String.fromCharCode(65 + i)}
                           </div>
                           <span className="text-sm font-medium text-[var(--text-primary)]">{opt.text}</span>
                        </button>
                     ))}

                     {currentQ.question_type === 'essay' && (
                        <textarea
                          value={responses[currentQ.id] || ""}
                          onChange={(e) => handleResponseChange(currentQ.id, e.target.value)}
                          placeholder="Type your comprehensive answer here..."
                          className="w-full min-h-[250px] p-6 rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all resize-none"
                        />
                     )}
                  </div>
               </div>

               <div className="flex items-center justify-between pt-12 border-t border-[var(--border)] mt-12">
                  <Button 
                    variant="ghost" 
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    icon={<ChevronLeft className="h-5 w-5" />}
                  >
                     Previous
                  </Button>
                  
                  {currentIndex === questions.length - 1 ? (
                    <Button 
                      onClick={handleSubmit} 
                      loading={submitting}
                      className="bg-green-600 hover:bg-green-700 text-white border-none rounded-2xl h-12 px-8 font-black shadow-xl shadow-green-600/20"
                      icon={<CheckCircle2 className="h-5 w-5" />}
                    >
                       Finish Exam
                    </Button>
                  ) : (
                    <Button 
                      className="rounded-2xl h-12 px-8 font-black shadow-xl shadow-[var(--accent)]/20"
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                    >
                       Next Question <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
               </div>
            </Card>
         </div>

         {/* Navigation Sidebar */}
         <div className="lg:col-span-1">
            <Card className="p-6 bg-[var(--bg-secondary)] border-none h-fit sticky top-8">
               <div className="flex items-center gap-2 mb-6 text-[var(--text-primary)]">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-widest">Navigation Hub</span>
               </div>
               
               <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => (
                     <button
                       key={q.id}
                       onClick={() => setCurrentIndex(i)}
                       className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all relative ${
                         currentIndex === i ? "ring-2 ring-[var(--accent)] ring-offset-2" : ""
                       } ${
                         responses[q.id] 
                         ? "bg-[var(--accent)] text-white" 
                         : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]/80"
                       }`}
                     >
                        {i + 1}
                        {flags[q.id] && (
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-[var(--bg-secondary)]" />
                        )}
                     </button>
                  ))}
               </div>

               <div className="mt-8 pt-6 border-t border-[var(--border)] space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[var(--text-tertiary)]">
                     <span>Completed</span>
                     <span className="text-[var(--text-primary)]">{Object.keys(responses).length} / {questions.length}</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-[var(--accent)] transition-all duration-500" 
                       style={{ width: `${(Object.keys(responses).length / questions.length) * 100}%` }}
                     />
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] flex gap-3">
                     <AlertCircle className="h-4 w-4 text-[var(--accent)] shrink-0" />
                     <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                        Answers are saved automatically in real-time. You can safely refresh if needed.
                     </p>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
