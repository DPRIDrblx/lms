"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { 
  Users, 
  Plus, 
  GraduationCap, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Wallet, 
  Loader2, 
  CheckCircle2, 
  BookOpen,
  Trophy,
  Heart,
  MessageCircle
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Child {
  id: string;
  full_name: string;
  xp: number;
  rank: string;
  avatar_url: string | null;
  stats?: {
    attendanceRate: number;
    avgGrade: number;
    courseProgress: number;
    paymentStatus: "Paid" | "Pending" | "Overdue";
  };
}

interface AttendanceLog {
  id: string;
  check_in_time: string;
  method: string;
  student_id: string;
}

interface Score {
  student_id: string;
  score: number;
  target_type: string;
  created_at: string;
}

export default function ParentDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childId, setChildId] = useState("");
  const [linking, setLinking] = useState(false);
  const [attendance, setAttendance] = useState<Record<string, AttendanceLog[]>>({});
  const [scores, setScores] = useState<Record<string, Score[]>>({});

  const fetchStats = useCallback(async (childIds: string[]) => {
    // 1. Fetch Attendance
    const { data: logs } = await supabase
      .from("attendance_logs")
      .select("*")
      .in("student_id", childIds)
      .order("check_in_time", { ascending: false });

    if (logs) {
      const grouped = logs.reduce((acc: any, log: any) => {
        if (!acc[log.student_id]) acc[log.student_id] = [];
        acc[log.student_id].push(log);
        return acc;
      }, {});
      setAttendance(grouped);
    }

    // 2. Fetch Scores
    const { data: scoreData } = await supabase
      .from("student_scores")
      .select("*")
      .in("student_id", childIds)
      .order("created_at", { ascending: false });

    if (scoreData) {
      const grouped = scoreData.reduce((acc: any, s: any) => {
        if (!acc[s.student_id]) acc[s.student_id] = [];
        acc[s.student_id].push(s);
        return acc;
      }, {});
      setScores(grouped);
    }

    // 3. Fetch Course Progress (simplified for demo)
    // In a real app, we'd count lessons completed vs total lessons in all courses
  }, [supabase]);

  const fetchChildren = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("parent_student_links")
      .select("student_id, profiles!parent_student_links_student_id_fkey(*)")
      .eq("parent_id", profile.id);
    
    if (data) {
      const childData = data.map((item: any) => item.profiles) as Child[];
      setChildren(childData);
      
      const childIds = childData.map((c: any) => c.id);
      if (childIds.length > 0) {
        await fetchStats(childIds);
      }
    }
    setLoading(false);
  }, [profile, supabase, fetchStats]);

  useEffect(() => {
    fetchChildren();

    // Subscribe to Realtime updates for all linked children
    const channel = supabase
      .channel('parent-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchChildren();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, () => {
        fetchChildren();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_scores' }, () => {
        fetchChildren();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChildren, supabase]);

  const handleAddChild = async () => {
    if (!profile || !childId) return;
    setLinking(true);

    try {
      // 1. Verify if student exists and has the 'student' role
      const { data: student, error: studentError } = await supabase
        .from("profiles")
        .select("id, role, full_name")
        .eq("id", childId)
        .single();

      if (studentError || !student) {
        alert("Student ID not found. Please check the UUID again.");
        setLinking(false);
        return;
      }

      if (student.role !== "student") {
        alert(`${student.full_name} is not a student account.`);
        setLinking(false);
        return;
      }

      // 2. Insert the link
      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({ parent_id: profile.id, student_id: childId });

      if (linkError) {
        if (linkError.code === "23505") {
          alert("This student is already linked to your account.");
        } else {
          alert("Failed to link student. " + linkError.message);
        }
      } else {
        alert(`Successfully linked to ${student.full_name}!`);
        setChildId("");
        setShowAddChild(false);
        fetchChildren();
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLinking(false);
    }
  };

  const calculateAvgGrade = (childId: string) => {
    const childScores = scores[childId] || [];
    if (childScores.length === 0) return 0;
    const sum = childScores.reduce((acc, s) => acc + (s.score || 0), 0);
    return Math.round(sum / childScores.length);
  };

  const calculateAttendanceRate = (childId: string) => {
    const logs = attendance[childId] || [];
    // Dummy calculation: days present / 20 school days
    const uniqueDays = new Set(logs.map((l: any) => new Date(l.check_in_time).toDateString())).size;
    return Math.min(Math.round((uniqueDays / 20) * 100), 100);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. New Vibrant Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 md:p-12 text-white shadow-xl shadow-purple-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center gap-3">
              Family Hub <Heart className="h-8 w-8 text-pink-300" fill="currentColor" />
            </h1>
            <p className="text-indigo-100 max-w-md text-sm md:text-base leading-relaxed">
              Pantau perkembangan dan kesehatan akademik buah hati Anda secara real-time. Semua dalam satu ketukan.
            </p>
          </div>
          <Button 
            onClick={() => setShowAddChild(true)} 
            className="bg-white text-purple-600 hover:bg-indigo-50 border-none font-bold rounded-xl px-6 py-6 shadow-lg transition-all hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            Tautkan Anak
          </Button>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 right-10 w-48 h-48 bg-pink-500/30 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          <div className="h-64 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
        </div>
      ) : children.length > 0 ? (
        <div className="space-y-12">
          {children.map((child) => {
            const avgGrade = calculateAvgGrade(child.id);
            const attendRate = calculateAttendanceRate(child.id);
            
            return (
              <motion.div key={child.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-50">
                <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-violet-100 to-fuchsia-100"></div>
                
                <div className="relative p-6 pt-12 md:p-8 md:pt-16 flex flex-col lg:flex-row gap-8">
                  {/* Photo & Basic Info */}
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-left min-w-[240px]">
                    <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-md mb-4 z-10 relative">
                       <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                          {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover" /> : child.full_name[0]}
                       </div>
                       <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-[3px] border-white rounded-full" title="Active"></div>
                    </div>
                    
                    <h2 className="text-2xl font-black text-slate-800">{child.full_name}</h2>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
                       <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none font-bold">
                         Siswa {child.rank || 'Aktif'}
                       </Badge>
                       <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                         <Trophy className="h-3 w-3 text-amber-500" /> {child.xp || 0} XP
                       </span>
                    </div>
                    
                    <Link href={`/parent/child/${child.id}`} className="mt-8 w-full block">
                      <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200 text-white border-0 font-bold text-sm">
                        Lihat Rapor Lengkap
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Health Overview */}
                  <div className="flex-1 space-y-6">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kesehatan Akademik</h3>
                     
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
                           <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                              <CheckCircle2 className="h-6 w-6" />
                           </div>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Kehadiran</span>
                           <span className="text-2xl font-black text-slate-800">{attendRate}%</span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
                           <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                              <TrendingUp className="h-6 w-6" />
                           </div>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Rata-rata</span>
                           <span className="text-2xl font-black text-slate-800">{avgGrade > 0 ? `${avgGrade}` : "—"}</span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
                           <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                              <BookOpen className="h-6 w-6" />
                           </div>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Tugas Selesai</span>
                           <span className="text-2xl font-black text-slate-800">{scores[child.id]?.length || 0}</span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors">
                           <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
                              <Wallet className="h-6 w-6" />
                           </div>
                           <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Status SPP</span>
                           <span className="text-xl font-black text-slate-800">Lunas</span>
                        </div>
                     </div>

                     {/* Latest Assessments Section replaces Academic Progress */}
                     <div className="space-y-4 pt-4 border-t border-slate-100">
                       <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Penilaian Terakhir</h3>
                       
                       {scores[child.id]?.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                           {scores[child.id].slice(0, 3).map((s, i) => (
                             <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                               <div className="flex justify-between items-start mb-3">
                                 <span className="text-xs font-bold text-slate-500 uppercase">{s.target_type}</span>
                                 <Badge className={s.score >= 75 ? "bg-emerald-100 text-emerald-700 border-none" : s.score >= 60 ? "bg-amber-100 text-amber-700 border-none" : "bg-rose-100 text-rose-700 border-none"}>
                                   {s.score}%
                                 </Badge>
                               </div>
                               <ProgressBar value={s.score || 0} max={100} size="sm" color={s.score >= 75 ? "#10b981" : s.score >= 60 ? "#f59e0b" : "#f43f5e"} />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100">
                           <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-sm text-slate-500 font-medium">Belum ada nilai yang tercatat.</p>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-slate-100">
          <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-indigo-300" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Tautkan Akun Anak Anda</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 mt-3 leading-relaxed">
            Mulai pantau kehadiran, nilai rapor, dan pencapaian akademik anak Anda secara real-time. Anda membutuhkan ID Unik (UUID) dari akun siswa.
          </p>
          <Button size="lg" onClick={() => setShowAddChild(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-200">
            <Plus className="h-5 w-5 mr-2" />
            Tautkan Anak Sekarang
          </Button>
        </div>
      )}

      {/* Link Child Modal */}
      <Modal isOpen={showAddChild} onClose={() => setShowAddChild(false)} title="Link Student Profile">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/10">
            <p className="text-xs text-[var(--accent)] leading-relaxed">
              <strong>How to find the ID:</strong> Ask your child to open their Profile page. Their Student ID is a long unique code (e.g., 550e8400-e29b...) found at the bottom of the page.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Student UUID</label>
            <input
              type="text"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all font-mono"
            />
          </div>
          <Button className="w-full" onClick={handleAddChild} loading={linking}>
            Establish Connection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
