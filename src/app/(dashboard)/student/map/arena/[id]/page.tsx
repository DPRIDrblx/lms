"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), { ssr: false });

export default function ArenaPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
     <div className="w-full h-screen bg-black overflow-hidden relative">
         <PhaserGame matchId={id as string} profileId={profile.id} />
     </div>
  );
}
