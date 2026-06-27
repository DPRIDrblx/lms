"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, BookOpen, GraduationCap, Key, Globe } from "lucide-react";
import Link from "next/link";
import { PwaInstallButton } from "@/components/ui/pwa-install-button";

export default function LoginPage() {
  const { user, profile, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  
  // Prevent immediate redirect loop, wait for session to stabilize
  useEffect(() => {
    if (user) {
      if (profile?.force_password_change) {
        router.push("/auth/change-password");
        return;
      }
      const timer = setTimeout(() => {
        if (profile?.role === 'sobat_nia') {
          router.push('/sobat-nia');
        } else if (profile?.role === 'operator_les') {
          router.push('/operator-les');
        } else if (profile?.role === 'pengurus_nia') {
          router.push('/pengurus-nia');
        } else {
          router.push("/dashboard");
        }
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
      else setError("Check your email for a confirmation link.");
      setLoading(false);
    }
  };

  const isEmailValid = email.includes("@") && email.includes(".");
  const isPasswordValid = password.length >= 6;
  const isNameValid = fullName.trim().length > 2;

  return (
    <div className="min-h-screen bg-[#b6c4fc] flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[1200px] h-[800px] max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row relative"
      >
        
        {/* LEFT PANEL: Form Section */}
        <div className="flex-1 p-8 lg:p-16 flex flex-col relative z-10 bg-white overflow-y-auto">
          
          {/* Header Row */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="text-sm font-medium text-slate-500">
              {mode === "signin" ? "New here?" : "Already member?"}{" "}
              <button 
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
                className="text-[#4361ee] font-bold hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>

          {/* Title Area */}
          <div className="mb-10 relative">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </h1>
            {/* Decorative Swoosh */}
            {mode === "signup" && (
              <svg className="absolute -right-8 top-0 w-12 h-12 text-slate-300" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 90 C 20 40, 80 10, 90 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            <p className="text-slate-400 mt-2 text-sm">
              {mode === "signin" ? "Log in to your account to continue" : "Create your account to join IGNITE"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 max-w-md">
            
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="relative group">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#4361ee] transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                      required
                      className="w-full h-12 pl-10 pr-10 bg-transparent border-b-2 border-slate-100 focus:border-[#4361ee] outline-none text-slate-700 font-medium transition-colors"
                    />
                    {isNameValid && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2ec4b6]" />}
                  </div>

                  <div className="relative group">
                    <GraduationCap className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#4361ee] transition-colors" />
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full h-12 pl-10 pr-10 bg-transparent border-b-2 border-slate-100 focus:border-[#4361ee] outline-none text-slate-700 font-medium transition-colors appearance-none cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="parent">Parent</option>
                      <option value="principal">Principal</option>
                      <option value="sobat_nia">Sobat NIA</option>
                    </select>
                    {role && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2ec4b6]" />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#4361ee] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full h-12 pl-10 pr-10 bg-transparent border-b-2 border-slate-100 focus:border-[#4361ee] outline-none text-slate-700 font-medium transition-colors"
              />
              {isEmailValid && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2ec4b6]" />}
            </div>

            <div className="relative group">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#4361ee] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full h-12 pl-10 pr-12 bg-transparent border-b-2 border-slate-100 focus:border-[#4361ee] outline-none text-slate-700 font-medium transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              {isPasswordValid && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2ec4b6]" />}
            </div>

            {/* Password rules indicator (Only on signup) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-4"
                >
                  <p className={`text-xs flex items-center gap-2 ${isPasswordValid ? 'text-[#2ec4b6]' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> At least 6 characters
                  </p>
                  <p className={`text-xs flex items-center gap-2 ${password.match(/[0-9]/) ? 'text-[#2ec4b6]' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3" /> Includes at least one number
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center gap-6 pt-6">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-[#4361ee] hover:bg-[#3f37c9] text-white font-bold py-3 px-8 rounded-full flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-[#4361ee]/30"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                    <div className="bg-white/20 p-1 rounded-full">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </>
                )}
              </button>

              <span className="text-slate-300 text-sm">or</span>

              <div className="flex items-center gap-3">
                <button type="button" onClick={signInWithGoogle} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <PwaInstallButton />
            </div>
          </form>

          {/* Footer */}
          <div className="mt-auto pt-10 flex items-center gap-2 text-xs font-bold text-slate-400">
            <Globe className="w-4 h-4 text-[#4361ee]" /> ENG
          </div>

        </div>

        {/* RIGHT PANEL: Decorative Geometric Blue Section */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-[#4361ee]">
          {/* SVG Background Patterns */}
          <div className="absolute inset-0 z-0">
            {/* Base dark blue wave */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 right-0 w-[150%] h-[120%] -translate-y-[10%] translate-x-[10%] fill-[#3a0ca3]">
              <path d="M0,0 C30,40 80,10 100,50 L100,100 L0,100 Z" />
            </svg>
            {/* Light blue overlay wave */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-[120%] h-[80%] translate-y-[20%] -translate-x-[10%] fill-[#4895ef]">
              <path d="M0,100 C20,30 60,60 100,0 L100,100 L0,100 Z" />
            </svg>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-12">
            
            <div className="relative w-full max-w-sm">
              
              {/* Floating Stat Card (Top) */}
              <motion.div 
                animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl mb-8 w-48 relative left-0"
              >
                <div className="text-xs font-bold text-orange-400 mb-1">Courses Completed</div>
                <div className="text-2xl font-black text-slate-800">12</div>
                
                {/* Wavy chart mockup */}
                <div className="mt-6 flex items-end gap-1 h-10">
                  <svg viewBox="0 0 100 30" className="w-full h-full stroke-orange-400 fill-none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0,20 Q10,30 20,10 T40,20 T60,5 T80,15 T100,0" />
                  </svg>
                </div>
                
                {/* Center dot badge */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-4 border-white shadow-lg">
                  +3
                </div>
              </motion.div>

              {/* Floating Icon 1 */}
              <motion.div 
                animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute top-10 -right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl z-20"
              >
                <GraduationCap className="w-6 h-6 text-[#4361ee]" />
              </motion.div>

              {/* Floating Icon 2 */}
              <motion.div 
                animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                className="absolute top-40 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl z-20"
              >
                <BookOpen className="w-5 h-5 text-slate-800" />
              </motion.div>

              {/* Floating Info Card (Bottom) */}
              <motion.div 
                animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl w-full ml-12"
              >
                <div className="flex gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="w-8 h-1 bg-[#4361ee] rounded-full"></div>
                    <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                    <div className="w-3/4 h-1 bg-slate-200 rounded-full"></div>
                    <div className="w-full h-1 bg-slate-200 rounded-full"></div>
                    <div className="w-1/2 h-1 bg-slate-200 rounded-full"></div>
                  </div>
                  
                  <div className="w-32 flex flex-col items-center text-center pt-2">
                    <div className="text-orange-400 mb-3">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight mb-2">Learn Anywhere</h3>
                    <p className="text-[10px] text-slate-400 leading-tight">Access your courses at any time across devices.</p>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
