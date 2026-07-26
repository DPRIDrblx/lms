"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, GraduationCap, Globe } from "lucide-react";
import Link from "next/link";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";

export default function AppLoginPage() {
  const { user, profile, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (user) {
      if (profile?.force_password_change) {
        router.push("/auth/change-password");
        return;
      }
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, profile ? 0 : 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, router]);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "principal">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "signin") {
      const { error: err } = await signInWithEmail(email, password);
      if (err) {
        setError(err);
        setLoading(false);
      }
    } else {
      const { error: err } = await signUpWithEmail(email, password, fullName, role);
      if (err) setError(err);
      else setError("Cek email kamu untuk link konfirmasi.");
      setLoading(false);
    }
  };

  const isEmailValid = email.includes("@") && email.includes(".");
  const isPasswordValid = password.length >= 6;
  const isNameValid = fullName.trim().length > 2;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* Background Decorative Half Circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-500/20 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-yellow-400/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/10 blur-[80px]" />
      </div>
      
      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1100px] h-[800px] max-h-[90vh] bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col lg:flex-row relative z-10 border border-slate-100"
      >
        
        {/* LEFT PANEL: Form Section */}
        <div className="flex-1 p-6 sm:p-8 lg:p-14 flex flex-col relative z-10 bg-white/95 backdrop-blur-3xl overflow-y-auto">
          
          <div className="flex items-center justify-between mb-8 lg:mb-12">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
            </Link>
            <div className="text-sm font-medium text-slate-400">
              {mode === "signin" ? "Belum punya akun?" : "Sudah terdaftar?"}{" "}
              <button 
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
                className="text-red-600 font-black hover:text-red-700 transition-colors"
              >
                {mode === "signin" ? "Daftar" : "Masuk"}
              </button>
            </div>
          </div>

          {/* Mobile-only Branding Header */}
          <div className="lg:hidden w-full bg-slate-900 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-lg border-b-4 border-slate-800">
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-[15px] border-red-500 opacity-80" />
            <div className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full border-[20px] border-yellow-400 opacity-90" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-600 mix-blend-screen blur-xl opacity-50" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-black text-white tracking-tighter mb-1 drop-shadow-md">NIA<span className="text-yellow-400">.</span></h2>
              <p className="text-slate-300 font-bold text-sm tracking-widest uppercase">Center</p>
            </div>
          </div>

          <div className="mb-8 lg:mb-10 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2">
              {mode === "signin" ? "Selamat Datang" : "Bergabung Sekarang"}
            </h1>
            <p className="text-slate-500 font-medium">
              {mode === "signin" ? "Masuk ke portal NIA Center kamu." : "Buat akun untuk mulai belajar di Center."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 flex-1 max-w-md">
            
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap"
                      required
                      className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-slate-700 font-bold transition-all"
                    />
                    {isNameValid && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                  </div>

                  <div className="relative group">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-slate-700 font-bold transition-all appearance-none cursor-pointer"
                    >
                      <option value="student">Siswa Center</option>
                      <option value="teacher">Tutor / Guru</option>
                      <option value="parent">Orang Tua</option>
                    </select>
                    {role && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Alamat Email"
                required
                className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-slate-700 font-bold transition-all"
              />
              {isEmailValid && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full h-14 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-slate-700 font-bold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-100"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-bold border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-4 flex items-center gap-4">
              <button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-70 shadow-[0_4px_0_rgb(185,28,28)] active:translate-y-1 active:shadow-[0_0px_0_rgb(185,28,28)]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Masuk" : "Daftar"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button type="button" onClick={signInWithGoogle} className="w-14 h-14 rounded-2xl border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <PwaInstallButton />
            </div>
          </form>
        </div>

        {/* RIGHT PANEL: Decorative Geometric Center Section */}
        <div className="hidden lg:flex lg:w-[45%] relative bg-slate-900 overflow-hidden items-center justify-center p-12">
          
          {/* Half circles and abstract shapes */}
          <div className="absolute inset-0 z-0 opacity-80">
            {/* Red Half Circle Top Right */}
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-[40px] border-red-500 opacity-80" />
            
            {/* Yellow Half Circle Bottom Left */}
            <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full border-[50px] border-yellow-400 opacity-90" />
            
            {/* Blue Solid Circle Center Right */}
            <div className="absolute top-1/2 right-0 translate-x-1/3 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-600 mix-blend-screen blur-xl" />
            
            {/* Red Solid Circle Center Left */}
            <div className="absolute top-1/3 left-0 -translate-x-1/2 w-72 h-72 rounded-full bg-red-600 mix-blend-screen blur-2xl" />
          </div>

          {/* Glassmorphism content overlay */}
          <div className="relative z-10 w-full max-w-sm">
            <motion.div 
              animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] shadow-2xl relative"
            >
              <h2 className="text-5xl font-black text-white tracking-tighter mb-1">NIA<span className="text-yellow-400">.</span></h2>
              <h3 className="text-lg font-bold text-slate-300 mb-8 tracking-widest uppercase">Center</h3>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center text-white font-black text-xl">7E</div>
                  <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-red-400 rounded-full" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 font-black text-xl">8E</div>
                  <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-[60%] h-full bg-yellow-400 rounded-full" />
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-xl">9E</div>
                  <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-[40%] h-full bg-blue-400 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
