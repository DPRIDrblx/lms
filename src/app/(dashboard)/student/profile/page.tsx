"use client";

import { useAuth } from "@/lib/auth-context";
import { User, Flame, Diamond, Settings } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { profile } = useAuth();
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pb-24">
      <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
        <div className="bg-indigo-500 p-8 flex flex-col items-center justify-center text-white relative">
          <Link href="/settings">
            <button className="absolute top-6 right-6 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors">
              <Settings className="w-6 h-6 text-white" />
            </button>
          </Link>
          <div className="w-32 h-32 rounded-full bg-white border-4 border-indigo-300 flex items-center justify-center text-indigo-500 font-black text-5xl mb-4 shadow-lg">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          <h1 className="text-3xl font-black mb-1">{profile?.full_name}</h1>
          <p className="text-indigo-200 font-bold capitalize">{profile?.role}</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-black text-slate-800 mb-6">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-700">{profile?.current_streak || 0}</p>
                <p className="text-sm font-bold text-slate-400">Day Streak</p>
              </div>
            </div>
            <div className="border-2 border-slate-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Diamond className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-700">{profile?.xp || 0}</p>
                <p className="text-sm font-bold text-slate-400">Total XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
