"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Search, Sparkles, PlayCircle, Map as MapIcon, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  teacher_id: string;
  profiles: { full_name: string };
  lessons_count: number;
}

export default function CoursesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
  const [goldenHourActive, setGoldenHourActive] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const query = supabase
        .from("courses")
        .select(`
          *,
          profiles:teacher_id(full_name),
          lessons_count:lessons(count)
        `)
        .eq("is_published", true);

      if (profile?.role === "student" && profile.class_id) {
        query.eq("class_id", profile.class_id);
      }

      const { data: coursesData } = await query;

      if (coursesData) {
        setCourses(coursesData.map((c: any) => ({
          ...c,
          lessons_count: c.lessons_count[0]?.count || 0
        })) as unknown as Course[]);
      }

      if (profile) {
        const { data: progressData } = await supabase
          .from("course_progress")
          .select("course_id, completed")
          .eq("student_id", profile.id);

        if (progressData) {
          const map: Record<string, number> = {};
          progressData.forEach((p: any) => {
            if (p.completed) {
              map[p.course_id] = (map[p.course_id] || 0) + 1;
            }
          });
          setProgress(map);
        }
      }
      
      const { data: ghSettings } = await supabase.from("global_settings").select("value").eq("key", "golden_hour_active").single();
      if (ghSettings && (ghSettings.value === "true" || ghSettings.value === true)) {
          setGoldenHourActive(true);
      }
      
      setLoading(false);
    };

    fetchCourses();
  }, [profile, supabase]);

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "all") return true;
    
    const done = progress[c.id] || 0;
    const total = c.lessons_count;
    
    if (filter === "completed") return done === total && total > 0;
    if (filter === "in-progress") return done < total;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Explore</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Discover courses and explore the Cyber Map.</p>
        </div>
      </motion.div>

      {/* Cyber Map Portal Banner */}
      <Link href="/student/map" className="block mt-6 mb-8 group relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 p-8 shadow-lg shadow-indigo-900/20 border-2 border-indigo-700/50 hover:border-indigo-400 transition-all">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none"></div>
         
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-indigo-500/30 flex items-center justify-center border border-indigo-400/50 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  <MapIcon className="w-8 h-8 text-indigo-300" />
               </div>
               <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-1">Cyber Map (Peta Wilayah)</h2>
                  <p className="text-indigo-200 font-medium text-sm md:text-base max-w-md">Jelajahi wilayah kekuasaan kelas, tantang faksi lain, dan rebut dominasi di Middle International School!</p>
               </div>
            </div>
            
            <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
               <ChevronRight className="w-6 h-6 text-white" />
            </div>
         </div>
      </Link>

      {/* THE GOLDEN HOUR PORTAL */}
      {goldenHourActive && profile?.role === 'student' && (
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-[0_15px_40px_rgba(245,158,11,0.3)] mb-8 border border-white/20"
         >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute -top-[50%] -right-[10%] w-[500px] h-[500px] bg-yellow-300/30 rounded-full blur-[80px] pointer-events-none"></motion.div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
               <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-black uppercase tracking-widest border border-white/30 shadow-sm mb-4">
                     <Sparkles className="w-4 h-4 text-yellow-200" /> Event Spesial Terbuka!
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-200 drop-shadow-sm">The Golden Hour</h2>
                  <p className="text-lg font-medium text-white/90 max-w-lg mb-6 leading-relaxed">Masuk ke portal kuis gacha harian sekarang juga dan dapatkan kesempatan memenangkan <span className="font-black text-yellow-300">Gems</span> secara acak!</p>
                  
                  <Link href="/student/golden-hour">
                     <button className="flex items-center gap-3 px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_6px_0_rgb(254,215,170)] hover:shadow-[0_8px_0_rgb(254,215,170)]">
                        <PlayCircle className="w-6 h-6" /> Masuk Portal
                     </button>
                  </Link>
               </div>
               
               <div className="hidden md:flex relative shrink-0">
                  <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-40 rounded-full"></div>
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Jackpot&backgroundColor=transparent" alt="Gacha Bot" className="w-48 h-48 relative z-10 drop-shadow-2xl animate-bounce" style={{ animationDuration: '3s' }} />
               </div>
            </div>
         </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-slate-200 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-[0_4px_0_rgb(226,232,240)]"
          />
        </div>
        <div className="flex gap-1.5 bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-1.5 shadow-sm overflow-x-auto shrink-0">
          {(["all", "in-progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all capitalize whitespace-nowrap border-2 ${
                filter === f
                  ? "bg-indigo-500 text-white border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] transform translate-y-1"
                  : "bg-white text-slate-500 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(226,232,240)]"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-[var(--bg-tertiary)]/50 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => {
            const done = progress[course.id] || 0;
            const total = course.lessons_count;
            const progressPercent = Math.round((done / (total || 1)) * 100);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/courses/${course.id}`} className="block h-full group">
                  <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-[0_8px_0_rgb(226,232,240)] transform transition-all duration-150 hover:-translate-y-1 active:translate-y-2 active:shadow-none h-full flex flex-col">
                    <div className="aspect-[16/9] flex items-center justify-center relative bg-indigo-50 overflow-hidden">
                      {course.cover_image ? (
                        <img src={course.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${done === total && total > 0 ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-indigo-500/90 text-white border-indigo-400'}`}>
                          {done === total && total > 0 ? "Completed" : `${done}/${total} Lessons`}
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-5 right-5">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/20 shadow-sm">
                           {course.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col bg-white">
                      <h2 className="text-base sm:text-xl font-black text-slate-800 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-500 transition-colors">{course.title}</h2>
                      <p className="text-sm font-bold text-slate-500 line-clamp-2 mb-6 flex-1 leading-relaxed">{course.description}</p>
                      <div className="pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-[var(--text-tertiary)] truncate mr-2">By <span className="font-semibold text-[var(--text-secondary)]">{course.profiles?.full_name}</span></p>
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{progressPercent}%</p>
                        </div>
                        <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--bg-secondary)] backdrop-blur-lg border border-[var(--border)] rounded-3xl text-center py-20 shadow-sm">
          <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No courses found</h2>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
