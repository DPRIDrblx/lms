"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { 
  Trophy, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  ArrowRight, 
  QrCode, 
  School, 
  FileText, 
  User, 
  LogOut, 
  RefreshCw, 
  Zap, 
  Calendar, 
  ChevronRight, 
  Play, 
  Lock, 
  FileCheck2, 
  Download,
  AlertCircle,
  ExternalLink,
  Brain,
  Hash
} from "lucide-react";
import confetti from "canvas-confetti";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  cover_image: string;
  lessons_count: number;
}

interface NastResult {
  status: "pending" | "lolos" | "tidak_lolos";
  score?: number | string;
  rank?: string;
  notes?: string;
  category?: string;
  updated_at?: string;
  updated_by?: string;
}

export default function NastParticipantDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  
  const NAST_CLASS_ID = "07fd41cd-9515-4255-9aab-b815cdb21d4e"; // SMP NAST 2026 (NAST2026JHS)

  const [courses, setCourses] = useState<Course[]>([]);
  const [result, setResult] = useState<NastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"arena" | "kpu" | "jadwal">("arena");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/nast/login");
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Ensure user is in the NAST class
      if (profile && profile.class_id !== NAST_CLASS_ID) {
        await supabase
          .from("profiles")
          .update({ class_id: NAST_CLASS_ID })
          .eq("id", user?.id);
      }

      // 2. Fetch Tournament Courses (The Explore content for this class)
      const { data: coursesData } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          description,
          category,
          cover_image,
          lessons_count:lessons(count)
        `)
        .contains("target_class_ids", [NAST_CLASS_ID])
        .eq("is_published", true);

      if (coursesData) {
        setCourses(coursesData.map((c: any) => ({
          ...c,
          lessons_count: c.lessons_count?.[0]?.count || 0
        })));
      }

      // 3. Fetch Qualification Announcement from global_settings
      const { data: settingsData } = await supabase
        .from("global_settings")
        .select("value")
        .eq("key", "nast_results")
        .maybeSingle();

      const existingMap: Record<string, NastResult> = settingsData?.value || {};
      const userRes = existingMap[user?.id || ""];

      setResult(userRes || null);

      // Trigger confetti if qualified!
      if (userRes?.status === "lolos") {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 },
          colors: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"]
        });
      }

    } catch (err) {
      console.error("Error loading NAST dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    toast.success("E-Sertifikat Resmi NAST 2027 sedang disiapkan untuk diunduh!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center gap-4 text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-black tracking-wide text-slate-300">
          Memuat Arena Dasbor NAST 2027...
        </p>
      </div>
    );
  }

  // Determine Qualification State
  const currentStatus = result?.status || "pending"; // Default is 'pending' (Abu-Abu)

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* 🌌 AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-96 right-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* 🧭 TOP APP BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#070B14]/85 border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand */}
          <Link href="/nast" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-white/10 rounded-2xl p-2 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/logo-nast.png" alt="Logo NAST 2027" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">NAST 2027</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Dasbor Peserta
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400">
                Kode Kelas: <strong className="text-amber-400 font-mono">NAST2026JHS</strong>
              </p>
            </div>
          </Link>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-black text-white">{profile?.full_name || user?.email}</span>
              <span className="text-[10px] font-bold text-slate-400">{profile?.school_name || (user?.user_metadata as any)?.school_name || "Peserta SMP / MTs"}</span>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 🌟 MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 📢 1. PENGUMUMAN KELULUSAN (THE CENTRAL REQUIREMENT) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div>
          {/* CASE 1: BELUM ADA INPUTAN / PENDING (ABU-ABU) */}
          {currentStatus === "pending" && (
            <div className="p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900/90 via-[#131B2A]/90 to-slate-900/90 border-2 border-slate-700/60 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-slate-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border-2 border-slate-600/50 text-slate-400 flex items-center justify-center font-black shrink-0 shadow-inner">
                    <Clock className="w-8 h-8 animate-pulse text-slate-400" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-600 text-xs font-black uppercase tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                      <span>Status Seleksi: Menunggu Pengumuman Resmi</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-200 tracking-tight">
                      Penilaian Babak Penyisihan Sedang Berlangsung
                    </h2>

                    <p className="text-slate-400 text-xs sm:text-sm font-medium mt-2 max-w-2xl leading-relaxed">
                      Hasil pengerjaan CBT dan lembar jawaban Anda saat ini sedang dalam proses sinkronisasi dan rekapitulasi nilai oleh Dewan Juri Nasional NAST 2027. Pengumuman kelulusan ke babak semifinal akan diperbarui secara otomatis di halaman ini oleh Operator Les.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="px-5 py-3 rounded-2xl bg-slate-800/60 border border-slate-700 text-center w-full md:w-auto">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Dasbor</p>
                    <p className="text-sm font-black text-slate-300 mt-0.5">Abu-Abu (Pending)</p>
                  </div>
                  <button 
                    onClick={loadDashboardData}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-600 w-full md:w-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cek Ulang</span>
                  </button>
                </div>
              </div>

              {/* Progress Flow */}
              <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 1. Registrasi
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5 font-medium">Terverifikasi</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 2. Masuk Kelas
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5 font-medium">NAST2026JHS</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-900/20 border border-cyan-500/30">
                  <p className="text-cyan-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 3. Rekap Juri
                  </p>
                  <p className="text-slate-300 text-[11px] mt-0.5 font-medium">Dalam Proses</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 opacity-60">
                  <p className="text-slate-400 font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> 4. Semifinal
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-medium">Belum Dibuka</p>
                </div>
              </div>
            </div>
          )}

          {/* CASE 2: LOLOS (GOLD & EMERALD CHAMPION CARD) */}
          {currentStatus === "lolos" && (
            <div className="p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950 border-2 border-amber-400/60 shadow-2xl shadow-emerald-500/20 relative overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-400/25">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Hasil Resmi: Dinyatakan Lolos</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                      Selamat! Anda Lolos ke Babak Semifinal NAST 2027!
                    </h2>

                    <p className="text-emerald-200 text-xs sm:text-sm font-medium mt-2 max-w-2xl leading-relaxed">
                      Selamat atas pencapaian luar biasa Anda di babak penyisihan nasional. Dewan Juri telah mengonfirmasi bahwa nilai Anda memenuhi syarat kelulusan ke babak semifinal.
                    </p>

                    {result?.notes && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-amber-400/30 text-xs text-amber-200 font-medium">
                        <strong className="text-amber-400 font-black">Catatan Juri:</strong> {result.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score & Rank Card */}
                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-center">
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Skor Akhir</p>
                    <p className="text-3xl sm:text-4xl font-black text-white">{result?.score !== undefined ? result.score : "92.0"}</p>
                    {result?.rank && (
                      <p className="text-xs font-bold text-emerald-400 mt-1">{result.rank}</p>
                    )}
                  </div>

                  <button
                    onClick={handleDownloadCertificate}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>Unduh SK Kelulusan (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CASE 3: TIDAK LOLOS (DIGNIFIED APPRECIATION CARD) */}
          {currentStatus === "tidak_lolos" && (
            <div className="p-6 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 border-2 border-rose-500/40 shadow-xl relative overflow-hidden backdrop-blur-xl">
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-400 flex items-center justify-center font-black shrink-0">
                    <Award className="w-8 h-8 text-rose-400" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-wider mb-2">
                      <span>Apresiasi Peserta Nasional</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Terima Kasih Atas Partisipasi Luar Biasamu di NAST 2027
                    </h2>

                    <p className="text-slate-300 text-xs sm:text-sm font-medium mt-2 max-w-2xl leading-relaxed">
                      Meskipun langkah Anda belum berlanjut ke babak semifinal kali ini, semangat belajar dan dedikasi Anda sangat kami apresiasi. Seluruh peserta berhak mendapatkan E-Sertifikat Kepesertaan Nasional Ber-Barcode.
                    </p>

                    {result?.notes && (
                      <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 font-medium">
                        <strong className="text-rose-400 font-black">Catatan Juri:</strong> {result.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                  {result?.score !== undefined && (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Skor Diperoleh</p>
                      <p className="text-2xl font-black text-white">{result.score}</p>
                    </div>
                  )}

                  <button
                    onClick={handleDownloadCertificate}
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Unduh Piagam Peserta (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 🪪 2. DIGITAL PARTICIPANT BADGE / KPU ONLINE */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 relative overflow-hidden backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/25 shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "P"}
              </div>

              <div>
                <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest block">
                  Kartu Tanda Peserta Online (KPU)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {profile?.full_name || user?.email}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                  <span className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-slate-500" />
                    {profile?.school_name || (user?.user_metadata as any)?.school_name || "SMP / MTs Peserta"}
                  </span>
                  <span>•</span>
                  <span className="text-amber-400 font-mono">Kode: NAST2026JHS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <QrCode className="w-10 h-10 text-cyan-400" />
                <div className="text-left text-xs">
                  <p className="font-mono font-black text-white">NAST27-JHS-{user?.id?.slice(0, 5)?.toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400">Verifikasi Resmi Sistem</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 🏟️ 3. ARENA MODUL & KISI-KISI KELAS NAST2026JHS (THE EXPLORE) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 inline-block mb-1">
                Arena Kompetisi & Modul Soal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Materi Lomba Kelas NAST 2026 (JHS)
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                Daftar mata pelajaran, bank soal, dan modul resmi yang terhubung langsung dengan kode kelas Anda.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                {courses.length} Modul Terbuka
              </span>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="p-16 text-center text-slate-500 rounded-3xl bg-white/[0.02] border border-white/10">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-base font-black text-slate-400">Belum ada modul yang terhubung</p>
              <p className="text-xs">Pastikan kelas NAST2026JHS telah mempublikasikan modul ajar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c, i) => (
                <div 
                  key={c.id}
                  className="rounded-3xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 p-6 flex flex-col justify-between transition-all group hover:bg-white/[0.06] shadow-xl relative overflow-hidden"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {c.category || "Tournament"}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {c.lessons_count} Modul
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-2">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-400 font-medium line-clamp-3 leading-relaxed mb-6">
                      {c.description || "Modul dan silabus resmi kompetisi NAST 2027 jenjang SMP / MTs."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terdaftar
                    </span>

                    <Link href={`/courses/${c.id}`}>
                      <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95">
                        <span>Akses Modul</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* ⚡ 4. QUICK SIMULASI CBT LAUNCHER */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-white/15 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shrink-0">
              <Zap className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Simulasi Ujian CBT Interaktif</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Uji kemampuan dengan timer real-time dan rendering rumus KaTeX standar olimpiade tanpa freeze.
              </p>
            </div>
          </div>

          <Link href="/courses">
            <button className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap">
              <span>Buka Menu Explore Lengkap</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#05080E] py-8 text-center text-xs text-slate-500 font-bold mt-16">
        Dasbor Peserta Resmi NAST 2027 • NIA Tutoring LMS Platform
      </footer>

    </div>
  );
}
