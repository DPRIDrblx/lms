"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getRank, getNextRank } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Trophy, 
  CalendarCheck, 
  Flame, 
  Clock, 
  Star,
  ChevronRight,
  TrendingUp,
  Loader2,
  Calendar,
  ArrowRight
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface CourseRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  lessons_count: number;
}

interface SchoolEvent {
  id: string;
  title: string;
  event_date: string;
  category: string;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;

    // 1. Fetch Courses
    const { data: courseData } = await supabase
      .from("courses")
      .select("*, lessons(count)")
      .eq("is_published", true)
      .limit(3);

    // 2. Fetch Progress
    const { data: progData } = await supabase
      .from("course_progress")
      .select("*")
      .eq("student_id", profile.id);

    // 3. Fetch Events
    const { data: eventData } = await supabase
      .from("school_events")
      .select("*")
      .order("event_date", { ascending: true })
      .limit(3);

    if (courseData) setCourses(courseData.map((c: any) => ({ ...c, lessons_count: c.lessons[0]?.count || 0 })));
    if (progData) setProgressData(progData);
    if (eventData) setEvents(eventData as SchoolEvent[]);
    
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchData();

    // Real-time updates
    const channel = supabase
      .channel('student-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${profile?.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_progress', filter: `student_id=eq.${profile?.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_events' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, profile?.id, supabase]);

  if (!profile) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-secondary)] animate-pulse">Hydrating your Academy Profile...</p>
      </div>
    );
  }

  if (profile.role === "teacher") return <TeacherDashboard />;
  if (profile.role === "tu") return null;

  const xp = profile.xp || 0;
  const rank = getRank(xp);
  const nextRank = getNextRank(xp);
  const completedCount = progressData.filter(p => p.completed).length;

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Welcome back, {profile.full_name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Here&apos;s your learning progress overview.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total XP" value={xp.toLocaleString()} icon={Trophy} color="#4F46E5" trend={{ value: "+25 today", positive: true }} />
        <StatCard label="Current Rank" value={rank} icon={Star} color="#F59E0B" />
        <StatCard label="Lessons Done" value={completedCount} icon={BookOpen} color="#10B981" />
        <StatCard label="Day Streak" value="7" icon={Flame} color="#EF4444" trend={{ value: "Keep going!", positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Rank Progress</h2>
            <Badge variant="info">{rank}</Badge>
          </div>
          <ProgressBar value={nextRank.progress} showLabel size="lg" color="#4F46E5" />
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            {nextRank.xpNeeded > 0 ? `${nextRank.xpNeeded} XP to ${nextRank.name}` : "You've reached the highest rank!"}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">School Events</h2>
            <Link href="/events" className="text-xs text-[var(--accent)] font-bold uppercase tracking-wider">All</Link>
          </div>
          <div className="space-y-3">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="p-1.5 rounded-lg bg-[var(--accent-light)]">
                  <Calendar className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mt-0.5">
                    {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )) : <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No upcoming events.</p>}
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Continue Learning</h2>
          <Link href="/courses" className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const done = progressData.filter(p => p.course_id === course.id && p.completed).length;
            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card hover padding="none">
                  <div className="aspect-video bg-[var(--bg-tertiary)] relative overflow-hidden rounded-t-2xl">
                     {course.cover_image && <img src={course.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-1">{course.category}</p>
                    <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 truncate">{course.title}</h3>
                    <ProgressBar value={done} max={course.lessons_count || 1} size="sm" color="var(--accent)" />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{done}/{course.lessons_count} missions</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ students: 0, courses: 0, avgXp: 0 });
  const [topStudents, setTopStudents] = useState<any[]>([]);

  const fetchTeacherData = useCallback(async () => {
    const { data: students } = await supabase.from("profiles").select("id, full_name, xp, rank").eq("role", "student").order("xp", { ascending: false }).limit(5);
    const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true }).eq("teacher_id", profile?.id);
    const { data: allStudents } = await supabase.from("profiles").select("xp").eq("role", "student");

    if (students) setTopStudents(students);
    setStats({
      students: allStudents?.length || 0,
      courses: courseCount || 0,
      avgXp: allStudents?.length ? Math.round(allStudents.reduce((acc: number, s: any) => acc + s.xp, 0) / allStudents.length) : 0
    });
  }, [profile?.id, supabase]);

  useEffect(() => {
    fetchTeacherData();
    const channel = supabase.channel('teacher-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchTeacherData()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTeacherData, supabase]);

  return (
    <div className="space-y-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Good day, {profile?.full_name?.split(" ")[0]} 🎓
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Your teaching overview and student performance.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.students} icon={BookOpen} color="#4F46E5" />
        <StatCard label="My Courses" value={stats.courses} icon={BookOpen} color="#10B981" />
        <StatCard label="Avg. Student XP" value={stats.avgXp} icon={Trophy} color="#F59E0B" />
        <StatCard label="Active Sessions" value="—" icon={CalendarCheck} color="#8B5CF6" trend={{ value: "Live", positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top Performing Students</h2>
          <div className="space-y-3">
             {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                   <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-[var(--text-tertiary)]">#{i+1}</span>
                      <div>
                         <p className="text-sm font-bold text-[var(--text-primary)]">{s.full_name}</p>
                         <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">{getRank(s.xp)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-[var(--accent)]">{s.xp} XP</p>
                   </div>
                </div>
             ))}
          </div>
        </Card>
        
        <Card>
           <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Links</h2>
           <div className="space-y-2">
              <Link href="/teacher/courses">
                 <Button variant="secondary" className="w-full justify-between" icon={<ArrowRight className="h-4 w-4" />}>
                    Manage Content
                 </Button>
              </Link>
              <Link href="/teacher/grading/offline">
                 <Button variant="secondary" className="w-full justify-between" icon={<ArrowRight className="h-4 w-4" />}>
                    Manual Grading
                 </Button>
              </Link>
           </div>
        </Card>
      </div>
    </div>
  );
}
