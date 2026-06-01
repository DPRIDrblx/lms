"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, Search, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SobatNiaCoursesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile) return;
    const fetchMyCourses = async () => {
      // 1. Get active subscriptions
      const { data: subs } = await supabase
        .from("nia_subscriptions")
        .select("package_id")
        .eq("user_id", profile.id)
        .eq("status", "active");

      if (!subs || subs.length === 0) {
        setLoading(false);
        return;
      }

      const packageIds = subs.map((s: any) => s.package_id);

      // 2. Get courses linked to those packages
      const { data: mappings } = await supabase
        .from("nia_package_courses")
        .select("course_id, courses(*)")
        .in("package_id", packageIds);

      if (mappings) {
        // Filter out duplicates if a course is in multiple packages, and ensure it is published
        const uniqueCourses = new Map();
        mappings.forEach((m: any) => {
          if (m.courses && m.courses.is_published) {
            uniqueCourses.set(m.course_id, m.courses);
          }
        });
        setCourses(Array.from(uniqueCourses.values()));
      }
      setLoading(false);
    };

    fetchMyCourses();
  }, [profile]);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Materi Saya</h1>
        <p className="text-slate-500 font-medium">Akses semua kursus dan materi belajar dari paket yang Anda ikuti.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari materi Sains, Matematika..." 
          className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm font-medium"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-72 bg-slate-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Materi</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Anda belum memiliki paket belajar yang aktif. Yuk langganan paket NIA Tutoring sekarang!</p>
          <Link href="/bayarnia" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/20 inline-block">
            Lihat Paket Belajar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }}
              key={course.id} 
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative aspect-video bg-slate-100 overflow-hidden">
                {course.cover_image ? (
                  <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <BookOpen className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/20">
                    {course.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{course.description}</p>
                
                <Link href={`/courses/${course.id}`} className="w-full py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <PlayCircle className="w-5 h-5" /> Mulai Belajar
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
