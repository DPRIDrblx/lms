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

      const qList = questionsRes.data || [];
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
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-black tracking-widest uppercase text-blue-400">
          Menyiapkan Lembar Ujian CBT MMIS v2...
        </p>
      </div>
    );
  }

  // Submission Result View
  if (isFinished && submissionResult) {
    const showScore = config?.show_score ?? true;
    const showExplanation = config?.show_explanation ?? false;

    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-xl w-full bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95">
          
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-wider">
              CBT MMIS v2.0
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">Ujian Berhasil Dikumpulkan!</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Jawaban Anda untuk paket ujian <strong>{quiz?.title}</strong> telah tersimpan aman dan terenkripsi di server.
            </p>
          </div>

          {/* Conditional Score Display based on Teacher's setting */}
          {showScore ? (
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Nilai Akhir Anda</p>
                <p className="text-5xl font-black text-emerald-400 mt-1">
                  {submissionResult.score ?? 0}
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Benar</span>
                  <span className="text-base font-black text-emerald-400">{submissionResult.correctCount ?? 0}</span>
                  <span className="text-[10px] text-emerald-400/80 block">(+{submissionResult.positivePoints ?? 0})</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Salah</span>
                  <span className="text-base font-black text-rose-400">{submissionResult.wrongCount ?? 0}</span>
                  <span className="text-[10px] text-rose-400/80 block">(-{submissionResult.negativePoints ?? 0})</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Kosong</span>
                  <span className="text-base font-black text-slate-300">{submissionResult.unansweredCount ?? 0}</span>
                  <span className="text-[10px] text-slate-400 block">(0 poin)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-2">
              <Award className="w-8 h-8 text-blue-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Hasil Ujian Dirahasiakan</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
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
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Lihat Pembahasan Soal Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/student/cbt")}
              className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-all"
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
  const answeredCount = Object.keys(responses).filter((k) => responses[k] !== undefined && responses[k] !== "").length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const qCorrectPoints = Number(currentQ?.points_correct ?? currentQ?.metadata?.points_correct ?? currentQ?.points ?? config?.points_correct ?? 4);
  const qPenaltyWrong = Number(currentQ?.penalty_wrong ?? currentQ?.metadata?.penalty_wrong ?? config?.penalty_wrong ?? 1);
  const qAudioUrl = currentQ?.audio_url || currentQ?.metadata?.audio_url;
  const qImageUrl = currentQ?.image_url || currentQ?.metadata?.image_url;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans select-none">
      
      {/* Floating Webcam Proctor Widget */}
      {config?.require_webcam && (
        <CbtWebcamMonitor isRequired={true} floating={true} />
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Identity & Exam info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md shadow-blue-500/20">
              v2
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[180px] sm:max-w-md">
                {quiz?.title}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                {profile?.full_name} • Kelas {profile?.class_name || "Siswa"}
              </p>
            </div>
          </div>

          {/* Center Timer Display */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl font-mono text-sm font-black border transition-all ${
                timeLeft < 300
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-900/30 animate-pulse"
                  : timeLeft < 600
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/60"
                  : "bg-slate-900 text-slate-200 border-slate-800 shadow-inner"
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
                  ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                  : blurCount === 1
                  ? "bg-amber-950/80 text-amber-300 border-amber-700/60"
                  : "bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Keluar Tab: {blurCount}/3</span>
            </div>

            {/* Font Size Adjuster */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFontSize("normal")}
                className={`px-2 py-0.5 rounded-lg font-bold transition-colors ${fontSize === "normal" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                title="Ukuran Font Normal"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-2 py-0.5 rounded-lg font-bold text-sm transition-colors ${fontSize === "large" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                title="Ukuran Font Besar"
              >
                A+
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden lg:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Fokus)"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Mobile Question Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{currentIndex + 1}/{totalQuestions}</span>
            </button>
          </div>

        </div>

        {/* Global Progress Line Bar */}
        <div className="w-full bg-slate-800 h-1 mt-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 cols: Question Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Question Card */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
            
            {/* Question Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-600/30">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  dari {totalQuestions} Soal
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  {currentQ?.question_type === "mcq" ? "Pilihan Ganda" : currentQ?.question_type === "complex_mcq" ? "Pilihan Kompleks" : "Essay"}
                </span>
              </div>

              {/* Scoring Info, Clear Option & Flag Toggle */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-800/60">
                  +{qCorrectPoints} Benar
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-950/80 text-rose-400 text-xs font-bold border border-rose-800/60">
                  -{qPenaltyWrong} Salah
                </span>

                {/* Clear Selected Option button (Crucial for negative scoring) */}
                {currentAnswer !== undefined && currentAnswer !== null && (
                  <button
                    type="button"
                    onClick={() => currentQ && handleClearAnswer(currentQ.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors border border-slate-700"
                    title="Kosongkan jawaban untuk menghindari pengurangan poin jika ragu"
                  >
                    <Trash2 className="w-3 h-3 text-slate-400" />
                    <span className="hidden sm:inline">Hapus Jawaban</span>
                  </button>
                )}

                {/* Flag / Ragu-ragu Button */}
                <button
                  type="button"
                  onClick={() => currentQ && handleToggleFlag(currentQ.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    isFlagged
                      ? "bg-amber-950/80 text-amber-300 border-amber-600 shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border-slate-700"
                  }`}
                  title="Tandai ragu-ragu (Shortcut tombol R)"
                >
                  <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
                  <span>{isFlagged ? "Ragu-ragu" : "Tandai"}</span>
                </button>
              </div>
            </div>

            {/* Question Audio / Music Player if present */}
            {qAudioUrl && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <p className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Materi Audio / Listening Soal:
                </p>
                <CbtAudioPlayer src={qAudioUrl} title={`Audio Soal No. ${currentIndex + 1}`} />
              </div>
            )}

            {/* Question Image if present */}
            {qImageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-w-lg bg-slate-950 group">
                <img
                  src={qImageUrl}
                  alt="Gambar Soal"
                  className="w-full h-auto object-contain max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setZoomedImage(qImageUrl)}
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(qImageUrl)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border border-slate-700"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-400" /> Perbesar Gambar
                </button>
              </div>
            )}

            {/* Question Text with KaTeX & LaTeX */}
            <div
              className={`text-slate-100 leading-relaxed font-normal ${
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
                          ? "border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/10"
                          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 bg-slate-950/40"
                      }`}
                    >
                      {/* Option Letter Pill */}
                      <span
                        className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white"
                        }`}
                      >
                        {letter}
                      </span>

                      {/* Option Text with LaTeX & KaTeX */}
                      <div className="flex-1 pt-1.5 text-slate-200 font-medium">
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
                <p className="text-xs text-blue-400 font-semibold italic flex items-center gap-1">
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
                          ? "border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10"
                          : "border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 bg-slate-950/40"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white"
                        }`}
                      >
                        {isSelected ? "✓" : letter}
                      </span>

                      <div className="flex-1 pt-1.5 text-slate-200 font-medium">
                        <MathRenderer htmlContent={opt.text} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Essay Question */}
            {currentQ?.question_type === "essay" && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tuliskan Jawaban Essay Anda Secara Lengkap:
                </label>
                <textarea
                  rows={7}
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Ketik jawaban essay Anda di sini..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                />
              </div>
            )}

            {/* Keyboard shortcut hint strip */}
            <div className="hidden sm:flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-medium">
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Shortcut: Tekan <strong>A - E</strong> untuk opsi jawaban • <strong>← / →</strong> navigasi soal • <strong>R</strong> ragu-ragu</span>
            </div>

          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                currentIndex === 0
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Center Quick Flag on Mobile */}
            <button
              type="button"
              onClick={() => currentQ && handleToggleFlag(currentQ.id)}
              className={`sm:hidden px-3 py-2 rounded-xl text-xs font-bold border ${
                isFlagged ? "bg-amber-950 text-amber-300 border-amber-600" : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>

            {/* Next or Finish Button */}
            {currentIndex >= totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(true)}
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan Ujian</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right 1 col: Question Number Navigation Grid (Desktop & Mobile Drawer) */}
        <div
          className={`lg:block bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 space-y-4 ${
            showQuestionGrid
              ? "fixed inset-x-4 top-20 z-40 max-h-[80vh] overflow-y-auto block shadow-2xl bg-slate-900 border-slate-700"
              : "hidden"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-black text-white">Daftar Nomor Soal</h3>
              <p className="text-xs text-slate-400 font-medium">
                {answeredCount} dari {totalQuestions} dijawab ({progressPercent}%)
              </p>
            </div>
            {showQuestionGrid && (
              <button
                type="button"
                onClick={() => setShowQuestionGrid(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700"
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

              let btnClass = "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800";
              if (isCurrent) {
                btnClass = "ring-2 ring-blue-500 bg-blue-600 text-white font-black shadow-md shadow-blue-500/30";
              } else if (isFlg) {
                btnClass = "bg-amber-950/90 text-amber-300 border-amber-600 font-bold";
              } else if (isAns) {
                btnClass = "bg-emerald-950/80 text-emerald-300 border-emerald-700/80 font-bold";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowQuestionGrid(false);
                  }}
                  className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center relative ${btnClass}`}
                >
                  <span>{idx + 1}</span>
                  {isFlg && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-600 shadow-xs" />
              <span>Soal Sedang Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-950 border border-emerald-700" />
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-950 border border-amber-600" />
              <span>Ragu-ragu ({Object.values(flags).filter(Boolean).length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-950 border border-slate-800" />
              <span>Belum Dijawab ({totalQuestions - answeredCount})</span>
            </div>
          </div>

          {/* Direct Submit Action */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmSubmitModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Kumpulkan Ujian Sekarang
            </button>
          </div>

        </div>

      </div>

      {/* MODAL: ANTI-CHEAT TAB BLUR ALERT */}
      {blurModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 text-center space-y-4 animate-in zoom-in-95">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                blurModal.type === "auto_submit"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : blurModal.type === "warning_2"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800/80">
                {blurModal.type === "auto_submit"
                  ? "Batas Keluar Tab Habis (3/3)"
                  : blurModal.type === "warning_2"
                  ? "Peringatan Terakhir (2/3)"
                  : "Peringatan Keluar Tab (1/3)"}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-3">
                {blurModal.type === "auto_submit"
                  ? "Ujian Di-Submit Otomatis!"
                  : "Pelanggaran Pengawasan CBT!"}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {blurModal.message}
              </p>
            </div>

            {blurModal.type !== "auto_submit" && (
              <button
                type="button"
                onClick={() => setBlurModal({ show: false, type: "warning_1", message: "" })}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Saya Mengerti & Kembali ke Ujian
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM SUBMISSION */}
      {confirmSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Kumpulkan Lembar Ujian?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pastikan Anda telah memeriksa semua nomor soal sebelum mengakhiri ujian ini.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div className="text-left bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sudah Dijawab</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">{answeredCount} Soal</p>
              </div>
              <div className="text-left bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Belum Dijawab</span>
                <p className="text-lg font-black text-rose-400 mt-0.5">{totalQuestions - answeredCount} Soal</p>
              </div>
            </div>

            {totalQuestions - answeredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 font-medium text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Masih terdapat {totalQuestions - answeredCount} soal yang belum Anda jawab. Jawaban kosong tidak mendapatkan pengurangan skor (0).</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Periksa Lagi
              </button>

              <button
                type="button"
                onClick={() => handleFinalSubmit(false, "user_submitted")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomedImage} alt="Zoomed" className="w-full h-auto object-contain rounded-2xl border border-slate-800" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
