"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getInitials, cn } from "@/lib/utils";
import { Sun, Moon, LogOut, Bell, GraduationCap, Glasses } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [equippedBorder, setEquippedBorder] = useState("");
  const [equippedHat, setEquippedHat] = useState("");
  const [equippedGlasses, setEquippedGlasses] = useState("");

  useEffect(() => {
    if (!profile) return;
    const fetchEquipped = async () => {
      const supabase = createClient();
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
  }, [profile]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-[var(--border)] print:hidden shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="lg:hidden w-10" />

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>

          {/* Notifications */}
          <button className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all relative">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--error)] rounded-full" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all"
            >
              <div className="relative">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className={cn("w-9 h-9 rounded-full object-cover", equippedBorder)} />
                ) : (
                  <div className={cn("w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-black text-indigo-500", equippedBorder)}>
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
              <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:block">
                {profile?.full_name}
              </span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-[var(--border)] shadow-[var(--shadow-lg)] rounded-xl py-1.5 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{profile?.full_name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] capitalize">{profile?.role}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setDropdownOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
