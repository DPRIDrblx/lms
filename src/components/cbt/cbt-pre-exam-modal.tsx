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
      alert("Ujian ini mewajibkan kamera aktif untuk pengawasan (proctoring). Mohon izinkan dan nyalakan kamera terlebih dahulu.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-blue-600 p-6 sm:p-7 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              CBT MMIS v2.0
            </span>
            <span className="text-xs text-blue-100 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              Konfirmasi & Verifikasi Peserta
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">{quiz.title}</h2>
          <p className="text-xs text-blue-100 mt-1">
            Mata Pelajaran: <span className="font-bold text-white">{quiz.courses?.title || "Umum"}</span>
          </p>

          {/* Quick Specifications Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/20">
            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Waktu</span>
              </div>
              <p className="text-sm font-black text-white">{durationMinutes} Menit</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-200" />
                <span>Jumlah Soal</span>
              </div>
              <p className="text-sm font-black text-white">{questionCount || quiz.questions?.length || "—"} Butir</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-200 text-xs mb-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Poin Benar</span>
              </div>
              <p className="text-sm font-black text-emerald-200">+{config.points_correct}</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-rose-200 text-xs mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Poin Salah</span>
              </div>
              <p className="text-sm font-black text-rose-200">-{config.penalty_wrong}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[62vh] overflow-y-auto">
          
          {/* Anti-Cheat Alert Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldAlert className="w-5 h-5 font-black" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Sistem Anti-Curang Aktif (Maksimal 3x Keluar Tab)
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Ujian dipantau otomatis. Anda <strong>dilarang berpindah tab browser</strong> atau membuka aplikasi lain. 
                Jika Anda keluar tab sebanyak <strong className="text-amber-950 underline underline-offset-2">3 kali</strong>, ujian akan <strong>OTOMATIS DIKUMPULKAN</strong> oleh sistem.
              </p>
            </div>
          </div>

          {/* Description of Exam */}
          {cleanDescription && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Deskripsi & Petunjuk Umum
              </h4>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {cleanDescription}
              </div>
            </div>
          )}

          {/* Exam Rules & Regulations */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Peraturan & Tata Tertib Ujian
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {config.exam_rules || "1. Kerjakan dengan jujur, tenang, dan mandiri.\n2. Dilarang membuka catatan, tab lain, atau aplikasi bantuan.\n3. Periksa kembali jawaban sebelum mengumpulkan ujian."}
            </div>
          </div>

          {/* Webcam Proctoring Check */}
          {config.require_webcam && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-purple-600" />
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                Token Masuk Ujian <span className="text-rose-500">*</span>
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
                  className={`w-full h-11 px-4 uppercase font-mono tracking-widest rounded-xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all ${
                    tokenError ? "border-rose-500 bg-rose-50/50" : "border-slate-300"
                  }`}
                />
              </div>
              {tokenError && (
                <p className="text-xs text-rose-600 font-semibold">{tokenError}</p>
              )}
            </div>
          )}

          {/* Statement of Honesty Checkbox */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-relaxed font-medium select-none">
                {config.statement_text || "Saya menyatakan bersedia mengerjakan ujian ini secara jujur, mandiri tanpa bantuan orang lain atau AI, tidak membuka tab/aplikasi lain, dan mematuhi seluruh tata tertib CBT MMIS v2."}
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 ${
              isFormValid
                ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
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
