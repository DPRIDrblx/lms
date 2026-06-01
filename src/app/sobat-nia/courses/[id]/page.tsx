"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, Play, FileText, HelpCircle, Trophy, ChevronDown, ChevronUp, Presentation, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const TYPE_ICONS: Record<string, React.ElementType> = {
  text: FileText,
  pdf: FileText,
  video: Play,
  interactive_video: Play,
  canva: Presentation,
  game: Layout,
  quiz: HelpCircle
};

const BUTTON_LABELS: Record<string, string> = {
  text: "Baca Materi",
  pdf: "Buka PDF",
  video: "Tonton Video",
  interactive_video: "Tonton Interaktif",
  canva: "Lihat Presentasi",
  game: "Mainkan Game",
  quiz: "Kerjakan Ujian"
};

export default function SobatNiaCourseDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
      const { data: courseData } = await supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id(full_name),
          chapters(*),
          lessons(*)
        `)
        .eq("id", id)
        .single();

      if (courseData) {
        // Sort chapters and lessons
        const sortedChapters = (courseData.chapters || []).sort((a: any, b: any) => a.order_index - b.order_index);
        const sortedLessons = (courseData.lessons || []).sort((a: any, b: any) => a.order_index - b.order_index);
        
        setCourse({
          ...courseData,
          chapters: sortedChapters,
          lessons: sortedLessons
        });
        
        if (sortedChapters.length > 0) {
          setExpandedChapters(new Set(sortedChapters.map((c: any) => c.id)));
        }

        // Fetch Progress
        const { data: progressData } = await supabase
          .from("course_progress")
          .select("lesson_id, completed")
          .eq("student_id", profile.id)
          .eq("course_id", id);
        
        if (progressData) {
          setCompletedIds(new Set(progressData.filter((d: any) => d.completed).map((d: any) => d.lesson_id)));
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [id, profile]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>;
  if (!course) return <div className="p-20 text-center font-bold text-slate-500">Materi tidak ditemukan.</div>;

  const totalCount = course.lessons.length;
  const doneCount = completedIds.size;
  const progressPercent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto pb-24">
      <Link href="/sobat-nia/courses" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 w-fit">
        <ArrowLeft className="w-5 h-5" /> Kembali ke Daftar Materi
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200">
        <div className="relative h-64 bg-slate-100 flex items-end p-8">
          {course.cover_image ? (
            <>
              <img src={course.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500" />
          )}
          
          <div className="relative z-10 w-full">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/20 inline-block mb-3">
              {course.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{course.title}</h1>
            <p className="text-white/80 font-medium">Pengajar: <span className="font-bold text-white">{course.profiles?.full_name}</span></p>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">Progres Belajar</span>
              <span className="text-sm font-black text-orange-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="px-5 py-3 bg-orange-50 text-orange-700 rounded-xl font-bold whitespace-nowrap text-center">
            {doneCount} / {totalCount} Selesai
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-orange-500" /> Kurikulum Belajar
        </h2>

        {course.chapters.length > 0 ? (
          course.chapters.map((chapter: any) => {
            const chapterLessons = course.lessons.filter((l: any) => l.chapter_id === chapter.id);
            const isExpanded = expandedChapters.has(chapter.id);
            const chapterDoneCount = chapterLessons.filter((l: any) => completedIds.has(l.id)).length;
            
            return (
              <div key={chapter.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-0.5">{chapterDoneCount}/{chapterLessons.length} Materi Selesai</p>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden md:block">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${chapterLessons.length ? (chapterDoneCount/chapterLessons.length)*100 : 0}%` }} />
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3 relative">
                        <div className="absolute left-[39px] top-0 bottom-0 w-px bg-slate-200" />
                        
                        {chapterLessons.map((lesson: any, idx: number) => {
                          const isDone = completedIds.has(lesson.id);
                          const Icon = TYPE_ICONS[lesson.content_type] || FileText;
                          
                          return (
                            <div key={lesson.id} className="relative flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full bg-slate-50 border-4 border-slate-50 flex items-center justify-center z-10 shrink-0 shadow-sm ml-2.5">
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500 bg-white rounded-full" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300 bg-white rounded-full" />
                                )}
                              </div>
                              
                              <div className={`flex-1 bg-white p-4 rounded-2xl border transition-all ${isDone ? 'border-green-200' : 'border-slate-200 hover:border-orange-300 hover:shadow-md'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <Icon className="w-4 h-4 text-orange-500" />
                                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                                        {lesson.content_type.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <h4 className={`font-bold text-base ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{lesson.title}</h4>
                                    <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-500">
                                      <Trophy className="w-3.5 h-3.5" /> +{lesson.xp_reward} XP
                                    </div>
                                  </div>
                                  
                                  <Link href={`/sobat-nia/courses/${id}/lessons/${lesson.id}`} className="shrink-0">
                                    <button className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold transition-all ${isDone ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}>
                                      {isDone ? "Pelajari Ulang" : (BUTTON_LABELS[lesson.content_type] || "Mulai")}
                                    </button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        
                        {chapterLessons.length === 0 && (
                          <div className="ml-12 p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-medium text-sm">
                            Belum ada materi di bab ini.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
             <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-bold">Kursus ini belum memiliki silabus/bab.</p>
          </div>
        )}
      </div>
    </div>
  );
}
