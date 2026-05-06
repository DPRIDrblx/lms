"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { getInitials } from "@/lib/utils";
import { Sun, Moon, LogOut, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border)]">
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
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-all"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
                  {getInitials(profile?.full_name || "U")}
                </div>
              )}
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
                  className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] py-1.5 overflow-hidden"
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
