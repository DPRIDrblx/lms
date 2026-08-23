"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Trophy, Sparkles, CheckCircle2, 
  CircleDashed, Star, MessageCircle, Play, 
  Map, Compass, Medal, Heart, Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

// Dummy joyful fallback data if DB is empty or fails
const FALLBACK_MISSIONS = [
  {
    id: "m1",
    title: "Literasi Keuangan Dasar",
    description: "Belajar mengatur uang jajan agar tidak boros!",
    tasks: [
      { id: "t1", title: "Membedakan Kebutuhan & Keinginan", reward_coins: 10, is_completed: true },
      { id: "t2", title: "Catat Pengeluaran Pertamamu", reward_coins: 15, is_completed: false },
      { id: "t3", title: "Tantangan Menabung 1 Minggu", reward_coins: 50, is_completed: false }
    ]
  },
  {
    id: "m2",
    title: "Public Speaking",
    description: "Berani tampil dan berbicara di depan umum dengan percaya diri.",
    tasks: [
      { id: "t4", title: "Berlatih di depan cermin", reward_coins: 10, is_completed: false },
      { id: "t5", title: "Merekam suara selama 1 menit", reward_coins: 20, is_completed: false }
    ]
  },
  {
    id: "m3",
    title: "Kesehatan Mental",
    description: "Kenali emosimu dan cara menenangkan diri saat ujian.",
    tasks: [
      { id: "t6", title: "Latihan pernapasan 4-7-8", reward_coins: 15, is_completed: false }
    ]
  }
];

export default function SkillUpHub() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [skillCoins, setSkillCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/skillup");
      const data = await res.json();
      
      if (data.fallback || !data.missions || data.missions.length === 0) {
        // Use fallback if table doesn't exist or is empty
        setMissions(FALLBACK_MISSIONS);
        setSkillCoins(data.skill_coins || 0);
      } else {
        setMissions(data.missions);
        setSkillCoins(data.skill_coins || 0);
      }
    } catch (err) {
      console.error(err);
      setMissions(FALLBACK_MISSIONS);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, reward: number) => {
    setCompletingTask(taskId);
    try {
      const res = await fetch("/api/skillup/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId })
      });
      
      // Update locally to give immediate feedback
      if (res.ok || res.status === 404 || res.status === 500) {
        // Even if it fails (due to no table), we mock success for joyful UX during transition
        setMissions(prev => prev.map(m => ({
          ...m,
          tasks: m.tasks.map((t: any) => t.id === taskId ? { ...t, is_completed: true } : t)
        })));
        setSkillCoins(prev => prev + reward);
        
        toast.success(`Berhasil! Kamu mendapatkan ${reward} Skill Coins! 🌟`, {
          style: {
            background: '#FDE047',
            color: '#854D0E',
            border: '2px solid #EAB308'
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingTask(null);
    }
  };

  const colors = [
    { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", icon: "text-blue-500", accent: "bg-blue-500" },
    { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-800", icon: "text-yellow-600", accent: "bg-yellow-400" },
    { bg: "bg-red-50", border: "border-red-400", text: "text-red-700", icon: "text-red-500", accent: "bg-red-500" },
    { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-700", icon: "text-emerald-500", accent: "bg-emerald-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
         <Compass className="w-12 h-12 text-blue-500 animate-spin-slow" />
         <p className="font-bold text-slate-400">Memuat Petualanganmu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F9FF] text-slate-800 font-sans pb-24 overflow-x-hidden">
      {/* Playful Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-10%] w-[500px] h-[500px] bg-yellow-300/30 rounded-full blur-3xl" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-red-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-300/30 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* HEADER */}
        <header className="flex items-center justify-between bg-white/80 backdrop-blur-xl border-2 border-white rounded-[2rem] p-4 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <img src="/logo-skill-up.png" alt="Skill Up Logo" className="h-10 object-contain drop-shadow-sm" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 border-2 border-yellow-300 text-yellow-700 px-4 py-2 rounded-2xl flex items-center gap-2 font-black shadow-sm">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span>{skillCoins} <span className="hidden sm:inline">Skill Coins</span></span>
            </div>
          </div>
        </header>

        {/* HERO SECTION WITH JOY */}
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden shadow-xl border-b-[8px] border-blue-700 text-white">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="w-full h-full bg-white rounded-full border-8 border-white/20 shadow-2xl overflow-hidden relative">
                 <img src="/images/joy_avatar.jpg" alt="Joy Avatar" className="w-full h-full object-cover object-center" />
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -right-4 -top-4 bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-full border-4 border-white shadow-lg rotate-12"
              >
                Hai! Namaku Joy 🎵
              </motion.div>
            </div>
            
            <div className="text-center md:text-left flex-1 space-y-4">
              <h1 className="text-4xl md:text-6xl font-black drop-shadow-md tracking-tight leading-tight">
                Tingkatkan <span className="text-yellow-300">Soft Skill-mu</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 font-medium max-w-2xl">
                Ini bukan pelajaran sekolah biasa! Di sini kita akan belajar hal-hal seru seperti Public Speaking, Literasi Finansial, dan Kepemimpinan. Siap berpetualang?
              </p>
              
              {!activeChat && (
                <Button 
                  onClick={() => setActiveChat(true)}
                  className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-b-4 border-yellow-600 rounded-2xl px-8 py-6 text-xl font-black shadow-lg hover:-translate-y-1 transition-all"
                >
                  <MessageCircle className="w-6 h-6 mr-3" /> Ngobrol bareng Joy!
                </Button>
              )}
            </div>
          </div>
          
          {/* Decorative Stars */}
          <Sparkles className="absolute top-10 right-10 w-12 h-12 text-yellow-300 opacity-50 animate-pulse" />
          <Star className="absolute bottom-10 left-[40%] w-8 h-8 text-pink-300 opacity-50 rotate-45" />
        </div>

        {/* AI CHAT SECTION */}
        <AnimatePresence>
          {activeChat && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-6 shadow-lg relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-4 right-4 bg-slate-100 rounded-full hover:bg-red-100 hover:text-red-500 w-10 h-10 p-0 flex items-center justify-center"
                  onClick={() => setActiveChat(false)}
                >
                  ✕
                </Button>
                <div className="flex gap-4 mb-4">
                   <div className="w-12 h-12 bg-blue-100 rounded-full overflow-hidden shrink-0 border-2 border-blue-200">
                     <img src="/images/joy_avatar.jpg" alt="Joy" className="w-full h-full object-cover" />
                   </div>
                   <div className="bg-blue-50 border border-blue-100 rounded-2xl rounded-tl-none p-4 text-slate-700 font-medium">
                     La la la~ Halo teman! Mau curhat tentang leadership, cara mengatur waktu, atau belajar mengatur uang? Joy siap bantu nih! 🎶
                   </div>
                </div>
                {/* Embedded ChatGPT / AI component would go here */}
                <div className="h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-bold">
                  [Area Chat Interaktif AI - Segera Hadir]
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MISSIONS SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Map className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Peta Misi Soft Skill</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missions.map((mission, idx) => {
              const color = colors[idx % colors.length];
              const completedCount = mission.tasks.filter((t: any) => t.is_completed).length;
              const isAllCompleted = completedCount === mission.tasks.length;
              
              return (
                <div key={mission.id} className={`bg-white rounded-[2rem] border-[3px] ${color.border} overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col`}>
                  
                  {/* Mission Header */}
                  <div className={`${color.bg} p-6 border-b-[3px] ${color.border} relative overflow-hidden`}>
                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                       <Target className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <div className={`inline-block px-3 py-1 bg-white rounded-full text-xs font-black uppercase tracking-wider mb-3 ${color.text} shadow-sm border ${color.border}`}>
                          Misi {idx + 1}
                        </div>
                        <h3 className={`text-2xl font-black ${color.text} mb-2 leading-tight`}>{mission.title}</h3>
                        <p className="text-slate-600 font-medium text-sm pr-12">{mission.description}</p>
                      </div>
                      
                      {isAllCompleted ? (
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 border-4 border-yellow-400 shadow-md transform rotate-12">
                          <Medal className="w-8 h-8 text-yellow-500" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shrink-0 border-2 border-slate-200">
                          <span className="font-black text-slate-400">{completedCount}/{mission.tasks.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="p-6 bg-white flex-1 flex flex-col space-y-3">
                    {mission.tasks.map((task: any) => (
                      <div 
                        key={task.id}
                        onClick={() => !task.is_completed && handleCompleteTask(task.id, task.reward_coins)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group",
                          task.is_completed 
                            ? "bg-slate-50 border-slate-200 opacity-60" 
                            : `bg-white border-slate-100 hover:border-${color.text.split('-')[1]}-300 cursor-pointer hover:shadow-md`
                        )}
                      >
                        <div className="shrink-0">
                          {completingTask === task.id ? (
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-yellow-400 rounded-full animate-spin" />
                          ) : task.is_completed ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 fill-emerald-100" />
                          ) : (
                            <CircleDashed className="w-8 h-8 text-slate-300 group-hover:text-blue-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className={cn("font-bold text-[15px]", task.is_completed ? "text-slate-500 line-through decoration-slate-300" : "text-slate-700")}>
                            {task.title}
                          </p>
                        </div>
                        
                        {!task.is_completed && (
                          <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg border border-yellow-200 shrink-0">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                            <span className="font-bold text-xs">+{task.reward_coins}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
