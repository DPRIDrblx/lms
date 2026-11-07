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
  BookOpen,
  Sparkles,
  Inbox
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

  // Process and filter: STRICTLY for CBT MMIS v2 exams only
  const cbtItems = useMemo(() => {
    return quizzes
      .filter((quiz) => !quiz.is_form)
      .map((quiz) => {
        const config = parseCbtConfig(quiz);
        const scheduleStatus = getExamScheduleStatus(config, currentTime);
        const isTargeted = isStudentClassTargeted(config, studentClass);
        const scoreRecord = scores[quiz.id];
        const isCompleted = Boolean(scoreRecord);

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
        // STRICT FILTER: Hanya paket yang khusus dibuat untuk platform CBT MMIS v2
        if (!item.config.is_cbt_v2) return false;

        // Filter target kelas siswa (7A, 7B, atau semua kelas)
        if (!item.isTargeted) return false;

        // Filter tab
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

  // Counts strictly for CBT MMIS v2
  const cbtQuizzesAll = useMemo(() => {
    return quizzes.filter((q) => {
      if (q.is_form) return false;
      const config = parseCbtConfig(q);
      return config.is_cbt_v2 && isStudentClassTargeted(config, studentClass);
    });
  }, [quizzes, studentClass]);

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans">
      
      {/* Sleek, Modern Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
              <MonitorCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900">
                  CBT <span className="text-blue-600">MMIS</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-black tracking-wider">
                  v2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Computer Based Test Platform
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Session indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-slate-700 font-mono text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{currentTime.toLocaleTimeString("id-ID", { hour12: false })} WIB</span>
          </div>

          {/* Right: Student Profile & Switcher Back */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">{profile?.full_name || "Siswa"}</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Kelas {studentClass || "Siswa"}
              </span>
            </div>

            {/* Switcher back to normal LMS */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembali ke LMS Biasa</span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        
        {/* Modern Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-2">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Platform Ujian Resmi
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Galeri Paket Ujian CBT MMIS v2
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Hanya menampilkan paket ujian resmi yang ditargetkan untuk kelas Anda ({studentClass || "Semua"}).
              Dikerjakan sesuai jadwal tayang dengan pengawasan kamera dan batas 3x keluar tab.
            </p>
          </div>

          {/* Stats Chips */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Aktif</span>
              <span className="text-lg font-black text-emerald-600">{activeCount}</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Terjadwal</span>
              <span className="text-lg font-black text-amber-600">{upcomingCount}</span>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Selesai</span>
              <span className="text-lg font-black text-blue-600">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/70 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({cbtQuizzesAll.length})
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "active" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sedang Tayang ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "upcoming" ? "bg-amber-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Terjadwal ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "completed" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Selesai ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ujian atau mapel..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs transition-all"
            />
          </div>

        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl bg-white border border-slate-200 animate-pulse p-6" />
            ))}
          </div>
        ) : cbtItems.length === 0 ? (
          /* Clean Empty State */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Inbox className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Belum Ada Paket Ujian CBT MMIS v2</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm mx-auto">
                Halaman ini khusus menampilkan paket ujian resmi CBT MMIS v2. Saat guru mempublikasikan ujian untuk kelas Anda ({studentClass || "Siswa"}), paket ujian akan otomatis muncul di sini.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Belajar LMS</span>
              </Link>
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
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 flex flex-col justify-between p-5 group"
                >
                  
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                        {quiz.courses?.title || "Umum"}
                      </span>

                      {/* Status Chip */}
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center gap-1 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Selesai
                        </span>
                      ) : scheduleStatus.status === "active" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Sedang Tayang
                        </span>
                      ) : scheduleStatus.status === "upcoming" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-500" /> Terjadwal
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          Berakhir
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-3">
                      {quiz.title}
                    </h3>

                    {/* Clean Specs Strip */}
                    <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Waktu</span>
                        <span className="text-xs font-bold text-slate-800">{durationMinutes}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Soal</span>
                        <span className="text-xs font-bold text-slate-800">{questionCount}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Skor +/-</span>
                        <span className="text-xs font-bold text-emerald-700">+{config.points_correct}/-{config.penalty_wrong}</span>
                      </div>
                    </div>

                    {/* Security & Features Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600 mb-4">
                      {config.require_webcam && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Webcam Wajib
                        </span>
                      )}
                      {config.token_enabled && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                          <Key className="w-3 h-3" /> Token
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500" /> Maks 3x Tab
                      </span>
                    </div>

                    {/* Schedule Date Banner if Upcoming */}
                    {scheduleStatus.status === "upcoming" && config.schedule_start && (
                      <div className="mb-3 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 font-medium">
                        Dibuka pada: <strong>{new Date(config.schedule_start).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</strong>
                      </div>
                    )}

                    {/* Score summary if completed */}
                    {isCompleted && (
                      <div className="mb-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-bold uppercase">Nilai Ujian</span>
                          {config.show_score ? (
                            <span className="text-base font-black text-blue-700">Skor: {scoreRecord.score ?? 0}</span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-600 italic">Hasil Dirahasiakan</span>
                          )}
                        </div>
                        <Award className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100">
                    {isCompleted ? (
                      config.show_explanation ? (
                        <Link
                          href={`/student/cbt/review/${quiz.id}`}
                          className="w-full py-2 px-3 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Pembahasan</span>
                        </Link>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                          Ujian Selesai
                        </div>
                      )
                    ) : scheduleStatus.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => openPreExamModal(quiz, config)}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 group-hover:shadow"
                      >
                        <span>Mulai Ujian</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : scheduleStatus.status === "upcoming" ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Belum Dibuka</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Waktu Berakhir</span>
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
