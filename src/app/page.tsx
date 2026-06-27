"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Zap, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-hidden flex flex-col relative">
      
      {/* Playful Floating Elements Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] w-24 h-24 bg-yellow-400 rounded-3xl opacity-20 -rotate-12"
        />
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[15%] w-32 h-32 bg-blue-400 rounded-full opacity-20"
        />
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="absolute top-[25%] right-[10%] w-20 h-20 bg-green-400 rounded-2xl opacity-20 rotate-45"
        />
        <motion.div 
          animate={{ y: [0, 25, 0] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute bottom-[15%] right-[15%] w-40 h-40 bg-pink-400 rounded-full opacity-20 blur-xl"
        />
      </div>

      {/* Navbar */}
      <header className="relative z-10 p-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg border-b-4 border-indigo-700">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-black text-slate-800 tracking-tight">IGNITE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full pb-20">
        
        {/* Floating Mascot/Hero Graphic */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          className="relative mb-12"
        >
          <div className="w-48 h-48 md:w-64 md:h-64 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center border-8 border-white shadow-2xl relative overflow-visible">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="relative w-[120%] h-[120%] -mt-8"
            >
              <Image 
                src="/images/mascot_v2.png" 
                alt="IGNITE Mascot" 
                fill 
                className="object-contain mix-blend-multiply"
              />
            </motion.div>
            
            {/* Badges */}
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
              className="absolute -right-4 top-4 bg-yellow-400 text-yellow-900 w-16 h-16 rounded-2xl flex items-center justify-center font-black border-4 border-white shadow-lg rotate-12"
            >
              <Zap className="w-8 h-8 fill-current" />
            </motion.div>
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, type: "spring" }}
              className="absolute -left-6 bottom-8 bg-green-400 text-green-900 w-16 h-16 rounded-2xl flex items-center justify-center font-black border-4 border-white shadow-lg -rotate-12"
            >
              <BookOpen className="w-8 h-8 fill-current" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl font-black text-slate-800 mb-6 leading-tight tracking-tight"
        >
          Belajar Bebas Ribet. <br className="hidden md:block" />
          <span className="text-indigo-500">Seru Kapan Saja!</span>
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12"
        >
          Platform belajar modern yang disesuaikan dengan caramu belajar. Selesaikan kuis, kumpulkan poin, dan raih prestasi layaknya bermain game!
        </motion.p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mx-auto"
        >
          <Link href="/login" className="w-full">
            <button className="w-full py-4 px-8 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-black rounded-2xl border-b-4 border-indigo-700 active:border-b-0 active:translate-y-1 transition-all text-lg shadow-xl shadow-indigo-500/20">
              MULAI BELAJAR
            </button>
          </Link>
          <Link href="/login" className="w-full">
            <button className="w-full py-4 px-8 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-black rounded-2xl border-2 border-slate-200 border-b-4 active:border-b-2 active:translate-y-0.5 transition-all text-lg shadow-sm">
              SAYA SUDAH PUNYA AKUN
            </button>
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
