"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnnouncementBoard } from "@/components/dashboard/announcement-board";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CenterLoader } from "@/components/ui/center-loader";
import { getRank, getNextRank } from "@/lib/utils";
import { checkAndUpdateStreak, generateDailyQuests } from "@/lib/gamification";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
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
  QrCode,
  Diamond,
  Gem
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
  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const router = useRouter();
  
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [centerSchedules, setCenterSchedules] = useState<any[]>([]);
  const [leadership, setLeadership] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [quests, setQuests] = useState<any[]>([]);
  const [drills, setDrills] = useState<any[]>([]);
  const [activeFeedbacks, setActiveFeedbacks] = useState<any[]>([]);
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

    if (isCenterStudent) {
      const { data: schedData } = await supabase
        .from("center_schedules")
        .select("*")
        .order("schedule_time", { ascending: true })
        .limit(3);
      if (schedData) setCenterSchedules(schedData);
    } else {
      const { data: sessions } = await supabase
        .from('ace_feedback_sessions')
        .select('*, profiles!teacher_id(full_name, id), ace_student_feedbacks(id, student_id)')
        .eq('is_active', true);
        
      if (sessions) {
        const pending = sessions.filter((s: any) => 
          !s.ace_student_feedbacks?.some((fb: any) => fb.student_id === profile.id)
        );
        setActiveFeedbacks(pending);
      }
    }

    if (courseData) setCourses(courseData.map((c: any) => ({ ...c, lessons_count: c.lessons[0]?.count || 0 })));
    if (progData) setProgressData(progData);
    if (eventData) setEvents(eventData as SchoolEvent[]);
    if (leadershipData) setLeadership(leadershipData);
    
    setTimeout(() => setLoading(false), 1500);
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
          <div className="flex flex-col items-center justify-center space-y-4">
            <CenterLoader size="lg" />
            <p className="text-sm font-bold text-slate-400 animate-pulse mt-4">Memuat Profil Center...</p>
          </div>
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
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-20 relative">
      {/* Decorative Background for Center Students */}
      {isCenterStudent && uiMode === 'fun' && (
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[100vw] max-w-[1400px] h-[600px] overflow-hidden -z-10 pointer-events-none opacity-60">
          <div className="absolute -top-32 -left-20 w-[500px] h-[500px] rounded-full border-[80px] border-red-500/10 mix-blend-multiply blur-lg" />
          <div className="absolute top-20 right-[-10%] w-[600px] h-[600px] rounded-full border-[100px] border-yellow-400/10 mix-blend-multiply blur-2xl" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/10 mix-blend-multiply blur-[80px]" />
        </div>
      )}

      {!isCenterStudent ? (
        <>
          <div className="w-full">
            <AnnouncementBoard />
          </div>

          {activeFeedbacks.length > 0 && (
            <div className="w-full space-y-4">
              {activeFeedbacks.map(fb => (
                <div key={fb.id} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 md:p-8 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6 transform hover:scale-[1.01] transition-transform">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
                      <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">Yuk, isi kuisioner feedback siswa dari {fb.profiles?.full_name}!</h3>
                      <p className="text-indigo-100 font-medium">Bantu sekolah kita menjadi lebih baik. Waktumu hanya 2 menit dan semua jawaban dijamin 100% anonim.</p>
                    </div>
                  </div>
                  <Link href={`/student/feedback/${fb.id}`} className="w-full md:w-auto px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold text-lg text-center shadow-lg hover:bg-indigo-50 hover:shadow-indigo-500/20 active:scale-95 transition-all">
                    Mulai Isi 🚀
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      ) : uiMode === 'clean' ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#0C1E5B] to-[#1E40AF] rounded-[20px] p-6 md:p-8 text-white shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto text-center md:text-left">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border-[3px] border-white/20 shrink-0 shadow-lg">
                  {profile.avatar_url ? (
                    profile.avatar_url.includes("/avatars/") ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover object-top" />
                    ) : profile.avatar_url.startsWith("http") ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl">{profile.avatar_url}</span>
                    )
                  ) : (
                    <span className="text-2xl font-bold">{profile.full_name?.[0] || "U"}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black mb-1.5 drop-shadow-sm">{profile.full_name}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-semibold text-blue-100">
                    <div className="flex items-center gap-1.5"><Diamond className="w-4 h-4 text-blue-300 fill-blue-300" /> {xp} XP</div>
                    <div className="flex items-center gap-1.5"><Gem className="w-4 h-4 text-amber-300 fill-amber-300" /> {(profile as any).gems || 0} Gems</div>
                    <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-400 fill-orange-400" /> {streak} Hari Aktif</div>
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex flex-col items-center justify-center px-8 border-l border-white/10">
                <span className="text-[11px] uppercase tracking-widest text-blue-200/80 mb-1 font-bold">Pangkat / Rank</span>
                <span className="text-xl font-black text-amber-400 drop-shadow-sm">{rank}</span>
              </div>
              
              <Link href="/student/leaderboard" className="w-full md:w-auto bg-black/20 hover:bg-black/30 transition-colors rounded-[16px] p-4 flex items-center gap-4 cursor-pointer border border-white/5">
                <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-400 drop-shadow-sm" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mb-0.5">Leaderboard</p>
                  <p className="font-bold text-sm">Lihat Peringkat</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/50" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-[12px] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#108B96]" />
                </div>
                <div>
                  <h3 className="font-bold text-[17px] text-slate-800 leading-tight">Jadwal Sesi Berikutnya</h3>
                  <p className="text-slate-500 text-[13px] font-medium">Persiapkan dirimu untuk sesi belajar hari ini</p>
                </div>
              </div>
              <Link href="/student/jadwal-les" className="hidden md:flex px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-[#108B96] font-semibold text-sm rounded-[10px] hover:bg-slate-50 transition-colors items-center gap-2">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {centerSchedules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {centerSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 bg-white rounded-[16px] border border-slate-200 flex gap-4 hover:border-[#108B96]/50 hover:shadow-sm transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-teal-50/50 text-[#108B96] rounded-[12px] flex flex-col items-center justify-center shrink-0 border border-teal-100/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(schedule.schedule_time).toLocaleDateString('id-ID', { month: 'short' })}</span>
                      <span className="text-[22px] font-black leading-none mt-0.5">{new Date(schedule.schedule_time).getDate()}</span>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h4 className="font-bold text-slate-800 text-[15px] line-clamp-1 group-hover:text-[#108B96] transition-colors">{schedule.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-[13px] font-medium text-slate-500">{new Date(schedule.schedule_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-[16px] border border-dashed border-slate-200">
                <p className="font-medium text-slate-500 text-sm">Belum ada jadwal les dalam waktu dekat.</p>
              </div>
            )}
            
            <Link href="/student/jadwal-les" className="md:hidden mt-4 w-full flex px-4 py-3 bg-white border border-slate-200 text-slate-600 hover:text-[#108B96] font-semibold text-sm rounded-[10px] justify-center items-center gap-2">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-red-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border-b-8 border-red-800 transform hover:-translate-y-1 transition-transform duration-300">
          {/* Abstract SVG Backgrounds inside the Card */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-80">
            <div className="absolute -right-20 -top-20 w-[300px] h-[300px] rounded-full bg-orange-500 blur-3xl mix-blend-screen" />
            <div className="absolute -left-20 -bottom-20 w-[400px] h-[400px] rounded-full border-[60px] border-red-400 opacity-30" />
            <div className="absolute right-20 bottom-[-50px] w-[200px] h-[200px] rounded-full border-[40px] border-yellow-400 opacity-20" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-2xl tracking-tight drop-shadow-md">Jadwal Les Terdekat</h3>
                  <p className="text-red-100 font-bold text-sm">Persiapkan dirimu untuk sesi belajar berikutnya!</p>
                </div>
              </div>
              <Link href="/student/jadwal-les" className="hidden md:flex px-6 py-2.5 bg-white text-red-600 font-black rounded-xl hover:bg-red-50 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shadow-md items-center gap-2">
                Lihat Semua <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {centerSchedules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {centerSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex gap-4 hover:bg-white/20 transition-colors group cursor-pointer shadow-lg">
                    <div className="w-16 h-16 bg-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">{new Date(schedule.schedule_time).toLocaleDateString('id-ID', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none text-red-600">{new Date(schedule.schedule_time).getDate()}</span>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h4 className="font-bold text-white text-lg line-clamp-1 group-hover:text-yellow-200 transition-colors drop-shadow-sm">{schedule.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-red-200" />
                        <p className="text-sm font-medium text-red-100">{new Date(schedule.schedule_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/30">
                <p className="font-bold text-red-100 text-lg">Belum ada jadwal les dalam waktu dekat.</p>
              </div>
            )}
            
            <Link href="/student/jadwal-les" className="md:hidden mt-6 w-full flex px-6 py-3 bg-white text-red-600 font-black rounded-xl justify-center items-center gap-2 shadow-lg active:scale-95 transition-all">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: THE LEARNING PATH */}
        <div className="flex-1 flex flex-col items-center py-6 relative min-h-[80vh]">
         <div className="text-center mb-12 relative z-10 w-full max-w-md">
           <div className={cn(
             "rounded-3xl p-6 flex justify-between items-center transition-transform",
             uiMode === 'clean'
               ? "bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] text-slate-800"
               : "bg-emerald-500 shadow-[0_8px_0_rgb(4,120,87)] border-2 border-emerald-600 text-white transform hover:-translate-y-1 active:translate-y-2 active:shadow-[0_0px_0_rgb(4,120,87)]"
           )}>
             <div className="text-left">
               <h2 className={cn("text-2xl mb-1", uiMode === 'clean' ? "font-bold text-slate-800" : "font-black")}>Misi Pembelajaran</h2>
               <p className={cn(uiMode === 'clean' ? "text-slate-500 text-sm font-medium" : "font-bold text-emerald-100")}>Lanjutkan petualangan belajarmu!</p>
             </div>
             <div className={cn(
               "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
               uiMode === 'clean' ? "bg-orange-50 text-orange-500" : "bg-transparent text-emerald-200"
             )}>
               <BookOpen className="w-8 h-8" />
             </div>
           </div>
         </div>

         {/* Path container */}
         <div className="relative w-full max-w-md flex flex-col items-center gap-10">
            {/* Drills Section */}
            {drills.length > 0 && drills.map((drill, idx) => {
              const isCompleted = drill.is_completed;
              return (
                <div key={`drill-${drill.id}`} className="relative flex flex-col items-center group cursor-pointer w-full mb-4">
                  <div className="absolute top-24 h-16 w-1 bg-slate-200 -z-10 rounded-full" />
                  <div className="relative w-full px-4">
                    <Link href={isCompleted ? '#' : `/student/drills/${drill.id}`}>
                      <div className={cn(
                        "w-full p-5 flex items-center gap-4 transition-all",
                        uiMode === 'clean'
                          ? (isCompleted ? "bg-slate-50 border border-slate-200 rounded-2xl opacity-70" : "bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-orange-400 hover:shadow-md")
                          : (isCompleted ? "bg-emerald-50 border-4 border-emerald-200 rounded-[2rem] opacity-70" : "bg-white border-4 border-amber-300 rounded-[2rem] shadow-[0_8px_0_rgb(252,211,77)] hover:-translate-y-1 hover:shadow-[0_10px_0_rgb(252,211,77)] active:translate-y-2 active:shadow-none")
                      )}>
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center shrink-0",
                          uiMode === 'clean'
                            ? (isCompleted ? 'bg-slate-100 rounded-xl' : 'bg-orange-50 rounded-xl')
                            : (isCompleted ? 'bg-emerald-100 rounded-2xl' : 'bg-amber-100 animate-pulse rounded-2xl')
                        )}>
                          {isCompleted ? <Trophy className={cn("w-7 h-7", uiMode === 'clean' ? "text-slate-400" : "text-emerald-500")} /> : <Flame className={cn("w-7 h-7", uiMode === 'clean' ? "text-orange-500" : "text-amber-500")} />}
                        </div>
                        <div>
                          <h3 className={cn("text-lg mb-1", uiMode === 'clean' ? "font-bold text-slate-800" : "font-black text-slate-800 text-xl")}>{drill.title}</h3>
                          {isCompleted ? (
                            <p className={cn("text-xs font-semibold", uiMode === 'clean' ? "text-slate-500" : "text-emerald-600 font-bold")}>Misi Selesai!</p>
                          ) : (
                            <p className={cn("text-xs font-semibold", uiMode === 'clean' ? "text-orange-600" : "text-amber-600 font-bold text-sm")}>Latihan Pemantapan (+{drill.xp_reward} XP)</p>
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
                       <div className="absolute top-20 h-20 w-1 bg-slate-200 -z-10 rounded-full" />
                     )}
                     
                     <div className="relative">
                       {/* Circular Button */}
                       <Link href={`/courses/${course.id}`} className="flex flex-col items-center">
                         <div className={cn(
                           "w-20 h-20 rounded-full flex items-center justify-center z-10 mb-3 transition-all",
                           uiMode === 'clean'
                             ? `border-2 bg-white ${isCompleted ? 'border-slate-200' : 'border-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.2)] hover:scale-105'}`
                             : `w-24 h-24 border-4 ${color.border} ${color.bg} ${color.shadow} transform duration-150 active:translate-y-2 active:shadow-none hover:ring-8 ${color.ring}`
                         )}>
                           {isCompleted ? (
                             <Trophy className={cn("w-8 h-8 drop-shadow-md", uiMode === 'clean' ? "text-slate-300 drop-shadow-none" : "w-10 h-10 text-white/90")} />
                           ) : (
                             <Star className={cn("w-8 h-8 drop-shadow-md", uiMode === 'clean' ? "text-blue-600 drop-shadow-none" : "w-10 h-10 text-white/90")} />
                           )}
                         </div>
                         <div className={cn(
                           "bg-white px-4 py-2 text-center min-w-[120px] z-20",
                           uiMode === 'clean'
                             ? "rounded-xl border border-slate-200 shadow-sm"
                             : "rounded-xl border-2 border-slate-200 shadow-sm"
                         )}>
                           <div className={cn("text-slate-700 text-xs line-clamp-1", uiMode === 'clean' ? "font-bold" : "text-sm font-black")}>{course.title}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{done}/{course.lessons_count} Topik</div>
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
        <div className={cn(
          "bg-white p-6",
          uiMode === 'clean' ? "rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" : "rounded-[2rem] border-2 border-slate-200 shadow-sm"
        )}>
           <div className={cn("flex items-center justify-between mb-4 pb-4", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
              <h2 className={cn("text-lg text-slate-800", uiMode === 'clean' ? "font-bold" : "text-xl font-black")}>Liga Peringkat</h2>
              <span className="text-xs font-bold text-blue-600 uppercase">Lihat Papan</span>
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
        <div className={cn(
          "bg-white p-6",
          uiMode === 'clean' ? "rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" : "rounded-[2rem] border-2 border-slate-200 shadow-sm"
        )}>
           <div className={cn("flex items-center justify-between mb-6 pb-4", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
              <h2 className={cn("text-lg text-slate-800", uiMode === 'clean' ? "font-bold" : "text-xl font-black")}>Misi Harian</h2>
              <span className="text-xs font-bold text-blue-600 uppercase">Lihat Semua</span>
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
         <div className={cn(
           "bg-white p-6",
           uiMode === 'clean' ? "rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)]" : "rounded-[2rem] border-2 border-slate-200 shadow-sm"
         )}>
            <div className={cn("flex items-center justify-between mb-6 pb-4", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
               <h2 className={cn("text-lg text-slate-800", uiMode === 'clean' ? "font-bold" : "text-xl font-black")}>Alat Cepat</h2>
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
