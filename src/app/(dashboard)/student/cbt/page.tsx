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
  AlertCircle, 
  Search, 
  Filter, 
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
  BookOpen,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming" | "completed">("all");

  // Live clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch quizzes and scores
  useEffect(() => {
    if (!profile?.id) return;

    const fetchData = async () => {
      setLoading(true);

      const [quizzesRes, scoresRes] = await Promise.all([
        supabase
          .from("quizzes")
          .select("*, courses(title), questions(count)")
          .order("created_at", { ascending: false }),
        supabase
          .from("student_scores")
          .select("*")
          .eq("student_id", profile.id)
      ]);

      if (quizzesRes.data) {
        setQuizzes(quizzesRes.data);
      }

      if (scoresRes.data) {
        const scoreMap: Record<string, any> = {};
        scoresRes.data.forEach((s: any) => {
          scoreMap[s.target_id] = s;
        });
        setScores(scoreMap);
      }

      setLoading(false);
    };

    fetchData();
  }, [profile?.id, supabase]);

  const studentClass = profile?.class_name;

  // Process and filter quizzes for CBT MMIS v2
  const cbtItems = useMemo(() => {
    return quizzes
      .map((quiz) => {
        const config = parseCbtConfig(quiz);
        const scheduleStatus = getExamScheduleStatus(config, currentTime);
        const isTargeted = isStudentClassTargeted(config, studentClass);
        const scoreRecord = scores[quiz.id];
        const isCompleted = Boolean(scoreRecord);

        // Filter: Must either be marked is_cbt_v2 OR have CBT MMIS v2 settings
        // If a teacher created a regular quiz, we can still include it in CBT v2 if it's targeted
        return {
          quiz,
          config,
          scheduleStatus,
          isTargeted,
          scoreRecord,
          isCompleted,
        };
      })
      .filter((item) => {
        // Show if targeted to student's class (e.g. 7A, 7B, or all classes)
        if (!item.isTargeted) return false;

        // Apply tab filter
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
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.quiz.title.toLowerCase().includes(q) ||
          item.quiz.courses?.title?.toLowerCase().includes(q)
        );
      });
  }, [quizzes, scores, studentClass, currentTime, activeTab, searchQuery]);

  const openPreExamModal = (quiz: any, config: CbtExamConfig) => {
    setSelectedQuiz(quiz);
    setSelectedConfig(config);
    setIsPreExamModalOpen(true);
  };

  const activeCount = quizzes.filter((q) => {
    const c = parseCbtConfig(q);
    return getExamScheduleStatus(c, currentTime).status === "active" && !scores[q.id];
  }).length;

  const upcomingCount = quizzes.filter((q) => {
    const c = parseCbtConfig(q);
    return getExamScheduleStatus(c, currentTime).status === "upcoming";
  }).length;

  const completedCount = Object.keys(scores).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* CBT MMIS v2 Dedicated Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Switcher indicator */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <MonitorCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  CBT <span className="text-blue-600">MMIS v2</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                  Mode Ujian Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Computer Based Test Platform
              </p>
            </div>
          </div>

          {/* Student Info & Live Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">{profile?.full_name || "Siswa"}</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Kelas {studentClass || "Siswa"}
              </span>
            </div>

            {/* Live Clock Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>
                {currentTime.toLocaleTimeString("id-ID", { hour12: false })} WIB
              </span>
            </div>

            {/* Switcher: Back to LMS Biasa */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kembali ke LMS Biasa</span>
              <span className="md:hidden">LMS</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-6 sm:p-8 overflow-hidden shadow-xl shadow-indigo-950/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Ujian Siswa
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Galeri Paket Soal CBT MMIS v2
            </h2>
            <p className="text-blue-100 text-sm mt-2 leading-relaxed">
              Selamat datang di sistem CBT MMIS v2. Pilih paket soal sesuai jadwal tayang guru Anda. 
              Sistem dilengkapi pengawasan otomatis, aturan penilaian (+/-), dan batas toleransi maksimal 3 kali keluar tab.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <span className="text-xs text-blue-200">Total Paket</span>
              <p className="text-xl font-black text-white mt-0.5">{quizzes.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <span className="text-xs text-emerald-300">Sedang Tayang</span>
              <p className="text-xl font-black text-emerald-300 mt-0.5">{activeCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <span className="text-xs text-amber-300">Terjadwal</span>
              <p className="text-xl font-black text-amber-300 mt-0.5">{upcomingCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <span className="text-xs text-blue-200">Selesai Dikerjakan</span>
              <p className="text-xl font-black text-white mt-0.5">{completedCount}</p>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua Paket ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "active" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sedang Tayang ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "upcoming" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Terjadwal ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "completed" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Riwayat & Hasil ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul soal atau mapel..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-xs"
            />
          </div>

        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse p-6" />
            ))}
          </div>
        ) : cbtItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Paket Soal</h3>
            <p className="text-xs text-slate-500 mt-1">
              Belum ada paket ujian yang sesuai dengan filter atau kelas Anda ({studentClass || "Semua"}).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cbtItems.map(({ quiz, config, scheduleStatus, scoreRecord, isCompleted }) => {
              const durationMinutes = quiz.time_limit || quiz.time_limit_minutes || 60;
              const questionCount = quiz.questions?.[0]?.count || quiz.questions?.length || 0;

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  
                  {/* Card Header & Content */}
                  <div className="p-6">
                    
                    {/* Top status & target badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                        {quiz.courses?.title || "Umum"}
                      </span>

                      {/* Schedule status badge */}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      ) : scheduleStatus.status === "active" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sedang Tayang
                        </span>
                      ) : scheduleStatus.status === "upcoming" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Terjadwal
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Berakhir
                        </span>
                      )}
                    </div>

                    {/* Quiz Title */}
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3">
                      {quiz.title}
                    </h3>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{durationMinutes} Menit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{questionCount} Soal</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>+{config.points_correct} Benar</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>-{config.penalty_wrong} Salah</span>
                      </div>
                    </div>

                    {/* Feature Badges (Webcam, Token, Anti-Cheat) */}
                    <div className="flex flex-wrap gap-1.5">
                      {config.require_webcam ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                          <Camera className="w-3 h-3" /> Webcam Wajib
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          Bebas Kamera
                        </span>
                      )}

                      {config.token_enabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                          <Key className="w-3 h-3" /> Perlu Token
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          Bebas Token
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-100">
                        <ShieldAlert className="w-3 h-3" /> Max 3x Tab
                      </span>
                    </div>

                    {/* Schedule detail info if upcoming */}
                    {scheduleStatus.status === "upcoming" && config.schedule_start && (
                      <p className="mt-3 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-xl border border-amber-200/60 font-medium">
                        Tayang pada:{" "}
                        <span className="font-bold">
                          {new Date(config.schedule_start).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </p>
                    )}

                    {/* Completed Score Info */}
                    {isCompleted && (
                      <div className="mt-3 p-3 bg-blue-50/80 rounded-2xl border border-blue-200/60 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 font-bold">Hasil Ujian Anda</p>
                          {config.show_score ? (
                            <p className="text-lg font-black text-blue-700">
                              Skor: {scoreRecord.score ?? 0}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-slate-600 italic">
                              Hasil dirahasiakan pengawas
                            </p>
                          )}
                        </div>
                        <Award className="w-7 h-7 text-blue-500/80" />
                      </div>
                    )}

                  </div>

                  {/* Card Action Footer */}
                  <div className="p-6 pt-0">
                    {isCompleted ? (
                      config.show_explanation ? (
                        <Link
                          href={`/student/cbt/review/${quiz.id}`}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span>Lihat Pembahasan Soal</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Ujian Selesai Dikerjakan</span>
                        </button>
                      )
                    ) : scheduleStatus.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => openPreExamModal(quiz, config)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group-hover:shadow-lg"
                      >
                        <span>Mulai Ujian</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : scheduleStatus.status === "upcoming" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Belum Dibuka (Terjadwal)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Waktu Ujian Telah Berakhir</span>
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

