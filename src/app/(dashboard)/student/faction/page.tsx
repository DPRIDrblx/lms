"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Trophy, ChevronRight, Loader2, Target, Sword } from "lucide-react";
import toast from "react-hot-toast";

const FACTIONS = [
  { id: "Alpha", color: "bg-red-500", text: "text-red-500", light: "bg-red-100", icon: "🐺", desc: "Berani dan tak kenal takut. Pemimpin alami." },
  { id: "Beta", color: "bg-blue-500", text: "text-blue-500", light: "bg-blue-100", icon: "🦅", desc: "Cerdas dan strategis. Berpikir sebelum bertindak." },
  { id: "Gamma", color: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-100", icon: "🐻", desc: "Kuat dan protektif. Setia pada kelompok." },
  { id: "Delta", color: "bg-purple-500", text: "text-purple-500", light: "bg-purple-100", icon: "🦉", desc: "Kreatif dan inovatif. Memecahkan masalah." },
];

export default function FactionPage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [topMembers, setTopMembers] = useState<Record<string, any[]>>({});
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadFactionData();
    }
  }, [profile]);

  const loadFactionData = async () => {
    setLoading(true);
    try {
      // Get leaderboard
      const { data: boardData, error: boardError } = await supabase.rpc('get_faction_leaderboard');
      if (boardError) throw boardError;
      
      const lData = boardData || [];
      // Ensure all factions exist in leaderboard even if 0 members
      const completeBoard = FACTIONS.map(f => {
        const found = lData.find((d: any) => d.faction_name === f.id);
        return found || { faction_name: f.id, total_xp: 0, member_count: 0 };
      }).sort((a, b) => b.total_xp - a.total_xp);
      
      setLeaderboard(completeBoard);

      // Get top members for each faction
      const tops: Record<string, any[]> = {};
      await Promise.all(FACTIONS.map(async (f) => {
        const { data: members } = await supabase.rpc('get_top_faction_members', { p_faction: f.id, p_limit: 3 });
        tops[f.id] = members || [];
      }));
      setTopMembers(tops);
      
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data faksi");
    } finally {
      setLoading(false);
    }
  };

  const joinFaction = async (factionId: string) => {
    if (!confirm(`Yakin ingin bergabung dengan faksi ${factionId}? Pilihan ini tidak bisa diubah.`)) return;
    setJoining(true);
    const { error } = await supabase.from('profiles').update({ faction: factionId }).eq('id', profile?.id);
    if (error) {
      toast.error("Gagal bergabung dengan faksi");
    } else {
      toast.success(`Selamat datang di faksi ${factionId}!`);
      await refreshProfile();
      loadFactionData();
    }
    setJoining(false);
  };

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  // CHOOSING FACTION SCREEN
  if (!profile?.faction) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block p-4 bg-indigo-100 rounded-full text-indigo-500 mb-4">
            <Sword className="w-12 h-12" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">Pilih Faksimu</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">Untuk bergabung dalam Perang Faksi, kamu harus memilih satu Faksi. Kumpulkan XP bersama teman-temanmu dan raih kemenangan!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FACTIONS.map((f, i) => (
            <motion.div 
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => !joining && joinFaction(f.id)}
              className={`bg-white p-8 rounded-3xl border-4 border-slate-100 hover:${f.color} hover:border-transparent group cursor-pointer transition-all hover:shadow-2xl hover:shadow-${f.color.split('-')[1]}-500/30 hover:-translate-y-2 relative overflow-hidden`}
            >
              <div className={`absolute top-[-20px] right-[-20px] text-9xl opacity-5 group-hover:opacity-20 transition-opacity ${f.text}`}>
                {f.icon}
              </div>
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl ${f.light} ${f.text} flex items-center justify-center text-3xl mb-6 group-hover:bg-white`}>
                  {f.icon}
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2 group-hover:text-white">{f.id}</h2>
                <p className="text-slate-500 font-medium group-hover:text-white/90">{f.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-white">
                  GABUNG SEKARANG <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // FACTION LEADERBOARD SCREEN
  const myFaction = FACTIONS.find(f => f.id === profile.faction);
  const maxXp = Math.max(...leaderboard.map(l => l.total_xp), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Hero Header */}
      <div className={`relative overflow-hidden rounded-3xl p-8 md:p-12 ${myFaction?.color} text-white shadow-xl`}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-white/20 rounded-full backdrop-blur-md flex items-center justify-center text-7xl border-4 border-white/30 shadow-inner">
            {myFaction?.icon}
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-3">
              <Shield className="w-4 h-4" /> Faksi Kamu
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-2">{myFaction?.id}</h1>
            <p className="text-white/80 font-medium text-lg max-w-xl">{myFaction?.desc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-500 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Peringkat Faksi</h2>
          </div>
          
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 space-y-8 shadow-sm">
            {leaderboard.map((l, idx) => {
              const fac = FACTIONS.find(f => f.id === l.faction_name);
              const percentage = (l.total_xp / maxXp) * 100;
              const isFirst = idx === 0;
              
              return (
                <div key={l.faction_name} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black ${isFirst ? 'bg-yellow-100 text-yellow-600 shadow-lg shadow-yellow-500/20' : 'bg-slate-100 text-slate-400'}`}>
                        {isFirst ? '👑' : `#${idx + 1}`}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-800">{fac?.id}</span>
                          <span className="text-xl">{fac?.icon}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                          <Users className="w-4 h-4" /> {l.member_count} Anggota
                        </div>
                      </div>
                    </div>
                    <div className={`text-2xl font-black ${isFirst ? 'text-yellow-500' : 'text-slate-700'}`}>
                      {l.total_xp.toLocaleString()} <span className="text-sm font-bold text-slate-400">XP</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${fac?.color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Members */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-500 rounded-2xl">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Elit Faksi</h2>
          </div>
          
          <div className="space-y-6">
            {FACTIONS.map(f => {
              const members = topMembers[f.id] || [];
              if (members.length === 0) return null;
              
              return (
                <div key={f.id} className="bg-white rounded-3xl border-2 border-slate-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-slate-100">
                    <div className={`w-8 h-8 rounded-lg ${f.light} ${f.text} flex items-center justify-center text-sm font-bold`}>
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-slate-800">Top {f.id}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {members.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                          {i + 1}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          {m.avatar_url ? (
                            <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{m.full_name}</p>
                          <p className="font-semibold text-slate-400 text-xs">{m.xp.toLocaleString()} XP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
