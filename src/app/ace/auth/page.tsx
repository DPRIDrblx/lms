"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ChevronRight, X, Loader2 } from "lucide-react";

export default function ACEAuthTransition() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.push("/login");
      return;
    }
    if (profile.role !== "teacher" && profile.role !== "principal" && profile.role !== "tu") {
      router.push("/dashboard");
      return;
    }
  }, [profile, loading, router]);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setShowLoading(true);
    }, 500);
    setTimeout(() => {
      router.push("/ace");
    }, 2500);
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (loading || !profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <AnimatePresence mode="wait">
        {!showLoading ? (
          <motion.div 
            key="consent"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="w-full max-w-lg p-8 z-10 relative"
          >
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-900/20 text-center">
              
              {/* Header Logos */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
                  <span className="font-black text-slate-300">IGNITE</span>
                </div>
                <div className="w-8 flex items-center justify-center text-slate-500">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/50">
                  <span className="font-black text-white">ACE</span>
                </div>
              </div>

              <h1 className="text-2xl font-black mb-3">Otorisasi Ruang ACE</h1>
              <p className="text-slate-400 font-medium text-sm mb-8 px-4 leading-relaxed">
                Apakah Anda yakin ingin masuk ke portal Academic & Educator Center menggunakan profil ini?
              </p>

              {/* Profile Card */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-3xl p-6 flex items-center gap-5 mb-8">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-indigo-500 text-white font-black text-xl rounded-full flex items-center justify-center shadow-inner">
                    {profile.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left flex-1 min-w-0">
                  <h2 className="text-lg font-black text-white truncate">{profile.full_name}</h2>
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{profile.role}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Permissions List */}
              <div className="text-left mb-10">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Aplikasi Ruang ACE akan mengakses:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-sm text-slate-300 font-medium">Data Kepegawaian & Identitas Diri</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-sm text-slate-300 font-medium">Rekam Jejak Kinerja & Dokumen Penilaian</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                    <span className="text-sm text-slate-300 font-medium">Izin menangkap titik Koordinat Lokasi (GPS)</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex-[2] py-4 rounded-2xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 relative overflow-hidden"
                >
                  {isConfirming ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                    </motion.div>
                  ) : (
                    "Ya, Lanjutkan"
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center z-10"
          >
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-8 relative">
              <span className="font-black text-3xl text-white">ACE</span>
              <div className="absolute -inset-4 border-2 border-indigo-500/30 rounded-[2.5rem] animate-ping" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Memasuki Ruang ACE</h2>
            <p className="text-indigo-300 font-medium animate-pulse">Menyiapkan workspace Anda...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple internal icon for CheckCircle2
function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
