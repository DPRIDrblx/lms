"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, Heart, LogOut, Gem } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { getInitials, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Glasses } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export function StudentTopBar() {
  const { profile, signOut, isCenterStudent } = useAuth();
  const supabase = createClient();
  const { uiMode } = useTheme();
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
    <div className={cn(
      "sticky top-0 z-30 w-full h-16 flex items-center justify-between px-4 lg:px-8 transition-colors",
      uiMode === 'clean' 
        ? "bg-white border-b border-slate-200" 
        : "bg-white/80 backdrop-blur-xl border-b-2 border-slate-200"
    )}>
      {/* Spacer for desktop to account for left sidebar width */}
      <div className="hidden lg:block w-[260px]"></div>

      <div className="flex-1 flex justify-center lg:justify-end gap-6 items-center">
        {/* Streak */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          {streak > 0 ? (
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [-3, 3, -3],
                filter: [
                  "drop-shadow(0 0 2px rgba(249,115,22,0.3))", 
                  "drop-shadow(0 0 8px rgba(249,115,22,0.8))", 
                  "drop-shadow(0 0 2px rgba(249,115,22,0.3))"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="w-7 h-7 text-orange-500 fill-orange-500" />
            </motion.div>
          ) : (
            <Flame className="w-6 h-6 text-slate-400 fill-slate-300" />
          )}
          <span className={cn(
            "text-lg", 
            uiMode === 'clean' ? "font-semibold text-slate-700" : "font-black",
            uiMode !== 'clean' && streak > 0 ? "text-orange-600" : (uiMode !== 'clean' ? "text-slate-500" : "")
          )}>{streak}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Diamond className={cn("w-6 h-6 text-blue-500", uiMode === 'clean' ? "" : "fill-blue-500")} />
          <span className={cn("text-lg text-blue-600", uiMode === 'clean' ? "font-semibold" : "font-black")}>{xp}</span>
        </div>

        {/* Gems */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
          <Gem className={cn("w-6 h-6 text-pink-500", uiMode === 'clean' ? "" : "fill-pink-500")} />
          <span className={cn("text-lg text-pink-600", uiMode === 'clean' ? "font-semibold" : "font-black")}>{gems}</span>
        </div>

        {/* Hearts (Cosmetic for now) */}
        <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors hidden sm:flex">
          <Heart className={cn("w-6 h-6 text-rose-500", uiMode === 'clean' ? "" : "fill-rose-500")} />
          <span className={cn("text-lg text-rose-600", uiMode === 'clean' ? "font-semibold" : "font-black")}>5</span>
        </div>

        {/* User Menu */}
        <div className="ml-2 lg:ml-6 relative flex items-center" ref={dropdownRef}>
          {profile?.active_title && (
            <div className="hidden md:flex flex-col items-end mr-3">
              <span className={cn("text-[10px] uppercase tracking-widest text-slate-400", uiMode === 'clean' ? "font-semibold" : "font-black")}>Gelar</span>
              <span className={cn(
                "text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md", 
                uiMode === 'clean' ? "font-semibold border-none" : "font-black border border-amber-200"
              )}>
                {profile.active_title}
              </span>
            </div>
          )}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 transition-all",
              uiMode === 'clean' ? "border border-transparent hover:border-slate-200" : "border-2 border-transparent hover:border-slate-200"
            )}
          >
            <div className="relative">
              {profile?.avatar_url ? (
                profile.avatar_url.includes("/avatars/") ? (
                  <img src={profile.avatar_url} alt="" className={cn("w-9 h-9 rounded-full object-cover object-top", equippedBorder)} />
                ) : profile.avatar_url.startsWith("http") ? (
                  <img src={profile.avatar_url} alt="" className={cn("w-9 h-9 rounded-full object-cover", equippedBorder)} />
                ) : (
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-inner", equippedBorder, isCenterStudent ? "bg-red-100" : "bg-emerald-100")}>
                    {profile.avatar_url}
                  </div>
                )
              ) : (
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-black", equippedBorder, isCenterStudent ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
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
                className={cn(
                  "absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-2xl py-2 overflow-hidden z-50",
                  uiMode === 'clean' ? "border border-slate-200" : "border-2 border-slate-200"
                )}
              >
                <div className={cn("px-4 py-3 mb-2", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
                  <p className={cn("text-sm truncate text-slate-800", uiMode === 'clean' ? "font-bold" : "font-black")}>{profile?.full_name}</p>
                  <p className={cn("text-xs capitalize text-slate-400", uiMode === 'clean' ? "font-medium" : "font-bold")}>{profile?.role}</p>
                </div>
                <button
                  onClick={() => { signOut(); setDropdownOpen(false); }}
                  className={cn("flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors", uiMode === 'clean' ? "font-semibold" : "font-bold")}
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
