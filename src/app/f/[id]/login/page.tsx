"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function FormSSOLoginPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau kata sandi salah. Silakan coba lagi.");
      setLoading(false);
    } else {
      router.push(`/f/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-900 rounded-b-[4rem] md:rounded-b-[10rem] -z-10 shadow-2xl"></div>
      
      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href={`/f/${id}`} className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors font-semibold bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          Kembali ke Form
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto px-6"
      >
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100 backdrop-blur-xl bg-white/95">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 text-center tracking-tight">Otorisasi SSO</h1>
            <p className="text-gray-500 text-center text-sm mt-2">Masuk menggunakan akun sistem Anda untuk melanjutkan ke formulir</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold text-center border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-gray-900"
                  placeholder="name@school.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-gray-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 mt-8"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Lanjutkan SSO <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 pt-6">
            <p className="text-xs text-gray-400 font-medium">Single Sign-On (SSO) dilindungi oleh keamanan enkripsi standar.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
