"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

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
      // so we can catch force_password_change, but don't wait forever.
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
      } else {
        // Redirection will be handled by the useEffect above once profile loads
      }
    } else {
      const { error: err } = await signUpWithEmail(email, password, fullName, role);
      if (err) setError(err);
      else setError("Check your email for a confirmation link.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-500 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/20" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-white/10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10 text-white max-w-md"
        >
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 border-b-4 border-white/20 shadow-xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 leading-tight tracking-tight">Welcome to IGNITE</h1>
          <p className="text-lg text-white/90 leading-relaxed font-medium">
            A modern learning ecosystem with gamified courses, smart attendance, and integrated finance management.
          </p>
        </motion.div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Playful background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border-b-4 border-indigo-700">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">IGNITE</span>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="text-sm font-bold text-slate-500 mb-8">
            {mode === "signin"
              ? "Welcome back! Enter your credentials below."
              : "Join the academy and start your learning journey."}
          </p>

          {/* Google SSO */}
          <button
            onClick={signInWithGoogle}
            className="w-full h-14 bg-white border-2 border-slate-200 border-b-4 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all active:translate-y-1 active:border-b-2 mb-6"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 py-1 bg-white border-2 border-slate-200 rounded-full font-bold text-slate-500 uppercase tracking-wider">or email</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-sm font-bold text-red-600 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <span className="text-red-500">!</span>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-slate-200 border-b-4 text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-500 focus:border-b-4 focus:-translate-y-0.5 transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">Role</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(["student", "teacher", "parent", "tu", "principal", "sobat_nia", "pengurus_nia", "operator_les"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r as any)}
                        className={`h-12 rounded-xl border-2 border-b-4 text-xs font-bold transition-all capitalize flex items-center justify-center ${
                          role === r
                            ? "bg-indigo-100 border-indigo-500 text-indigo-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        {r.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-slate-200 border-b-4 text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-500 focus:border-b-4 focus:-translate-y-0.5 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white border-2 border-slate-200 border-b-4 text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-500 focus:border-b-4 focus:-translate-y-0.5 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-1.5 rounded-lg"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 mt-4 bg-indigo-500 border-2 border-indigo-700 border-b-4 text-white font-black text-lg rounded-2xl hover:bg-indigo-400 active:border-b-2 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                mode === "signin" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center p-4 rounded-2xl bg-slate-100/50 border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-500 mb-2">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              className="text-indigo-500 font-black hover:text-indigo-400 transition-colors uppercase tracking-wide text-sm"
            >
              {mode === "signin" ? "Sign Up Now" : "Sign In Instead"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
