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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Presentation
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  pdf: FileText,
  video: Play,
  reading: FileText,
  quiz: HelpCircle,
  canva: Presentation,
};

const BUTTON_LABELS: Record<string, string> = {
  text: "Baca",
  pdf: "Buka PDF",
  video: "Tonton",
  quiz: "Kerjakan Kuis",
  canva: "Lihat"
};

interface Lesson {
  id: string;
  chapter_id: string | null;
  title: string;
  content_type: string;
  xp_reward: number;
  order_index: number;
  type: "lesson";
}

interface Quiz {
  id: string;
  chapter_id: string | null;
  title: string;
  time_limit_minutes: number;
  passing_score: number;
  type: "quiz";
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  profiles: { full_name: string };
  chapters: Chapter[];
  lessons: Lesson[];
  quizzes: Quiz[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { uiMode } = useTheme();
  const { profile } = useAuth();
  const supabase = createClient();
  const [course, setCourse] = useState<Course | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id(full_name),
          chapters(*),
          lessons(*),
          quizzes(*)
        `)
        .eq("id", id)
        .single();

      if (courseData) {
        setCourse({
          ...courseData,
          chapters: (courseData.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index),
          lessons: (courseData.lessons || []).map((l: any) => ({ 
            ...l, 
            type: "lesson",
            content_type: (l.content_type === 'video' && l.video_url?.toLowerCase().includes('canva')) ? 'canva' : l.content_type 
          })),
          quizzes: (courseData.quizzes || []).map((q: any) => ({ ...q, type: "quiz" }))
        } as unknown as Course);
        
        if (courseData.chapters) {
          setExpandedChapters(new Set(courseData.chapters.map((c: any) => c.id)));
        }

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

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!course) return <div className="py-20 text-center text-[var(--text-tertiary)]">Course not found.</div>;

  const missions = [
    ...course.lessons,
    ...course.quizzes.map(q => ({ ...q, content_type: "quiz", xp_reward: 50, order_index: 999 }))
  ];

  const doneCount = completedIds.size;
  const totalCount = missions.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className={cn("bg-white overflow-hidden transition-all", uiMode === 'clean' ? "rounded-2xl border border-slate-200 shadow-sm" : "rounded-[2rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)]")}>
          <div className="h-56 relative overflow-hidden flex items-center px-8 bg-indigo-500">
            {course.cover_image && (
              <>
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img src={course.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover blur-[2px]" />
              </>
            )}
            <div className="relative z-20">
              <Badge variant="info" className="mb-3 backdrop-blur-md bg-white/20 border-white/30 text-white shadow-lg">{course.category}</Badge>
              <h1 className="text-4xl font-black text-white drop-shadow-md mb-2">{course.title}</h1>
              <p className="text-sm text-white/90 font-bold drop-shadow-sm">Taught by {course.profiles?.full_name}</p>
            </div>
          </div>
          <div className={cn("px-8 py-5 flex items-center gap-6 bg-white", uiMode === 'clean' ? "border-t border-slate-100" : "border-t-2 border-slate-100")}>
            <div className="flex-1">
              <ProgressBar value={doneCount} max={totalCount || 1} showLabel color="#10B981" size="lg" />
            </div>
            <p className="text-sm font-black text-slate-500 whitespace-nowrap bg-slate-100 px-4 py-2 rounded-xl">
              {doneCount} / {totalCount} <span className="font-bold opacity-70">Missions Completed</span>
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6 mt-8">
        <h2 className="text-xl font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[var(--accent)]" /> 
          Course Curriculum
        </h2>
        
        {course.chapters.length > 0 ? (
          <>
            {course.chapters.map(chapter => {
              const chapterMissions = missions
                .filter(m => m.chapter_id === chapter.id)
                .sort((a, b) => a.order_index - b.order_index);
              const isExpanded = expandedChapters.has(chapter.id);
              const chapterDoneCount = chapterMissions.filter(m => completedIds.has(m.id)).length;
              
              return (
                <div key={chapter.id} className="space-y-3">
                  <div 
                    className={cn("flex items-center justify-between p-4 bg-white cursor-pointer transition-all group", uiMode === 'clean' ? (isExpanded ? "border border-[#108B96] bg-slate-50 rounded-xl" : "border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm") : (isExpanded ? "border-2 rounded-2xl border-indigo-200 bg-indigo-50 shadow-[0_4px_0_rgb(199,210,254)]" : "border-2 rounded-2xl border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] hover:shadow-[0_6px_0_rgb(226,232,240)] hover:-translate-y-1"))}
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}`}>
                        {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg">{chapter.title}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-0.5">{chapterDoneCount}/{chapterMissions.length} completed</p>
                      </div>
                    </div>
                    <ProgressBar value={chapterDoneCount} max={chapterMissions.length || 1} className="w-24 hidden sm:block" color="#6366f1" />
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 space-y-3 overflow-hidden relative"
                      >
                        <div className="absolute left-[38px] top-2 bottom-2 w-px bg-[var(--border)] -z-10" />
                        {chapterMissions.map((m, i) => {
                          const isQuiz = (m as any).type === "quiz";
                          const done = completedIds.has(m.id);
                          const TypeIcon = isQuiz ? HelpCircle : (TYPE_ICONS[m.content_type] || FileText);
                          const btnLabel = isQuiz ? "Kerjakan" : (BUTTON_LABELS[m.content_type] || "Buka");
                          
                          return (
                            <div key={m.id} className="relative flex items-center pt-2">
                              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 z-10 bg-[var(--bg-primary)] p-1">
                                {done ? (
                                  <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
                                ) : (
                                  <Circle className="h-6 w-6 text-[var(--border)]" />
                                )}
                              </div>
                              
                              <div className={cn("ml-10 w-full p-4 transition-all", uiMode === 'clean' ? (done ? "rounded-xl border border-emerald-200 bg-emerald-50/50" : "rounded-xl border border-slate-200 bg-white hover:border-slate-300") : (done ? "rounded-2xl border-2 border-emerald-200 bg-emerald-50" : "rounded-2xl border-2 border-slate-200 bg-white shadow-[0_4px_0_rgb(226,232,240)]"))}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <TypeIcon className="h-4 w-4 text-slate-400" />
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        {isQuiz ? "Assessment" : (m.content_type === "canva" ? "presentasi" : m.content_type)}
                                      </span>
                                    </div>
                                    <h3 className={`text-base font-black ${done ? "text-emerald-700 opacity-80" : "text-slate-700"}`}>{m.title}</h3>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                      <span className="text-xs font-black text-amber-500">+{m.xp_reward} XP</span>
                                    </div>
                                  </div>

                                  {profile?.role === "student" && (
                                    isQuiz ? (
                                      <Link href={`/quizzes/${m.id}`}>
                                        <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-[#108B96] text-white hover:bg-[#0d737d]") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none"))}>
                                          {done ? "Lihat Nilai" : "Mulai Ujian"} <ChevronRight className="h-4 w-4" />
                                        </button>
                                      </Link>
                                    ) : (
                                      <Link href={`/courses/${id}/lessons/${m.id}`}>
                                        <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-[#108B96] text-white hover:bg-[#0d737d]") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none"))}>
                                          {done ? "Pelajari Ulang" : btnLabel} <ChevronRight className="h-4 w-4" />
                                        </button>
                                      </Link>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {chapterMissions.length === 0 && (
                          <div className="ml-10 p-4 border-2 border-dashed border-[var(--border)] rounded-xl text-center text-[var(--text-tertiary)] text-xs font-medium">
                            Belum ada materi di bab ini.
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {/* Pseudo-chapter for unassigned missions (e.g. Quizzes without chapter_id) */}
            {missions.filter(m => !m.chapter_id).length > 0 && (
              <div className="space-y-3 mt-6">
                <div 
                  className={cn("flex items-center justify-between p-4 bg-white cursor-pointer transition-all group", uiMode === 'clean' ? (expandedChapters.has("assessments") ? "border border-amber-400 bg-amber-50 rounded-xl" : "border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm") : (expandedChapters.has("assessments") ? "border-2 rounded-2xl border-amber-200 bg-amber-50 shadow-[0_4px_0_rgb(253,230,138)]" : "border-2 rounded-2xl border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] hover:shadow-[0_6px_0_rgb(226,232,240)] hover:-translate-y-1"))}
                  onClick={() => toggleChapter("assessments")}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${expandedChapters.has("assessments") ? 'bg-amber-200 text-amber-600' : 'bg-amber-100 text-amber-500 group-hover:bg-amber-200 group-hover:text-amber-600'}`}>
                      {expandedChapters.has("assessments") ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-lg">Ujian & Asesmen (CBT)</h3>
                      <p className="text-sm font-bold text-slate-400 mt-0.5">Ujian kompetensi akhir</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedChapters.has("assessments") && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-6 space-y-3 overflow-hidden relative"
                    >
                      <div className="absolute left-[38px] top-2 bottom-2 w-px bg-[var(--border)] -z-10" />
                      {missions.filter(m => !m.chapter_id).map((m, i) => {
                        const isQuiz = (m as any).type === "quiz";
                        const done = completedIds.has(m.id);
                        const TypeIcon = isQuiz ? HelpCircle : (TYPE_ICONS[m.content_type] || FileText);
                        const btnLabel = isQuiz ? "Kerjakan" : (BUTTON_LABELS[m.content_type] || "Buka");
                        
                        return (
                          <div key={m.id} className="relative flex items-center pt-2">
                            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 z-10 bg-[var(--bg-primary)] p-1">
                              {done ? (
                                <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
                              ) : (
                                <Circle className="h-6 w-6 text-[var(--border)]" />
                              )}
                            </div>
                            
                            <div className={`ml-10 w-full p-4 rounded-2xl border-2 ${done ? 'border-emerald-200 bg-emerald-50' : 'bg-white border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <TypeIcon className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                      {isQuiz ? "Assessment CBT" : (m.content_type === "canva" ? "presentasi" : m.content_type)}
                                    </span>
                                  </div>
                                  <h3 className={`text-base font-black ${done ? "text-emerald-700 opacity-80" : "text-slate-700"}`}>{m.title}</h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                    <span className="text-xs font-black text-amber-500">+{m.xp_reward} XP</span>
                                  </div>
                                </div>

                                {profile?.role === "student" && (
                                  isQuiz ? (
                                    <Link href={`/quizzes/${m.id}`}>
                                      <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-amber-500 text-white hover:bg-amber-600") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-amber-500 text-white border-amber-600 shadow-[0_4px_0_rgb(217,119,6)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(217,119,6)] active:translate-y-1 active:shadow-none"))}>
                                        {done ? "Lihat Nilai" : "Mulai Ujian"} <ChevronRight className="h-4 w-4" />
                                      </button>
                                    </Link>
                                  ) : (
                                    <Link href={`/courses/${id}/lessons/${m.id}`}>
                                      <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-[#108B96] text-white hover:bg-[#0d737d]") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none"))}>
                                        {done ? "Pelajari Ulang" : btnLabel} <ChevronRight className="h-4 w-4" />
                                      </button>
                                    </Link>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-3.5 top-2 bottom-2 w-px bg-[var(--border)]" />
            <div className="space-y-3">
              {missions.map((m, i) => {
                const isQuiz = (m as any).type === "quiz";
                const done = completedIds.has(m.id);
                const TypeIcon = isQuiz ? HelpCircle : (TYPE_ICONS[m.content_type] || FileText);
                const btnLabel = isQuiz ? "Kerjakan" : (BUTTON_LABELS[m.content_type] || "Buka");
                
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                    <div className="absolute -left-8 top-4 z-10">
                      {done ? (
                        <CheckCircle2 className="h-7 w-7 text-emerald-500 bg-white rounded-full" />
                      ) : (
                        <Circle className="h-7 w-7 text-slate-300 bg-white rounded-full" />
                      )}
                    </div>

                    <div className={`w-full p-4 rounded-2xl border-2 ${done ? 'border-emerald-200 bg-emerald-50' : 'bg-white border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {isQuiz ? "Assessment" : (m.content_type === "canva" ? "presentasi" : m.content_type)}
                            </span>
                          </div>
                          <h3 className={`text-base font-black ${done ? "text-emerald-700 opacity-80" : "text-slate-700"}`}>{m.title}</h3>
                          <div className="flex items-center gap-1 mt-2">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-black text-amber-500">+{m.xp_reward} XP Reward</span>
                          </div>
                        </div>

                        {profile?.role === "student" && (
                          isQuiz ? (
                            <Link href={`/quizzes/${m.id}`}>
                              <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-amber-500 text-white hover:bg-amber-600") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-amber-500 text-white border-amber-600 shadow-[0_4px_0_rgb(217,119,6)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(217,119,6)] active:translate-y-1 active:shadow-none"))}>
                                {done ? "Lihat Nilai" : "Mulai Ujian"} <ChevronRight className="h-4 w-4" />
                              </button>
                            </Link>
                          ) : (
                            <Link href={`/courses/${id}/lessons/${m.id}`}>
                              <button className={cn("px-4 py-2 font-bold text-sm transition-all flex items-center gap-1", uiMode === 'clean' ? (done ? "rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" : "rounded-lg border border-transparent bg-[#108B96] text-white hover:bg-[#0d737d]") : (done ? "rounded-xl border-2 bg-slate-100 text-slate-500 border-slate-200" : "rounded-xl border-2 bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none"))}>
                                {done ? "Pelajari Ulang" : btnLabel} <ChevronRight className="h-4 w-4" />
                              </button>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {missions.length === 0 && (
                <div className="p-10 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
                  <BookOpen className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold text-[var(--text-secondary)]">Belum ada materi di kursus ini.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
