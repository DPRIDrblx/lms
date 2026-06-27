"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Shield, Trophy, Medal, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getRank } from "@/lib/utils";
import Link from "next/link";

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Fetch all students ordered by XP
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, xp, avatar_url, role")
      .eq("role", "student")
      .order("xp", { ascending: false })
      .limit(50);
      
    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-2">Papan Peringkat</h1>
        <p className="text-slate-500 font-bold">Terus belajar dan jadilah yang terbaik di IGNITE!</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
        <div className="bg-amber-400 p-8 flex flex-col items-center justify-center text-white border-b-4 border-amber-500 relative overflow-hidden">
          <Shield className="w-48 h-48 text-amber-300 absolute -right-12 -bottom-12 opacity-40 rotate-12" />
          <Trophy className="w-20 h-20 text-amber-100 mb-4 drop-shadow-lg" />
          <h2 className="text-3xl font-black drop-shadow-md">Global League</h2>
          <p className="font-bold text-amber-900 mt-2 bg-amber-300/50 px-4 py-1 rounded-full">Top 50 Students</p>
        </div>
        
        <div className="p-4 sm:p-6 space-y-2">
          {loading ? (
            <div className="flex justify-center items-center py-12">
               <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
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
                  <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                    isMe 
                    ? 'bg-indigo-50 border-2 border-indigo-200 shadow-sm' 
                    : 'border-2 border-transparent hover:bg-slate-50 hover:border-slate-100'
                  }`}>
                    <div className="w-10 font-black text-slate-400 text-center flex justify-center items-center">
                      {rank === 1 ? <Medal className="w-8 h-8 text-amber-500" /> : 
                       rank === 2 ? <Medal className="w-8 h-8 text-slate-400" /> : 
                       rank === 3 ? <Medal className="w-8 h-8 text-amber-700" /> : 
                       <span className="text-xl">{rank}</span>}
                    </div>
                    
                    {user.avatar_url && user.avatar_url.includes('/avatars/') ? (
                      <img src={user.avatar_url} className={`w-14 h-14 rounded-full object-cover object-top border-4 ${isMe ? 'border-indigo-300' : 'border-slate-200'}`} />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-4 ${
                        isMe ? 'bg-indigo-200 text-indigo-700 border-indigo-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {user.full_name?.charAt(0)}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className={`font-black text-lg ${isMe ? 'text-indigo-700' : 'text-slate-800'}`}>{user.full_name} {isMe && "(Kamu)"}</h3>
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">{getRank(user.xp)}</p>
                    </div>
                    
                    <div className={`font-black text-xl ${isMe ? 'text-indigo-600' : 'text-slate-700'}`}>
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
