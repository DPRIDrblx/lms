"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Shield, Trophy, Medal } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { useState, useEffect } from "react";
import { getRank, cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

export default function LeaderboardPage() {
  const { profile, isCenterStudent } = useAuth();
  const supabase = createClient();
  const { uiMode } = useTheme();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Fetch all students ordered by XP
    let query = supabase
      .from("profiles")
      .select("id, full_name, xp, avatar_url, role, class_id")
      .eq("role", "student")
      .order("xp", { ascending: false })
      .limit(50);
      
    if (isCenterStudent && profile?.class_id) {
      query = query.eq("class_id", profile.class_id);
    }
    
    const { data } = await query;
      
    if (data) {
      setUsers(data);
    }
    setTimeout(() => setLoading(false), 1500);
  };
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-2">Papan Peringkat</h1>
        <p className="text-slate-500 font-bold">Terus belajar dan jadilah yang terbaik di IGNITE!</p>
      </div>

      <div className={cn("bg-white overflow-hidden transition-all", uiMode === 'clean' ? "rounded-3xl border border-slate-200 shadow-sm" : cn("rounded-[2.5rem] border-2 border-slate-200", isCenterStudent ? "shadow-[0_8px_0_rgb(254,226,226)]" : "shadow-[0_8px_0_rgb(226,232,240)]"))}>
        <div className={cn("p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all", uiMode === 'clean' ? "bg-slate-50 border-b border-slate-200" : cn("text-white border-b-4", isCenterStudent ? "bg-red-500 border-red-600" : "bg-amber-400 border-amber-500"))}>
          <Shield className={cn("w-48 h-48 absolute -right-12 -bottom-12 rotate-12 transition-colors", uiMode === 'clean' ? "opacity-10 text-slate-300" : cn("opacity-40", isCenterStudent ? "text-red-400" : "text-amber-300"))} />
          <Trophy className={cn("w-20 h-20 mb-4", uiMode === 'clean' ? "text-amber-500" : cn("drop-shadow-lg", isCenterStudent ? "text-red-100" : "text-amber-100"))} />
          <h2 className={cn("text-3xl font-black", uiMode === 'clean' ? "text-slate-800" : "drop-shadow-md text-white")}>{isCenterStudent ? `${profile?.class_name} League` : "Global League"}</h2>
          <p className={cn("font-bold mt-2 px-4 py-1 rounded-full text-sm", uiMode === 'clean' ? "text-slate-500 bg-slate-200/50" : cn(isCenterStudent ? "text-red-900 bg-red-300/50" : "text-amber-900 bg-amber-300/50"))}>Top 50 Students</p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-2">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
               <CenterLoader size="md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold">
               Belum ada data siswa.
            </div>
          ) : (
            users.map((user, idx) => {
              const rank = idx + 1;
              const isMe = user.id === profile?.id;
              
              return (
                <Link key={user.id} href={isMe ? '/student/profile' : `/student/profile/${user.id}`}>
                  <div className={cn("flex items-center gap-4 p-4 transition-all cursor-pointer", uiMode === 'clean' ? (isMe ? "bg-slate-50 border border-[#108B96] rounded-xl shadow-sm" : "bg-white border border-transparent rounded-xl hover:bg-slate-50 hover:border-slate-100") : (isMe ? "bg-indigo-50 border-2 border-indigo-200 shadow-sm rounded-2xl" : "border-2 border-transparent hover:bg-slate-50 hover:border-slate-100 rounded-2xl"))}>
                    <div className="w-10 font-black text-slate-400 text-center flex justify-center items-center">
                      {rank === 1 ? <Medal className="w-8 h-8 text-amber-500" /> : 
                       rank === 2 ? <Medal className="w-8 h-8 text-slate-400" /> : 
                       rank === 3 ? <Medal className="w-8 h-8 text-amber-700" /> : 
                       <span className="text-xl">{rank}</span>}
                    </div>
                    
                    {user.avatar_url && user.avatar_url.includes('/avatars/') ? (
                      <img src={user.avatar_url} className={cn("w-14 h-14 rounded-full object-cover object-top", uiMode === 'clean' ? "border-2 border-slate-200" : cn("border-4", isMe ? "border-indigo-300" : "border-slate-200"))} />
                    ) : (
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center font-black text-xl", uiMode === 'clean' ? "border-2 border-slate-200 bg-slate-100 text-slate-500" : cn("border-4", 
                        isMe ? 'bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-slate-200 text-slate-600 border-slate-300'))}>
                        {user.full_name?.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className={cn("font-black text-lg", uiMode === 'clean' ? "text-slate-800" : cn(isMe ? "text-indigo-700" : "text-slate-800"))}>{user.full_name} {isMe && "(Kamu)"}</h3>
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{getRank(user.xp)}</p>
                    </div>
                    
                    <div className={cn("font-black text-xl", uiMode === 'clean' ? (isMe ? "text-[#108B96]" : "text-slate-700") : cn(isMe ? "text-indigo-600" : "text-slate-700"))}>
                      {user.xp} <span className="text-sm text-slate-400">XP</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
