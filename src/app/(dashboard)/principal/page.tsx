"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, Users, BookOpen, GraduationCap, Building2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnnouncementBoard } from "@/components/dashboard/announcement-board";

export default function PrincipalDashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    journalsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== "principal" && profile.role !== "tu") {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      // 1. Get total students
      const { count: studentCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student");
      
      // 2. Get total teachers
      const { count: teacherCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher");
      
      // 3. Get total classes
      const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true });
      
      // 4. Get journals submitted today
      const today = new Date().toISOString().split('T')[0];
      const { count: journalCount } = await supabase.from("teaching_journals").select("*", { count: "exact", head: true }).eq("date", today);

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalClasses: classCount || 0,
        journalsToday: journalCount || 0
      });
      setLoading(false);
    };

    if (profile) fetchData();
  }, [profile, router, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Building2 className="h-48 w-48 text-white" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
            <GraduationCap className="h-4 w-4" /> Executive Board
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">Sistem Informasi<br />Manajemen Sekolah</h1>
          <p className="text-slate-400 mt-4 text-lg max-w-xl">Selamat datang kembali, Kepala Sekolah. Berikut adalah ringkasan operasional IGNITE hari ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-5 group hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Siswa</p>
            <p className="text-3xl font-black text-white">{stats.totalStudents}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-5 group hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Guru</p>
            <p className="text-3xl font-black text-white">{stats.totalTeachers}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center gap-5 group hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Kelas</p>
            <p className="text-3xl font-black text-white">{stats.totalClasses}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 flex items-center gap-5 group hover:-translate-y-1 transition-all">
          <div className="h-14 w-14 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">Jurnal Hari Ini</p>
            <p className="text-3xl font-black text-white">{stats.journalsToday}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnnouncementBoard />
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-amber-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              Tindakan Cepat
            </h3>
            <div className="space-y-3">
              <Link href="/principal/journals" className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500/50 transition-all group">
                <span className="font-bold text-slate-300 group-hover:text-amber-500 transition-colors">Pantau Jurnal Mengajar</span>
              </Link>
              <Link href="/principal/attendances" className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-amber-500/50 transition-all group">
                <span className="font-bold text-slate-300 group-hover:text-amber-500 transition-colors">Rekapitulasi Absensi</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
