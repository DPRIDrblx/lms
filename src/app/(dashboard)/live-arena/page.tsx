"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, ArrowRight, Zap, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveArenaEntryPage() {
  const [pin, setPin] = useState("");
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      setIsJoining(true);
      setTimeout(() => {
        router.push(`/live-arena/${pin}`);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden font-sans">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 opacity-80" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-500/20 rounded-full blur-[120px] mix-blend-screen"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-pink-500/20 rounded-full blur-[100px] mix-blend-screen"
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 md:p-12 border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.3)] text-center bg-white/10 backdrop-blur-2xl rounded-[3rem]">
          
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/50 border border-white/20 relative"
          >
             <div className="absolute inset-0 bg-white/20 rounded-3xl blur animate-pulse" />
             <Gamepad2 className="w-12 h-12 text-white relative z-10" />
          </motion.div>

          <h1 className="text-4xl font-black tracking-tight text-white mb-3 drop-shadow-md">LIVE ARENA</h1>
          <p className="text-indigo-200 font-medium mb-10">Enter the 6-digit Game PIN from your teacher.</p>
          
          <form onSubmit={handleJoin} className="space-y-6 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="000000"
                maxLength={6}
                value={pin}
                disabled={isJoining}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full h-24 text-center text-5xl font-black tracking-[0.3em] bg-slate-900/50 border-2 border-indigo-500/30 rounded-3xl text-white placeholder:text-white/20 focus:border-indigo-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-indigo-500/30 outline-none transition-all shadow-inner"
              />
              <AnimatePresence>
                {pin.length === 6 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  >
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button 
              type="submit"
              disabled={pin.length !== 6 || isJoining}
              size="lg" 
              className={`w-full h-20 text-xl rounded-[2rem] font-black border-b-4 transition-all overflow-hidden relative group ${
                pin.length === 6 
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 border-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:border-b-0 active:translate-y-1' 
                : 'bg-slate-800 border-slate-900 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isJoining ? (
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Zap className="w-8 h-8 fill-current" />
                 </motion.div>
              ) : (
                <>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    ENTER ARENA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  {pin.length === 6 && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-[2rem]" />
                  )}
                </>
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
