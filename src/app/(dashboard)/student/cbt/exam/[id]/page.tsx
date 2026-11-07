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
  AlertCircle, 
  ShieldAlert,
  LayoutGrid, 
  X, 
  ZoomIn,
  Volume2,
  Award,
  ArrowRight,
  FileText,
  RotateCcw
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

  const handleToggleFlag = (qId: string) => {
    setFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold tracking-wider uppercase text-blue-300">Menyiapkan Ruang Ujian CBT MMIS v2...</p>
      </div>
    );
  }

  // Submission Result View
  if (isFinished && submissionResult) {
    const showScore = config?.show_score ?? true;
    const showExplanation = config?.show_explanation ?? false;

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6 animate-in fade-in zoom-in-95">
          
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">
              CBT MMIS v2
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Ujian Berhasil Dikumpulkan!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Lembar jawaban Anda untuk ujian <strong>{quiz?.title}</strong> telah tersimpan aman di server.
            </p>
          </div>

          {/* Conditional Score Display based on Teacher's setting */}
          {showScore ? (
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Skor Akhir Anda</p>
                <p className="text-5xl font-black text-blue-600 mt-1">
                  {submissionResult.score ?? 0}
                </p>
              </div>

              {submissionResult.positivePoints !== undefined && (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                    <span className="block font-bold">Benar</span>
                    <span className="text-sm font-black">{submissionResult.correctCount} (+{submissionResult.positivePoints})</span>
                  </div>
                  <div className="p-2 bg-rose-50 rounded-xl text-rose-800">
                    <span className="block font-bold">Salah</span>
                    <span className="text-sm font-black">{submissionResult.wrongCount} (-{submissionResult.negativePoints})</span>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                    <span className="block font-bold">Kosong</span>
                    <span className="text-sm font-black">{submissionResult.unansweredCount}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed font-medium">
              <ShieldAlert className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              Guru / Pengawas menyetel hasil dan nilai ujian ini <strong>dirahasiakan</strong>. 
              Nilai resmi akan diumumkan oleh guru bersangkutan.
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {showScore && showExplanation && (
              <button
                type="button"
                onClick={() => router.push(`/student/cbt/review/${quizId}`)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Lihat Pembahasan Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/student/cbt")}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all"
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

  const qCorrectPoints = Number(currentQ?.points_correct ?? currentQ?.metadata?.points_correct ?? currentQ?.points ?? config?.points_correct ?? 4);
  const qPenaltyWrong = Number(currentQ?.penalty_wrong ?? currentQ?.metadata?.penalty_wrong ?? config?.penalty_wrong ?? 1);
  const qAudioUrl = currentQ?.audio_url || currentQ?.metadata?.audio_url;
  const qImageUrl = currentQ?.image_url || currentQ?.metadata?.image_url;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      
      {/* Floating Webcam Proctor Widget */}
      {config?.require_webcam && (
        <CbtWebcamMonitor isRequired={true} floating={true} />
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Identity & Exam info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              v2
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 truncate max-w-[200px] sm:max-w-sm">
                {quiz?.title}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {profile?.full_name} • Kelas {profile?.class_name || "Siswa"}
              </p>
            </div>
          </div>

          {/* Center Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black shadow-xs transition-colors ${
                timeLeft < 300
                  ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                  : timeLeft < 600
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-slate-100 text-slate-800 border border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4 text-current" />
              <span>{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Right Controls: Tab Alert Pill & Font Size */}
          <div className="flex items-center gap-2">
            {/* Tab violation counter pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                blurCount === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : blurCount === 1
                  ? "bg-amber-50 text-amber-700 border-amber-300"
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
                className={`px-2 py-0.5 rounded-lg font-bold ${fontSize === "normal" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("large")}
                className={`px-2 py-0.5 rounded-lg font-bold text-sm ${fontSize === "large" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600"}`}
              >
                A+
              </button>
            </div>

            {/* Mobile Question Grid Toggle */}
            <button
              type="button"
              onClick={() => setShowQuestionGrid(!showQuestionGrid)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 cols: Question Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* Question Meta Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  dari {totalQuestions} Soal
                </span>
              </div>

              {/* Scoring Info & Flag Toggle */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                  +{qCorrectPoints} Benar
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                  -{qPenaltyWrong} Salah
                </span>

                <button
                  type="button"
                  onClick={() => currentQ && handleToggleFlag(currentQ.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    isFlagged
                      ? "bg-amber-100 text-amber-800 border-amber-300 shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{isFlagged ? "Ragu-ragu" : "Tandai"}</span>
                </button>
              </div>
            </div>

            {/* Question Audio / Music Player if present */}
            {qAudioUrl && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  Audio Soal:
                </p>
                <CbtAudioPlayer src={qAudioUrl} title={`Audio Soal No. ${currentIndex + 1}`} />
              </div>
            )}

            {/* Question Image if present */}
            {qImageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-md bg-slate-50 group">
                <img
                  src={qImageUrl}
                  alt="Gambar Soal"
                  className="w-full h-auto object-contain max-h-72 cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setZoomedImage(qImageUrl)}
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(qImageUrl)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Perbesar
                </button>
              </div>
            )}

            {/* Question Text with KaTeX & LaTeX */}
            <div
              className={`text-slate-800 leading-relaxed ${
                fontSize === "xlarge" ? "text-lg" : fontSize === "large" ? "text-base" : "text-sm"
              }`}
            >
              {currentQ ? (
                <MathRenderer htmlContent={currentQ.question_text} />
              ) : (
                <p className="text-slate-400">Soal tidak ditemukan.</p>
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
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/70 shadow-xs"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      {/* Option Letter Pill */}
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                        }`}
                      >
                        {letter}
                      </span>

                      {/* Option Text with LaTeX & KaTeX */}
                      <div className="flex-1 pt-1 text-slate-800 font-medium">
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
                <p className="text-xs text-slate-500 font-semibold italic">Pilih satu atau lebih jawaban yang benar:</p>
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
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 shadow-xs"
                          : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                        }`}
                      >
                        {isSelected ? "✓" : letter}
                      </span>

                      <div className="flex-1 pt-1 text-slate-800 font-medium">
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
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tuliskan Jawaban Essay Anda:
                </label>
                <textarea
                  rows={6}
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Ketik jawaban Anda di sini..."
                  className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-sans"
                />
              </div>
            )}

          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                currentIndex === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmSubmitModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kumpulkan Ujian</span>
            </button>

            <button
              type="button"
              disabled={currentIndex >= totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                currentIndex >= totalQuestions - 1
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              }`}
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right 1 col: Question Number Navigation Grid (Desktop & Mobile Drawer) */}
        <div
          className={`lg:block bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 ${
            showQuestionGrid
              ? "fixed inset-x-4 top-20 z-40 max-h-[80vh] overflow-y-auto block shadow-2xl"
              : "hidden"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">Daftar Nomor Soal</h3>
              <p className="text-xs text-slate-500 font-medium">
                {answeredCount} dari {totalQuestions} dijawab
              </p>
            </div>
            {showQuestionGrid && (
              <button
                type="button"
                onClick={() => setShowQuestionGrid(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grid of Numbers */}
          <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const ans = responses[q.id];
              const isAns = ans !== undefined && ans !== null && ans !== "" && (Array.isArray(ans) ? ans.length > 0 : true);
              const isFlg = Boolean(flags[q.id]);
              const isCurrent = currentIndex === idx;

              let btnClass = "bg-slate-100 text-slate-700 border-slate-200";
              if (isCurrent) {
                btnClass = "ring-2 ring-blue-600 bg-blue-600 text-white font-black shadow-xs";
              } else if (isFlg) {
                btnClass = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
              } else if (isAns) {
                btnClass = "bg-blue-50 text-blue-700 border-blue-300 font-bold";
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
                    <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-600" />
              <span>Soal Sedang Aktif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300" />
              <span>Sudah Dijawab</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
              <span>Ragu-ragu / Ditandai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200" />
              <span>Belum Dijawab</span>
            </div>
          </div>

          {/* Direct Submit Action */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmSubmitModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Kumpulkan Ujian Sekarang
            </button>
          </div>

        </div>

      </div>

      {/* MODAL: ANTI-CHEAT TAB BLUR ALERT */}
      {blurModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                blurModal.type === "auto_submit"
                  ? "bg-rose-100 text-rose-600"
                  : blurModal.type === "warning_2"
                  ? "bg-amber-100 text-amber-600 animate-bounce"
                  : "bg-amber-100 text-amber-500"
              }`}
            >
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {blurModal.type === "auto_submit"
                  ? "Batas Keluar Tab Habis (3/3)"
                  : blurModal.type === "warning_2"
                  ? "Peringatan Terakhir (2/3)"
                  : "Peringatan Keluar Tab (1/3)"}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {blurModal.type === "auto_submit"
                  ? "Ujian Di-Submit Otomatis!"
                  : "Pelanggaran Pengawasan!"}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {blurModal.message}
              </p>
            </div>

            {blurModal.type !== "auto_submit" && (
              <button
                type="button"
                onClick={() => setBlurModal({ show: false, type: "warning_1", message: "" })}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                Saya Mengerti & Kembali ke Ujian
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM SUBMISSION */}
      {confirmSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Kumpulkan Ujian?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pastikan Anda telah memeriksa semua jawaban sebelum menyelesaikan ujian.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div className="text-left">
                <span className="text-slate-500">Sudah Dijawab:</span>
                <p className="text-base font-black text-blue-600">{answeredCount} Soal</p>
              </div>
              <div className="text-left">
                <span className="text-slate-500">Belum Dijawab:</span>
                <p className="text-base font-black text-slate-600">{totalQuestions - answeredCount} Soal</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Periksa Lagi
              </button>

              <button
                type="button"
                onClick={() => handleFinalSubmit(false, "user_submitted")}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomedImage} alt="Zoomed" className="w-full h-auto object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

