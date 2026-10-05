"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Hand, MessageSquare, MonitorPlay, Sparkles, X, UserCircle2, MicOff, VideoOff } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { cn } from "@/lib/utils";

export default function OnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data } = await supabase
        .from("center_schedules")
        .select("*, tutor:tutor_id(full_name, avatar_url)")
        .eq("id", resolvedParams.id)
        .single();
      
      setSchedule(data);
      setLoading(false);
    };
    fetchSchedule();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <CenterLoader size="lg" />
        <p className="text-slate-400 mt-4 animate-pulse font-medium">Memasuki ruangan panggung...</p>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Particles / Stars Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.5 + 0.1,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        {/* Subtle glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 relative z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/80" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-base md:text-lg text-white leading-tight flex items-center gap-2">
              {schedule.title}
              <span className="bg-red-500 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">Live</span>
            </h1>
            <p className="text-xs text-white/50">{schedule.tutor?.full_name} • Panggung Virtual</p>
          </div>
        </div>
        <Button 
          onClick={() => router.back()}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-xl"
        >
          Keluar
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Stage / Podium Area (Center) */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center relative">
          
          <div className="w-full max-w-5xl aspect-video bg-black/60 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center backdrop-blur-sm group">
            
            {/* Podium Glow Effect */}
            <div className="absolute bottom-0 w-3/4 h-1/2 bg-gradient-to-t from-indigo-500/20 to-transparent blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center p-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center shadow-2xl">
                  {schedule.tutor?.avatar_url ? (
                    <img src={schedule.tutor.avatar_url} className="w-full h-full rounded-full object-cover" alt="Tutor" />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-slate-500" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-2 rounded-full">
                  <MicOff className="w-4 h-4 text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">Tutor {schedule.tutor?.full_name?.split(' ')[0] || ''}</h2>
              <p className="text-slate-400 font-medium">Video akan muncul di sini</p>
              
              <div className="mt-8 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <span className="text-sm font-semibold text-indigo-200">Menunggu sesi dimulai sepenuhnya...</span>
              </div>
            </div>

            {/* Overlays / Labels */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white/90">Layar Utama</span>
            </div>

          </div>

          {/* Student "On Stage" Area (Bottom of screen) */}
          <div className="mt-8 flex gap-4 w-full max-w-5xl justify-center h-24">
             {/* This area is reserved for students who are invited to stage */}
             <div className="w-40 h-full bg-white/5 border border-white/10 border-dashed rounded-2xl flex items-center justify-center text-xs text-white/30 font-medium text-center px-4">
                Area Siswa Naik Panggung
             </div>
          </div>

        </main>

        {/* Right Sidebar (Chat & Activities) */}
        <aside className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-md hidden lg:flex flex-col relative z-20">
          <div className="p-4 border-b border-white/10">
             <h3 className="font-bold text-white flex items-center gap-2">
               <MessageSquare className="w-4 h-4 text-indigo-400" /> Diskusi & Aktivitas
             </h3>
          </div>
          
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center opacity-50">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
               <MonitorPlay className="w-8 h-8 text-white/50" />
             </div>
             <p className="text-sm font-medium text-white/60">Sistem Polling & CBT Interaktif akan muncul di sini.</p>
          </div>

          {/* Dummy Chat Input */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ketik pesan..." 
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Controls */}
      <footer className="h-20 bg-black/60 border-t border-white/10 backdrop-blur-xl flex items-center justify-center px-6 relative z-30">
        <div className="flex items-center gap-4">
          
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors" title="Kamera Mati">
              <VideoOff className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-white/10 transition-colors" title="Mic Mati">
              <MicOff className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={cn(
              "h-14 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all duration-300",
              isHandRaised 
                ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]" 
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            )}
          >
            <Hand className={cn("w-5 h-5", isHandRaised && "animate-bounce")} />
            {isHandRaised ? "Turunkan Tangan" : "Raise Hand"}
          </button>
        </div>
      </footer>

    </div>
  );
}
