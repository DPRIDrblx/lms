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
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Course Portal</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Explore your learning missions and track progress.</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
        </div>
        <div className="flex gap-1.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-1">
          {(["all", "in-progress", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course, i) => {
            const done = progress[course.id] || 0;
            const total = course.lessons_count;
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/courses/${course.id}`}>
                  <Card hover padding="none" className="overflow-hidden flex flex-col h-full">
                    <div className="h-40 flex items-center justify-center relative bg-[var(--bg-tertiary)] overflow-hidden">
                      {course.cover_image ? (
                        <img src={course.cover_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="h-12 w-12 text-[var(--text-tertiary)]" />
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant={done === total && total > 0 ? "success" : "info"}>
                          {done === total && total > 0 ? "Completed" : `${done}/${total} Lessons`}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{course.category}</p>
                      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{course.title}</h3>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">{course.description}</p>
                      <div className="pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-[var(--text-tertiary)]">by {course.profiles?.full_name}</p>
                          <p className="text-xs font-bold text-[var(--text-primary)]">{Math.round((done / (total || 1)) * 100)}%</p>
                        </div>
                        <ProgressBar value={done} max={total || 1} size="sm" color="var(--accent)" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <BookOpen className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">No courses found</h2>
          <p className="text-sm text-[var(--text-secondary)]">Try adjusting your search or filters.</p>
        </Card>
      )}
    </div>
  );
}
