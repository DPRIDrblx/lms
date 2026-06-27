"use client";

import { useAuth } from "@/lib/auth-context";
import { LogOut, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export function ParentTopBar() {
  const { profile, signOut } = useAuth();
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
    <div className="sticky top-0 z-30 w-full h-16 bg-white/80 backdrop-blur-xl border-b-2 border-slate-200 flex items-center justify-between px-4 lg:px-8">
      {/* Spacer for desktop to account for left sidebar width */}
      <div className="hidden lg:block w-[260px]"></div>

      {/* Mobile Title */}
      <div className="lg:hidden flex items-center gap-2">
        <h1 className="text-xl font-black text-indigo-500 tracking-tight">Parent Portal</h1>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <button className="w-10 h-10 rounded-full border-2 border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors">
           <Bell className="w-5 h-5" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors border-2 border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm border border-indigo-200">
              {profile?.full_name ? getInitials(profile.full_name) : "?"}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-2 py-3 overflow-hidden">
              <div className="px-4 pb-3 mb-2 border-b-2 border-slate-100">
                <p className="font-bold text-slate-800 text-sm truncate">{profile?.full_name}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{profile?.role}</p>
              </div>
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
