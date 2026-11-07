"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useMemo } from "react";
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
  FileText,
  Lightbulb,
  Filter
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
  const [filterType, setFilterType] = useState<"all" | "correct" | "wrong" | "unanswered">("all");

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
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Memuat Pembahasan CBT MMIS v2...</p>
      </div>
    );
  }

  if (!quiz || !scoreRecord) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 text-center border border-slate-800 shadow-2xl space-y-4">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Data Pembahasan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400">Anda belum mengerjakan ujian ini atau sesi evaluasi tidak ditemukan.</p>
          <Link
            href="/student/cbt"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
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
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-8 text-center border border-slate-800 shadow-2xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Pembahasan Soal Dirahasiakan</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Guru atau pengawas tidak mengaktifkan fitur pembahasan soal untuk paket ujian ini.
          </p>
          <Link
            href="/student/cbt"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
          >
            Kembali ke Galeri CBT
          </Link>
        </div>
      </div>
    );
  }

  const responses = scoreRecord.metadata?.responses || {};
  const scoreDetails = scoreRecord.metadata?.scoreDetails || null;

  // Filter questions based on filterType
  const filteredQuestions = questions.filter((q, idx) => {
    if (filterType === "all") return true;

    const studentAns = responses[q.id];
    const isAnswered = studentAns !== undefined && studentAns !== null && studentAns !== "";
    if (filterType === "unanswered") return !isAnswered;

    // Check correctness
    let isCorrect = false;
    if (q.question_type === "mcq" && q.options) {
      const correctOpt = q.options.find((o: any) => o.is_correct || o.isCorrect);
      isCorrect = correctOpt && correctOpt.text === studentAns;
    } else if (q.question_type === "complex_mcq" && q.options) {
      const correctArr = q.options.filter((o: any) => o.is_correct || o.isCorrect).map((o: any) => o.text);
      const studentArr = Array.isArray(studentAns) ? studentAns : [];
      isCorrect = correctArr.length === studentArr.length && correctArr.every((t: string) => studentArr.includes(t));
    }

    if (filterType === "correct") return isCorrect;
    if (filterType === "wrong") return isAnswered && !isCorrect;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 pb-24 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/student/cbt"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Kembali ke Galeri CBT</span>
          </Link>

          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2.5 py-0.5 rounded-full">
              CBT MMIS v2.0
            </span>
            <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-xs mt-1">
              Pembahasan: {quiz.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Review Body */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Score Overview Card */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              {quiz.courses?.title || "Mata Pelajaran Umum"}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">{quiz.title}</h2>
            <p className="text-xs text-slate-400">
              Evaluasi Pengerjaan Ujian CBT MMIS v2 • Rombel Kelas {profile?.class_name || "Siswa"}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Skor Akhir</span>
              <span className="text-3xl font-black text-emerald-400 block">{scoreRecord.score ?? 0}</span>
            </div>
            <Award className="w-10 h-10 text-blue-500 shrink-0" />
          </div>
        </div>

        {/* Detailed Metrics Strip */}
        {scoreDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Jawaban Benar</span>
              <span className="text-xl font-black text-emerald-400">{scoreDetails.correctCount}</span>
              <span className="text-[10px] text-emerald-400/80 font-bold block mt-0.5">+{scoreDetails.positivePointsTotal} Poin</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Jawaban Salah</span>
              <span className="text-xl font-black text-rose-400">{scoreDetails.wrongCount}</span>
              <span className="text-[10px] text-rose-400/80 font-bold block mt-0.5">-{scoreDetails.negativePointsTotal} Poin</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tidak Dijawab</span>
              <span className="text-xl font-black text-slate-300">{scoreDetails.unansweredCount}</span>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">0 Poin</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Total Soal</span>
              <span className="text-xl font-black text-blue-400">{scoreDetails.totalQuestions}</span>
              <span className="text-[10px] text-blue-400/80 font-bold block mt-0.5">Butir</span>
            </div>
          </div>
        )}

        {/* Filter Tab Buttons */}
        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Semua Soal ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("correct")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === "correct" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Jawaban Benar ({scoreDetails?.correctCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("wrong")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === "wrong" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Jawaban Salah ({scoreDetails?.wrongCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("unanswered")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filterType === "unanswered" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Tidak Dijawab ({scoreDetails?.unansweredCount ?? 0})
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => {
            const studentAns = responses[q.id];
            const isAnswered = studentAns !== undefined && studentAns !== null && studentAns !== "";
            const qAudioUrl = q.audio_url || q.metadata?.audio_url;
            const qImageUrl = q.image_url || q.metadata?.image_url;
            const qExplanation = q.explanation || q.metadata?.explanation;

            let isCorrect = false;
            let correctOptionText: string | null = null;

            if (q.question_type === "mcq" && q.options) {
              const correctOpt = q.options.find((o: any) => o.is_correct || o.isCorrect);
              if (correctOpt) correctOptionText = correctOpt.text;
              isCorrect = correctOpt && correctOpt.text === studentAns;
            } else if (q.question_type === "complex_mcq" && q.options) {
              const correctArr = q.options.filter((o: any) => o.is_correct || o.isCorrect).map((o: any) => o.text);
              const studentArr = Array.isArray(studentAns) ? studentAns : [];
              isCorrect = correctArr.length === studentArr.length && correctArr.every((t: string) => studentArr.includes(t));
            }

            return (
              <div
                key={q.id}
                className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-7 space-y-5 shadow-xl"
              >
                {/* Question Item Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Soal {q.question_type === "mcq" ? "Pilihan Ganda" : q.question_type === "complex_mcq" ? "Pilihan Ganda Kompleks" : "Essay"}
                    </span>
                  </div>

                  {/* Result Status Chip */}
                  {isAnswered ? (
                    isCorrect ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-bold border border-emerald-700/80 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Benar (+{q.points_correct ?? config?.points_correct ?? 4})
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-rose-950/80 text-rose-400 text-xs font-bold border border-rose-700/80 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Salah (-{q.penalty_wrong ?? config?.penalty_wrong ?? 1})
                      </span>
                    )
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                      Kosong (0 Poin)
                    </span>
                  )}
                </div>

                {/* Audio player if exists */}
                {qAudioUrl && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <CbtAudioPlayer src={qAudioUrl} title={`Audio Soal No. ${idx + 1}`} />
                  </div>
                )}

                {/* Question Image if exists */}
                {qImageUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-w-md bg-slate-950 group">
                    <img
                      src={qImageUrl}
                      alt="Gambar Soal"
                      className="w-full h-auto object-contain max-h-72 cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setZoomedImage(qImageUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomedImage(qImageUrl)}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-white text-xs font-bold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Perbesar
                    </button>
                  </div>
                )}

                {/* Question text with KaTeX */}
                <div className="text-slate-100 text-sm sm:text-base leading-relaxed">
                  <MathRenderer htmlContent={q.question_text} />
                </div>

                {/* MCQ Options with status indication */}
                {q.question_type === "mcq" && q.options && (
                  <div className="space-y-2.5 pt-1">
                    {q.options.map((opt: any, optIdx: number) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isStudentChoice = studentAns === opt.text;
                      const isCorrectKey = opt.is_correct || opt.isCorrect;

                      let optClass = "border-slate-800 bg-slate-950/40 text-slate-300";
                      let badge = null;

                      if (isCorrectKey) {
                        optClass = "border-emerald-600/80 bg-emerald-950/30 text-emerald-200 font-semibold";
                        badge = <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-700 shrink-0">Kunci Jawaban</span>;
                      } else if (isStudentChoice && !isCorrectKey) {
                        optClass = "border-rose-600/80 bg-rose-950/30 text-rose-200 font-semibold";
                        badge = <span className="text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-md border border-rose-700 shrink-0">Pilihan Anda (Salah)</span>;
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-2xl border-2 flex items-start gap-3.5 ${optClass}`}
                        >
                          <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isCorrectKey 
                              ? "bg-emerald-600 text-white" 
                              : isStudentChoice 
                              ? "bg-rose-600 text-white" 
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {letter}
                          </span>
                          <div className="flex-1 pt-1 text-xs sm:text-sm">
                            <MathRenderer htmlContent={opt.text} />
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Teacher Explanation Card */}
                {qExplanation && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4 text-amber-300" />
                      <span>Pembahasan Guru:</span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-6">
                      <MathRenderer htmlContent={qExplanation} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

      {/* Lightbox Modal */}
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
