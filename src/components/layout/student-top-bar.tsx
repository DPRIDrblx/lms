"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { UserMenu } from "@/components/ui/user-menu";

export function StudentTopBar() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      // Load current gamification stats
      const loadStats = async () => {
        const { data } = await supabase.from("profiles").select("current_streak, xp").eq("id", profile.id).single();
        if (data) {
          setStreak(data.current_streak || 0);
          setXp(data.xp || 0);
        }
      };
      loadStats();

      // Listen for updates
      const channel = supabase.channel("profile_stats")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${profile.id}` }, (payload) => {
          if (payload.new.current_streak !== undefined) setStreak(payload.new.current_streak);
          if (payload.new.xp !== undefined) setXp(payload.new.xp);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile?.id, supabase]);

  return (
    <div className="sticky top-0 z-30 w-full h-16 bg-white/80 backdrop-blur-xl border-b-2 border-slate-200 flex items-center justify-between px-4 lg:px-8">
      {/* Spacer for desktop to account for left sidebar width */}
      <div className="hidden lg:block w-[260px]"></div>

      <div className="flex-1 flex justify-center lg:justify-end gap-6 items-center">
        {/* Streak */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <span className="font-black text-orange-600 text-lg">{streak}</span>
        </div>

        {/* XP / Gems */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Diamond className="w-6 h-6 text-blue-500 fill-blue-500" />
          <span className="font-black text-blue-600 text-lg">{xp}</span>
        </div>

        {/* Hearts (Cosmetic for now) */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors hidden sm:flex">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span className="font-black text-rose-600 text-lg">5</span>
        </div>

        {/* User Menu */}
        <div className="ml-2 lg:ml-6">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
