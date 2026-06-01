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
      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)]">Sistem Informasi Manajemen Sekolah</h1>
        <p className="text-[var(--text-secondary)] mt-2 text-lg">Selamat datang kembali, Kepala Sekolah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900/60 uppercase tracking-wider">Total Siswa</p>
            <p className="text-3xl font-black text-blue-900">{stats.totalStudents}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-wider">Total Guru</p>
            <p className="text-3xl font-black text-emerald-900">{stats.totalTeachers}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <div className="h-12 w-12 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-900/60 uppercase tracking-wider">Total Kelas</p>
            <p className="text-3xl font-black text-purple-900">{stats.totalClasses}</p>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900/60 uppercase tracking-wider">Jurnal Hari Ini</p>
            <p className="text-3xl font-black text-amber-900">{stats.journalsToday}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnnouncementBoard />
        </div>
        
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[var(--accent)]" />
              Tindakan Cepat
            </h3>
            <div className="space-y-3">
              <Link href="/principal/journals" className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all group">
                <span className="font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent)]">Pantau Jurnal Mengajar</span>
              </Link>
              <Link href="/principal/attendances" className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)] transition-all group">
                <span className="font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent)]">Rekapitulasi Absensi</span>
              </Link>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
