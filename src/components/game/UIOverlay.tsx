"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import VirtualJoystick from "./VirtualJoystick";

interface UIOverlayProps {
  matchId: string;
  profileId: string;
}

export default function UIOverlay({ matchId, profileId }: UIOverlayProps) {
  const [matchData, setMatchData] = useState<any>(null);
  
  useEffect(() => {
     // Fetch match initial state
     const supabase = createClient();
     
     const fetchMatch = async () => {
         const { data } = await supabase.from('faction_war_matches').select('*').eq('id', matchId).single();
         if (data) setMatchData(data);
     };
     fetchMatch();

     // Listen to match updates
     const sub = supabase.channel(`match_${matchId}`)
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'faction_war_matches', filter: `id=eq.${matchId}` }, (payload: any) => {
           setMatchData(payload.new);
       })
       .subscribe();

     return () => {
       supabase.removeChannel(sub);
     };
  }, [matchId]);

  if (!matchData) return null;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
       {/* Top Bar: Scores and Phase */}
       <div className="flex justify-between items-start pointer-events-auto">
           <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl flex flex-col items-center">
              <span className="text-rose-400 font-black text-xs uppercase tracking-widest">Penantang</span>
              <span className="text-3xl font-black text-white">{matchData.challenger_score}</span>
           </div>

           <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-6 py-2 rounded-full flex flex-col items-center shadow-lg shadow-black/50">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fase Berlangsung</span>
              <span className="text-xl font-black text-cyan-400">{matchData.status.toUpperCase()}</span>
           </div>

           <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl flex flex-col items-center">
              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">Bertahan</span>
              <span className="text-3xl font-black text-white">{matchData.defender_score}</span>
           </div>
       </div>

       {/* Question Modal Area - Will be triggered by custom events from Phaser */}
       
       {/* Mobile Joystick (Only visible on small screens but functional everywhere) */}
       <div className="md:hidden">
          <VirtualJoystick 
             onMove={(x, y) => window.dispatchEvent(new CustomEvent('joystickMove', { detail: { x, y } }))} 
             onEnd={() => window.dispatchEvent(new CustomEvent('joystickEnd'))} 
          />
       </div>
    </div>
  );
}
