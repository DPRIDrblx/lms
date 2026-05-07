"use client";

import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSES } from "@/lib/courses-data";
import { getRank } from "@/lib/utils";
import { motion } from "framer-motion";
import { Users, BookOpen, Trophy, Search, Award, ArrowRight } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface StudentRow {
  id: string;
  full_name: string;
  xp: number;
  avatar_url: string | null;
}

export default function TeacherPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [homeroomClass, setHomeroomClass] = useState<any>(null);

  const fetchData = useCallback(async () => {
    // Fetch students
    const { data: stds } = await supabase
      .from("profiles")
      .select("id, full_name, xp, avatar_url")
      .eq("role", "student")
      .order("xp", { ascending: false });
    if (stds) setStudents(stds);

    // Fetch homeroom status
    if (profile) {
      const { data: cls } = await supabase
        .from("classes")
        .select("*")
        .eq("homeroom_teacher_id", profile.id)
        .single();
      if (cls) setHomeroomClass(cls);
    }
  }, [supabase, profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = students.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Academic Command Center</h1>
           <p className="text-sm text-[var(--text-secondary)] mt-1">Institutional management portal for teacher-led digital learning.</p>
        </div>
        {homeroomClass && (
           <Badge className="bg-[var(--accent)] text-white border-none py-1.5 px-4 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg shadow-[var(--accent)]/20 animate-pulse">
              Homeroom Teacher: {homeroomClass.name}
           </Badge>
        )}
      </motion.div>

      {/* Homeroom CTA */}
      {homeroomClass && (
         <Card className="p-0 overflow-hidden border-none shadow-2xl bg-indigo-600 group">
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
               <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Award className="h-40 w-40" /></div>
               <div className="z-10">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Homeroom Authority: {homeroomClass.name}</h3>
                  <p className="text-indigo-100 text-sm mt-1 font-medium">You have administrative control over this class. Manage official report cards and academic standing.</p>
               </div>
               <Link href="/teacher/homeroom">
                  <Button className="h-12 px-8 bg-white text-indigo-600 hover:bg-white/90 font-black rounded-xl z-10" icon={<ArrowRight className="h-4 w-4" />}>
                     Manage Class {homeroomClass.name}
                  </Button>
               </Link>
            </div>
         </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--accent-light)]">
            <Users className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{students.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Total Students</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#10B98115" }}>
            <BookOpen className="h-5 w-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{COURSES.length}</p>
            <p className="text-sm text-[var(--text-secondary)]">Active Courses</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: "#F59E0B15" }}>
            <Trophy className="h-5 w-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {students.length ? Math.round(students.reduce((s, st) => s + st.xp, 0) / students.length) : 0}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">Avg. XP</p>
          </div>
        </Card>
      </div>

      {/* Course list */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Courses</h2>
        <div className="space-y-2">
          {COURSES.map((course) => (
            <div key={course.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="w-2 h-10 rounded-full" style={{ backgroundColor: course.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{course.title}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{course.lessons.length} lessons · {course.instructor}</p>
              </div>
              <Badge variant="info">{course.category}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Student performance */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Student Performance</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border)]">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Student</th>
                <th className="pb-3 font-medium">XP</th>
                <th className="pb-3 font-medium">Rank</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="py-3 text-[var(--text-tertiary)]">{i + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {s.avatar_url ? (
                        <img src={s.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[10px] font-semibold text-[var(--accent)]">
                          {s.full_name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-[var(--text-primary)]">{s.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-[var(--text-secondary)]">{s.xp.toLocaleString()}</td>
                  <td className="py-3"><Badge variant="info">{getRank(s.xp)}</Badge></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-[var(--text-tertiary)]">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
