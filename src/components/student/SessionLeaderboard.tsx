"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Star, Trophy, Medal, Sparkles } from "lucide-react";

export function SessionLeaderboard({ scheduleId, studentId }: { scheduleId: string, studentId: string }) {
  const supabase = createClient();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myStars, setMyStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessionStars() {
      // Fetch all stars for this specific session using RPC to bypass RLS
      const { data, error } = await supabase.rpc('get_session_stars_leaderboard', { p_schedule_id: scheduleId });

      if (!error && data) {
        const mapped = data.map((row: any) => ({
          id: row.student_id,
          name: row.full_name || 'Siswa',
          stars: Number(row.stars) || 0
        }));

        setLeaderboard(mapped);
        
        const me = mapped.find((s: any) => s.id === studentId);
        if (me) setMyStars(me.stars);
      } else {
        console.error("Session RPC failed, falling back to direct table query:", error);
        const { data: fallbackData } = await supabase
          .from('student_stars')
          .select('student_id, stars, profiles!student_stars_student_id_fkey(full_name)')
          .eq('schedule_id', scheduleId)
          .order('stars', { ascending: false });
          
        if (fallbackData) {
          const mapped = fallbackData.map((row: any) => ({
            id: row.student_id,
            name: row.profiles?.full_name || 'Siswa',
            stars: row.stars
          }));
          setLeaderboard(mapped);
          const me = mapped.find((s: any) => s.id === studentId);
          if (me) setMyStars(me.stars);
        }
      }
      setLoading(false);
    }

    fetchSessionStars();

    // Subscribe to realtime updates for this specific session
    const channel = supabase
      .channel(`public:student_stars:schedule_${scheduleId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'student_stars',
        filter: `schedule_id=eq.${scheduleId}`
      }, () => {
        fetchSessionStars();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scheduleId, studentId, supabase]);

  if (loading) {
    return <div className="h-48 bg-slate-100 rounded-3xl animate-pulse w-full"></div>;
  }

  // If no stars given yet
  if (leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
        <h3 className="text-xl font-black text-slate-800 mb-2">Bintang Sesi Ini</h3>
        <p className="text-slate-500">Belum ada bintang yang dibagikan di sesi ini.</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-xl font-bold">
          <Star className="w-5 h-5 fill-yellow-400" />
          Kamu memiliki {myStars} bintang
        </div>
      </div>
    );
  }

  const first = leaderboard[0];
  const second = leaderboard.length > 1 ? leaderboard[1] : null;
  const third = leaderboard.length > 2 ? leaderboard[2] : null;
  const runnerUps = leaderboard.slice(3, 10);

  return (
    <div className="bg-gradient-to-b from-indigo-900 to-blue-900 rounded-[32px] p-8 shadow-xl border border-indigo-800 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 relative z-10 gap-4">
        <div>
          <h3 className="text-2xl font-black flex items-center gap-2 text-white">
            <Trophy className="w-7 h-7 text-yellow-400" />
            Podium Sesi Ini
          </h3>
          <p className="text-indigo-200 mt-1">Siapa yang paling aktif hari ini?</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Star className="w-5 h-5 text-yellow-900 fill-yellow-900" />
          </div>
          <div>
            <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Bintang Kamu</p>
            <p className="text-xl font-black text-white">{myStars} <span className="text-sm font-medium text-indigo-200">/ sesi ini</span></p>
          </div>
        </div>
      </div>

      {/* Podium Graphic */}
      <div className="flex items-end justify-center gap-2 md:gap-6 h-64 mt-8 relative z-10 mb-8 border-b border-indigo-500/50 pb-4">
        {/* Second Place */}
        {second && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="text-center mb-2">
              <p className="font-bold text-sm md:text-base text-slate-200 line-clamp-1 w-20 md:w-24 break-words">{second.name}</p>
              <div className="flex items-center justify-center gap-1 text-yellow-300 font-black mt-1">
                {second.stars} <Star className="w-3 h-3 fill-yellow-300" />
              </div>
            </div>
            <div className="w-20 md:w-28 h-32 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl flex items-start justify-center pt-4 relative shadow-2xl border-t-4 border-indigo-300">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-10 h-10 rounded-full bg-slate-300 border-4 border-indigo-800 flex items-center justify-center font-black text-slate-700 z-10 shadow-lg">2</div>
            </div>
          </div>
        )}

        {/* First Place */}
        {first && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-700">
            <div className="text-center mb-2">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-1 drop-shadow-md" />
              <p className="font-black text-base md:text-lg text-yellow-400 line-clamp-1 w-24 md:w-32 break-words">{first.name}</p>
              <div className="flex items-center justify-center gap-1 text-yellow-300 font-black mt-1 bg-yellow-900/40 px-2 py-0.5 rounded-full">
                {first.stars} <Star className="w-4 h-4 fill-yellow-300" />
              </div>
            </div>
            <div className="w-24 md:w-32 h-44 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-xl flex items-start justify-center pt-4 relative shadow-2xl border-t-4 border-yellow-200">
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 blur-sm rounded-t-xl"></div>
              <div className="w-12 h-12 rounded-full bg-yellow-200 border-4 border-yellow-700 flex items-center justify-center font-black text-yellow-800 z-10 shadow-xl">1</div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {third && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="text-center mb-2">
              <p className="font-bold text-sm md:text-base text-slate-300 line-clamp-1 w-20 md:w-24 break-words">{third.name}</p>
              <div className="flex items-center justify-center gap-1 text-yellow-300 font-black mt-1">
                {third.stars} <Star className="w-3 h-3 fill-yellow-300" />
              </div>
            </div>
            <div className="w-20 md:w-28 h-24 bg-gradient-to-t from-indigo-700 to-indigo-600 rounded-t-xl flex items-start justify-center pt-4 relative shadow-2xl border-t-4 border-indigo-400">
              <div className="absolute inset-0 bg-black/10 rounded-t-xl"></div>
              <div className="w-10 h-10 rounded-full bg-amber-700 border-4 border-indigo-900 flex items-center justify-center font-black text-amber-100 z-10 shadow-lg">3</div>
            </div>
          </div>
        )}
      </div>

      {/* Runner Ups */}
      {runnerUps.length > 0 && (
        <div className="mt-8 relative z-10">
          <h4 className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-4">Runner Up Sesi Ini</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {runnerUps.map((runner, index) => (
              <div key={runner.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-white/5 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-800/50 flex items-center justify-center text-indigo-300 font-bold text-sm border border-indigo-500/30">
                    {index + 4}
                  </div>
                  <p className="font-bold text-slate-200">{runner.name}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/30">
                  <span className="font-black text-yellow-400">{runner.stars}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
