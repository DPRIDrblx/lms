"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback, useRef } from "react";
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  LayoutGrid, 
  X, 
  ZoomIn,
  Volume2,
  Award,
  ArrowRight,
  Maximize2,
  Minimize2,
  Trash2,
  Keyboard,
  Info
} from "lucide-react";
import { MathRenderer } from "@/components/ui/math-renderer";
import { CbtAudioPlayer } from "@/components/cbt/cbt-audio-player";
import { CbtWebcamMonitor } from "@/components/cbt/cbt-webcam-monitor";
import { 
  parseCbtConfig, 
  calculateCbtScore, 
  CbtExamConfig 
} from "@/lib/cbt-config";

function getQuestionTypeLabel(type: string | undefined): string {
  switch (type) {
    case "mcq":
      return "Pilihan Ganda";
    case "complex_mcq":
      return "Pilihan Ganda Kompleks";
    case "matching":
      return "Menjodohkan";
    case "matrix":
      return "Benar / Salah";
    case "linear_scale":
      return "Skala Linear";
    case "essay":
      return "Uraian / Essay";
    default:
      return "Pilihan Ganda";
  }
}

function isQuestionAnswered(ans: any): boolean {
  if (ans === undefined || ans === null || ans === "") return false;
  if (Array.isArray(ans)) return ans.length > 0;
  if (typeof ans === "object") return Object.keys(ans).length > 0;
  return true;
}

export default function CbtExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [config, setConfig] = useState<CbtExamConfig | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Anti-cheat 3x tab blur state
  const [blurCount, setBlurCount] = useState(0);
  const [blurModal, setBlurModal] = useState<{
    show: boolean;
    type: "warning_1" | "warning_2" | "auto_submit";
    message: string;
  }>({ show: false, type: "warning_1", message: "" });

  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);

  const blurCountRef = useRef(0);
  const isFinishedRef = useRef(false);

  // Initialize exam data
  useEffect(() => {
    if (!profile?.id) return;

    const initExam = async () => {
      setLoading(true);

      const [quizRes, questionsRes, sessionRes, scoreRes] = await Promise.all([
        supabase.from("quizzes").select("*, courses(title)").eq("id", quizId).single(),
        supabase.from("questions").select("*").eq("quiz_id", quizId).order("order_index", { ascending: true }),
        supabase.from("exam_sessions").select("*").eq("student_id", profile.id).eq("quiz_id", quizId).single(),
        supabase.from("student_scores").select("*").eq("student_id", profile.id).eq("target_id", quizId).single(),
      ]);

      if (!quizRes.data) {
        alert("Paket soal ujian tidak ditemukan.");
        router.push("/student/cbt");
        return;
      }

      const parsedConfig = parseCbtConfig(quizRes.data);
      if (!parsedConfig.is_cbt_v2 || quizRes.data.is_form) {
        alert("Paket ini bukan paket ujian CBT MMIS v2.");
        router.push("/student/cbt");
        return;
      }
      setQuiz(quizRes.data);
      setConfig(parsedConfig);

      // Check if already completed
      if (scoreRes.data) {
        setIsFinished(true);
        isFinishedRef.current = true;
        setSubmissionResult({
          score: scoreRes.data.score,
          metadata: scoreRes.data.metadata || {},
          isGraded: scoreRes.data.is_graded,
        });
        setLoading(false);
        return;
      }

      const qList = (questionsRes.data || []).map((q: any) => ({
        ...q,
        question_type: q.question_type || q.metadata?.question_type || "mcq",
      }));
      setQuestions(qList);

      // Initialize persistent blur count from localStorage
      const storageKey = `cbt_blur_${quizId}_${profile.id}`;
      const savedBlur = parseInt(localStorage.getItem(storageKey) || "0", 10);
      setBlurCount(savedBlur);
      blurCountRef.current = savedBlur;

      // Timer & session calculation
      const totalSeconds = (quizRes.data.time_limit || quizRes.data.time_limit_minutes || 60) * 60;
      let initialTimeLeft = totalSeconds;

      if (sessionRes.data) {
        if (sessionRes.data.status === "submitted") {
          setIsFinished(true);
          isFinishedRef.current = true;
          setLoading(false);
          return;
        }

        if (sessionRes.data.time_left_seconds !== undefined) {
          initialTimeLeft = Math.max(0, sessionRes.data.time_left_seconds);
        }

        // Restore responses & flags from metadata
        if (sessionRes.data.metadata?.responses) {
          setResponses(sessionRes.data.metadata.responses);
        }
        if (sessionRes.data.metadata?.flags) {
          setFlags(sessionRes.data.metadata.flags);
        }
      } else {
        // Create initial exam session
        await supabase.from("exam_sessions").upsert({
          student_id: profile.id,
          quiz_id: quizId,
          time_left_seconds: totalSeconds,
          status: "in_progress",
          metadata: { responses: {}, flags: {} },
          started_at: new Date().toISOString(),
        });
      }

      setTimeLeft(initialTimeLeft);
      setLoading(false);
    };

    initExam();
  }, [quizId, profile?.id, supabase, router]);

  // Countdown Timer
  useEffect(() => {
    if (loading || isFinished || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time expires
          handleFinalSubmit(true, "time_expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isFinished, timeLeft]);

  // Periodically persist time_left and responses to exam_sessions
  useEffect(() => {
    if (loading || isFinished || !profile?.id) return;

    const syncInterval = setInterval(() => {
      supabase
        .from("exam_sessions")
        .update({
          time_left_seconds: timeLeft,
          metadata: { responses, flags, blurCount: blurCountRef.current },
        })
        .eq("student_id", profile.id)
        .eq("quiz_id", quizId)
        .then(() => {});
    }, 15000);

    return () => clearInterval(syncInterval);
  }, [loading, isFinished, timeLeft, responses, flags, profile?.id, quizId, supabase]);

  // Submit Exam handler
  const handleFinalSubmit = useCallback(async (isAuto = false, reason = "user_submitted") => {
    if (isFinishedRef.current || isSubmitting || !profile?.id || !quiz) return;

    setIsSubmitting(true);
    isFinishedRef.current = true;
    setIsFinished(true);

    const currentConfig = config || parseCbtConfig(quiz);
    const scoreResult = calculateCbtScore(questions, responses, currentConfig);

    const metadataPayload = {
      responses,
      flags,
      scoreDetails: scoreResult,
      blurCount: blurCountRef.current,
      submitReason: reason,
      submittedAt: new Date().toISOString(),
    };

    try {
      // 1. Save to student_scores
      await supabase.from("student_scores").upsert(
        {
          student_id: profile.id,
          target_id: quizId,
          target_type: "quiz",
          score: scoreResult.scaledScore,
          is_graded: true,
          graded_at: new Date().toISOString(),
          metadata: metadataPayload,
        },
        { onConflict: "student_id,target_id" }
      );

      // 2. Mark exam_sessions as submitted
      await supabase
        .from("exam_sessions")
        .update({
          status: "submitted",
          time_left_seconds: 0,
          metadata: metadataPayload,
        })
        .eq("student_id", profile.id)
        .eq("quiz_id", quizId);

      // Clean local blur storage
      localStorage.removeItem(`cbt_blur_${quizId}_${profile.id}`);

      setSubmissionResult({
        score: scoreResult.scaledScore,
        rawScore: scoreResult.rawScore,
        maxScore: scoreResult.maxPossibleScore,
        correctCount: scoreResult.correctCount,
        wrongCount: scoreResult.wrongCount,
        unansweredCount: scoreResult.unansweredCount,
        positivePoints: scoreResult.positivePointsTotal,
        negativePoints: scoreResult.negativePointsTotal,
        reason,
      });
    } catch (e) {
      console.error("Submission failed", e);
    } finally {
      setIsSubmitting(false);
      setConfirmSubmitModal(false);
      setBlurModal({ show: false, type: "warning_1", message: "" });
    }
  }, [isSubmitting, profile?.id, quiz, config, questions, responses, flags, quizId, supabase]);

  // Anti-Cheat: 3x Tab Exit Blur Tracker
  useEffect(() => {
    if (loading || isFinished) return;

    let debounceTimer: NodeJS.Timeout | null = null;

    const registerBlurViolation = () => {
      if (isFinishedRef.current) return;

      const nextCount = blurCountRef.current + 1;
      blurCountRef.current = nextCount;
      setBlurCount(nextCount);

      if (profile?.id) {
        localStorage.setItem(`cbt_blur_${quizId}_${profile.id}`, String(nextCount));
        
        // Log violation to Supabase
        supabase.from("cbt_tab_violations").insert({
          student_id: profile.id,
          quiz_id: quizId,
          violation_count: nextCount,
          violation_type: "tab_exit",
        }).then(() => {});
      }

      if (nextCount === 1) {
        setBlurModal({
          show: true,
          type: "warning_1",
          message: "Anda terdeteksi keluar dari layar / tab ujian! Perhatian: Jika Anda keluar tab sebanyak 3 kali, ujian akan OTOMATIS DISUBMIT.",
        });
      } else if (nextCount === 2) {
        setBlurModal({
          show: true,
          type: "warning_2",
          message: "PERINGATAN TERAKHIR! Anda telah keluar tab sebanyak 2 kali. Jika Anda keluar tab 1 kali lagi, ujian akan LANGSUNG OTOMATIS DIKUMPULKAN!",
        });
      } else if (nextCount >= 3) {
        setBlurModal({
          show: true,
          type: "auto_submit",
          message: "BATAS TOLERANSI HABIS! Anda telah keluar tab sebanyak 3 kali. Sesuai tata tertib CBT MMIS v2, lembar jawaban Anda otomatis dikumpulkan oleh sistem.",
        });

        // Trigger automatic submit after brief notification
        setTimeout(() => {
          handleFinalSubmit(true, "auto_tab_exit_limit");
        }, 1200);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(registerBlurViolation, 200);
      }
    };

    const handleWindowBlur = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(registerBlurViolation, 200);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [loading, isFinished, profile?.id, quizId, supabase, handleFinalSubmit]);

  // Answer handler
  const handleSelectOption = (qId: string, value: any) => {
    setResponses((prev) => ({ ...prev, [qId]: value }));
  };

  const handleClearAnswer = (qId: string) => {
    setResponses((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleToggleFlag = (qId: string) => {
    setFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard Shortcuts (A-E for options, Left/Right for questions, R for flag)
  useEffect(() => {
    if (loading || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      const key = e.key.toUpperCase();

      // Options A-E
      if (currentQ.question_type === "mcq" && currentQ.options) {
        const optionKeys = ["A", "B", "C", "D", "E"];
        const numKeys = ["1", "2", "3", "4", "5"];

        let optIdx = optionKeys.indexOf(key);
        if (optIdx === -1) optIdx = numKeys.indexOf(e.key);

        if (optIdx !== -1 && currentQ.options[optIdx]) {
          handleSelectOption(currentQ.id, currentQ.options[optIdx].text);
        }
      }

      // Flag / Ragu-ragu (key R)
      if (key === "R") {
        handleToggleFlag(currentQ.id);
      }

      // Navigation: Left & Right arrow
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, isFinished, currentIndex, questions]);

  const formatTimer = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 font-sans">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black tracking-wider uppercase text-blue-700">
          Menyiapkan Lembar Ujian CBT MMIS v2...
        </p>
      </div>
    );
  }

  // Submission Result View (Clean LMS Card)
  if (isFinished && submissionResult) {
    const showScore = config?.show_score ?? true;
    const showExplanation = config?.show_explanation ?? false;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95">
          
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
              CBT MMIS v2.0
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">Ujian Berhasil Dikumpulkan!</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
              Jawaban Anda untuk paket ujian <strong>{quiz?.title}</strong> telah tersimpan aman di server.
            </p>
          </div>

          {/* Conditional Score Display based on Teacher's setting */}
          {showScore ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nilai Akhir Anda</p>
                <p className="text-5xl font-black text-emerald-600 mt-1">
                  {submissionResult.score ?? 0}
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Benar</span>
                  <span className="text-base font-black text-emerald-600">{submissionResult.correctCount ?? 0}</span>
                  <span className="text-[10px] text-emerald-700 block">(+{submissionResult.positivePoints ?? 0})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Salah</span>
                  <span className="text-base font-black text-rose-600">{submissionResult.wrongCount ?? 0}</span>
                  <span className="text-[10px] text-rose-700 block">(-{submissionResult.negativePoints ?? 0})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Kosong</span>
                  <span className="text-base font-black text-slate-700">{submissionResult.unansweredCount ?? 0}</span>
                  <span className="text-[10px] text-slate-500 block">(0 poin)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-2">
              <Award className="w-8 h-8 text-blue-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Hasil Ujian Dirahasiakan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Pengawas atau guru menyetel hasil ujian untuk tidak langsung ditampilkan kepada siswa sampai seluruh rangkaian evaluasi selesai.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            {showExplanation && (
              <button
                type="button"
                onClick={() => router.push(`/student/cbt/review/${quizId}`)}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lihat Pembahasan Soal Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/student/cbt")}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Kembali ke Galeri CBT MMIS v2
            </button>
          </div>

        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? responses[currentQ.id] : null;
  const isFlagged = currentQ ? Boolean(flags[currentQ.id]) : false;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(responses).filter((k) => isQuestionAnswered(responses[k])).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const qCorrectPoints = Number(currentQ?.points_correct ?? currentQ?.metadata?.points_correct ?? currentQ?.points ?? config?.points_correct ?? 4);
  const qPenaltyWrong = Number(currentQ?.penalty_wrong ?? currentQ?.metadata?.penalty_wrong ?? config?.penalty_wrong ?? 1);
  const qAudioUrl = currentQ?.audio_url || currentQ?.metadata?.audio_url;
  const qImageUrl = currentQ?.image_url || currentQ?.metadata?.image_url;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none">
      
      {/* Floating Webcam Proctor Widget */}
      {config?.require_webcam && (
        <CbtWebcamMonitor isRequired={true} floating={true} />
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Identity & Exam info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              v2
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[180px] sm:max-w-md">
                {quiz?.title}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {profile?.full_name} • Kelas {profile?.class_name || "Siswa"}
              </p>
            </div>
          </div>

          {/* Center Timer Display */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono text-sm font-black border transition-all ${
                timeLeft < 300
                  ? "bg-rose-50 text-rose-700 border-rose-300 shadow-xs animate-pulse"
                  : timeLeft < 600
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : "bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4 text-current" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Right Controls: Tab Anti-Cheat Pill, Font Size, Fullscreen & Mobile Drawer */}
          <div className="flex items-center gap-2">
            
            {/* Tab violation counter pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                blurCount === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : blurCount === 1
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Keluar Tab: {blurCount}/3</span>
            </div>

            {/* Font Size Adjuster */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${fontSize === "normal" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                title="Ukuran Font Normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-2 py-0.5 rounded-lg font-bold text-sm transition-colors ${fontSize === "large" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                title="Ukuran Font Besar"
              >
                A+
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden lg:flex p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Fokus)"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Mobile Question Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="lg:hidden p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-bold shadow-xs"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{currentIndex + 1}/{totalQuestions}</span>
            </button>
          </div>

        </div>

        {/* Global Progress Line Bar */}
        <div className="w-full bg-slate-200 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 cols: Question Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* Question Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  dari {totalQuestions} Soal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider border border-blue-200">
                  {getQuestionTypeLabel(currentQ?.question_type)}
                </span>
              </div>

              {/* Scoring Info, Clear Option & Flag Toggle */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  +{qCorrectPoints} Benar
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  -{qPenaltyWrong} Salah
                </span>

                {/* Clear Selected Option button (Crucial for negative scoring) */}
                {currentAnswer !== undefined && currentAnswer !== null && (
                  <button
                    type="button"
                    onClick={() => currentQ && handleClearAnswer(currentQ.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
                    title="Kosongkan jawaban untuk menghindari pengurangan poin jika ragu"
                  >
                    <Trash2 className="w-3 h-3 text-slate-500" />
                    <span className="hidden sm:inline">Hapus Jawaban</span>
                  </button>
                )}

                {/* Flag / Ragu-ragu Button */}
                <button
                  type="button"
                  onClick={() => currentQ && handleToggleFlag(currentQ.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isFlagged
                      ? "bg-amber-100 text-amber-900 border-amber-300 shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border-slate-200"
                  }`}
                  title="Tandai ragu-ragu (Shortcut tombol R)"
                >
                  <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{isFlagged ? "Ragu-ragu" : "Tandai"}</span>
                </button>
              </div>
            </div>

            {/* Question Audio / Music Player if present */}
            {qAudioUrl && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  Materi Audio / Listening Soal:
                </p>
                <CbtAudioPlayer src={qAudioUrl} title={`Audio Soal No. ${currentIndex + 1}`} />
              </div>
            )}

            {/* Question Image if present */}
            {qImageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-lg bg-slate-100 group">
                <img
                  src={qImageUrl}
                  alt="Gambar Soal"
                  className="w-full h-auto object-contain max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setZoomedImage(qImageUrl)}
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(qImageUrl)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border border-slate-200 shadow-xs cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-600" /> Perbesar Gambar
                </button>
              </div>
            )}

            {/* Question Text with KaTeX & LaTeX */}
            <div
              className={`text-slate-900 leading-relaxed font-normal ${
                fontSize === "xlarge" ? "text-lg" : fontSize === "large" ? "text-base" : "text-sm sm:text-base"
              }`}
            >
              {currentQ ? (
                <MathRenderer htmlContent={currentQ.question_text} />
              ) : (
                <p className="text-slate-500">Soal tidak ditemukan.</p>
              )}
            </div>

            {/* Answer Options Area */}
            {currentQ?.question_type === "mcq" && currentQ.options && (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt: any, idx: number) => {
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D, E
                  const isSelected = currentAnswer === opt.text;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt.text)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 group cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {/* Option Letter Pill */}
                      <span
                        className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                        }`}
                      >
                        {letter}
                      </span>

                      {/* Option Text with LaTeX & KaTeX */}
                      <div className="flex-1 pt-1.5 text-slate-800 font-medium">
                        <MathRenderer htmlContent={opt.text} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Complex MCQ (Multiple Selection) */}
            {currentQ?.question_type === "complex_mcq" && currentQ.options && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-blue-700 font-semibold italic flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Pilih satu atau lebih pilihan yang benar:
                </p>
                {currentQ.options.map((opt: any, idx: number) => {
                  const letter = String.fromCharCode(65 + idx);
                  const selectedArr: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
                  const isSelected = selectedArr.includes(opt.text);

                  const toggleComplex = () => {
                    const newArr = isSelected
                      ? selectedArr.filter((t) => t !== opt.text)
                      : [...selectedArr, opt.text];
                    handleSelectOption(currentQ.id, newArr);
                  };

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={toggleComplex}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 group cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? "✓" : letter}
                      </span>

                      <div className="flex-1 pt-1.5 text-slate-800 font-medium">
                        <MathRenderer htmlContent={opt.text} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Matching Question (Menjodohkan) */}
            {currentQ?.question_type === "matching" && currentQ.options && (() => {
              const userMatches: Record<string, string> = (currentAnswer && typeof currentAnswer === "object") ? currentAnswer : {};
              const availablePairs: string[] = Array.from(new Set(currentQ.options.map((o: any) => o.match_pair).filter(Boolean))) as string[];

              return (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Jodohkan setiap pernyataan di sisi kiri dengan pasangan jawaban yang tepat di sisi kanan:</span>
                  </div>

                  <div className="space-y-3">
                    {currentQ.options.map((opt: any, oIdx: number) => {
                      const selectedVal = userMatches[opt.text] || "";

                      return (
                        <div
                          key={oIdx}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {oIdx + 1}
                            </span>
                            <div className="text-sm font-semibold text-slate-800 pt-0.5">
                              <MathRenderer htmlContent={opt.text} />
                            </div>
                          </div>

                          <div className="hidden md:block text-slate-300">
                            <ChevronRight className="w-5 h-5" />
                          </div>

                          <div className="w-full md:w-72 shrink-0">
                            <select
                              value={selectedVal}
                              onChange={(e) => {
                                const val = e.target.value;
                                const nextMatches = { ...userMatches };
                                if (val) {
                                  nextMatches[opt.text] = val;
                                } else {
                                  delete nextMatches[opt.text];
                                }
                                handleSelectOption(currentQ.id, nextMatches);
                              }}
                              className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                                selectedVal
                                  ? "bg-blue-50 text-blue-900 border-blue-400 shadow-xs"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <option value="">-- Pilih Pasangan Jawaban --</option>
                              {availablePairs.map((pair, pIdx) => (
                                <option key={pIdx} value={pair}>
                                  {pair}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Matrix Question (Benar / Salah) */}
            {currentQ?.question_type === "matrix" && currentQ.options && (() => {
              const userMatrix: Record<string, string> = (currentAnswer && typeof currentAnswer === "object") ? currentAnswer : {};
              const cols: string[] = currentQ.criteria?.cols || ["Benar", "Salah"];

              return (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Tentukan pilihan jawaban untuk masing-masing baris pernyataan berikut:</span>
                  </div>

                  <div className="space-y-3">
                    {currentQ.options.map((opt: any, oIdx: number) => {
                      const selectedVal = userMatrix[opt.text] || "";

                      return (
                        <div
                          key={oIdx}
                          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {oIdx + 1}
                            </span>
                            <div className="text-sm font-semibold text-slate-800 pt-0.5">
                              <MathRenderer htmlContent={opt.text} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {cols.map((col: string, cIdx: number) => {
                              const isChecked = selectedVal === col;
                              return (
                                <button
                                  key={cIdx}
                                  type="button"
                                  onClick={() => {
                                    const nextMatrix = { ...userMatrix, [opt.text]: col };
                                    handleSelectOption(currentQ.id, nextMatrix);
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {col}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Essay Question */}
            {currentQ?.question_type === "essay" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tuliskan Jawaban Essay Anda Secara Lengkap:
                </label>
                <textarea
                  rows={7}
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Ketik jawaban essay Anda di sini..."
                  className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                />
              </div>
            )}

            {/* Keyboard shortcut hint strip */}
            <div className="hidden sm:flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-medium">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Shortcut: Tekan <strong>A - E</strong> untuk opsi jawaban • <strong>← / →</strong> navigasi soal • <strong>R</strong> ragu-ragu</span>
            </div>

          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                currentIndex === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Center Quick Flag on Mobile */}
            <button
              type="button"
              onClick={() => currentQ && handleToggleFlag(currentQ.id)}
              className={`sm:hidden px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                isFlagged ? "bg-amber-100 text-amber-900 border-amber-300" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
            </button>

            {/* Next or Finish Button */}
            {currentIndex >= totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(true)}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right 1 col: Question Number Navigation Grid (Desktop & Mobile Drawer) */}
        <div
          className={`lg:block bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 ${
            showQuestionGrid
              ? "fixed inset-x-4 top-20 z-40 max-h-[80vh] overflow-y-auto block shadow-xl bg-white border-slate-300"
              : "hidden"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Daftar Nomor Soal</h3>
              <p className="text-xs text-slate-500 font-medium">
                {answeredCount} dari {totalQuestions} dijawab ({progressPercent}%)
              </p>
            </div>
            {showQuestionGrid && (
              <button
                type="button"
                onClick={() => setShowQuestionGrid(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid of Numbers */}
          <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const ans = responses[q.id];
              const isAns = ans !== undefined && ans !== null && ans !== "" && (Array.isArray(ans) ? ans.length > 0 : true);
              const isFlg = Boolean(flags[q.id]);
              const isCurrent = currentIndex === idx;

              let btnClass = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
              if (isCurrent) {
                btnClass = "ring-2 ring-blue-600 ring-offset-1 bg-blue-600 text-white font-black shadow-xs";
              } else if (isFlg) {
                btnClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
              } else if (isAns) {
                btnClass = "bg-blue-50 text-blue-700 border-blue-200 font-bold";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowQuestionGrid(false);
                  }}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center relative cursor-pointer ${btnClass}`}
                >
                  <span>{idx + 1}</span>
                  {isFlg && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-600 shadow-xs" />
              <span>Soal Sedang Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-50 border border-blue-200" />
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
              <span>Ragu-ragu ({Object.values(flags).filter(Boolean).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200" />
              <span>Belum Dijawab ({totalQuestions - answeredCount})</span>
            </div>
          </div>

          {/* Direct Submit Action */}
          <div className="pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setConfirmSubmitModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              Kumpulkan Ujian Sekarang
            </button>
          </div>

        </div>

      </div>

      {/* MODAL: ANTI-CHEAT TAB BLUR ALERT */}
      {blurModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                blurModal.type === "auto_submit"
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : blurModal.type === "warning_2"
                  ? "bg-amber-50 text-amber-600 border border-amber-200 animate-bounce"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {blurModal.type === "auto_submit"
                  ? "Batas Keluar Tab Habis (3/3)"
                  : blurModal.type === "warning_2"
                  ? "Peringatan Terakhir (2/3)"
                  : "Peringatan Keluar Tab (1/3)"}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-3">
                {blurModal.type === "auto_submit"
                  ? "Ujian Di-Submit Otomatis!"
                  : "Pelanggaran Pengawasan CBT!"}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {blurModal.message}
              </p>
            </div>

            {blurModal.type !== "auto_submit" && (
              <button
                type="button"
                onClick={() => setBlurModal({ show: false, type: "warning_1", message: "" })}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Saya Mengerti & Kembali ke Ujian
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM SUBMISSION */}
      {confirmSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Kumpulkan Lembar Ujian?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pastikan Anda telah memeriksa semua nomor soal sebelum mengakhiri ujian ini.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div className="text-left bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Sudah Dijawab</span>
                <p className="text-lg font-black text-emerald-600 mt-0.5">{answeredCount} Soal</p>
              </div>
              <div className="text-left bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Belum Dijawab</span>
                <p className="text-lg font-black text-rose-600 mt-0.5">{totalQuestions - answeredCount} Soal</p>
              </div>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Masih terdapat {totalQuestions - answeredCount} soal yang belum Anda jawab. Jawaban kosong tidak mendapatkan pengurangan skor (0).</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Periksa Lagi
              </button>

              <button
                type="button"
                onClick={() => handleFinalSubmit(false, "user_submitted")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Menyimpan...</span>
                ) : (
                  <>
                    <span>Ya, Kumpulkan</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZOOMED IMAGE MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomedImage} alt="Zoomed" className="w-full h-auto object-contain rounded-2xl border border-slate-200 shadow-xl bg-white" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
