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
  Search
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [scoreRes, quizRes] = await Promise.all([
        supabase.from("student_scores").select("*").eq("student_id", profile?.id).eq("target_id", id).single(),
        supabase.from("quizzes").select("*").eq("id", id).single()
      ]);
      
      if (scoreRes.data) setScore(scoreRes.data);
      if (quizRes.data) setQuiz(quizRes.data);
      setLoading(false);
    };
    fetchData();
  }, [id, profile, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse">Calculating Final Results...</div>;
  if (!score) return <div className="text-center py-20">Score record not found. Please complete the quiz first.</div>;

  const percentage = Math.round((score.score / (quiz?.total_points || 100)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
         <Link href="/courses">
            <Button variant="ghost" icon={<ChevronLeft className="h-4 w-4" />}>Back to Courses</Button>
         </Link>
         <Badge variant="info" className="px-4 py-1.5 font-bold">{quiz?.title}</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <Card className="md:col-span-2 p-12 flex flex-col items-center justify-center text-center bg-[var(--bg-secondary)] border-none shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy className="h-40 w-40" /></div>
           
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-[var(--accent)] flex flex-col items-center justify-center mb-8 bg-white shadow-xl">
                 <span className="text-6xl font-black text-[var(--accent)]">{percentage}%</span>
                 <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Final Mastery</span>
              </div>
           </motion.div>

           <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
              {percentage >= 75 ? "Excellent Performance!" : percentage >= 50 ? "Good Effort!" : "Requires Improvement"}
           </h2>
           <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
              Your exam has been submitted to the Academy portal. Final grades for essay components will be updated after teacher review.
           </p>

           <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                 <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Points Earned</p>
                 <p className="text-xl font-bold text-[var(--text-primary)]">{score.score} / {quiz?.total_points}</p>
              </div>
              <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                 <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Status</p>
                 <Badge variant={score.is_graded ? "success" : "warning"} className="font-bold">
                    {score.is_graded ? "Finalized" : "Pending Review"}
                 </Badge>
              </div>
           </div>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="p-6 bg-[var(--accent)] text-white border-none shadow-xl shadow-[var(--accent)]/30">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Award /></div>
                 <h3 className="font-bold">Certification Status</h3>
              </div>
              <p className="text-xs opacity-80 leading-relaxed mb-6">
                 Achieving a score of 75% or higher unlocks the course module completion badge on your public profile.
              </p>
              <Button className="w-full bg-white text-[var(--accent)] hover:bg-white/90 border-none">View Certificates</Button>
           </Card>

           <Card className="p-6 bg-[var(--bg-secondary)] border-none">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-4 flex items-center gap-2">
                 <BarChart3 className="h-4 w-4 text-[var(--accent)]" /> Next Steps
              </h4>
              <div className="space-y-3">
                 <Link href="/courses" className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] transition-all">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Return to Curriculum</span>
                    <ChevronLeft className="h-3 w-3 rotate-180" />
                 </Link>
                 <Link href="/chat" className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] transition-all">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">Discuss in Class Chat</span>
                    <ChevronLeft className="h-3 w-3 rotate-180" />
                 </Link>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
