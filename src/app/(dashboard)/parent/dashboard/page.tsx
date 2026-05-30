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
  Trophy
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Parent Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Real-time monitoring of your children&apos;s academic performance.</p>
        </div>
        <Button variant="secondary" onClick={() => setShowAddChild(true)} icon={<Plus className="h-4 w-4" />}>
          Link Student
        </Button>
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
              <motion.div key={child.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-xl relative">
                      {child.avatar_url ? (
                        <img src={child.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                      ) : (
                        child.full_name[0]
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">{child.full_name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="info" className="text-[10px] py-0">{child.rank || 'Novice'}</Badge>
                        <span className="text-xs text-[var(--text-tertiary)] font-medium flex items-center gap-1">
                          <Trophy className="h-3 w-3" /> {child.xp || 0} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/parent/child/${child.id}`}>
                    <Button variant="secondary" size="sm">Detailed Report</Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Attendance Rate" value={`${attendRate}%`} icon={CheckCircle2} color="#10B981" />
                  <StatCard label="Avg. Grade" value={avgGrade > 0 ? `${avgGrade}%` : "—"} icon={TrendingUp} color="#4F46E5" />
                  <StatCard label="Completed Tasks" value={scores[child.id]?.length || 0} icon={BookOpen} color="#F59E0B" />
                  <StatCard label="SPP Status" value="Paid" icon={Wallet} color="#0EA5E9" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Attendance Log */}
                  <Card className="lg:col-span-1">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                      <Calendar className="h-4 w-4 text-[var(--accent)]" />
                      Live Attendance
                    </h3>
                    <div className="space-y-3">
                      {attendance[child.id]?.length > 0 ? (
                        attendance[child.id].slice(0, 5).map((log) => (
                          <div key={log.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-primary)]">
                                {new Date(log.check_in_time).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">{new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <Badge variant="success" className="text-[9px] uppercase tracking-wider">{log.method}</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-20" />
                          <p className="text-xs text-[var(--text-tertiary)]">No logs found this week.</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Academic Progress */}
                  <Card className="lg:col-span-2">
                    <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                      <GraduationCap className="h-4 w-4 text-[var(--accent)]" />
                      Latest Assessments
                    </h3>
                    <div className="space-y-4">
                      {scores[child.id]?.length > 0 ? (
                        scores[child.id].slice(0, 3).map((s, i) => (
                          <div key={i} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">{s.target_type}</span>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">Assessment #{s.created_at.slice(-4)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-[var(--accent)]">{s.score}%</span>
                              </div>
                            </div>
                            <ProgressBar value={s.score || 0} max={100} size="sm" color="var(--accent)" />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <TrendingUp className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-2 opacity-20" />
                          <p className="text-sm text-[var(--text-tertiary)]">No scores recorded yet.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-[var(--text-tertiary)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Link Your Child&apos;s Account</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-8 mt-2">
            Monitor attendance, grades, and academy progress in real-time. You&apos;ll need your child&apos;s unique User ID.
          </p>
          <Button size="lg" onClick={() => setShowAddChild(true)} icon={<Plus className="h-4 w-4" />}>
            Link Student Now
          </Button>
        </Card>
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
