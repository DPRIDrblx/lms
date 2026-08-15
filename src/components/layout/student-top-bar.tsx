"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, Heart, LogOut, Gem, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { getInitials, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Glasses } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

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
    <>
      {uiMode === 'clean' ? (
        <div className="sticky top-0 z-40 w-full h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-10">
            {/* Ruangguru-style Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex items-center bg-blue-600 text-white rounded-lg px-2.5 py-1 font-black text-xl tracking-tighter">
                <span>IGNITE</span>
              </div>
            </Link>
            
            {/* Top Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Belajar</Link>
              <Link href="/student/jadwal-les" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Tatap Muka</Link>
              <Link href="/student/klinik" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Klinik PR</Link>
              <Link href="/student/drills" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Latihan</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
            >
              <div className="flex flex-col items-end mr-1">
                <span className="text-sm font-bold text-slate-700">Akun Saya</span>
              </div>
              <div className="relative">
                {profile?.avatar_url ? (
                  profile.avatar_url.includes("/avatars/") ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover object-top" />
                  ) : profile.avatar_url.startsWith("http") ? (
                    <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner", isCenterStudent ? "bg-red-100" : "bg-emerald-100")}>
                      {profile.avatar_url}
                    </div>
                  )
                ) : (
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black", isCenterStudent ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                    {getInitials(profile?.full_name || "U")}
                  </div>
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
                  className="absolute right-0 top-12 mt-2 w-56 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-xl border border-slate-100 py-2 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 mb-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm truncate font-bold text-slate-800">{profile?.full_name}</p>
                    <p className="text-xs capitalize font-medium text-slate-500">{profile?.role}</p>
                  </div>
                  
                  <Link 
                    href="/student/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </Link>

                  <div className="my-1 border-t border-slate-100"></div>

                  <button
                    onClick={() => { signOut(); setDropdownOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="sticky top-0 z-30 w-full h-16 flex items-center justify-between px-4 lg:px-8 transition-colors bg-white/80 backdrop-blur-xl border-b-2 border-slate-200">
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
                  <Flame className="w-7 h-7 fill-orange-500" />
                </motion.div>
              ) : (
                <Flame className="w-6 h-6 text-slate-400 fill-slate-300" />
              )}
              <span className={cn(
                "text-lg font-black",
                streak > 0 ? "text-orange-600" : "text-slate-500"
              )}>{streak}</span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
              <Diamond className="w-6 h-6 fill-blue-500" />
              <span className="text-lg font-black text-blue-600">{xp}</span>
            </div>

            {/* Gems */}
            <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors">
              <Gem className="w-6 h-6 fill-pink-500" />
              <span className="text-lg font-black text-pink-600">{gems}</span>
            </div>

            {/* Hearts (Cosmetic for now) */}
            <div className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-xl cursor-pointer transition-colors hidden sm:flex">
              <Heart className="w-6 h-6 fill-rose-500" />
              <span className="text-lg font-black text-rose-600">5</span>
            </div>

            {/* User Menu */}
            <div className="ml-2 lg:ml-6 relative flex items-center" ref={dropdownRef}>
              {profile?.active_title && (
                <div className="hidden md:flex flex-col items-end mr-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Gelar</span>
                  <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md font-black border border-amber-200">
                    {profile.active_title}
                  </span>
                </div>
              )}
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
                    className="absolute right-0 mt-3 w-56 bg-white shadow-xl rounded-2xl py-2 overflow-hidden z-50 border-2 border-slate-200"
                  >
                    <div className="px-4 py-3 mb-2 border-b-2 border-slate-100">
                      <p className="text-sm truncate text-slate-800 font-black">{profile?.full_name}</p>
                      <p className="text-xs capitalize text-slate-400 font-bold">{profile?.role}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setDropdownOpen(false); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors font-bold"
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
      )}
    </>
  );
}
