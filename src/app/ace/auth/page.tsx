"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ACEAuthTransition() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [step, setStep] = useState(0);

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

    // Simulate SSO Flow Steps
    const timer1 = setTimeout(() => setStep(1), 800);
    const timer2 = setTimeout(() => setStep(2), 2000);
    const timer3 = setTimeout(() => {
      router.push("/ace");
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [profile, loading, router]);

  const steps = [
    { id: 0, text: "Menghubungkan ke server Ruang ACE..." },
    { id: 1, text: "Mengambil profil Pendidik IGNITE..." },
    { id: 2, text: "Otentikasi berhasil! Mengalihkan..." }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md p-8 bg-slate-800/50 rounded-[2rem] border border-slate-700 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-indigo-500/20 blur-[50px] -z-10 rounded-full" />

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8 relative">
            <ShieldCheck className="w-10 h-10 text-white" />
            
            {step === 2 && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-800 flex items-center justify-center"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>

          <h1 className="text-2xl font-black mb-2 tracking-tight">Otentikasi SSO</h1>
          <p className="text-slate-400 font-medium mb-8 text-sm">Portal Academic & Educator Center</p>

          <div className="space-y-4 w-full">
            {steps.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: step >= i ? 1 : 0.3, 
                  x: 0,
                  scale: step === i ? 1.02 : 1
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${
                  step === i 
                    ? "bg-indigo-500/10 border-indigo-500/30" 
                    : step > i 
                      ? "bg-emerald-500/5 border-emerald-500/20" 
                      : "bg-slate-800 border-slate-700"
                }`}
              >
                {step > i ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : step === i ? (
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 shrink-0" />
                )}
                <span className={`text-sm font-bold text-left ${step >= i ? "text-slate-200" : "text-slate-500"}`}>
                  {s.text}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700 w-full flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>Powered by IGNITE ID</span>
            <span>Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
