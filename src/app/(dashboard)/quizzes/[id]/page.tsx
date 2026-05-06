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
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: quizData, error } = await supabase
        .from("quizzes")
        .select(`*, questions(*)`)
        .eq("id", quizId)
        .single();

      if (quizData) {
        setQuiz(quizData as Quiz);
        if (quizData.time_limit_minutes) {
          setTimeLeft(quizData.time_limit_minutes * 60);
        }
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [quizId, supabase]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !finished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !finished) {
      handleSubmit();
    }
  }, [timeLeft, finished]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || !profile) return;
    setSubmitting(true);

    let totalScore = 0;
    let maxScore = 0;
    let hasEssay = false;

    quiz.questions.forEach(q => {
      maxScore += q.points;
      if (q.question_type === "mcq") {
        const selected = answers[q.id];
        const correctOption = q.options?.find(o => o.is_correct);
        if (selected === correctOption?.text) {
          totalScore += q.points;
        }
      } else {
        hasEssay = true;
      }
    });

    const finalPercentage = Math.round((totalScore / maxScore) * 100);
    const passed = finalPercentage >= quiz.passing_score;

    // Save score
    const { error } = await supabase.from("student_scores").insert({
      student_id: profile.id,
      target_id: quizId,
      target_type: "quiz",
      score: finalPercentage,
      is_graded: !hasEssay,
      submission_url: JSON.stringify(answers), // Store all answers as JSON
      graded_at: hasEssay ? null : new Date().toISOString()
    });

    // Award XP if passed
    if (passed && !hasEssay) {
      const xpReward = 50; // Base reward for passing quiz
      await supabase.from("profiles").update({ xp: (profile.xp || 0) + xpReward }).eq("id", profile.id);
      refreshProfile();
    }

    setResult({ score: finalPercentage, passed });
    setFinished(true);
    setSubmitting(false);
  }, [quiz, profile, answers, quizId, supabase, refreshProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;
  if (!quiz) return <div className="py-20 text-center text-[var(--text-tertiary)]">Quiz not found.</div>;

  if (finished && result) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="text-center p-8">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
              {result.passed ? <Trophy className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {result.passed ? "Examination Passed!" : "Exam Completed"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              You scored <span className="font-bold text-[var(--accent)]">{result.score}%</span> on this assessment.
            </p>
            
            <div className="mt-8 space-y-3">
               <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Status</p>
                  <Badge variant={result.passed ? "success" : "error"}>{result.passed ? "PASSED" : "FAILED"}</Badge>
               </div>
               {result.passed && (
                 <p className="text-xs text-[var(--success)] font-medium">✨ You earned +50 XP!</p>
               )}
            </div>

            <Button className="w-full mt-8" onClick={() => router.back()}>
              Return to Course
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{quiz.title}</h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Question {currentIdx + 1} of {quiz.questions.length}</p>
        </div>
        {timeLeft !== null && (
          <Card className="py-2 px-4 flex items-center gap-2 border-[var(--accent)]/30">
            <Clock className={`h-4 w-4 ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-[var(--accent)]"}`} />
            <span className={`text-sm font-bold ${timeLeft < 60 ? "text-red-500" : "text-[var(--text-primary)]"}`}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </Card>
        )}
      </div>

      <ProgressBar value={progress} size="sm" color="var(--accent)" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-8 min-h-[400px] flex flex-col">
            <div className="flex-1">
              <Badge variant="info" className="mb-4 uppercase tracking-wider text-[10px]">
                {currentQuestion.question_type} — {currentQuestion.points} Points
              </Badge>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-relaxed mb-8">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.question_type === "mcq" ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [currentQuestion.id]: option.text })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between group ${
                        answers[currentQuestion.id] === option.text
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                          : "border-[var(--border)] hover:border-[var(--accent)]/30 text-[var(--text-primary)]"
                      }`}
                    >
                      <span className="text-sm font-medium">{option.text}</span>
                      {answers[currentQuestion.id] === option.text && <CheckCircle2 className="h-5 w-5" />}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={8}
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                  placeholder="Type your answer here..."
                  className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm text-[var(--text-primary)] resize-none"
                />
              )}
            </div>

            <div className="mt-12 flex items-center justify-between">
              <Button
                variant="ghost"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                icon={<ChevronLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              {currentIdx === quiz.questions.length - 1 ? (
                <Button 
                  onClick={handleSubmit} 
                  loading={submitting}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Submit Examination
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  disabled={!answers[currentQuestion.id]}
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  Next Question
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
