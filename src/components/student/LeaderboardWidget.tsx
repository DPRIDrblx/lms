"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Star, Trophy, Medal, Sparkles, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function LeaderboardWidget() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [myStars, setMyStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Get first day of current month
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      
      // Use RPC to bypass RLS and aggregate stars safely
      const { data: starsData, error } = await supabase.rpc('get_monthly_stars_leaderboard');
        
      if (!error && starsData) {
        // Map the RPC result to match the expected format {id, name, total}
        const mappedData = starsData.map((row: any) => ({
          id: row.student_id,
          name: row.full_name || 'Siswa',
          total: Number(row.total_stars) || 0
        }));

        // Find my stars
        if (profile?.id) {
          const myData = mappedData.find((s: any) => s.id === profile.id);
          if (myData) {
            setMyStars(myData.total);
          }
        }
        
        // Sort and get top 3 (already sorted by RPC, but just to be safe)
        const sorted = mappedData.sort((a: any, b: any) => b.total - a.total).slice(0, 10);
        setTopStudents(sorted);
      } else {
        console.error("RPC failed, falling back to direct table query:", error);
        // Fallback if RPC is not created yet (might suffer from RLS issues)
        const { data: fallbackData } = await supabase
          .from("student_stars")
          .select("student_id, stars, profiles!student_stars_student_id_fkey(full_name)")
          .gte("created_at", firstDay);
          
        if (fallbackData) {
          const studentMap: Record<string, { id: string, name: string, total: number }> = {};
          fallbackData.forEach((row: any) => {
            if (!studentMap[row.student_id]) {
              studentMap[row.student_id] = { id: row.student_id, name: row.profiles?.full_name || 'Siswa', total: 0 };
            }
            studentMap[row.student_id].total += row.stars;
          });
          
          if (profile?.id && studentMap[profile.id]) {
            setMyStars(studentMap[profile.id].total);
          }
          const sorted = Object.values(studentMap).sort((a, b) => b.total - a.total).slice(0, 10);
          setTopStudents(sorted);
        }
      }
      setLoading(false);
    }
    
    fetchData();

    // Subscribe to realtime updates for student_stars
    const channel = supabase
      .channel('public:student_stars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_stars' }, () => {
        console.log('Realtime update received! Refetching leaderboard...');
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  if (loading) {
    return <div className="h-32 bg-slate-100 rounded-3xl animate-pulse"></div>;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Profile Stats */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 drop-shadow-md" />
          </div>
          <div>
            <p className="text-blue-200 font-bold text-sm uppercase tracking-wider mb-1">Total Bintang Saya (Bulan Ini)</p>
            <div className="flex items-end gap-2">
              <h2 className="text-4xl font-black">{myStars}</h2>
              <span className="text-blue-200 font-medium mb-1">Bintang</span>
            </div>
          </div>
        </div>

        {/* Animated Leaderboard Ticker */}
        <div className="w-full md:w-auto flex-1 max-w-sm bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
          <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm mb-3">
            <Trophy className="w-4 h-4" /> Top 3 Bintang Terbanyak
            <TrendingUp className="w-4 h-4 ml-auto text-blue-300" />
          </div>
          
          <div className="h-20 overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col animate-[scrollUp_8s_linear_infinite]">
              {/* Double the list for seamless scrolling */}
              {[...topStudents, ...topStudents].map((student, idx) => (
                <div key={idx} className="h-10 flex items-center justify-between px-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      (idx % topStudents.length) === 0 ? 'bg-yellow-400 text-yellow-900' :
                      (idx % topStudents.length) === 1 ? 'bg-slate-300 text-slate-800' :
                      'bg-orange-400 text-orange-950'
                    }`}>
                      {(idx % topStudents.length) + 1}
                    </span>
                    <span className="font-bold text-sm truncate max-w-[120px]">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full text-xs font-bold text-yellow-300">
                    {student.total} <Star className="w-3 h-3 fill-yellow-300" />
                  </div>
                </div>
              ))}
              
              {topStudents.length === 0 && (
                <div className="h-20 flex items-center justify-center text-sm text-blue-200 font-medium italic">
                  Belum ada peraih bintang bulan ini.
                </div>
              )}
            </div>
            
            {/* Gradient Mask for smooth scrolling edges */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-800/20 via-transparent to-blue-800/20 pointer-events-none"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
