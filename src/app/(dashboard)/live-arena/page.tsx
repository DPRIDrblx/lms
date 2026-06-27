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

  const handleJoinSpectator = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      setIsJoining(true);
      setTimeout(() => {
        router.push(`/live-arena/${pin}/spectator`);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Animated Gradient Mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 opacity-80" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[30%] -left-[10%] w-[70vw] h-[70vw] bg-indigo-300/30 rounded-full blur-[120px] mix-blend-multiply"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] bg-pink-300/30 rounded-full blur-[100px] mix-blend-multiply"
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8 md:p-12 border border-white shadow-[0_20px_60px_rgba(99,102,241,0.15)] text-center bg-white/70 backdrop-blur-xl rounded-[3rem]">
          
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/30 border border-white/50 relative"
          >
             <div className="absolute inset-0 bg-white/20 rounded-3xl blur animate-pulse" />
             <Gamepad2 className="w-12 h-12 text-white relative z-10" />
          </motion.div>

          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3 drop-shadow-sm">LIVE ARENA</h1>
          <p className="text-slate-500 font-medium mb-10">Enter the 6-digit Game PIN from your teacher.</p>
          
          <form onSubmit={handleJoin} className="space-y-6 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="000000"
                maxLength={6}
                value={pin}
                disabled={isJoining}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full h-24 text-center text-5xl font-black tracking-[0.3em] bg-white border-2 border-slate-200 rounded-3xl text-slate-900 placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all shadow-inner"
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
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 border-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 active:border-b-0 active:translate-y-1' 
                : 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
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

            <Button 
              type="button"
              onClick={handleJoinSpectator}
              disabled={pin.length !== 6 || isJoining}
              variant="secondary"
              size="lg" 
              className={`w-full h-16 text-lg rounded-[1.5rem] font-bold border-2 transition-all ${
                pin.length === 6 
                ? 'text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300' 
                : 'text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              Join as Spectator (Bet Gems)
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
