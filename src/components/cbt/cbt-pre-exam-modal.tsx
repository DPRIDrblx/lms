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
  ArrowRight
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
        setTokenError("Token ujian salah! Silakan tanyakan kepada pengawas.");
        return;
      }
    }

    // Validate webcam if required
    if (config.require_webcam && !isWebcamActive) {
      alert("Ujian ini mewajibkan kamera aktif. Harap izinkan dan nyalakan kamera terlebih dahulu.");
      return;
    }

    // Validate agreement
    if (!hasAgreed) {
      alert("Harap centang kotak pernyataan persetujuan sebelum memulai ujian.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-black uppercase tracking-wider">
              CBT MMIS v2
            </span>
            <span className="text-xs text-blue-200 font-semibold">Konfirmasi Masuk Ujian</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight leading-snug">{quiz.title}</h2>
          <p className="text-xs text-blue-200 mt-1">
            Mata Pelajaran: <span className="font-bold text-white">{quiz.courses?.title || "Umum"}</span>
          </p>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/15">
            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu</span>
              </div>
              <p className="text-sm font-bold text-white">{durationMinutes} Menit</p>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-0.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Jumlah Soal</span>
              </div>
              <p className="text-sm font-bold text-white">{questionCount || quiz.questions?.length || "—"} Soal</p>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs mb-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Skor Benar</span>
              </div>
              <p className="text-sm font-bold text-emerald-300">+{config.points_correct}</p>
            </div>

            <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-rose-300 text-xs mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Skor Salah</span>
              </div>
              <p className="text-sm font-bold text-rose-300">-{config.penalty_wrong}</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Anti-Cheat Warning Highlight */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Sistem Pengawasan CBT MMIS v2 Aktif</h4>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                Ujian ini menerapkan batas maksimal <strong>3 kali keluar tab</strong> atau membuka aplikasi lain. 
                Jika mencapai 3 kali keluar tab, sistem akan <strong>langsung mengumpulkan lembar jawaban otomatis</strong>.
              </p>
            </div>
          </div>

          {/* Deskripsi Ujian */}
          {cleanDescription && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Deskripsi Ujian
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {cleanDescription}
              </div>
            </div>
          )}

          {/* Tata Tertib / Peraturan Ujian */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Peraturan & Tata Tertib Ujian
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {config.exam_rules || "1. Kerjakan dengan jujur dan mandiri.\n2. Dilarang membuka tab lain.\n3. Periksa kembali jawaban sebelum selesai."}
            </div>
          </div>

          {/* Pemeriksaan Webcam */}
          {config.require_webcam && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Pemeriksaan Kamera (Wajib)
              </h4>
              <CbtWebcamMonitor
                isRequired={true}
                onStatusChange={(status) => setIsWebcamActive(status)}
              />
            </div>
          )}

          {/* Token Masuk Ujian */}
          {config.token_enabled && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
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
                  placeholder="Masukkan token dari guru/pengawas..."
                  className={`w-full h-11 px-4 uppercase font-mono tracking-wider rounded-xl bg-slate-50 border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all ${
                    tokenError ? "border-rose-400 bg-rose-50/50" : "border-slate-300"
                  }`}
                />
              </div>
              {tokenError && (
                <p className="text-xs text-rose-600 font-semibold">{tokenError}</p>
              )}
            </div>
          )}

          {/* Kotak Pernyataan / Checkbox Persetujuan */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs text-slate-800 leading-relaxed font-medium select-none">
                {config.statement_text || "Saya menyatakan bersedia mengerjakan ujian ini secara jujur, mandiri tanpa bantuan pihak lain, tidak membuka tab/aplikasi lain, dan mematuhi tata tertib CBT MMIS v2."}
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={!isFormValid}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
              isFormValid
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg active:scale-95 cursor-pointer"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Mulai Kerjakan Ujian</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

