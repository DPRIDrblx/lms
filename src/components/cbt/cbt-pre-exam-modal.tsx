"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  ShieldAlert, 
  Clock, 
  HelpCircle, 
  Key, 
  Camera, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  Info
} from "lucide-react";
import { CbtWebcamMonitor } from "./cbt-webcam-monitor";
import { CbtExamConfig, getCleanDescription } from "@/lib/cbt-config";

interface CbtPreExamModalProps {
  quiz: any;
  config: CbtExamConfig;
  isOpen: boolean;
  onClose: () => void;
  questionCount?: number;
}

export function CbtPreExamModal({
  quiz,
  config,
  isOpen,
  onClose,
  questionCount = 0,
}: CbtPreExamModalProps) {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);

  if (!isOpen || !quiz) return null;

  const durationMinutes = quiz.time_limit || quiz.time_limit_minutes || 60;
  const cleanDescription = getCleanDescription(quiz.description);

  const handleStartExam = () => {
    // Validate token if enabled
    if (config.token_enabled && config.token_code) {
      const normalizedInput = tokenInput.trim().toUpperCase();
      const normalizedTarget = config.token_code.trim().toUpperCase();
      if (normalizedInput !== normalizedTarget) {
        setTokenError("Token ujian tidak sesuai! Silakan minta token resmi ke guru/pengawas.");
        return;
      }
    }

    // Validate webcam if required
    if (config.require_webcam && !isWebcamActive) {
      alert("Ujian ini mewajibkan kamera aktif untuk proctoring. Mohon izinkan dan nyalakan kamera terlebih dahulu.");
      return;
    }

    // Validate agreement
    if (!hasAgreed) {
      alert("Harap centang kotak pernyataan persetujuan tata tertib ujian sebelum memulai.");
      return;
    }

    // Navigate to CBT MMIS v2 exam room
    router.push(`/student/cbt/exam/${quiz.id}`);
  };

  const isFormValid =
    hasAgreed &&
    (!config.token_enabled || tokenInput.trim().length > 0) &&
    (!config.require_webcam || isWebcamActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0F172A] text-slate-100 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 p-6 sm:p-7 text-white relative border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
              CBT MMIS v2.0
            </span>
            <span className="text-xs text-blue-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              Konfirmasi & Verifikasi Peserta
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">{quiz.title}</h2>
          <p className="text-xs text-blue-200/90 mt-1">
            Mata Pelajaran: <span className="font-bold text-white">{quiz.courses?.title || "Umum"}</span>
          </p>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/15">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Waktu</span>
              </div>
              <p className="text-sm font-black text-white">{durationMinutes} Menit</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-300" />
                <span>Jumlah Soal</span>
              </div>
              <p className="text-sm font-black text-white">{questionCount || quiz.questions?.length || "—"} Butir</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs mb-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Poin Benar</span>
              </div>
              <p className="text-sm font-black text-emerald-300">+{config.points_correct}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-rose-300 text-xs mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Poin Salah</span>
              </div>
              <p className="text-sm font-black text-rose-300">-{config.penalty_wrong}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[62vh] overflow-y-auto">
          
          {/* Anti-Cheat Alert Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5 font-black" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                Sistem Anti-Curang Aktif (Maksimal 3x Keluar Tab)
              </h4>
              <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                Ujian dipantau otomatis. Anda <strong>dilarang berpindah tab browser</strong> atau membuka aplikasi lain. 
                Jika Anda keluar tab sebanyak <strong className="text-amber-100 underline underline-offset-2">3 kali</strong>, ujian akan <strong>OTOMATIS DIKUMPULKAN</strong> oleh sistem.
              </p>
            </div>
          </div>

          {/* Description of Exam */}
          {cleanDescription && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Deskripsi & Petunjuk Umum
              </h4>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                {cleanDescription}
              </div>
            </div>
          )}

          {/* Exam Rules & Regulations */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Peraturan & Tata Tertib Ujian
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
              {config.exam_rules || "1. Kerjakan dengan jujur, tenang, dan mandiri.\n2. Dilarang membuka catatan, tab lain, atau aplikasi bantuan.\n3. Periksa kembali jawaban sebelum mengumpulkan ujian."}
            </div>
          </div>

          {/* Webcam Proctoring Check */}
          {config.require_webcam && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                Pemeriksaan Kamera Pengawas (Wajib)
              </h4>
              <CbtWebcamMonitor
                isRequired={true}
                onStatusChange={(status) => setIsWebcamActive(status)}
              />
            </div>
          )}

          {/* Token Access Input */}
          {config.token_enabled && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Token Masuk Ujian <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setTokenError("");
                  }}
                  placeholder="Masukkan token dari guru / pengawas..."
                  className={`w-full h-11 px-4 uppercase font-mono tracking-widest rounded-2xl bg-slate-900 border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    tokenError ? "border-rose-500 bg-rose-950/20" : "border-slate-800"
                  }`}
                />
              </div>
              {tokenError && (
                <p className="text-xs text-rose-400 font-semibold">{tokenError}</p>
              )}
            </div>
          )}

          {/* Statement of Honesty Checkbox */}
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-700 bg-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-200 leading-relaxed font-medium select-none">
                {config.statement_text || "Saya menyatakan bersedia mengerjakan ujian ini secara jujur, mandiri tanpa bantuan orang lain atau AI, tidak membuka tab/aplikasi lain, dan mematuhi seluruh tata tertib CBT MMIS v2."}
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${
              isFormValid
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-blue-600/30 active:scale-95 cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            <span>Mulai Kerjakan Ujian Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
