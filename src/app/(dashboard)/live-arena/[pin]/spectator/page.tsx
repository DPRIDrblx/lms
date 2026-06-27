"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Gem, Loader2, Play } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

export default function SpectatorPage() {
  const params = useParams();
  const router = useRouter();
  const pin = params?.pin as string;
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [gems, setGems] = useState(0);
  const [betAmount, setBetAmount] = useState(10);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [hasBet, setHasBet] = useState(false);

  const fetchInitial = useCallback(async () => {
    if (!profile) return;
    
    // Get Gems
    const { data: pData } = await supabase.from("profiles").select("gems").eq("id", profile.id).single();
    if (pData) setGems(pData.gems || 0);

    // 1. Get Session by PIN
    const { data: sData, error: sError } = await supabase.from("live_quiz_sessions").select("*").eq("pin_code", pin).single();
    if (sError || !sData) {
      toast.error("Invalid PIN code.");
      router.push("/live-arena");
      return;
    }
    setSession(sData);

    // Check if already bet
    const { data: betData } = await supabase.from("live_quiz_spectators").select("*").eq("session_id", sData.id).eq("bettor_id", profile.id).single();
    if (betData) {
      setHasBet(true);
      setTargetPlayerId(betData.target_player_id);
    }
    
    // Fetch Participants
    const { data: participantsData } = await supabase.from("live_quiz_participants").select("*, profiles(full_name)").eq("session_id", sData.id).order("score", { ascending: false });
    if (participantsData) setParticipants(participantsData);

    setLoading(false);
  }, [profile, pin, router, supabase]);

  useEffect(() => {
    fetchInitial();
    
    if (!session?.id) return;
    
    const channel = supabase.channel(`live_arena_${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_quiz_participants', filter: `session_id=eq.${session.id}` }, () => {
        supabase.from("live_quiz_participants").select("*, profiles(full_name)").eq("session_id", session.id).order("score", { ascending: false })
          .then(({ data }: { data: any }) => data && setParticipants(data));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_quiz_sessions', filter: `id=eq.${session.id}` }, (payload: any) => {
         setSession(payload.new);
         if (payload.new.status === "finished") {
             checkBetResult();
         }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [fetchInitial, supabase, session?.id]);

  const checkBetResult = async () => {
    if (!hasBet || !targetPlayerId) return;
    // Check if targetPlayer is in top 3
    const { data: leaderboard } = await supabase.from("live_quiz_participants").select("student_id").eq("session_id", session.id).order("score", { ascending: false }).limit(3);
    const isWinner = leaderboard?.some((p: any) => p.student_id === targetPlayerId);
    
    if (isWinner) {
       toast.success("Tebakan Benar! Kamu memenangkan Gems!");
       // Payout x2 (Assuming odds = 2 for simplicity)
       // This would ideally be an RPC, we do it client side for prototype
       const { data: betInfo } = await supabase.from("live_quiz_spectators").select("bet_amount").eq("session_id", session.id).eq("bettor_id", profile?.id).single();
       if (betInfo) {
          const payout = betInfo.bet_amount * 2;
          const { data: userProfile } = await supabase.from("profiles").select("gems").eq("id", profile?.id).single();
          await supabase.from("profiles").update({ gems: (userProfile?.gems || 0) + payout }).eq("id", profile?.id);
          setGems(prev => prev + payout);
       }
    } else {
       toast.error("Tebakan Salah! Coba lagi lain waktu.");
    }
  };

  const placeBet = async () => {
    if (!targetPlayerId || betAmount < 5) return;
    if (gems < betAmount) {
      toast.error("Gems tidak cukup!");
      return;
    }
    if (session.status !== 'waiting') {
      toast.error("Kuis sudah dimulai, tidak bisa bertaruh lagi!");
      return;
    }

    const { error } = await supabase.from("live_quiz_spectators").insert({
      session_id: session.id,
      bettor_id: profile?.id,
      target_player_id: targetPlayerId,
      bet_amount: betAmount,
      odds: 2.0
    });

    if (!error) {
      const newGems = gems - betAmount;
      await supabase.from("profiles").update({ gems: newGems }).eq("id", profile?.id);
      setGems(newGems);
      setHasBet(true);
      toast.success("Berhasil memasang taruhan!");
    } else {
      toast.error("Gagal memasang taruhan");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-12 h-12 text-pink-500 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">SPECTATOR ARENA</h1>
            <p className="text-slate-400">Tonton pertandingan dan pasang taruhanmu!</p>
          </div>
          <div className="bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3 border border-slate-700">
            <span className="text-sm font-bold text-slate-400">SALDO GEMS</span>
            <div className="flex items-center gap-1"><Gem className="w-6 h-6 text-pink-500 fill-pink-500" /><span className="text-2xl font-black">{gems}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl">
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Play className="text-emerald-500" /> Live Leaderboard</h2>
              <div className="space-y-4">
                {participants.length === 0 ? <p className="text-slate-500 italic">Belum ada peserta...</p> : participants.map((p, index) => (
                  <motion.div 
                    layout
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      targetPlayerId === p.student_id ? 'bg-indigo-900/50 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-slate-900/50 border-transparent hover:border-slate-600'
                    }`}
                    onClick={() => !hasBet && session.status === 'waiting' && setTargetPlayerId(p.student_id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-black text-sm">{index + 1}</div>
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-300">
                         <div dangerouslySetInnerHTML={{ __html: createAvatar(adventurer, { seed: p.avatar_seed || p.profiles?.full_name || "Hero" }).toString() }} />
                      </div>
                      <span className="font-bold text-lg">{p.profiles?.full_name}</span>
                      {hasBet && targetPlayerId === p.student_id && <span className="ml-2 px-2 py-1 bg-pink-500/20 text-pink-400 text-xs font-bold rounded-md border border-pink-500/50">YOUR BET</span>}
                    </div>
                    <div className="font-black text-2xl text-yellow-500">{p.score}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl sticky top-8">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><Trophy className="text-yellow-500" /> Betting Station</h3>
              
              {session?.status !== 'waiting' ? (
                <div className="text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-700">
                  <p className="font-bold text-slate-300">Pertandingan sudah dimulai!</p>
                  {hasBet && <p className="text-pink-400 mt-2 font-medium">Tunggu hasil akhir untuk melihat apakah tebakanmu benar.</p>}
                </div>
              ) : hasBet ? (
                 <div className="text-center p-6 bg-indigo-900/30 rounded-2xl border border-indigo-500/50">
                    <p className="font-bold text-indigo-300 mb-2">Taruhan Terpasang!</p>
                    <p className="text-sm text-slate-400">Jika jagoanmu masuk Top 3, kamu akan mendapatkan <span className="text-pink-400 font-bold font-mono">x2</span> Gems!</p>
                 </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">Pilih Jagoan (Klik pada Leaderboard)</label>
                    <div className="w-full bg-slate-900 p-4 rounded-xl border border-slate-700 text-center font-bold text-indigo-400">
                      {targetPlayerId ? participants.find(p => p.student_id === targetPlayerId)?.profiles?.full_name : 'Belum Memilih'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">Jumlah Gems</label>
                    <div className="relative">
                      <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                      <input 
                        type="number" 
                        min="5" 
                        value={betAmount} 
                        onChange={e => setBetAmount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-12 pr-4 font-black text-pink-400 outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-400">Potensi Menang</span>
                    <span className="text-emerald-400">+ {betAmount * 2} Gems</span>
                  </div>

                  <button 
                    onClick={placeBet}
                    disabled={!targetPlayerId || betAmount < 5}
                    className="w-full py-4 rounded-xl font-black bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_0_rgb(159,18,57)] active:translate-y-1 active:shadow-none"
                  >
                    PASANG TARUHAN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
