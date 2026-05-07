"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  GripVertical, 
  Video, 
  FileText, 
  Type, 
  Save,
  Loader2,
  Eye,
  BookOpen,
  HelpCircle,
  Award,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gradebook } from "@/components/teacher/gradebook";

interface Lesson {
  id: string;
  chapter_id: string | null;
  title: string;
  content_type: "text" | "video" | "pdf";
  body_text?: string;
  video_url?: string;
  pdf_url?: string;
  order_index: number;
  xp_reward: number;
}

interface Quiz {
  id: string;
  chapter_id: string | null;
  title: string;
  time_limit_minutes: number;
}

interface Chapter {
  id: string;
  title: string;
  order_index: number;
}

export default function EditCoursePage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"curriculum" | "gradebook">("curriculum");

  const fetchData = useCallback(async () => {
    const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
    const { data: chapterData } = await supabase.from("chapters").select("*").eq("course_id", id).order("order_index", { ascending: true });
    const { data: lessonData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index", { ascending: true });
    const { data: quizData } = await supabase.from("quizzes").select("*").eq("course_id", id);
    
    if (courseData) setCourse(courseData);
    if (chapterData) {
      setChapters(chapterData);
      setExpandedChapters(new Set(chapterData.map((c: any) => c.id)));
    }
    if (lessonData) setLessons(lessonData as Lesson[]);
    if (quizData) setQuizzes(quizData as Quiz[]);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle) return;
    setSaving(true);
    await supabase.from("chapters").insert({
      course_id: id,
      title: newChapterTitle,
      order_index: chapters.length
    });
    setNewChapterTitle("");
    setShowChapterModal(false);
    fetchData();
    setSaving(false);
  };

  const deleteChapter = async (cId: string) => {
    if (!confirm("Deleting this chapter will un-group its materials. Continue?")) return;
    await supabase.from("chapters").delete().eq("id", cId);
    fetchData();
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title) return;
    setSaving(true);

    const lessonData = {
      course_id: id,
      chapter_id: editingLesson.chapter_id,
      title: editingLesson.title,
      content_type: editingLesson.content_type,
      body_text: editingLesson.body_text,
      video_url: editingLesson.video_url,
      pdf_url: editingLesson.pdf_url,
      xp_reward: editingLesson.xp_reward || 10,
      order_index: editingLesson.id ? editingLesson.order_index : lessons.length,
    };

    if (editingLesson.id) {
      await supabase.from("lessons").update(lessonData).eq("id", editingLesson.id);
    } else {
      await supabase.from("lessons").insert(lessonData);
    }

    await fetchData();
    setShowLessonModal(false);
    setEditingLesson(null);
    setSaving(false);
  };

  const deleteLesson = async (lId: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("lessons").delete().eq("id", lId);
    fetchData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/teacher/courses" className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{course?.title}</h1>
              <Badge variant={course?.is_published ? "success" : "info"}>
                {course?.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Academic Session • {course?.class_id ? "Class Linked" : "No Class Assigned"}</p>
          </div>
        </div>
        
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)] self-start">
          <button 
            onClick={() => setActiveTab("curriculum")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'curriculum' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          >
            Curriculum
          </button>
          <button 
            onClick={() => setActiveTab("gradebook")}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'gradebook' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          >
            Gradebook
          </button>
        </div>

        {activeTab === "curriculum" && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowChapterModal(true)} icon={<Plus className="h-4 w-4" />}>
              New Chapter
            </Button>
            <Button size="sm" onClick={() => {
              setEditingLesson({ content_type: "text", xp_reward: 10, chapter_id: chapters[0]?.id || null });
              setShowLessonModal(true);
            }} icon={<Plus className="h-4 w-4" />}>
              Add Lesson
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "curriculum" ? (
          <motion.div 
            key="curriculum"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left: Course Settings */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-5 space-y-4">
                <h3 className="font-bold text-[var(--text-primary)]">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href={`/teacher/quizzes/create?course_id=${id}`}>
                    <Button variant="secondary" className="w-full justify-start" icon={<HelpCircle className="h-4 w-4" />}>
                      New Assessment
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start text-amber-600" 
                    icon={<Award className="h-4 w-4" />}
                    onClick={() => setActiveTab("gradebook")}
                  >
                    Enter Grades
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Chapter/Curriculum Manager */}
            <div className="lg:col-span-2 space-y-6">
              {chapters.length > 0 ? (
                <div className="space-y-4">
                  {chapters.map((chapter) => {
                    const chapterLessons = lessons.filter(l => l.chapter_id === chapter.id);
                    const chapterQuizzes = quizzes.filter(q => q.chapter_id === chapter.id);
                    const isExpanded = expandedChapters.has(chapter.id);

                    return (
                      <div key={chapter.id} className="space-y-2">
                        <div 
                          className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors group"
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
                            <h3 className="font-bold text-[var(--text-primary)]">{chapter.title}</h3>
                            <Badge variant="default" className="text-[10px]">{chapterLessons.length + chapterQuizzes.length} Items</Badge>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-6 space-y-2 overflow-hidden"
                            >
                              {chapterLessons.map((lesson) => (
                                <Card key={lesson.id} className="p-3 hover:border-[var(--accent)]/30 transition-all flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="h-4 w-4 text-[var(--text-tertiary)] cursor-grab" />
                                    {lesson.content_type === "video" ? <Video className="h-4 w-4 text-[var(--accent)]" /> : <FileText className="h-4 w-4 text-[var(--accent)]" />}
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditingLesson(lesson); setShowLessonModal(true); }} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:bg-[var(--error-light)] text-[var(--error)] rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </div>
                                </Card>
                              ))}
                              {chapterQuizzes.map((quiz) => (
                                <Card key={quiz.id} className="p-3 border-dashed border-[var(--accent)]/30 hover:bg-[var(--accent-light)]/20 transition-all flex items-center justify-between group">
                                  <div className="flex items-center gap-3">
                                    <GripVertical className="h-4 w-4 text-[var(--text-tertiary)] cursor-grab" />
                                    <HelpCircle className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{quiz.title} (Quiz)</span>
                                  </div>
                                  <Link href={`/teacher/quizzes/${quiz.id}/builder`}>
                                    <Button size="sm" variant="ghost">Edit Quiz</Button>
                                  </Link>
                                </Card>
                              ))}
                              {chapterLessons.length === 0 && chapterQuizzes.length === 0 && (
                                <div className="py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
                                  <p className="text-xs text-[var(--text-tertiary)]">Chapter is empty.</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-20 border-2 border-dashed">
                  <BookOpen className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-20" />
                  <h3 className="font-bold text-[var(--text-primary)]">No Chapters Yet</h3>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">Group your materials into chapters for better organization.</p>
                  <Button onClick={() => setShowChapterModal(true)}>Create Your First Chapter</Button>
                </Card>
              )}

              {/* Un-grouped Items */}
              {lessons.some(l => !l.chapter_id) && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Un-grouped Materials</h3>
                  {lessons.filter(l => !l.chapter_id).map(lesson => (
                    <Card key={lesson.id} className="p-3 hover:border-[var(--accent)]/30 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                          <FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">{lesson.title}</span>
                        </div>
                        <button onClick={() => { setEditingLesson(lesson); setShowLessonModal(true); }} className="text-xs text-[var(--accent)] font-bold">Assign to Chapter</button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="gradebook"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Gradebook courseId={id as string} classId={course?.class_id} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Modal */}
      <Modal isOpen={showChapterModal} onClose={() => setShowChapterModal(false)} title="New Chapter">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Chapter Title</label>
            <input 
              type="text" 
              value={newChapterTitle} 
              onChange={e => setNewChapterTitle(e.target.value)} 
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
              placeholder="e.g. Chapter 1: Introduction"
            />
          </div>
          <Button className="w-full" onClick={handleAddChapter} loading={saving}>Create Chapter</Button>
        </div>
      </Modal>

      {/* Lesson Modal */}
      <Modal isOpen={showLessonModal} onClose={() => { setShowLessonModal(false); setEditingLesson(null); }} title={editingLesson?.id ? "Edit Lesson" : "Add Lesson"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Chapter (Optional)</label>
            <select 
              value={editingLesson?.chapter_id || ""} 
              onChange={e => setEditingLesson({ ...editingLesson, chapter_id: e.target.value || null })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
            >
              <option value="">No Chapter</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input 
              type="text" 
              value={editingLesson?.title || ""} 
              onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["text", "video", "pdf"] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setEditingLesson({ ...editingLesson, content_type: t })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${editingLesson?.content_type === t ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)]"}`}
                >
                  {t === "video" ? <Video size={16} /> : <FileText size={16} />}
                  <span className="text-[10px] font-bold uppercase">{t}</span>
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleSaveLesson} loading={saving}>Save Material</Button>
        </div>
      </Modal>
    </div>
  );
}

function ExternalLink({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
