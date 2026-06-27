"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Plus, Edit, BookOpen, Trash2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Course {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

export default function PengurusCoursesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });
      if (data) setCourses(data as Course[]);
      setLoading(false);
    };
    fetchCourses();
  }, [profile]);

  const handleTogglePublish = async (courseId: string, currentState: boolean) => {
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: !currentState } : c));
    const { error } = await supabase.from("courses").update({ is_published: !currentState }).eq("id", courseId);
    if (error) {
      alert("Gagal memperbarui status: " + error.message);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, is_published: currentState } : c));
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manajemen Materi (Course)</h1>
          <p className="text-slate-500 font-medium">Buat dan atur urutan materi bimbingan belajar untuk Sobat IGNITE.</p>
        </div>
        <Link 
          href="/pengurus-nia/courses/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" /> Buat Materi Baru
        </Link>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {course.cover_image ? (
                  <img src={course.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <BookOpen className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md shadow-sm text-white ${course.is_published ? 'bg-green-500' : 'bg-slate-700'}`}>
                    {course.is_published ? "Dipublikasi" : "Draf"}
                  </span>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => handleTogglePublish(course.id, course.is_published)}
                    className="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 flex items-center gap-2"
                  >
                    {course.is_published ? <><EyeOff className="w-4 h-4"/> Sembunyikan</> : <><Eye className="w-4 h-4"/> Publikasikan</>}
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{course.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-400">
                    Dibuat: {new Date(course.created_at).toLocaleDateString('id-ID')}
                  </span>
                  <Link href={`/pengurus-nia/courses/${course.id}`} className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold rounded-lg flex items-center gap-1 text-sm">
                    <Edit className="w-4 h-4" /> Edit Materi
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-16 text-center">
          <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Belum ada materi</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Mulai buat modul materi pertama Anda untuk Sobat IGNITE.</p>
          <Link href="/pengurus-nia/courses/create" className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> Buat Materi
          </Link>
        </div>
      )}
    </div>
  );
}
