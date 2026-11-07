"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  MonitorCheck, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  Search, 
  Key, 
  Camera, 
  Zap, 
  ShieldAlert, 
  ArrowLeft,
  Calendar,
  Lock,
  ChevronRight,
  Eye,
  Award,
  Sparkles,
  Inbox,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  SlidersHorizontal,
  RefreshCw
} from "lucide-react";
import { CbtPreExamModal } from "@/components/cbt/cbt-pre-exam-modal";
import { 
  parseCbtConfig, 
  getExamScheduleStatus, 
  isStudentClassTargeted, 
  CbtExamConfig 
} from "@/lib/cbt-config";

export default function StudentCbtGalleryPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<CbtExamConfig | null>(null);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "completed">("all");

  // Live clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch quizzes with their questions count and course titles
    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select(`
        *,
        courses ( id, title ),
        questions ( count )
      `)
      .order("created_at", { ascending: false });

    if (quizzesData) {
      setQuizzes(quizzesData);
    }

    // Fetch existing scores for this student to know completion status
    if (profile?.id) {
      const { data: scoresData } = await supabase
        .from("student_scores")
        .select("*")
        .eq("student_id", profile.id)
        .eq("score_type", "quiz");

      const scoreMap: Record<string, any> = {};
      (scoresData || []).forEach((s: any) => {
        scoreMap[s.target_id] = s;
      });
      setScores(scoreMap);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, supabase]);

  const studentClass = profile?.class_name;

  // Process and filter: STRICTLY for CBT MMIS v2 exams only
  const cbtQuizzesAll = useMemo(() => {
    return quizzes.filter((q) => {
      if (q.is_form) return false;
      const config = parseCbtConfig(q);
      return config.is_cbt_v2 && isStudentClassTargeted(config, studentClass);
    });
  }, [quizzes, studentClass]);

  // Extract distinct subjects for quick filtering
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    cbtQuizzesAll.forEach((q) => {
      const title = q.courses?.title;
      if (title) set.add(title);
    });
    return Array.from(set);
  }, [cbtQuizzesAll]);

  // Filtered CBT items
  const cbtItems = useMemo(() => {
    return cbtQuizzesAll
      .map((quiz) => {
        const config = parseCbtConfig(quiz);
        const scheduleStatus = getExamScheduleStatus(config, currentTime);
        const scoreRecord = scores[quiz.id];
        const isCompleted = Boolean(scoreRecord);

        return {
          quiz,
          config,
          scheduleStatus,
          scoreRecord,
          isCompleted,
        };
      })
      .filter((item) => {
        // Tab filter
        if (activeTab === "active") {
          return item.scheduleStatus.status === "active" && !item.isCompleted;
        }
        if (activeTab === "upcoming") {
          return item.scheduleStatus.status === "upcoming";
        }
        if (activeTab === "completed") {
          return item.isCompleted;
        }
        return true;
      })
      .filter((item) => {
        // Subject filter
        if (selectedSubject !== "all" && item.quiz.courses?.title !== selectedSubject) {
          return false;
        }
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const title = (item.quiz.title || "").toLowerCase();
          const subject = (item.quiz.courses?.title || "").toLowerCase();
          return title.includes(q) || subject.includes(q);
        }
        return true;
      });
  }, [cbtQuizzesAll, currentTime, scores, activeTab, selectedSubject, searchQuery]);

  const activeCount = useMemo(() => {
    return cbtQuizzesAll.filter((q) => {
      const config = parseCbtConfig(q);
      return getExamScheduleStatus(config, currentTime).status === "active" && !scores[q.id];
    }).length;
  }, [cbtQuizzesAll, currentTime, scores]);

  const upcomingCount = useMemo(() => {
    return cbtQuizzesAll.filter((q) => {
      const config = parseCbtConfig(q);
      return getExamScheduleStatus(config, currentTime).status === "upcoming";
    }).length;
  }, [cbtQuizzesAll, currentTime]);

  const completedCount = useMemo(() => {
    return cbtQuizzesAll.filter((q) => Boolean(scores[q.id])).length;
  }, [cbtQuizzesAll, scores]);

  const openPreExamModal = (quiz: any, config: CbtExamConfig) => {
    setSelectedQuiz(quiz);
    setSelectedConfig(config);
    setIsPreExamModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Modern, Clean CBT Navigation Bar Matching LMS */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <MonitorCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  CBT <span className="text-blue-600">MMIS</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black tracking-wider border border-blue-200">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Portal Ujian Berbasis Komputer
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Network/WIB Indicator */}
          <div className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{currentTime.toLocaleTimeString("id-ID", { hour12: false })} WIB</span>
            <span className="text-slate-400">•</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-bold">Server Terhubung</span>
          </div>

          {/* Right: Student Profile & Switcher Back */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">{profile?.full_name || "Siswa"}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                  Kelas {studentClass || "Reguler"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* Switcher back to normal LMS */}
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-xs"
              title="Kembali ke Dashboard LMS Biasa"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Keluar Mode Ujian</span>
              <span className="sm:hidden">LMS</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        
        {/* LMS-Style Modern Clean Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Portal Resmi CBT MMIS v2.0</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Galeri Paket Ujian Siswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Menampilkan naskah ujian resmi yang ditugaskan guru untuk kelas <span className="text-blue-700 font-bold">{studentClass || "Anda"}</span>. 
                Didukung sistem <strong className="text-slate-800">Anti-Cheat 3x Keluar Tab</strong>, penilaian minus, dan kamera pengawas.
              </p>

              {/* Protocol feature pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-medium">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Maks. 3x Pindah Tab
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Sistem Skor Minus
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  Kamera Pengawas
                </span>
              </div>
            </div>

            {/* Quick Metrics Barometer */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block tracking-wider mb-1">Siap Ujian</span>
                <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Aktif</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider mb-1">Terjadwal</span>
                <span className="text-2xl font-black text-amber-600">{upcomingCount}</span>
                <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">Mendatang</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center min-w-[95px]">
                <span className="text-[10px] uppercase font-bold text-blue-800 block tracking-wider mb-1">Riwayat</span>
                <span className="text-2xl font-black text-blue-600">{completedCount}</span>
                <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">Selesai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters, Subject Select, and Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Semua Ujian ({cbtQuizzesAll.length})
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "active"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                Sedang Tayang ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "upcoming"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-200" />
                Terjadwal ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "completed"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                Selesai ({completedCount})
              </button>
            </div>

            {/* Right: Search Box & Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul ujian atau mapel..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="h-10 w-10 shrink-0 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors shadow-xs"
                title="Muat Ulang Paket Ujian"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

          </div>

          {/* Subject Pills (if more than 1 subject exists) */}
          {availableSubjects.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Mapel:
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubject("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  selectedSubject === "all"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
                }`}
              >
                Semua Mapel
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    selectedSubject === sub
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse p-6 space-y-4 shadow-xs"
              >
                <div className="flex justify-between items-center">
                  <div className="w-20 h-5 bg-slate-200 rounded-md" />
                  <div className="w-16 h-5 bg-slate-200 rounded-full" />
                </div>
                <div className="w-3/4 h-6 bg-slate-200 rounded-md" />
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : cbtItems.length === 0 ? (
          /* Clean LMS Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <Inbox className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {searchQuery || selectedSubject !== "all" 
                  ? "Tidak Ada Ujian yang Cocok"
                  : "Belum Ada Paket Ujian CBT MMIS v2"}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
                {searchQuery || selectedSubject !== "all"
                  ? "Coba ubah kata kunci pencarian atau reset filter mata pelajaran Anda."
                  : `Halaman ini hanya menampilkan naskah ujian resmi CBT MMIS v2 khusus kelas ${studentClass || "Anda"}. Paket baru akan otomatis muncul saat guru mengaktifkan jadwal.`}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {(searchQuery || selectedSubject !== "all") ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSubject("all");
                    setActiveTab("all");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Reset Filter
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Belajar LMS</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cbtItems.map(({ quiz, config, scheduleStatus, scoreRecord, isCompleted }) => {
              const durationMinutes = quiz.time_limit || quiz.time_limit_minutes || 60;
              const questionCount = quiz.questions?.[0]?.count || quiz.questions?.length || 0;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-6 group relative overflow-hidden"
                >
                  {/* Subtle Accent Glow Bar on Card Top */}
                  <div className={`absolute top-0 inset-x-0 h-1 transition-all ${
                    isCompleted 
                      ? "bg-blue-500" 
                      : scheduleStatus.status === "active" 
                      ? "bg-emerald-500 group-hover:h-1.5" 
                      : scheduleStatus.status === "upcoming"
                      ? "bg-amber-500"
                      : "bg-slate-300"
                  }`} />

                  {/* Top Card Section */}
                  <div>
                    {/* Course Subject & Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                        {quiz.courses?.title || "Umum"}
                      </span>

                      {/* Status Badges */}
                      {isCompleted ? (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center gap-1.5 border border-blue-200 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Selesai
                        </span>
                      ) : scheduleStatus.status === "active" ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1.5 border border-emerald-200 shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Sedang Tayang
                        </span>
                      ) : scheduleStatus.status === "upcoming" ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1.5 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" /> Terjadwal
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                          Waktu Berakhir
                        </span>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3">
                      {quiz.title}
                    </h3>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-3.5">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Durasi</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">{durationMinutes} Menit</span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Soal</span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">{questionCount} Butir</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Skor +/-</span>
                        <span className="text-xs font-black text-emerald-600 mt-0.5 block">
                          +{config.points_correct} / -{config.penalty_wrong}
                        </span>
                      </div>
                    </div>

                    {/* Security & Feature Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold mb-4">
                      {config.require_webcam && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Camera className="w-3 h-3 text-purple-600" /> Kamera Wajib
                        </span>
                      )}
                      {config.token_enabled && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-600" /> Perlu Token
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600" /> Batas 3x Tab
                      </span>
                    </div>

                    {/* Schedule Date Details for Upcoming */}
                    {scheduleStatus.status === "upcoming" && config.schedule_start && (
                      <div className="mb-3.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Mulai: <strong>{new Date(config.schedule_start).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</strong>
                        </span>
                      </div>
                    )}

                    {/* Score summary if completed */}
                    {isCompleted && (
                      <div className="mb-3.5 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-blue-700 block font-bold uppercase tracking-wider">Hasil Ujian</span>
                          {config.show_score ? (
                            <span className="text-lg font-black text-slate-900 mt-0.5 block">
                              Skor: <span className="text-emerald-600">{scoreRecord.score ?? 0}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500 italic">Dirahasiakan oleh Guru</span>
                          )}
                        </div>
                        <Award className="w-7 h-7 text-blue-600 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100">
                    {isCompleted ? (
                      config.show_explanation ? (
                        <Link
                          href={`/student/cbt/review/${quiz.id}`}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Pembahasan Soal</span>
                        </Link>
                      ) : (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold text-center border border-slate-200">
                          Ujian Telah Terkumpul
                        </div>
                      )
                    ) : scheduleStatus.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => openPreExamModal(quiz, config)}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4 text-amber-300" />
                        <span>Mulai Kerjakan Ujian</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : scheduleStatus.status === "upcoming" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Belum Dibuka (Terjadwal)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waktu Ujian Telah Lewat</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Pre-Exam Confirmation Modal */}
      {selectedQuiz && selectedConfig && (
        <CbtPreExamModal
          quiz={selectedQuiz}
          config={selectedConfig}
          isOpen={isPreExamModalOpen}
          onClose={() => setIsPreExamModalOpen(false)}
          questionCount={selectedQuiz.questions?.[0]?.count || selectedQuiz.questions?.length}
        />
      )}

    </div>
  );
}
