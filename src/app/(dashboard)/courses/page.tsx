"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Course Portal</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Explore your learning missions and track progress.</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-[var(--bg-secondary)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-1.5 shadow-sm overflow-x-auto shrink-0">
          {(["all", "in-progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                filter === f
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
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
                  <div className="bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[16/9] flex items-center justify-center relative bg-[var(--bg-tertiary)] overflow-hidden">
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
                    <div className="p-6 flex-1 flex flex-col">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</h2>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 flex-1 leading-relaxed">{course.description}</p>
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
