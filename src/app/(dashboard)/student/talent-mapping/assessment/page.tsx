"use client";

import { ArrowLeft, LayoutGrid, Map, User, Star, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AssessmentList() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-md border-b border-slate-100 z-10 relative">
        <div className="flex items-center gap-2">
          <Link href="/student/talent-mapping" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="text-amber-500">✨</span> IGNITE Skill Test
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
          <User className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 relative z-10">
        
        <div className="mb-6 relative">
          <h2 className="text-2xl font-black text-slate-800 mb-2">Pilih Asesmen Kamu!</h2>
          <p className="text-sm text-slate-500">
            Kenali potensimu dan gaya belajarmu dengan tes yang menyenangkan.
          </p>
          <div className="absolute top-0 right-0 animate-bounce">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400 opacity-50" />
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Tes Minat Bakat */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100 relative overflow-hidden group"
          >
            <div className="absolute top-4 right-4 text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-1 rounded-lg">PRO</div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 mb-4 text-2xl">
              🧩
            </div>
            <div className="text-[10px] font-bold text-emerald-600 tracking-wider mb-1">POPULER</div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Tes Minat Bakat</h3>
            <p className="text-xs text-emerald-800 mb-6 w-3/4">
              Cari tahu apa yang paling kamu sukai dan kuasai.
            </p>

            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-2">
              <span>Progres: 0%</span>
              <span>30 Soal</span>
            </div>
            
            <Link href="/student/talent-mapping/assessment/minat-bakat" className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 group-active:scale-[0.98]">
              Mulai <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Tes MBTI */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center shadow-sm text-purple-600 mb-4 text-2xl">
              🧠
            </div>
            <div className="text-[10px] font-bold text-purple-600 tracking-wider mb-1">KEPRIBADIAN</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Tes MBTI</h3>
            <p className="text-xs text-slate-500 mb-6 w-3/4">
              Kenali karakter unikmu di dalam maupun di luar kelas.
            </p>

            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Progres: 60%</span>
              <span>18 Soal</span>
            </div>
            
            <Link href="/student/talent-mapping/assessment/mbti" className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2">
              Lanjut <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Tes Gaya Belajar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 rounded-3xl p-6 border border-purple-100 relative overflow-hidden opacity-75 grayscale-[50%]"
          >
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/50 backdrop-blur rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-500 mb-4 text-2xl">
              📚
            </div>
            <div className="text-[10px] font-bold text-purple-600 tracking-wider mb-1">AKADEMIK</div>
            <h3 className="text-xl font-bold text-purple-950 mb-2">Tes Gaya Belajar</h3>
            <p className="text-xs text-purple-800 mb-6 w-3/4">
              Visual, Auditori, atau Kinestetik? Temukan cara belajar terbaikmu.
            </p>

            <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-2">
              <span>Terkunci</span>
              <span>15 Soal</span>
            </div>
            
            <button disabled className="w-full bg-purple-200 text-purple-400 font-bold py-3 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2">
              Lihat Nanti
            </button>
          </motion.div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 z-20 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          <Link href="/student/talent-mapping" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-bold">Dash</span>
          </Link>
          <Link href="/student/talent-mapping/assessment" className="flex flex-col items-center gap-1 p-2 text-amber-500">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">Test</span>
          </Link>
          <Link href="/student/talent-mapping/roadmap" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600">
            <Map className="w-6 h-6" />
            <span className="text-[10px] font-bold">Map</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
