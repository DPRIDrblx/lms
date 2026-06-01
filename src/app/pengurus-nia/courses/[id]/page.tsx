"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, Video, FileText, Layout, Presentation, GripVertical, Settings } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PengurusCourseBuilderPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  
  // Forms
  const [chapterTitle, setChapterTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
    const { data: chapterData } = await supabase.from("chapters").select("*").eq("course_id", id).order("order_index");
    const { data: lessonData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index");
    
    if (courseData) setCourse(courseData);
    if (chapterData) setChapters(chapterData);
    if (lessonData) setLessons(lessonData);
    
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("chapters").insert({
      course_id: id,
      title: chapterTitle,
      order_index: chapters.length
    });
    setChapterTitle("");
    setShowChapterModal(false);
    fetchData();
  };

  const handleDeleteChapter = async (cId: string) => {
    if(confirm("Hapus bab ini? Materi di dalamnya akan kehilangan grup.")) {
      await supabase.from("chapters").delete().eq("id", cId);
      fetchData();
    }
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      course_id: id,
      chapter_id: editingLesson.chapter_id || null,
      title: editingLesson.title,
      content_type: editingLesson.content_type,
      video_url: editingLesson.video_url || null,
      pdf_url: editingLesson.pdf_url || null,
      body_text: editingLesson.body_text || null,
      xp_reward: parseInt(editingLesson.xp_reward) || 10,
      order_index: editingLesson.id ? editingLesson.order_index : lessons.length
    };

    if (editingLesson.id) {
      await supabase.from("lessons").update(payload).eq("id", editingLesson.id);
    } else {
      await supabase.from("lessons").insert(payload);
    }
    
    setShowLessonModal(false);
    setEditingLesson(null);
    fetchData();
  };

  const handleDeleteLesson = async (lId: string) => {
    if(confirm("Hapus materi ini?")) {
      await supabase.from("lessons").delete().eq("id", lId);
      fetchData();
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5 text-orange-500" />;
      case 'interactive_video': return <Video className="w-5 h-5 text-purple-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'canva': return <Presentation className="w-5 h-5 text-blue-500" />;
      case 'game': return <Layout className="w-5 h-5 text-green-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'video': return "YouTube Video";
      case 'interactive_video': return "Interactive Video";
      case 'canva': return "Canva Slide";
      case 'game': return "Gamifikasi";
      case 'pdf': return "File PDF";
      default: return "Teks / Artikel";
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto pb-24">
      <Link href="/pengurus-nia/courses" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-4 w-fit">
        <ArrowLeft className="w-5 h-5" /> Kembali ke Manajemen Materi
      </Link>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900">{course?.title}</h1>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${course?.is_published ? 'bg-green-500' : 'bg-slate-700'}`}>
                  {course?.is_published ? "Dipublikasi" : "Draf"}
                </span>
              </div>
              <p className="text-slate-500 font-medium max-w-xl">{course?.description}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowChapterModal(true)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Bab Baru
              </button>
              <button 
                onClick={() => {
                  setEditingLesson({ title: "", content_type: "video", xp_reward: 10, chapter_id: chapters[0]?.id || "" });
                  setShowLessonModal(true);
                }}
                className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Tambah Materi
              </button>
            </div>
          </div>

          <div className="space-y-8 mt-8">
            {/* Unassigned Lessons */}
            {lessons.filter(l => !l.chapter_id).length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-sm ml-2">Materi Tanpa Bab</h3>
                <div className="space-y-3">
                  {lessons.filter(l => !l.chapter_id).map(lesson => (
                    <div key={lesson.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-orange-300 transition-colors">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                          {getIcon(lesson.content_type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                            <span>{getTypeLabel(lesson.content_type)}</span>
                            <span>•</span>
                            <span className="text-orange-500">{lesson.xp_reward} XP</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingLesson(lesson); setShowLessonModal(true); }} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters */}
            {chapters.map((chapter) => {
              const chapterLessons = lessons.filter(l => l.chapter_id === chapter.id);
              return (
                <div key={chapter.id} className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
                    <h2 className="font-black text-lg text-slate-900">Bab: {chapter.title}</h2>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteChapter(chapter.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    {chapterLessons.length === 0 ? (
                      <p className="text-center text-slate-400 font-medium py-4">Belum ada materi di bab ini.</p>
                    ) : (
                      chapterLessons.map(lesson => (
                        <div key={lesson.id} className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between group hover:border-orange-300 transition-colors shadow-sm">
                          <div className="flex items-center gap-4">
                            <GripVertical className="w-5 h-5 text-slate-300 cursor-move" />
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                              {getIcon(lesson.content_type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1">
                                <span>{getTypeLabel(lesson.content_type)}</span>
                                <span>•</span>
                                <span className="text-orange-500">{lesson.xp_reward} XP</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingLesson(lesson); setShowLessonModal(true); }} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-black text-slate-900">Bab Baru</h2>
            </div>
            <form onSubmit={handleAddChapter} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Bab</label>
                <input required type="text" value={chapterTitle} onChange={e=>setChapterTitle(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Contoh: Bab 1 Pendahuluan" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowChapterModal(false)} className="px-5 py-2.5 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-5 py-2.5 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600">Simpan Bab</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && editingLesson && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-black text-slate-900">{editingLesson.id ? "Edit Materi" : "Tambah Materi"}</h2>
              <button onClick={() => setShowLessonModal(false)} className="text-slate-400 hover:text-slate-900 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveLesson} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Judul Materi</label>
                  <input required type="text" value={editingLesson.title} onChange={e=>setEditingLesson({...editingLesson, title: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Contoh: Teori Dasar" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Bab</label>
                  <select value={editingLesson.chapter_id || ""} onChange={e=>setEditingLesson({...editingLesson, chapter_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="">-- Tanpa Bab --</option>
                    {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipe Materi</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'video', label: 'YouTube', icon: <Video className="w-4 h-4"/> },
                    { id: 'interactive_video', label: 'Interactive Video', icon: <Video className="w-4 h-4"/> },
                    { id: 'canva', label: 'Canva', icon: <Presentation className="w-4 h-4"/> },
                    { id: 'pdf', label: 'PDF', icon: <FileText className="w-4 h-4"/> },
                    { id: 'text', label: 'Artikel Teks', icon: <FileText className="w-4 h-4"/> },
                    { id: 'game', label: 'Gamifikasi', icon: <Layout className="w-4 h-4"/> },
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEditingLesson({...editingLesson, content_type: type.id})}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${editingLesson.content_type === type.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                    >
                      {type.icon}
                      <span className="font-bold text-xs">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(editingLesson.content_type === 'video' || editingLesson.content_type === 'interactive_video' || editingLesson.content_type === 'canva') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL (YouTube / Canva / Video)</label>
                  <input required type="url" value={editingLesson.video_url || ""} onChange={e=>setEditingLesson({...editingLesson, video_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="https://" />
                </div>
              )}

              {editingLesson.content_type === 'pdf' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL File PDF</label>
                  <input required type="url" value={editingLesson.pdf_url || ""} onChange={e=>setEditingLesson({...editingLesson, pdf_url: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="https://.../file.pdf" />
                </div>
              )}

              {(editingLesson.content_type === 'text' || editingLesson.content_type === 'game') && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Isi Teks / Topik Game</label>
                  <textarea rows={5} required value={editingLesson.body_text || ""} onChange={e=>setEditingLesson({...editingLesson, body_text: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Ketik isi materi di sini..." />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reward XP</label>
                <input required type="number" value={editingLesson.xp_reward || 10} onChange={e=>setEditingLesson({...editingLesson, xp_reward: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none max-w-[200px]" />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowLessonModal(false)} className="px-5 py-2.5 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-5 py-2.5 font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600">Simpan Materi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
