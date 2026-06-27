"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Star, Target, Zap, CheckCircle2, Gift } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function QuestsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [parentQuests, setParentQuests] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuests = async () => {
      if (!profile) return;
      const { data } = await supabase.from('parent_quests').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
      if (data) setParentQuests(data);
    };
    fetchQuests();
  }, [profile, supabase]);

  const completeQuest = async (questId: string, rewardGems: number) => {
    if (!profile) return;
    // 1. Set quest to completed
    const { error } = await supabase.from('parent_quests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', questId);
    if (!error) {
       // 2. Add gems to student (assuming parent already deducted or we just add)
       await supabase.from('profiles').update({ gems: ((profile as any).gems || 0) + rewardGems }).eq('id', profile.id);
       
       setParentQuests(parentQuests.map(q => q.id === questId ? { ...q, status: 'completed' } : q));
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-2">Quests & Missions</h1>
        <p className="text-slate-500 font-bold">Complete quests to earn XP and rank up!</p>
      </div>

      {parentQuests.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Gift className="text-fuchsia-500" /> Family Quests
          </h2>
          <div className="space-y-4">
            {parentQuests.map(quest => (
              <div key={quest.id} className={cn("bg-white rounded-3xl border-2 p-6 shadow-[0_6px_0_rgb(226,232,240)] flex flex-col md:flex-row md:items-center justify-between gap-6", quest.status === 'completed' ? "border-emerald-200 bg-emerald-50" : "border-fuchsia-200")}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <h3 className={cn("text-xl font-black", quest.status === 'completed' ? 'text-emerald-700' : 'text-slate-800')}>{quest.title}</h3>
                     {quest.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <p className="text-slate-500 font-bold">{quest.description}</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1 text-fuchsia-500 font-black text-xl">
                      <Star className="w-6 h-6 fill-current" /> {quest.reward_gems}
                   </div>
                   {quest.status !== 'completed' ? (
                     <button 
                       onClick={() => completeQuest(quest.id, quest.reward_gems)}
                       className="bg-fuchsia-500 text-white font-black px-6 py-3 rounded-xl border-2 border-fuchsia-600 shadow-[0_4px_0_rgb(192,38,211)] active:translate-y-1 active:shadow-none transition-all"
                     >
                        Klaim Reward
                     </button>
                   ) : (
                     <button disabled className="bg-emerald-100 text-emerald-600 font-black px-6 py-3 rounded-xl border-2 border-emerald-200">
                        Selesai
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Target className="text-blue-500" /> Daily Quests
      </h2>
      <div className="space-y-6">
        {[
          { title: "Complete 2 lessons", target: 2, current: 1, xp: 10, icon: Target, color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-200" },
          { title: "Earn 50 XP", target: 50, current: 50, xp: 20, icon: Star, color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200" },
          { title: "Perfect Score in a Quiz", target: 1, current: 0, xp: 30, icon: Zap, color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200" }
        ].map((quest, i) => {
          const isDone = quest.current >= quest.target;
          return (
            <div key={i} className={`bg-white rounded-3xl border-2 ${isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'} p-6 shadow-[0_6px_0_rgb(226,232,240)] flex items-center gap-6`}>
              <div className={`w-16 h-16 rounded-2xl ${isDone ? 'bg-emerald-100 text-emerald-500 border-2 border-emerald-200' : `${quest.bg} ${quest.color} border-2 ${quest.border}`} flex items-center justify-center shrink-0`}>
                <quest.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-xl font-black ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>{quest.title}</h3>
                  <span className="font-bold text-indigo-500">+{quest.xp} XP</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}></div>
                </div>
                <p className="text-right text-sm font-bold text-slate-400 mt-2">{quest.current} / {quest.target}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
