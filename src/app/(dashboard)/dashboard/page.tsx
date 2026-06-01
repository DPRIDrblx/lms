"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnnouncementBoard } from "@/components/dashboard/announcement-board";
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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [leadership, setLeadership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileTimeout, setProfileTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfileTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    
    // Redirect non-students to their respective dashboards
    if (profile.role === "teacher") {
      router.push("/teacher");
      return;
    } else if (profile.role === "principal") {
      router.push("/principal");
      return;
    } else if (profile.role === "tu") {
      router.push("/tu/dashboard");
      return;
    } else if (profile.role === "parent") {
      router.push("/parent/dashboard");
      return;
    }

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

    // 4. Check Leadership
    const { data: leadershipData } = await supabase
      .from("classes")
      .select("*")
      .or(`president_id.eq.${profile.id},vice_president_id.eq.${profile.id},secretary_1_id.eq.${profile.id},secretary_2_id.eq.${profile.id}`)
      .single();

    if (courseData) setCourses(courseData.map((c: any) => ({ ...c, lessons_count: c.lessons[0]?.count || 0 })));
    if (progData) setProgressData(progData);
    if (eventData) setEvents(eventData as SchoolEvent[]);
    if (leadershipData) setLeadership(leadershipData);
    
    setLoading(false);
  }, [profile, supabase, router]);

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
        {profileTimeout ? (
          <>
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-sm text-center">
              <p className="text-red-700 font-bold mb-2">Gagal Memuat Profil</p>
              <p className="text-sm text-red-600 mb-4">
                Koneksi ke database lambat atau terputus. Silakan periksa jaringan internet Anda atau coba lagi nanti.
              </p>
              <Button onClick={() => window.location.reload()} variant="danger" className="w-full">
                Refresh Halaman
              </Button>
            </div>
          </>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-secondary)] animate-pulse">Hydrating your Academy Profile...</p>
          </>
        )}
      </div>
    );
  }

  if (profile.role === "teacher") return <TeacherDashboard />;
  if (profile.role === "tu") return null;

  const xp = profile.xp || 0;
  const rank = getRank(xp);
  const nextRank = getNextRank(xp);
  const completedCount = progressData.filter(p => p.completed).length;

    <div className="space-y-8 max-w-6xl font-sans">
      {/* Student Welcome Banner (Glassmorphism) */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white/60 to-purple-50/80 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-indigo-950/80 border border-white/40 dark:border-slate-700/50 p-8 md:p-10 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/50 flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">
                Welcome back, {profile.full_name?.split(" ")[0]}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base">
                Your learning progress overview for today.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gamified Stats (Glass & Flow) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total XP */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Star className="h-5 w-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
              ↑ 25
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{xp.toLocaleString()}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total XP</p>
          </div>
        </div>

        {/* Current Rank */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-100/50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{rank}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Rank</p>
          </div>
        </div>

        {/* Lessons Done */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">{completedCount}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Missions Cleared</p>
          </div>
        </div>

        {/* Day Streak */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-6 rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-rose-100/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <Flame className="h-5 w-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-100/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 animate-pulse">
              Active
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">7</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Day Streak</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/40 dark:border-slate-700/50 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                Rank Progress
              </h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Earn XP to reach the next tier</p>
            </div>
            <div className="px-4 py-2 bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-2xl text-sm font-bold tracking-wide border border-indigo-200/50 dark:border-indigo-500/30">
              {rank}
            </div>
          </div>
          <div className="relative">
             <ProgressBar value={nextRank.progress} showLabel size="lg" color="#6366f1" />
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-6 flex justify-between items-center">
               <span>Next milestone: <strong className="text-slate-800 dark:text-slate-200">{nextRank.name}</strong></span>
               {nextRank.xpNeeded > 0 ? (
                 <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold">{nextRank.xpNeeded} XP left</span>
               ) : (
                 <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">Max Rank</span>
               )}
             </p>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/40 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Upcoming Events</h2>
            <Link href="/events" className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/20 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors">
                  <Calendar className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{event.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                 <p className="text-sm text-slate-400 dark:text-slate-500">No upcoming events.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full">
        <AnnouncementBoard />
      </div>

      {leadership && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-emerald-50/80 dark:bg-emerald-950/20 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-900/40 rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2 mb-1">
                  Class Leadership Portal
                </h2>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400/80">Managing Class {leadership.name}</p>
              </div>
              <div className="px-4 py-1.5 bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 rounded-full text-xs font-bold flex items-center gap-2 w-fit">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 Active Duty
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Link href="/student/leadership/attendance">
                  <Button variant="secondary" className="w-full h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-emerald-900 dark:text-emerald-100 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm" icon={<CalendarCheck className="h-4 w-4" />}>
                     Manage Class Attendance
                  </Button>
               </Link>
               <Link href="/chat">
                  <Button variant="secondary" className="w-full h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-emerald-900 dark:text-emerald-100 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm" icon={<ChevronRight className="h-4 w-4" />}>
                     Broadcast Announcement
                  </Button>
               </Link>
            </div>
          </div>
        </motion.div>
      )}

      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
               Continue Learning
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pick up where you left off</p>
          </div>
          <Link href="/courses" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
            View All Courses
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const done = progressData.filter(p => p.course_id === course.id && p.completed).length;
            const progressPercent = Math.round((done / (course.lessons_count || 1)) * 100);
            return (
              <Link key={course.id} href={`/courses/${course.id}`} className="group block h-full">
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                     {course.cover_image ? (
                       <img src={course.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                     ) : (
                       <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                         <BookOpen className="h-8 w-8 text-indigo-200 dark:text-indigo-800" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                     <div className="absolute bottom-4 left-5 right-5">
                        <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/20 shadow-sm">
                           {course.category}
                        </span>
                     </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{done}/{course.lessons_count} missions</p>
                          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">{progressPercent}%</p>
                       </div>
                       <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>
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

      <div className="w-full">
        <AnnouncementBoard />
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
