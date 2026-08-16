"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, ChevronDown, Star, Trophy, ClipboardList } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type LeaderboardEntry = {
  student_id: string;
  name: string;
  avatar: string;
  total_correct: number;
  total_xp: number;
  rank?: number;
};

export default function DrillLeaderboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'xp' | 'correct'>('xp');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // 1. Coba ambil dari View di database agar perhitungan (agregasi) dilakukan di server
      const { data: viewData, error: viewError } = await supabase
        .from('ai_drill_leaderboard')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (!viewError && viewData) {
        let arr = viewData.map((v: any, idx: number) => ({
          student_id: v.student_id,
          name: v.full_name || 'Siswa',
          avatar: v.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.full_name}`,
          total_correct: v.total_correct || 0,
          total_xp: v.total_xp || 0,
          rank: idx + 1
        }));
        setEntries(arr.filter((e: LeaderboardEntry) => e.total_xp > 0));
        setIsLoading(false);
        return;
      }

      // 2. Fallback: Fetch all results and profiles for a simple client-side aggregation
      // (Digunakan jika view 'ai_drill_leaderboard' belum dibuat di database)
      console.warn("View ai_drill_leaderboard not found, falling back to local aggregation");
      const { data: results, error: resError } = await supabase
        .from('ai_drill_results')
        .select('student_id, correct_answers');
      
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'student');

      if (resError || profError) throw (resError || profError);

      const agg: Record<string, LeaderboardEntry> = {};

      profiles?.forEach((p: any) => {
        agg[p.id] = {
          student_id: p.id,
          name: p.full_name || 'Siswa',
          avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.full_name}`,
          total_correct: 0,
          total_xp: 0
        };
      });

      results?.forEach((r: any) => {
        if (agg[r.student_id]) {
          agg[r.student_id].total_correct += (r.correct_answers || 0);
          agg[r.student_id].total_xp += (r.correct_answers || 0) * 10;
        }
      });

      let arr = Object.values(agg).filter(e => e.total_xp > 0);
      arr.sort((a, b) => b.total_xp - a.total_xp);
      
      // Assign ranks based on sorted XP
      arr = arr.map((e, idx) => ({ ...e, rank: idx + 1 }));
      
      setEntries(arr);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortedEntries = () => {
    const arr = [...entries];
    if (activeTab === 'xp') {
      return arr.sort((a, b) => b.total_xp - a.total_xp);
    } else {
      return arr.sort((a, b) => b.total_correct - a.total_correct);
    }
  };

  const sortedEntries = getSortedEntries();
  const top3 = sortedEntries.slice(0, 3);
  const rest = sortedEntries.slice(3);

  const currentUserEntry = sortedEntries.find(e => e.student_id === profile?.id);
  const currentUserRank = currentUserEntry ? sortedEntries.findIndex(e => e.student_id === profile?.id) + 1 : '-';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header Area */}
      <div className="bg-[#4318FF] min-h-[450px] w-full absolute top-0 left-0 z-0 overflow-hidden">
        {/* Abstract sunburst / rays background */}
        <div className="absolute inset-0 opacity-20" style={{
          background: 'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg)'
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#4318FF]"></div>
        
        <div className="max-w-5xl mx-auto px-6 py-6 relative z-10 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <Link href="/student/drills" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-md">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
          
          <div className="bg-white text-slate-800 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 cursor-pointer shadow-lg">
            Nasional <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="relative z-10 text-center mt-6">
          <h2 className="text-white font-bold text-lg">Peringkat {activeTab === 'xp' ? 'XP' : 'Soal Benar'} - Total Nasional</h2>
          <p className="text-white/80 text-sm font-medium">Agustus 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 pt-48">
        {/* Top 3 List */}
        <div className="space-y-3 mb-8">
          {top3.map((entry, idx) => {
            const isGold = idx === 0;
            const isSilver = idx === 1;
            const isBronze = idx === 2;
            
            let medalColor = "";
            let medalBg = "";
            if (isGold) { medalColor = "text-yellow-600"; medalBg = "bg-yellow-400"; }
            else if (isSilver) { medalColor = "text-slate-500"; medalBg = "bg-slate-300"; }
            else if (isBronze) { medalColor = "text-amber-800"; medalBg = "bg-amber-600"; }

            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={entry.student_id} 
                className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10"
              >
                <div className={`w-8 h-8 rounded-full ${medalBg} ${medalColor} flex items-center justify-center font-black text-sm shrink-0 shadow-lg border-2 border-white/20`}>
                  {idx + 1}
                </div>
                <img src={entry.avatar} alt={entry.name} className="w-12 h-12 rounded-full border-2 border-white/50 shadow-md bg-white" />
                <h3 className="font-bold text-white text-lg flex-1">{entry.name} {entry.student_id === profile?.id ? '(Kamu)' : ''}</h3>
                
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                  {activeTab === 'xp' ? (
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ) : (
                    <ClipboardList className="w-5 h-5 text-blue-300" />
                  )}
                  <span className="font-black text-white text-lg">
                    {activeTab === 'xp' ? entry.total_xp : entry.total_correct}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rest of the List */}
        <div className="bg-white rounded-t-3xl shadow-xl min-h-[500px]">
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama & Peringkat</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{activeTab === 'xp' ? 'Jumlah XP' : 'Jumlah Soal'}</span>
          </div>
          
          <div className="p-2 space-y-1">
            {rest.map((entry, idx) => (
              <div key={entry.student_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                <span className="font-bold text-slate-400 w-6 text-center">{entry.rank}</span>
                <img src={entry.avatar} alt={entry.name} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100" />
                <h3 className="font-bold text-slate-800 flex-1">{entry.name} {entry.student_id === profile?.id ? '(Kamu)' : ''}</h3>
                
                <div className="flex items-center gap-2">
                  {activeTab === 'xp' ? (
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ) : (
                    <ClipboardList className="w-4 h-4 text-blue-400" />
                  )}
                  <span className="font-black text-slate-700">
                    {activeTab === 'xp' ? entry.total_xp : entry.total_correct}
                  </span>
                </div>
              </div>
            ))}
            
            {rest.length === 0 && !isLoading && (
              <div className="text-center py-10 text-slate-400 font-medium">
                Belum ada data lainnya.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Current User Bar */}
      {currentUserEntry && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] border border-slate-100 p-4 flex items-center gap-4 pointer-events-auto">
            <span className="font-bold text-slate-800 w-6 text-center text-lg">{currentUserRank}</span>
            <div className="relative">
              <img src={currentUserEntry.avatar} alt="Kamu" className="w-10 h-10 rounded-full border-2 border-orange-500 bg-slate-100" />
              <div className="absolute -bottom-1 -right-1 bg-orange-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="font-bold text-slate-800 flex-1">
              {currentUserEntry.name} <span className="text-slate-400 font-medium">(Kamu)</span>
            </h3>
            
            <div className="flex items-center gap-2">
              {activeTab === 'xp' ? (
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              ) : (
                <ClipboardList className="w-5 h-5 text-blue-400" />
              )}
              <span className="font-black text-slate-800 text-lg">
                {activeTab === 'xp' ? currentUserEntry.total_xp : currentUserEntry.total_correct}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Tabs (Replaces standard nav for this page) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 px-6 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center">
          <button 
            onClick={() => setActiveTab('correct')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 border-b-2 transition-colors
              ${activeTab === 'correct' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Jumlah Soal Benar</span>
          </button>
          <button 
            onClick={() => setActiveTab('xp')}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 border-b-2 transition-colors
              ${activeTab === 'xp' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Star className={`w-6 h-6 ${activeTab === 'xp' ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">XP Terkumpul</span>
          </button>
        </div>
      </div>
    </div>
  );
}
