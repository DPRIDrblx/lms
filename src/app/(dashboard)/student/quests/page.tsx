"use client";

import { useAuth } from "@/lib/auth-context";
import { Star, Target, Zap } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";

export default function QuestsPage() {
  const { profile } = useAuth();
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-2">Daily Quests</h1>
        <p className="text-slate-500 font-bold">Complete quests to earn XP and rank up!</p>
      </div>

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
