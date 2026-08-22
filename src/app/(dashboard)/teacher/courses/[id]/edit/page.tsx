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
  ChevronUp,
  Presentation,
  X,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gradebook } from "@/components/teacher/gradebook";

interface Lesson {
  id: string;
  chapter_id: string | null;
  title: string;
  content_type: "text" | "video" | "pdf" | "canva" | "game" | "interactive_video" | "whiteboard" | "assignment";
  body_text?: string;
  video_url?: string;
  pdf_url?: string;
  interactive_quiz_data?: any[];
  order_index: number;
  xp_reward: number;
  due_date?: string | null;
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
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"curriculum" | "gradebook">("curriculum");
  const [gameTopic, setGameTopic] = useState("");
  const [gameInstruction, setGameInstruction] = useState("");

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    category: "",
    cover_image: "",
    target_class_ids: [] as string[],
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: classData } = await supabase.from("classes").select("*").order("name");
    const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
    const { data: chapterData } = await supabase.from("chapters").select("*").eq("course_id", id).order("order_index", { ascending: true });
    const { data: lessonData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index", { ascending: true });
    const { data: quizData } = await supabase.from("quizzes").select("*").eq("course_id", id);
    
    if (classData) setClasses(classData);
    if (courseData) setCourse(courseData);
    if (chapterData) {
      setChapters(chapterData);
      setExpandedChapters(new Set(chapterData.map((c: any) => c.id)));
    }
    if (lessonData) {
      const parsed = lessonData.map((l: any) => ({
        ...l,
        content_type: (l.content_type === 'video' && l.video_url?.toLowerCase().includes('canva')) ? 'canva' : l.content_type
      }));
      setLessons(parsed as Lesson[]);
    }
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

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course_banners')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('course_banners')
        .getPublicUrl(filePath);

      setCourseFormData(prev => ({ ...prev, cover_image: data.publicUrl }));
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('courses').update({
        title: courseFormData.title,
        description: courseFormData.description,
        category: courseFormData.category,
        cover_image: courseFormData.cover_image,
        target_class_ids: courseFormData.target_class_ids.length > 0 ? courseFormData.target_class_ids : []
      }).eq('id', id);
      if (error) throw error;
      toast.success("Info course berhasil diupdate!");
      setShowCourseModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(`Gagal update: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!editingLesson || !editingLesson.title) return;
    setSaving(true);

    let finalVideoUrl = editingLesson.video_url;
    if (editingLesson.content_type === "whiteboard" && !finalVideoUrl) {
      finalVideoUrl = `lms-board-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
    }

    const lessonData = {
      course_id: id,
      chapter_id: editingLesson.chapter_id,
      title: editingLesson.title,
      content_type: editingLesson.content_type === 'canva' ? 'video' : editingLesson.content_type,
      body_text: editingLesson.body_text,
      video_url: finalVideoUrl,
      pdf_url: editingLesson.pdf_url,
      interactive_quiz_data: editingLesson.interactive_quiz_data || [],
      xp_reward: editingLesson.xp_reward || 10,
      due_date: editingLesson.due_date || null,
      order_index: editingLesson.id ? editingLesson.order_index : lessons.length,
    };

    try {
      if (editingLesson.id) {
        const { error } = await supabase.from("lessons").update(lessonData).eq("id", editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lessons").insert(lessonData);
        if (error) throw error;
      }

      await fetchData();
      setShowLessonModal(false);
      setEditingLesson(null);
      toast.success("Materi berhasil disimpan!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Gagal menyimpan: ${error.message || "Terjadi kesalahan"}`);
    } finally {
      setSaving(false);
    }
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
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Academic Session • {course?.target_class_ids?.length ? `${course.target_class_ids.length} Classes Linked` : "No Class Assigned"}</p>
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
                  <Button variant="secondary" className="w-full justify-start" icon={<Edit3 className="h-4 w-4" />} onClick={() => {
                    setCourseFormData({
                      title: course?.title || "",
                      description: course?.description || "",
                      category: course?.category || "General",
                      cover_image: course?.cover_image || "",
                      target_class_ids: course?.target_class_ids || [],
                    });
                    setShowCourseModal(true);
                  }}>
                    Edit Course Info
                  </Button>
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
                                    {lesson.content_type === "video" ? <Video className="h-4 w-4 text-[var(--accent)]" /> : lesson.content_type === "canva" ? <Presentation className="h-4 w-4 text-[var(--accent)]" /> : lesson.content_type === "game" ? <Presentation className="h-4 w-4 text-purple-500" /> : lesson.content_type === "assignment" ? <FileText className="h-4 w-4 text-amber-500" /> : <FileText className="h-4 w-4 text-[var(--accent)]" />}
                                    <span className="text-sm font-medium text-[var(--text-primary)]">{lesson.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {lesson.content_type === "assignment" && (
                                      <Link href={`/teacher/courses/${id}/assignments/${lesson.id}`}>
                                        <button className="p-1.5 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold px-2 mr-2 border border-amber-200">Beri Nilai Tugas</button>
                                      </Link>
                                    )}
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
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
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
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {(["text", "video", "pdf", "canva", "game", "interactive_video", "whiteboard", "assignment"] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setEditingLesson({ ...editingLesson, content_type: t })}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${editingLesson?.content_type === t ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)]"}`}
                >
                  <span className="text-[10px] font-bold uppercase text-center">{t === "canva" ? "presentasi" : t === "game" ? "AI Game" : t === "interactive_video" ? "Int. Video" : t === "whiteboard" ? "Whiteboard" : t === "assignment" ? "Tugas" : t}</span>
                </button>
              ))}
            </div>
          </div>
          
          {editingLesson?.content_type === "text" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Content (Markdown)</label>
              <textarea 
                rows={4}
                value={editingLesson?.body_text || ""} 
                onChange={e => setEditingLesson({ ...editingLesson, body_text: e.target.value })}
                className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none resize-none"
                placeholder="Write your lesson content here..."
              />
            </div>
          )}

          {editingLesson?.content_type === "video" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">YouTube Video URL / Embed ID</label>
              <input 
                type="text" 
                value={editingLesson?.video_url || ""} 
                onChange={e => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
                placeholder="e.g. dQw4w9WgXcQ"
              />
            </div>
          )}

          {editingLesson?.content_type === "interactive_video" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">YouTube URL / MP4 URL</label>
                <input 
                  type="text" 
                  value={editingLesson?.video_url || ""} 
                  onChange={e => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Kuis di Dalam Video</h4>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary"
                    className="h-8 text-xs"
                    onClick={() => {
                      const currentData = (editingLesson?.interactive_quiz_data as any[]) || [];
                      const newData = [...currentData, { timestamp: 0, question: "", options: ["", ""], correct_index: 0 }];
                      setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Tambah Soal
                  </Button>
                </div>
                
                {!(editingLesson?.interactive_quiz_data?.length) && (
                   <p className="text-xs text-[var(--text-tertiary)] italic">Belum ada pertanyaan interaktif. Klik tombol "Tambah Soal".</p>
                )}

                {(editingLesson?.interactive_quiz_data || []).map((q: any, index: number) => (
                  <div key={index} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl relative space-y-3">
                    <button 
                      type="button"
                      className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-red-600 bg-white p-1 rounded-md shadow-sm border border-[var(--border)]"
                      onClick={() => {
                        const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                        newData.splice(index, 1);
                        setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pr-8">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Waktu (MM:SS / Detik)</label>
                        <input 
                          type="text" 
                          value={q.timestamp} 
                          onChange={(e) => {
                            const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                            newData[index].timestamp = e.target.value;
                            setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                          }}
                          placeholder="e.g. 02:38 atau 158"
                          className="w-full h-9 px-3 rounded-lg text-sm border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">Pertanyaan</label>
                        <input 
                          type="text" 
                          value={q.question} 
                          onChange={(e) => {
                            const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                            newData[index].question = e.target.value;
                            setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                          }}
                          className="w-full h-9 px-3 rounded-lg text-sm border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                          placeholder="Ketik pertanyaan di sini..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Pilihan Jawaban (Pilih yang benar)</label>
                      <div className="space-y-2">
                        {q.options.map((opt: string, optIndex: number) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input 
                              type="radio" 
                              name={`correct_${index}`} 
                              checked={q.correct_index === optIndex}
                              onChange={() => {
                                const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                                newData[index].correct_index = optIndex;
                                setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                              }}
                              className="w-4 h-4 text-[var(--accent)]"
                            />
                            <input 
                              type="text" 
                              value={opt} 
                              onChange={(e) => {
                                const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                                newData[index].options[optIndex] = e.target.value;
                                setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                              }}
                              className="flex-1 h-8 px-3 rounded-lg text-sm border border-[var(--border)] outline-none focus:border-[var(--accent)]" 
                              placeholder={`Opsi ${optIndex + 1}`}
                            />
                            <button 
                              type="button" 
                              className="p-1.5 text-[var(--text-tertiary)] hover:text-red-500 rounded bg-white border border-[var(--border)]"
                              onClick={() => {
                                const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                                newData[index].options.splice(optIndex, 1);
                                if (newData[index].correct_index >= newData[index].options.length) {
                                  newData[index].correct_index = Math.max(0, newData[index].options.length - 1);
                                }
                                setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          className="text-[10px] font-bold text-[var(--accent)] hover:text-indigo-600 mt-1"
                          onClick={() => {
                            const newData = [...((editingLesson.interactive_quiz_data as any[]) || [])];
                            newData[index].options.push("");
                            setEditingLesson({ ...editingLesson, interactive_quiz_data: newData });
                          }}
                        >
                          + Tambah Opsi Jawaban
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingLesson?.content_type === "whiteboard" && (
            <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] space-y-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Papan Tulis Kolaboratif 🖍️</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Ruangan rahasia untuk papan tulis ini akan <strong>dibuat secara otomatis</strong> saat Anda menyimpan materi. 
                Siswa yang membuka materi ini akan langsung bergabung ke kanvas interaktif yang sama dengan Anda secara real-time.
              </p>
            </div>
          )}

          {editingLesson?.content_type === "assignment" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Instruksi Tugas (Markdown)</label>
                <textarea 
                  rows={4}
                  value={editingLesson?.body_text || ""} 
                  onChange={e => setEditingLesson({ ...editingLesson, body_text: e.target.value })}
                  className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none resize-none"
                  placeholder="Tuliskan instruksi tugas secara detail..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Batas Waktu (Tenggat Waktu)</label>
                <input 
                  type="datetime-local" 
                  value={editingLesson?.due_date ? new Date(new Date(editingLesson.due_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                  onChange={e => setEditingLesson({ ...editingLesson, due_date: new Date(e.target.value).toISOString() })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
                />
              </div>
            </div>
          )}

          {editingLesson?.content_type === "canva" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Link Presentasi Canva / HTML Code</label>
              <input 
                type="text" 
                value={editingLesson?.video_url || ""} 
                onChange={e => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
                placeholder="Paste link presentasi Canva atau seluruh Kode Embed HTML..."
              />
              {editingLesson?.video_url?.includes('canva.link') && (
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
                  ℹ️ Menggunakan link pendek. Siswa akan melihat tombol "Lihat" untuk membuka presentasi.
                </p>
              )}
            </div>
          )}

          {editingLesson?.content_type === "pdf" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">PDF Link (G-Drive / Public URL)</label>
              <input 
                type="text" 
                value={editingLesson?.pdf_url || ""} 
                onChange={e => setEditingLesson({ ...editingLesson, pdf_url: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
                placeholder="https://..."
              />
            </div>
          )}

          {editingLesson?.content_type === "game" && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-4">
                 <div className="flex items-center gap-2 text-purple-700 font-bold">
                    <Presentation className="h-5 w-5" />
                    <span>AI Game Prompt Template</span>
                 </div>
                 <p className="text-xs text-purple-600">Gunakan template prompt ini untuk meminta AI (seperti ChatGPT atau Claude) membuatkan game interaktif. Salin prompt di bawah, berikan ke AI, lalu tempel kode HTML hasilnya ke kotak di bawahnya.</p>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="block text-xs font-semibold text-purple-800">Topik / Materi</label>
                      <input 
                        type="text" 
                        value={gameTopic}
                        onChange={(e) => setGameTopic(e.target.value)}
                        placeholder="e.g. Anatomi Jantung Manusia" 
                        className="w-full h-10 px-3 rounded-lg bg-white border border-purple-200 outline-none text-sm"
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <label className="block text-xs font-semibold text-purple-800">Instruksi Khusus (Opsional)</label>
                      <input 
                        type="text"
                        value={gameInstruction}
                        onChange={(e) => setGameInstruction(e.target.value)}
                        placeholder="e.g. Buat soal pilihan ganda, target umur 10 tahun"
                        className="w-full h-10 px-3 rounded-lg bg-white border border-purple-200 outline-none text-sm"
                      />
                   </div>
                 </div>

                 <div className="space-y-2">
                    <label className="block text-xs font-semibold text-purple-800 flex justify-between items-center">
                      Prompt untuk AI
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="h-7 text-[10px] bg-white"
                        onClick={() => {
                          navigator.clipboard.writeText(`Buatkan saya sebuah mini-game interaktif yang SANGAT ESTETIK berbasis HTML tunggal (HTML, CSS, dan JS berada dalam satu file). \n\nTopik materi: ${gameTopic || "[Isi Topik]"}\nInstruksi khusus: ${gameInstruction || "[Isi Instruksi]"}\n\nATURAN DESAIN & LOGIKA:\n1. Gunakan desain UI/UX modern (Glassmorphism, warna pastel/vibrant yang harmonis, bayangan halus, dan font sans-serif modern seperti Inter/Poppins).\n2. Tambahkan mikro-animasi yang mulus saat tombol ditekan (hover/active), kartu dibalik, atau saat transisi soal.\n3. Berikan *feedback* visual dan suara (opsional menggunakan API synth) jika pemain menjawab benar atau salah.\n4. Buat gamenya seru! Tambahkan adegan tambahan, cerita singkat, atau efek khusus yang membuatnya terasa seperti game sungguhan yang bagus.\n5. Logika permainan harus anti-bug, menghitung skor dengan benar, dan menampilkan layar "Menang/Kemenangan" yang meriah di akhir.\n\nSYARAT WAJIB (INTEGRASI LMS):\nKetika pemain berhasil menyelesaikan game sampai akhir atau menang, wajib jalankan baris kode javascript ini untuk melapor ke sistem LMS:\nwindow.parent.postMessage({ type: 'GAME_COMPLETED' }, '*');\n\nBerikan hanya kode HTML-nya saja tanpa penjelasan tambahan.`);
                          alert("Prompt tersalin!");
                        }}
                      >
                        Copy Prompt
                      </Button>
                    </label>
                    <textarea 
                      readOnly
                      rows={7}
                      value={`Buatkan saya sebuah mini-game interaktif yang SANGAT ESTETIK berbasis HTML tunggal (HTML, CSS, dan JS berada dalam satu file). \n\nTopik materi: ${gameTopic || "[Isi Topik]"}\nInstruksi khusus: ${gameInstruction || "[Isi Instruksi]"}\n\nATURAN DESAIN & LOGIKA:\n1. Gunakan desain UI/UX modern (Glassmorphism, warna pastel/vibrant yang harmonis, bayangan halus, dan font sans-serif modern seperti Inter/Poppins).\n2. Tambahkan mikro-animasi yang mulus saat tombol ditekan (hover/active), kartu dibalik, atau saat transisi soal.\n3. Berikan *feedback* visual dan suara (opsional menggunakan API synth) jika pemain menjawab benar atau salah.\n4. Buat gamenya seru! Tambahkan adegan tambahan, cerita singkat, atau efek khusus yang membuatnya terasa seperti game sungguhan yang bagus.\n5. Logika permainan harus anti-bug, menghitung skor dengan benar, dan menampilkan layar "Menang/Kemenangan" yang meriah di akhir.\n\nSYARAT WAJIB (INTEGRASI LMS):\nKetika pemain berhasil menyelesaikan game sampai akhir atau menang, wajib jalankan baris kode javascript ini untuk melapor ke sistem LMS:\nwindow.parent.postMessage({ type: 'GAME_COMPLETED' }, '*');\n\nBerikan hanya kode HTML-nya saja tanpa penjelasan tambahan.`}
                      className="w-full p-3 rounded-lg bg-white/50 border border-purple-200 outline-none resize-none text-xs text-purple-900 font-mono"
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Paste Kode HTML Game dari AI</label>
                <textarea 
                  rows={8}
                  value={editingLesson?.body_text || ""} 
                  onChange={e => setEditingLesson({ ...editingLesson, body_text: e.target.value })}
                  className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none resize-none font-mono text-sm"
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">XP Reward</label>
            <input 
              type="number" 
              value={editingLesson?.xp_reward || 10} 
              onChange={e => setEditingLesson({ ...editingLesson, xp_reward: parseInt(e.target.value) || 10 })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
            />
          </div>

          <Button className="w-full" onClick={handleSaveLesson} loading={saving}>Save Material</Button>
        </div>
      </Modal>

      {/* Edit Course Info Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Edit Course Info">
        <form onSubmit={handleSaveCourseInfo} className="space-y-4 p-1">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Target Classes</label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => {
                const isSelected = courseFormData.target_class_ids.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      const newIds = isSelected
                        ? courseFormData.target_class_ids.filter(id => id !== c.id)
                        : [...courseFormData.target_class_ids, c.id];
                      setCourseFormData({ ...courseFormData, target_class_ids: newIds });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]' 
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    Class {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Course Title</label>
            <input
              required
              type="text"
              value={courseFormData.title}
              onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
            <textarea
              required
              rows={4}
              value={courseFormData.description}
              onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Category</label>
            <select
              value={courseFormData.category}
              onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="General">General</option>
              <option value="Science">Science</option>
              <option value="Math">Math</option>
              <option value="History">History</option>
              <option value="Arts">Arts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Cover Image (Upload / URL)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={courseFormData.cover_image}
                  onChange={(e) => setCourseFormData({ ...courseFormData, cover_image: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <ImageIcon className="absolute left-4 top-3.5 h-4 w-4 text-[var(--text-tertiary)]" />
              </div>
              <div className="relative">
                 <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleUploadBanner}
                    disabled={uploadingBanner}
                 />
                 <Button type="button" variant="secondary" className="h-11 px-4 relative z-0 border-[var(--border)]" disabled={uploadingBanner}>
                    {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                 </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" type="button" onClick={() => setShowCourseModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>Save Changes</Button>
          </div>
        </form>
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
