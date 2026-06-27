"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), { ssr: false });

export default function ArenaPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
     const fetchMatch = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('faction_war_matches').select('*, territory_zones(*)').eq('id', id).single();
        if (data) setMatchData(data);
     };
     fetchMatch();
  }, [id]);
  
  if (!profile || !matchData) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
     <div className="w-full h-screen bg-black overflow-hidden relative">
         <PhaserGame matchId={id as string} profileId={profile.id} avatarUrl={profile.avatar_url || undefined} zoneName={matchData.territory_zones?.name} />
     </div>
  );
}
