"use client";

import { useAuth } from "@/lib/auth-context";
import { Shield, Trophy, Medal } from "lucide-react";

export default function LeaderboardPage() {
  const { profile } = useAuth();
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 pb-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-800 mb-2">Emerald League</h1>
        <p className="text-slate-500 font-bold">Top 10 advance to the next league!</p>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
        <div className="bg-amber-400 p-6 flex flex-col items-center justify-center text-white border-b-4 border-amber-500 relative overflow-hidden">
          <Shield className="w-24 h-24 text-amber-300 absolute -right-6 -bottom-6 opacity-50" />
          <Trophy className="w-16 h-16 text-amber-100 mb-2 drop-shadow-md" />
          <h2 className="text-2xl font-black drop-shadow-md">Current League</h2>
        </div>
        
        <div className="p-4">
          {[
            { name: "John Doe", xp: 12500, rank: 1, isMe: false },
            { name: "Jane Smith", xp: 11200, rank: 2, isMe: false },
            { name: profile?.full_name || "You", xp: profile?.xp || 8500, rank: 3, isMe: true },
            { name: "Alex Johnson", xp: 7400, rank: 4, isMe: false },
            { name: "Sarah Williams", xp: 6300, rank: 5, isMe: false },
          ].map((user) => (
            <div key={user.rank} className={`flex items-center gap-4 p-4 rounded-2xl mb-2 ${user.isMe ? 'bg-indigo-50 border-2 border-indigo-200' : 'hover:bg-slate-50'}`}>
              <div className="w-8 font-black text-slate-400 text-center">
                {user.rank === 1 ? <Medal className="w-6 h-6 text-amber-500 mx-auto" /> : 
                 user.rank === 2 ? <Medal className="w-6 h-6 text-slate-400 mx-auto" /> : 
                 user.rank === 3 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" /> : 
                 user.rank}
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-black text-emerald-600">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${user.isMe ? 'text-indigo-700' : 'text-slate-700'}`}>{user.name}</h3>
              </div>
              <div className="font-black text-indigo-500">
                {user.xp} XP
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
