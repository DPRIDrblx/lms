"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { 
  Trophy, 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function NastLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Silakan masukkan email dan password");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      toast.success("Login berhasil! Membuka Dasbor NAST 2027...");
      router.push("/nast/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans relative overflow-x-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between py-4">
        <Link href="/nast" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/10 rounded-xl p-1.5 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <img src="/logo-nast.png" alt="Logo NAST 2027" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white block">NAST 2027</span>
            <span className="text-[10px] font-bold text-cyan-400">Kembali ke Beranda</span>
          </div>
        </Link>
      </div>

      {/* Login Box */}
      <div className="max-w-md mx-auto w-full my-8">
        <div className="p-8 sm:p-10 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-2xl border border-white/15 shadow-2xl relative overflow-hidden">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-3xl p-3 border border-white/20 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <img src="/logo-nast.png" alt="NAST 2027" className="w-full h-full object-contain" />
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight">
              Portal Login Peserta
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Masuk untuk melihat pengumuman kelulusan, kartu ujian, dan arena kompetisi NAST 2027.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                Email Peserta:
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-1.5">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>{loading ? "Memverifikasi Akun..." : "Masuk ke Dasbor Peserta"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

          {/* Register Prompt */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Belum terdaftar sebagai peserta NAST 2027?
            </p>
            <Link href="/nast/register">
              <span className="text-xs font-black text-orange-400 hover:text-orange-300 hover:underline mt-1 inline-block">
                Daftar Sekarang (Gratis & Otomatis Masuk Kelas) →
              </span>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto text-center text-xs text-slate-500 py-2">
        Sistem Terintegrasi MMIS School & NIA Tutoring Center.
      </div>

    </div>
  );
}
