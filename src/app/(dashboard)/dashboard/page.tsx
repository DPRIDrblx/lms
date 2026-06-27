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
import { checkAndUpdateStreak, generateDailyQuests } from "@/lib/gamification";
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
  ArrowRight,
  Shield,
  ScanFace,
  QrCode
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
  const [streak, setStreak] = useState(0);
  const [quests, setQuests] = useState<any[]>([]);
  const [drills, setDrills] = useState<any[]>([]);
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

    // 5. Fetch Full Profile for Gamification (Streak & Quests)
    const { data: fullProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
    
    if (fullProfile) {
       const newStreak = await checkAndUpdateStreak(supabase, profile.id, fullProfile.current_streak, fullProfile.last_login_date, fullProfile.gems || 0);
       const newQuests = await generateDailyQuests(supabase, profile.id, fullProfile.daily_quests, fullProfile.last_quest_reset, fullProfile.xp || 0);
       setStreak(newStreak);
       setQuests(newQuests);
       
       if (fullProfile.class_id) {
         const { data: dls } = await supabase
           .from("drills")
           .select("*, drill_submissions(is_completed, student_id)")
           .eq("class_id", fullProfile.class_id)
           .gte("due_date", new Date().toISOString())
           .order("due_date", { ascending: true });
           
         if (dls) {
           const processedDrills = dls.map((d: any) => {
             const submission = d.drill_submissions?.find((s: any) => s.student_id === profile.id);
             return { ...d, is_completed: submission?.is_completed || false };
           });
           setDrills(processedDrills);
         }
       }
    }

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

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto font-sans pb-20">
      
      {/* LEFT COLUMN: THE LEARNING PATH */}
      <div className="flex-1 flex flex-col items-center py-12 relative min-h-screen">
         <div className="text-center mb-16 relative z-10 w-full max-w-md">
           <div className="bg-emerald-500 rounded-3xl p-6 shadow-[0_8px_0_rgb(4,120,87)] border-2 border-emerald-600 text-white flex justify-between items-center transform transition-transform hover:-translate-y-1 active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)]">
             <div className="text-left">
               <h2 className="text-2xl font-black mb-1">Your Learning Path</h2>
               <p className="font-bold text-emerald-100">Continue your journey!</p>
             </div>
             <BookOpen className="w-12 h-12 text-emerald-200" />
           </div>
         </div>

         {/* Path container */}
         <div className="relative w-full max-w-md flex flex-col items-center gap-10">
            {/* Drills Section */}
            {drills.length > 0 && drills.map((drill, idx) => {
              const isCompleted = drill.is_completed;
              return (
                <div key={`drill-${drill.id}`} className="relative flex flex-col items-center group cursor-pointer w-full mb-4">
                  <div className="absolute top-24 h-16 w-4 bg-slate-200 -z-10 rounded-full" />
                  <div className="relative w-full px-4">
                    <Link href={isCompleted ? '#' : `/student/drills/${drill.id}`}>
                      <div className={`w-full rounded-[2rem] p-6 border-4 flex items-center gap-4 transition-all ${
                        isCompleted 
                        ? 'bg-emerald-50 border-emerald-200 opacity-70' 
                        : 'bg-white border-amber-300 shadow-[0_8px_0_rgb(252,211,77)] hover:-translate-y-1 hover:shadow-[0_10px_0_rgb(252,211,77)] active:translate-y-2 active:shadow-none'
                      }`}>
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100' : 'bg-amber-100 animate-pulse'}`}>
                          {isCompleted ? <Trophy className="w-8 h-8 text-emerald-500" /> : <Flame className="w-8 h-8 text-amber-500" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 mb-1">{drill.title}</h3>
                          {isCompleted ? (
                            <p className="text-emerald-600 font-bold text-sm">Misi Selesai!</p>
                          ) : (
                            <p className="text-amber-600 font-bold text-sm">Drill Mingguan! (+{drill.xp_reward} XP)</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}

            {courses.length === 0 ? (
               <div className="p-8 text-center bg-slate-100 rounded-3xl border-2 border-slate-200 border-dashed text-slate-500 font-bold">
                 No courses available yet!
               </div>
            ) : (
               courses.map((course, idx) => {
                 const done = progressData.filter(p => p.course_id === course.id && p.completed).length;
                 const progressPercent = Math.round((done / (course.lessons_count || 1)) * 100);
                 const isCompleted = progressPercent === 100;
                 
                 // Create a zig-zag pattern
                 const offsetX = idx % 2 === 0 ? (idx % 4 === 0 ? '-translate-x-12' : 'translate-x-12') : 'translate-x-0';
                 
                 const colors = [
                   { bg: 'bg-indigo-500', shadow: 'shadow-[0_8px_0_rgb(67,56,202)]', border: 'border-indigo-600', ring: 'ring-indigo-200' },
                   { bg: 'bg-rose-500', shadow: 'shadow-[0_8px_0_rgb(190,18,60)]', border: 'border-rose-600', ring: 'ring-rose-200' },
                   { bg: 'bg-amber-500', shadow: 'shadow-[0_8px_0_rgb(180,83,9)]', border: 'border-amber-600', ring: 'ring-amber-200' },
                   { bg: 'bg-emerald-500', shadow: 'shadow-[0_8px_0_rgb(4,120,87)]', border: 'border-emerald-600', ring: 'ring-emerald-200' },
                 ];
                 const color = colors[idx % colors.length];

                 return (
                   <div key={course.id} className={`relative flex flex-col items-center group cursor-pointer ${offsetX}`}>
                     {/* Connecting Line to next item */}
                     {idx < courses.length - 1 && (
                       <div className="absolute top-24 h-16 w-4 bg-slate-200 -z-10 rounded-full" />
                     )}
                     
                     <div className="relative">
                       {/* Circular 3D Button */}
                       <Link href={`/courses/${course.id}`} className="flex flex-col items-center">
                         <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${color.border} ${color.bg} ${color.shadow} transform transition-all duration-150 active:translate-y-2 active:shadow-none hover:ring-8 ${color.ring} z-10 mb-3`}>
                           {isCompleted ? (
                             <Trophy className="w-10 h-10 text-white/90 drop-shadow-md" />
                           ) : (
                             <Star className="w-10 h-10 text-white/90 drop-shadow-md" />
                           )}
                         </div>
                         <div className="bg-white px-4 py-2 rounded-xl border-2 border-slate-200 shadow-sm text-center min-w-[120px] z-20">
                           <div className="font-black text-slate-700 text-sm line-clamp-1">{course.title}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{done}/{course.lessons_count} Missions</div>
                         </div>
                       </Link>
                     </div>
                   </div>
                 );
               })
            )}
            
            {/* Locked Future Stage */}
            <div className="relative flex flex-col items-center mt-12 opacity-50 grayscale">
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-slate-300 bg-slate-200 shadow-[0_8px_0_rgb(203,213,225)] z-10">
                <div className="w-10 h-10 rounded-full bg-slate-400"></div>
              </div>
            </div>
         </div>
      </div>

      {/* RIGHT COLUMN: QUESTS & LEAGUES */}
      <div className="w-full lg:w-[350px] shrink-0 space-y-6 pt-12 px-4 lg:px-0">
        
        {/* League Box */}
        <div className="bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-4 border-b-2 border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-800">League</h2>
              <span className="text-sm font-bold text-indigo-500 uppercase">View All</span>
           </div>
           <div className="flex items-center gap-4">
             <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center border-2 border-amber-200">
               <Shield className="w-8 h-8 text-amber-500" />
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-lg">{rank}</h3>
               <p className="text-slate-500 text-sm font-medium">{xp} Total XP</p>
             </div>
           </div>
           <div className="mt-4 pt-4 border-t-2 border-slate-100">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Tier</span>
                 <span className="text-xs font-black text-slate-700">{nextRank.name}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${nextRank.progress}%` }}></div>
              </div>
           </div>
        </div>

        {/* Daily Quests Box */}
        <div className="bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-800">Daily Quests</h2>
              <span className="text-sm font-bold text-indigo-500 uppercase">View All</span>
           </div>
           <div className="space-y-6">
              {quests.length > 0 ? quests.map((q: any) => {
                 const percent = Math.min(100, Math.round((q.progress / q.target) * 100));
                 return (
                   <div key={q.id} className="flex gap-4 items-center">
                     <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border-2 border-indigo-100 shrink-0">
                       <span className="text-xs font-black text-indigo-400 leading-none mb-1">XP</span>
                       <span className="text-lg font-black text-indigo-600 leading-none">{q.xp_reward}</span>
                     </div>
                     <div className="flex-1">
                       <p className={`font-bold text-[15px] mb-2 leading-tight ${q.is_claimed ? 'text-emerald-500' : 'text-slate-700'}`}>
                         {q.title}
                       </p>
                       <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative">
                         <div className={`h-full rounded-full transition-all duration-1000 ${q.is_claimed ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }}></div>
                       </div>
                       <p className="text-right text-xs font-bold text-slate-400 mt-1">{q.progress} / {q.target}</p>
                     </div>
                   </div>
                 );
              }) : (
                 <div className="text-center py-4 text-slate-400 font-bold">
                   No quests available.
                 </div>
              )}
           </div>
         </div>

         {/* Quick Tools Box */}
         <div className="bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-4">
               <h2 className="text-xl font-black text-slate-800">Quick Tools</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <Link href="/attendance/ai" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 transition-colors text-center gap-2 group">
                 <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                   <ScanFace className="w-6 h-6 text-indigo-600" />
                 </div>
                 <span className="font-bold text-sm text-indigo-900">Absensi Wajah AI</span>
               </Link>
               <Link href="/attendance/qr/student" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 transition-colors text-center gap-2 group">
                 <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                   <QrCode className="w-6 h-6 text-emerald-600" />
                 </div>
                 <span className="font-bold text-sm text-emerald-900">Scan QR</span>
               </Link>
            </div>
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
