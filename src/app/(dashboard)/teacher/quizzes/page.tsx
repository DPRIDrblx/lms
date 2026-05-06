"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Edit2, FileText, Clock, HelpCircle, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Quiz {
  id: string;
  title: string;
  time_limit_minutes: number;
  passing_score: number;
  is_randomized: boolean;
  created_at: string;
  courses: { title: string } | null;
}

export default function TeacherQuizzesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchQuizzes = async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });
      if (data) setQuizzes(data as unknown as Quiz[]);
      setLoading(false);
    };
    fetchQuizzes();
  }, [profile, supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">CBT Builder</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Create and manage Computer Based Tests and assessments.</p>
        </div>
        <Link href="/teacher/quizzes/create">
          <Button icon={<Plus className="h-4 w-4" />}>New Quiz</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="hover:shadow-[var(--shadow-md)] transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{quiz.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> {quiz.courses?.title || "No Course"}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {quiz.time_limit_minutes}m
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" /> {quiz.passing_score}% Pass
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/teacher/quizzes/${quiz.id}/builder`}>
                      <Button variant="secondary" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />}>Builder</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Award className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">No assessments found</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
            Start creating automated quizzes with multiple-choice or essay questions.
          </p>
          <Link href="/teacher/quizzes/create">
            <Button variant="secondary">Create Assessment</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
