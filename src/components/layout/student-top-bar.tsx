"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, Heart, LogOut, Gem } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { getInitials, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Glasses } from "lucide-react";

export function StudentTopBar() {
  const { profile, signOut } = useAuth();
  const supabase = createClient();
  const [streak, setStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [gems, setGems] = useState(0);

  const [equippedBorder, setEquippedBorder] = useState("");
  const [equippedHat, setEquippedHat] = useState("");
  const [equippedGlasses, setEquippedGlasses] = useState("");
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (profile?.id) {
      // Load current gamification stats
      const loadStats = async () => {
        const { data } = await supabase.from("profiles").select("current_streak, xp, gems").eq("id", profile.id).single();
        if (data) {
          setStreak(data.current_streak || 0);
          setXp(data.xp || 0);
          setGems(data.gems || 0);
        }
      };
      loadStats();

      // Load cosmetics
      const fetchEquipped = async () => {
        const { data } = await supabase.from('user_inventory').select('shop_items(*)').eq('user_id', profile.id).eq('is_equipped', true);
        if (data) {
          data.forEach((d: any) => {
            const item = d.shop_items;
            if (!item) return;
            if (item.type === 'cosmetic_border' || item.type === 'cosmetic_effect') setEquippedBorder(item.css_value);
            if (item.type === 'mascot_hat') setEquippedHat(item.icon);
            if (item.type === 'mascot_glasses') setEquippedGlasses(item.icon);
          });
        }
      };
      fetchEquipped();

      // Listen for updates
      const channel = supabase.channel("profile_stats")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${profile.id}` }, (payload: any) => {
          if (payload.new.current_streak !== undefined) setStreak(payload.new.current_streak);
          if (payload.new.xp !== undefined) setXp(payload.new.xp);
          if (payload.new.gems !== undefined) setGems(payload.new.gems);
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

        {/* XP */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Diamond className="w-6 h-6 text-blue-500 fill-blue-500" />
          <span className="font-black text-blue-600 text-lg">{xp}</span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Gem className="w-6 h-6 text-pink-500 fill-pink-500" />
          <span className="font-black text-pink-600 text-lg">{gems}</span>
        </div>

        {/* Hearts (Cosmetic for now) */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors hidden sm:flex">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span className="font-black text-rose-600 text-lg">5</span>
        </div>

        {/* User Menu */}
        <div className="ml-2 lg:ml-6 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 transition-all border-2 border-transparent hover:border-slate-200"
          >
            <div className="relative">
              {profile?.avatar_url ? (
                profile.avatar_url.includes("/avatars/") ? (
                  <img src={profile.avatar_url} alt="" className={cn("w-9 h-9 rounded-full object-cover object-top", equippedBorder)} />
                ) : profile.avatar_url.startsWith("http") ? (
                  <img src={profile.avatar_url} alt="" className={cn("w-9 h-9 rounded-full object-cover", equippedBorder)} />
                ) : (
                  <div className={cn("w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-xl shadow-inner", equippedBorder)}>
                    {profile.avatar_url}
                  </div>
                )
              ) : (
                <div className={cn("w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-600", equippedBorder)}>
                  {getInitials(profile?.full_name || "U")}
                </div>
              )}
              {equippedHat === 'GraduationCap' && (
                <GraduationCap className="absolute -top-3.5 -right-2.5 w-6 h-6 text-slate-800 fill-slate-800 rotate-12 drop-shadow-md z-10" />
              )}
              {equippedGlasses === 'Glasses' && (
                <Glasses className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 text-slate-900 fill-slate-900 drop-shadow-md z-10" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-56 bg-white border-2 border-slate-200 shadow-xl rounded-2xl py-2 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b-2 border-slate-100 mb-2">
                  <p className="text-sm font-black text-slate-800 truncate">{profile?.full_name}</p>
                  <p className="text-xs font-bold text-slate-400 capitalize">{profile?.role}</p>
                </div>
                <button
                  onClick={() => { signOut(); setDropdownOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
