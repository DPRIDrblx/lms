"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Loader2, Medal, Trophy, Star, Zap, Flame, Crown, CheckCircle2, Lock } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme-context";

const BADGES = [
  { id: "first_blood", name: "First Blood", desc: "Selesaikan ujian pertamamu.", icon: Zap, color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200" },
  { id: "rich_kid", name: "Dewa Koin", desc: "Kumpulkan total 10.000 Koin di Wallet.", icon: Crown, color: "text-yellow-500", bg: "bg-yellow-100", border: "border-yellow-200" },
  { id: "speed_demon", name: "Si Paling Cepat", desc: "Selesaikan ujian kurang dari 10 menit.", icon: Flame, color: "text-rose-500", bg: "bg-rose-100", border: "border-rose-200" },
  { id: "perfect_score", name: "Mister Sempurna", desc: "Dapatkan nilai 100 di kuis manapun.", icon: Star, color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200" },
  { id: "veteran", name: "Veteran", desc: "Mencapai 5.000 XP.", icon: Medal, color: "text-indigo-500", bg: "bg-indigo-100", border: "border-indigo-200" },
];

export default function BadgesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const { uiMode } = useTheme();
  
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) loadBadges();
  }, [profile]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('student_badges').select('badge_id').eq('student_id', profile?.id);
      if (data) {
        setUnlockedBadges(data.map((d: any) => d.badge_id));
      }
      
      const { data: pData } = await supabase.from('profiles').select('active_title').eq('id', profile?.id).single();
      if (pData) {
        setActiveTitle(pData.active_title);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat gelar");
    } finally {
      setLoading(false);
    }
  };

  const equipTitle = async (badgeId: string, badgeName: string) => {
    if (!unlockedBadges.includes(badgeId)) return;
    
    try {
      const newTitle = activeTitle === badgeName ? null : badgeName; // Toggle off if clicking the same
      const { error } = await supabase.from('profiles').update({ active_title: newTitle }).eq('id', profile?.id);
      if (error) throw error;
      
      setActiveTitle(newTitle);
      if (newTitle) {
        toast.success(`Gelar '${newTitle}' berhasil dipasang!`);
      } else {
        toast.success(`Gelar dilepas.`);
      }
    } catch (err) {
      toast.error("Gagal memasang gelar");
    }
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><CenterLoader size="md" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className={cn("p-8 md:p-12 relative overflow-hidden transition-all", uiMode === 'clean' ? "bg-slate-50 border border-slate-200 rounded-xl" : "bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl text-white shadow-xl")}>
        <div className={cn("absolute top-0 right-0 p-8 rotate-12 transition-all", uiMode === 'clean' ? "opacity-5 text-slate-400" : "opacity-20")}>
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className={cn("text-4xl font-black mb-4", uiMode === 'clean' ? "text-slate-800" : "text-white")}>Ruang Piala & Gelar 🏆</h1>
          <p className={cn("font-medium max-w-xl text-lg", uiMode === 'clean' ? "text-slate-500" : "text-indigo-200")}>
            Selesaikan misi-misi rahasia untuk membuka gelar kehormatan. Pasang gelar favoritmu agar semua orang bisa melihatnya!
          </p>
          
          <div className={cn("mt-8 inline-flex items-center gap-3 px-6 py-3 transition-all", uiMode === 'clean' ? "bg-white rounded-lg border border-slate-200" : "bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20")}>
            <span className={cn("font-bold", uiMode === 'clean' ? "text-slate-600" : "text-indigo-200")}>Gelar Aktif:</span>
            {activeTitle ? (
              <span className="bg-amber-400 text-amber-950 px-3 py-1 rounded-lg font-black text-sm uppercase tracking-wider">
                {activeTitle}
              </span>
            ) : (
              <span className="text-slate-400 italic">Belum ada gelar terpasang</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedBadges.includes(badge.id);
          const isEquipped = activeTitle === badge.name;
          
          return (
            <div 
              key={badge.id}
              onClick={() => isUnlocked && equipTitle(badge.id, badge.name)}
              className={cn(
                "p-6 transition-all relative group overflow-hidden", uiMode === 'clean' ? "rounded-xl border border-slate-200" : "rounded-3xl border-2", isUnlocked ? (uiMode === 'clean' ? "bg-white shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer" : "bg-white shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer") : (uiMode === 'clean' ? "bg-slate-50/50 border-dashed border-slate-200 grayscale opacity-50" : "bg-slate-50 border-dashed border-slate-200 grayscale opacity-70"), isEquipped && (uiMode === 'clean' ? "border-amber-400 shadow-sm bg-amber-50/20" : "border-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.2)] bg-amber-50/30")
              )}
            >
              {isEquipped && (
                <div className="absolute top-4 right-4 text-amber-500">
                  <CheckCircle2 className="w-6 h-6 fill-amber-100" />
                </div>
              )}
              
              {!isUnlocked && (
                <div className="absolute top-4 right-4 text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
              )}

              <div className={cn("w-16 h-16 flex items-center justify-center mb-6 shadow-sm", uiMode === 'clean' ? `rounded-xl ${badge.bg} ${badge.color} border border-transparent opacity-90` : `rounded-2xl border-2 ${badge.bg} ${badge.color} ${badge.border}`)}>
                <badge.icon className="w-8 h-8" strokeWidth={2.5} />
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2">{badge.name}</h3>
              <p className="text-sm font-medium text-slate-500">{badge.desc}</p>
              
              {isUnlocked && (
                <div className="mt-6 pt-4 border-t-2 border-slate-100">
                  <span className={cn("text-xs font-black uppercase tracking-widest", isEquipped ? "text-amber-500" : "text-indigo-500 group-hover:text-indigo-600")}>
                    {isEquipped ? "Dilepas (Klik)" : "Pasang Gelar"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
