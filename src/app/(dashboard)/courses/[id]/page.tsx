"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Play, 
  FileText, 
  HelpCircle, 
  Trophy, 
  Loader2,
  ChevronRight
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";

const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  pdf: FileText,
  video: Play,
  reading: FileText,
  quiz: HelpCircle,
};

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  xp_reward: number;
  order_index: number;
  type: "lesson";
}

interface Quiz {
  id: string;
  title: string;
  time_limit_minutes: number;
  passing_score: number;
  type: "quiz";
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  profiles: { full_name: string };
  lessons: Lesson[];
  quizzes: Quiz[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [course, setCourse] = useState<Course | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id(full_name),
          lessons(*),
          quizzes(*)
        `)
        .eq("id", id)
        .single();

      if (courseData) {
        setCourse({
          ...courseData,
          lessons: (courseData.lessons || []).map((l: any) => ({ ...l, type: "lesson" })),
          quizzes: (courseData.quizzes || []).map((q: any) => ({ ...q, type: "quiz" }))
        } as unknown as Course);
        
        if (profile) {
          const { data: progressData } = await supabase
            .from("course_progress")
            .select("lesson_id, completed")
            .eq("student_id", profile.id)
            .eq("course_id", id);
          
          if (progressData) {
            setCompletedIds(new Set(progressData.filter((d: any) => d.completed).map((d: any) => d.lesson_id)));
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [id, profile, supabase]);

  const handleComplete = async (lessonId: string, xpReward: number) => {
    if (!profile || completedIds.has(lessonId) || !course) return;
    setCompleting(lessonId);

    await supabase.from("course_progress").upsert({
      student_id: profile.id,
      course_id: course.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      xp_earned: xpReward,
    });

    await supabase
      .from("profiles")
      .update({ xp: (profile.xp || 0) + xpReward })
      .eq("id", profile.id);

    setCompletedIds((prev) => new Set([...prev, lessonId]));
    setCompleting(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    refreshProfile();
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!course) return <div className="py-20 text-center text-[var(--text-tertiary)]">Course not found.</div>;

  const missions = [
    ...course.lessons,
    ...course.quizzes.map(q => ({ ...q, content_type: "quiz", xp_reward: 50, order_index: 999 }))
  ].sort((a, b) => a.order_index - b.order_index);

  const doneCount = completedIds.size;
  const totalCount = missions.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="none" className="overflow-hidden">
          <div className="h-48 relative overflow-hidden flex items-center px-8">
            {course.cover_image && (
              <img src={course.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover blur-[2px] opacity-20" />
            )}
            <div className="relative z-10">
              <Badge variant="info" className="mb-2">{course.category}</Badge>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{course.title}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">by {course.profiles?.full_name}</p>
            </div>
          </div>
          <div className="px-8 py-5 border-t border-[var(--border)] flex items-center gap-6">
            <div className="flex-1">
              <ProgressBar value={doneCount} max={totalCount || 1} showLabel color="var(--accent)" />
            </div>
            <p className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
              {doneCount}/{totalCount} missions
            </p>
          </div>
        </Card>
      </motion.div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Learning Missions</h2>
        <div className="relative pl-8">
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-[var(--border)]" />
          <div className="space-y-3">
            {missions.map((m, i) => {
              const isQuiz = (m as any).type === "quiz";
              const done = completedIds.has(m.id);
              const TypeIcon = isQuiz ? HelpCircle : (TYPE_ICONS[m.content_type] || FileText);
              
              return (
                <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                  <div className="absolute -left-8 top-4 z-10">
                    {done ? (
                      <CheckCircle2 className="h-7 w-7 text-[var(--success)] bg-[var(--bg-secondary)] rounded-full" />
                    ) : (
                      <Circle className="h-7 w-7 text-[var(--border)] bg-[var(--bg-secondary)] rounded-full" />
                    )}
                  </div>

                  <Card className={`border ${done ? "border-[var(--success)]/30 bg-[var(--success-light)]/10" : "hover:border-[var(--accent)]/30 transition-all"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TypeIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                          <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                            {isQuiz ? "Assessment" : m.content_type}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">{m.title}</h3>
                        <div className="flex items-center gap-1 mt-2">
                          <Trophy className="h-3.5 w-3.5 text-[var(--warning)]" />
                          <span className="text-xs font-medium text-[var(--warning)]">+{m.xp_reward} XP Reward</span>
                        </div>
                      </div>

                      {profile?.role === "student" && (
                        isQuiz ? (
                          <Link href={`/quizzes/${m.id}`}>
                            <Button size="sm" variant="secondary" icon={<ChevronRight className="h-4 w-4" />}>
                              Take Exam
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant={done ? "ghost" : "primary"}
                            disabled={done}
                            loading={completing === m.id}
                            onClick={() => handleComplete(m.id, m.xp_reward)}
                          >
                            {done ? "Done ✓" : "Complete"}
                          </Button>
                        )
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
