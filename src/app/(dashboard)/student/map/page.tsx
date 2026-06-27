"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, Swords, Loader2, Zap, Laptop2, Library, Coffee, Map } from "lucide-react";
import { toast } from "react-hot-toast";

const icons = {
  Laptop2, Library, Coffee, Swords
};

export default function CyberMapPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [zones, setZones] = useState<any[]>([]);
  const [activeWars, setActiveWars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const DECLARATION_FEE = 500;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Zones
    const { data: zData } = await supabase.from("territory_zones").select("*, controlling_class:classes(name)");
    if (zData) setZones(zData);

    // Fetch Active Wars
    const { data: wData } = await supabase.from("faction_wars").select("*, challenger:classes!faction_wars_challenger_class_id_fkey(name), defender:classes!faction_wars_defender_class_id_fkey(name)").in("status", ["pending", "active"]);
    if (wData) setActiveWars(wData);

    setLoading(false);
  };

  const handleDeclareWar = async (zone: any) => {
    if (!profile?.class_id) {
        toast.error("Kamu tidak tergabung dalam kelas mana pun!");
        return;
    }
    if (profile.class_id === zone.controlling_class_id) {
        toast.error("Kelasmu sudah menguasai zona ini.");
        return;
    }
    
    // Check personal gems
    const { data: pData } = await supabase.from("profiles").select("gems").eq("id", profile.id).single();
    if (!pData || (pData.gems || 0) < DECLARATION_FEE) {
        toast.error(`Gems kamu tidak cukup. Butuh ${DECLARATION_FEE} Gems untuk deklarasi perang!`);
        return;
    }

    const confirm = window.confirm(`Deklarasikan perang untuk merebut ${zone.name} dari ${zone.controlling_class?.name || 'Netral'}?\nBiaya: ${DECLARATION_FEE} Gems (dipotong dari saldo pribadimu)`);
    if (!confirm) return;

    setProcessing(true);

    // Deduct gems
    await supabase.from("profiles").update({ gems: pData.gems - DECLARATION_FEE }).eq("id", profile.id);

    // Insert faction war
    await supabase.from("faction_wars").insert({
        zone_id: zone.id,
        challenger_class_id: profile.class_id,
        defender_class_id: zone.controlling_class_id,
        status: 'pending',
        declaration_fee: DECLARATION_FEE,
        declared_by: profile.id
    });

    toast.success("Deklarasi perang berhasil dikirim!");
    fetchData();
    setProcessing(false);
  };

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <Map className="w-8 h-8 text-cyan-500" /> Cyber Map
          </h1>
          <p className="text-slate-500 font-bold mt-2 text-lg">Conquer territories for your Faction.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {zones.map((zone, i) => {
              const Icon = (icons as any)[zone.icon] || Shield;
              const war = activeWars.find(w => w.zone_id === zone.id);
              const isMine = profile?.class_id === zone.controlling_class_id;

              return (
                  <motion.div 
                     key={zone.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className={`relative overflow-hidden rounded-3xl border-2 p-6 flex flex-col justify-between ${
                        war ? 'border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)] bg-gradient-to-br from-slate-900 to-rose-950 text-white' 
                        : isMine ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-gradient-to-br from-emerald-900 to-slate-900 text-white'
                        : 'border-slate-200 bg-white shadow-sm'
                     }`}
                  >
                     {/* Cyber Texture Overlay */}
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                     
                     <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                war ? 'bg-rose-500 text-white animate-pulse' 
                                : isMine ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            {war && (
                                <div className="px-4 py-1.5 bg-rose-500/20 border border-rose-500/50 rounded-full text-rose-300 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    <Swords className="w-4 h-4" /> CONTESTED
                                </div>
                            )}
                        </div>

                        <h2 className={`text-2xl font-black mb-2 ${war || isMine ? 'text-white' : 'text-slate-800'}`}>{zone.name}</h2>
                        <p className={`text-sm font-medium mb-6 ${war || isMine ? 'text-slate-300' : 'text-slate-500'}`}>{zone.description}</p>
                     </div>

                     <div className="relative z-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${war || isMine ? 'text-slate-400' : 'text-slate-400'}`}>Penguasa Saat Ini</p>
                            <p className={`text-lg font-black ${isMine ? 'text-emerald-400' : war ? 'text-rose-400' : 'text-indigo-600'}`}>
                                {zone.controlling_class ? zone.controlling_class.name : 'Zona Netral'} {isMine && '(Kelasmu)'}
                            </p>
                        </div>

                        {!isMine && !war && (
                            <button 
                                onClick={() => handleDeclareWar(zone)}
                                disabled={processing}
                                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_0_rgb(159,18,57)] hover:shadow-[0_6px_0_rgb(159,18,57)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
                            >
                                <ShieldAlert className="w-5 h-5" /> Deklarasi Perang
                            </button>
                        )}

                        {war && (
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase text-rose-400 mb-1">Penantang</p>
                                <p className="text-base font-black text-white">{war.challenger?.name}</p>
                            </div>
                        )}
                     </div>

                     {/* Buff Info */}
                     <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 border ${
                         war || isMine ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'
                     }`}>
                         <Zap className={`w-5 h-5 ${isMine ? 'text-emerald-400' : war ? 'text-yellow-400' : 'text-amber-500'}`} />
                         <span className={`text-sm font-bold ${war || isMine ? 'text-slate-200' : 'text-slate-600'}`}>{zone.buff_description}</span>
                     </div>
                  </motion.div>
              );
          })}
      </div>
    </div>
  );
}
