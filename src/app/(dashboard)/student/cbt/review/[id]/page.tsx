"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  BookOpen, 
  ShieldAlert, 
  ZoomIn, 
  X,
  Volume2,
  FileText
} from "lucide-react";
import { MathRenderer } from "@/components/ui/math-renderer";
import { CbtAudioPlayer } from "@/components/cbt/cbt-audio-player";
import { parseCbtConfig } from "@/lib/cbt-config";

export default function CbtReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [scoreRecord, setScoreRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchData = async () => {
      setLoading(true);

      const [quizRes, questionsRes, scoreRes] = await Promise.all([
        supabase.from("quizzes").select("*, courses(title)").eq("id", quizId).single(),
        supabase.from("questions").select("*").eq("quiz_id", quizId).order("order_index", { ascending: true }),
        supabase.from("student_scores").select("*").eq("student_id", profile.id).eq("target_id", quizId).single(),
      ]);

      if (quizRes.data) {
        const cbtConfig = parseCbtConfig(quizRes.data);
        setQuiz(quizRes.data);
        setConfig(cbtConfig);
      }

      if (questionsRes.data) {
        setQuestions(questionsRes.data);
      }

      if (scoreRes.data) {
        setScoreRecord(scoreRes.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [quizId, profile?.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memuat Pembahasan Ujian...</p>
      </div>
    );
  }

  if (!quiz || !scoreRecord) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Data Ujian Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">Anda belum mengerjakan ujian ini atau sesi tidak ditemukan.</p>
          <Link
            href="/student/cbt"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
          >
            Kembali ke Galeri CBT
          </Link>
        </div>
      </div>
    );
  }

  // Check if teacher allowed explanation
  if (config && !config.show_explanation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Pembahasan Dirahasiakan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Guru atau pengawas tidak mengaktifkan fitur pembahasan soal untuk paket ujian ini.
          </p>
          <Link
            href="/student/cbt"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs"
          >
            Kembali ke Galeri CBT
          </Link>
        </div>
      </div>
    );
  }

  const responses = scoreRecord.metadata?.responses || {};
  const scoreDetails = scoreRecord.metadata?.scoreDetails || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/student/cbt"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Galeri CBT</span>
          </Link>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              CBT MMIS v2
            </span>
            <h1 className="text-sm font-black text-slate-900 truncate max-w-xs mt-0.5">
              Pembahasan: {quiz.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Review Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Score Overview Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Evaluasi Anda</span>
            <h2 className="text-2xl font-black text-slate-900">{quiz.title}</h2>
            <p className="text-xs text-slate-500">
              Mata Pelajaran: <strong>{quiz.courses?.title || "Umum"}</strong> • Total {questions.length} Soal
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200 shrink-0">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">Skor Ujian</p>
              <p className="text-4xl font-black text-blue-600 mt-0.5">{scoreRecord.score ?? 0}</p>
            </div>
            <Award className="w-10 h-10 text-amber-500 shrink-0" />
          </div>
        </div>

        {/* Questions and Solutions List */}
        <div className="space-y-6">
          {questions.map((q, idx) => {
            const userAns = responses[q.id];
            const correctOpt = q.options?.find((o: any) => o.is_correct);
            const correctText = correctOpt?.text;
            const isCorrect = q.question_type === "mcq" && userAns === correctText;
            const isAnswered = userAns !== undefined && userAns !== null && userAns !== "";

            const qAudioUrl = q.audio_url || q.metadata?.audio_url;
            const qImageUrl = q.image_url || q.metadata?.image_url;
            const explanation = q.explanation || q.metadata?.explanation;

            return (
              <div
                key={q.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
              >
                {/* Question Header & Status */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500">Soal Nomor {idx + 1}</span>
                  </div>

                  <div>
                    {isAnswered ? (
                      isCorrect ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Jawaban Benar (+{config?.points_correct ?? 4})
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Jawaban Salah (-{config?.penalty_wrong ?? 1})
                        </span>
                      )
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        Tidak Dijawab (0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Audio if any */}
                {qAudioUrl && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                      Audio Soal:
                    </p>
                    <CbtAudioPlayer src={qAudioUrl} title={`Audio Soal No. ${idx + 1}`} />
                  </div>
                )}

                {/* Image if any */}
                {qImageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-w-sm bg-slate-50">
                    <img
                      src={qImageUrl}
                      alt="Gambar Soal"
                      className="w-full h-auto object-contain max-h-60 cursor-pointer"
                      onClick={() => setZoomedImage(qImageUrl)}
                    />
                  </div>
                )}

                {/* Question Text */}
                <div className="text-sm text-slate-800 font-medium leading-relaxed">
                  <MathRenderer htmlContent={q.question_text} />
                </div>

                {/* Options List */}
                {q.question_type === "mcq" && q.options && (
                  <div className="space-y-2 pt-1">
                    {q.options.map((opt: any, optIdx: number) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isUserChoice = userAns === opt.text;
                      const isOptionCorrect = Boolean(opt.is_correct);

                      let borderClass = "border-slate-200 bg-white";
                      if (isOptionCorrect) {
                        borderClass = "border-emerald-500 bg-emerald-50/70";
                      } else if (isUserChoice && !isOptionCorrect) {
                        borderClass = "border-rose-400 bg-rose-50/70";
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 text-xs ${borderClass}`}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                              isOptionCorrect
                                ? "bg-emerald-600 text-white"
                                : isUserChoice
                                ? "bg-rose-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {letter}
                          </span>

                          <div className="flex-1 pt-1 text-slate-800">
                            <MathRenderer htmlContent={opt.text} />
                          </div>

                          <div className="shrink-0 pt-1">
                            {isOptionCorrect && (
                              <span className="font-bold text-emerald-700 text-[11px]">Kunci Jawaban ✓</span>
                            )}
                            {isUserChoice && !isOptionCorrect && (
                              <span className="font-bold text-rose-600 text-[11px]">Pilihan Anda ✗</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pembahasan / Solution Box */}
                {explanation && (
                  <div className="p-5 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-800 text-xs font-black uppercase tracking-wider">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Pembahasan & Solusi:
                    </div>
                    <div className="text-xs text-slate-800 leading-relaxed">
                      <MathRenderer htmlContent={explanation} />
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </main>

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

