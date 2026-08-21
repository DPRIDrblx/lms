"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Target, Trophy, Map, LayoutGrid, ChevronRight, CheckCircle2, User, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TalentMappingDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [totalXp, setTotalXp] = useState(0);
  const [mbti, setMbti] = useState("Belum Tes");
  const [targetCampus, setTargetCampus] = useState({ name: "Belum Ditentukan", major: "Belum Ditentukan", passingGrade: 85 });
  
  // Dummy data for progress
  const progressData = {
    math: 75,
    indo: 40,
    dailyStreak: 3
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.id) return;
      try {
        const { data: tmData } = await supabase.from('tm_results').select('*').eq('student_id', profile.id).single();
        if (tmData) {
          if (tmData.mbti_result) setMbti(tmData.mbti_result);
          if (tmData.ptn_target && tmData.major_target) {
            setTargetCampus({ name: tmData.ptn_target, major: tmData.major_target, passingGrade: 85 });
          }
        }

        const { data: xpData } = await supabase.from('ai_drill_leaderboard').select('total_xp').eq('student_id', profile.id).single();
        if (xpData) setTotalXp(xpData.total_xp || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [profile]);

  // SNBT probability logic
  const calculateProbability = () => {
    const baseReadiness = (totalXp / 5000) * 100;
    const adjusted = baseReadiness - (targetCampus.passingGrade - 70); 
    return Math.max(5, Math.min(99, adjusted + 15));
  };
  
  const prob = Math.round(calculateProbability());

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-md border-b border-slate-100 z-10 relative">
        <div className="flex items-center gap-2">
          <Link href="/student/dashboard" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="text-amber-500">✨</span> IGNITE Dashboard
          </h1>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex justify-center border-b border-slate-200 bg-white/50 backdrop-blur-md relative z-10">
        <div className="flex gap-8">
          <Link href="/student/talent-mapping" className="px-4 py-4 border-b-2 border-amber-500 text-amber-600 font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/student/talent-mapping/assessment" className="px-4 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-bold flex items-center gap-2">
            <User className="w-5 h-5" /> Asesmen
          </Link>
          <Link href="/student/talent-mapping/roadmap" className="px-4 py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-bold flex items-center gap-2">
            <Map className="w-5 h-5" /> Roadmap
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
          {/* User Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-center gap-1.5 w-fit mx-auto md:mx-0 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                Level 5 Explorer
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 text-center md:text-left mb-1">
                Halo, {profile?.full_name?.split(' ')[0] || 'Siswa'}! ✨
              </h2>
              <p className="text-sm text-slate-500 text-center md:text-left mb-6">
                Siap untuk petualangan belajar hari ini? Ayo selesaikan misi harianmu!
              </p>

              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center rotate-3 shadow-sm border border-white">
                  <span className="text-4xl">🚀</span>
                </div>
              </div>
            </div>
            
            <button className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-3.5 rounded-2xl transition-colors shadow-sm active:scale-[0.98] mt-auto">
              Mulai Belajar
            </button>
          </motion.div>

          <div className="flex flex-col gap-6">
            {/* Progress Belajar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-1"
            >
              <h3 className="font-bold text-slate-800 mb-4">Progress Belajar</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                    <span>Matematika Dasar</span>
                    <span className="text-emerald-500">{progressData.math}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressData.math}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-1.5">
                    <span>Bahasa Indonesia</span>
                    <span className="text-amber-500">{progressData.indo}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressData.indo}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Target Kampus */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link href="/student/talent-mapping/roadmap" className="block bg-emerald-50 rounded-3xl p-5 border border-emerald-100 hover:shadow-md transition-all h-full">
                <h3 className="font-bold text-emerald-800 text-sm mb-3">Target Kampus</h3>
                <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                      UI
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{targetCampus.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{targetCampus.major}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Peluang Lolos (IGNITE University) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">PRO</div>
            <h3 className="font-bold text-slate-800 mb-2">Peluang lolos SNBT</h3>
            <p className="text-xs text-slate-500 text-center mb-6 max-w-[200px]">
              Berdasarkan hasil asesmen terakhir, ini adalah estimasi peluangmu masuk PTN impian.
            </p>

            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  className="text-slate-100 stroke-current"
                  strokeWidth="10"
                  cx="50" cy="50" r="40"
                  fill="transparent"
                />
                {/* Progress circle */}
                <motion.circle
                  className="text-blue-500 stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${(prob / 100) * 251.2} 251.2` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-blue-900">{prob}%</span>
              </div>
            </div>
            
          </motion.div>

        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 z-20 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          <Link href="/student/talent-mapping" className="flex flex-col items-center gap-1 p-2 text-amber-500">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-bold">Dash</span>
          </Link>
          <Link href="/student/talent-mapping/assessment" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600">
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
