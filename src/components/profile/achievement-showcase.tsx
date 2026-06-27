import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Award, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: any = { Trophy, Medal, Star, Award, Shield };

export function AchievementShowcase({ userId, isOwner }: { userId: string, isOwner: boolean }) {
  const supabase = createClient();
  const [showcaseBadges, setShowcaseBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBadges();
  }, [userId]);
  
  const fetchBadges = async () => {
    setLoading(true);
    
    // Get user's equipped badges IDs from profile
    const { data: profile } = await supabase.from("profiles").select("showcase_badges").eq("id", userId).single();
    const equippedIds = profile?.showcase_badges || [];
    
    // Get all badges the user owns
    const { data: userBadges } = await supabase.from("user_badges").select("*, badges(*)").eq("user_id", userId);
    
    if (userBadges) {
        const owned = userBadges.map(ub => ub.badges).filter(Boolean);
        setAllBadges(owned);
        
        const equipped = owned.filter(b => equippedIds.includes(b.id)).slice(0, 3);
        setShowcaseBadges(equipped);
        
        // Trigger Effects if looking at someone else's profile (or own)
        if (equipped.length > 0) {
            triggerEffects(equipped);
        }
    }
    setLoading(false);
  };
  
  const triggerEffects = (badges: any[]) => {
      badges.forEach(b => {
          if (b.effect_class === 'confetti') {
              setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }), 500);
          } else if (b.effect_class === 'stars') {
              // basic stars effect using confetti shapes
              setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.2 }, colors: ['#fbbf24', '#f59e0b'] }), 1000);
          } else if (b.effect_class === 'fire') {
              setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, colors: ['#ef4444', '#f97316', '#f59e0b'] }), 1500);
          }
      });
  };
  
  const handleToggleBadge = async (badge: any) => {
      let newIds = showcaseBadges.map(b => b.id);
      if (newIds.includes(badge.id)) {
          newIds = newIds.filter(id => id !== badge.id);
      } else {
          if (newIds.length >= 3) {
              alert("Maksimal hanya 3 badge yang bisa dipajang!");
              return;
          }
          newIds.push(badge.id);
      }
      
      await supabase.from("profiles").update({ showcase_badges: newIds }).eq("id", userId);
      
      const updatedEquipped = allBadges.filter(b => newIds.includes(b.id));
      setShowcaseBadges(updatedEquipped);
  };
  
  if (loading) return null;

  return (
    <div className="w-full relative mt-6 mb-4">
       {/* SHOWCASE DISPLAY */}
       <div className="flex justify-center items-end gap-4 h-24">
          {showcaseBadges.map((badge, idx) => {
              const Icon = ICON_MAP[badge.icon] || Award;
              // Visual hierarchy: middle is biggest (if 3 items)
              const isCenter = showcaseBadges.length === 3 && idx === 1;
              return (
                  <motion.div 
                     key={badge.id}
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ delay: idx * 0.2, type: "spring" }}
                     className={`flex flex-col items-center group relative cursor-help ${isCenter ? 'z-10' : 'z-0'}`}
                  >
                     <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-xl border-2 border-white transition-transform ${isCenter ? 'w-20 h-20 scale-110' : 'w-16 h-16'}`}>
                        <Icon className={`${isCenter ? 'w-10 h-10' : 'w-8 h-8'} text-yellow-900 drop-shadow-md`} />
                        {/* Glow */}
                        <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-30 rounded-full group-hover:opacity-60 transition-opacity"></div>
                     </div>
                     
                     {/* Tooltip */}
                     <div className="absolute top-full mt-2 w-48 bg-slate-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-2xl">
                        <p className="font-black text-yellow-400 mb-1">{badge.name}</p>
                        <p className="text-slate-300 font-medium leading-tight">{badge.description}</p>
                     </div>
                  </motion.div>
              );
          })}
          
          {showcaseBadges.length === 0 && !isOwner && (
             <p className="text-white/60 font-medium text-sm">Belum ada medali yang dipajang.</p>
          )}
          
          {showcaseBadges.length === 0 && isOwner && (
             <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-bold border border-white/30 backdrop-blur-sm transition-colors">
                + Pajang Medali
             </button>
          )}
       </div>
       
       {isOwner && showcaseBadges.length > 0 && (
           <button onClick={() => setIsEditing(!isEditing)} className="absolute -top-4 right-0 text-white/70 hover:text-white text-xs font-bold underline bg-black/20 px-3 py-1 rounded-full">
              Edit Showcase
           </button>
       )}
       
       {/* EDITING DRAWER */}
       <AnimatePresence>
          {isEditing && (
              <motion.div 
                 initial={{ height: 0, opacity: 0 }}
                 animate={{ height: "auto", opacity: 1 }}
                 exit={{ height: 0, opacity: 0 }}
                 className="overflow-hidden mt-6 bg-slate-900/50 backdrop-blur-xl border border-white/20 rounded-3xl p-6"
              >
                  <h3 className="text-white font-black mb-4">Koleksi Medalimu</h3>
                  <div className="flex flex-wrap gap-4">
                     {allBadges.map(badge => {
                         const Icon = ICON_MAP[badge.icon] || Award;
                         const isEquipped = showcaseBadges.some(b => b.id === badge.id);
                         return (
                             <button 
                                key={badge.id}
                                onClick={() => handleToggleBadge(badge)}
                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${isEquipped ? 'bg-yellow-500/20 border-yellow-500' : 'bg-slate-800 border-slate-700 opacity-60 hover:opacity-100'}`}
                             >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isEquipped ? 'bg-yellow-500 text-yellow-900' : 'bg-slate-700 text-slate-400'}`}>
                                   <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className={`font-bold text-sm ${isEquipped ? 'text-yellow-400' : 'text-slate-300'}`}>{badge.name}</p>
                                   <p className="text-xs text-slate-400">{isEquipped ? 'Dipajang' : 'Klik untuk pajang'}</p>
                                </div>
                             </button>
                         )
                     })}
                     
                     {allBadges.length === 0 && (
                         <p className="text-slate-400 text-sm">Kamu belum mendapatkan medali apapun. Teruslah berjuang!</p>
                     )}
                  </div>
              </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}
