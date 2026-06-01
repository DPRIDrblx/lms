"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, Users, BookOpen, Clock, FileText, CheckCircle2, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EducatorDashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeClasses: 0,
    totalStudents: 0,
    pendingGrades: 0
  });

  useEffect(() => {
    if (profile && profile.role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    const fetchStats = async () => {
      // Mock stats for now, can be wired up to actual queries later
      setStats({
        activeClasses: 4,
        totalStudents: 120,
        pendingGrades: 15
      });
      setLoading(false);
    };

    if (profile) fetchStats();
  }, [profile, router, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header section with Emerald Theme */}
      <div className="bg-teal-950 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-teal-900">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookOpen className="h-64 w-64 text-teal-100" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/50 border border-teal-800 text-teal-300 text-xs font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Educator Portal Active
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Welcome back, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                {profile?.full_name?.split(' ')[0]}
              </span>
            </h1>
            <p className="text-teal-100/80 max-w-xl text-lg">
              Here is what's happening in your classes today. You have <strong className="text-white">{stats.pendingGrades} assignments</strong> waiting to be graded.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/teacher/journal" className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-900/50 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Jurnal Mengajar
            </Link>
            <Link href="/attendance/qr/teacher" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <Users className="h-4 w-4" /> Buka Kelas
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border-none shadow-xl shadow-teal-900/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
            <Users className="h-24 w-24 text-teal-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.totalStudents}</h3>
            </div>
          </div>
          <p className="text-sm font-medium text-teal-600 flex items-center gap-1 relative z-10">
            <TrendingUp className="h-4 w-4" /> Across all active classes
          </p>
        </Card>

        <Card className="p-6 bg-white border-none shadow-xl shadow-teal-900/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
            <BookOpen className="h-24 w-24 text-indigo-600" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Classes</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.activeClasses}</h3>
            </div>
          </div>
          <p className="text-sm font-medium text-indigo-600 flex items-center gap-1 relative z-10">
            <CheckCircle2 className="h-4 w-4" /> All materials up to date
          </p>
        </Card>

        <Card className="p-6 bg-white border-none shadow-xl shadow-teal-900/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
            <AlertCircle className="h-24 w-24 text-amber-500" />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">To Grade</p>
              <h3 className="text-3xl font-black text-slate-800">{stats.pendingGrades}</h3>
            </div>
          </div>
          <p className="text-sm font-medium text-amber-600 flex items-center gap-1 relative z-10">
            <AlertCircle className="h-4 w-4" /> Assignments need attention
          </p>
        </Card>
      </div>

      {/* Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" /> Today's Schedule
          </h2>
          <Card className="p-12 text-center bg-white border-dashed border-2 border-slate-200 rounded-3xl shadow-sm">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No upcoming classes</h3>
            <p className="text-slate-500 mt-2">You don't have any scheduled classes for the remainder of today.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" /> Quick Actions
          </h2>
          <div className="grid gap-4">
            <Link href="/teacher/courses" className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Manage Content</h4>
                  <p className="text-xs text-slate-500">Edit courses & lessons</p>
                </div>
              </div>
            </Link>
            
            <Link href="/teacher/quizzes" className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">CBT Builder</h4>
                  <p className="text-xs text-slate-500">Create new quizzes</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
