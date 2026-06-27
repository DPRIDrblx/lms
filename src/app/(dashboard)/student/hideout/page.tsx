"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Shield, Gem, Users, Loader2, Flag, Sofa, Trophy, Target } from "lucide-react";
import { toast } from "react-hot-toast";

const ICON_MAP: any = { Sofa, Trophy, Flag };

export default function HideoutPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [classInfo, setClassInfo] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [crowdfunds, setCrowdfunds] = useState<any[]>([]);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchHideoutData();
    }
  }, [profile?.id]);

  const fetchHideoutData = async () => {
    setLoading(true);
    
    // Get Gems
    const { data: pData } = await supabase.from("profiles").select("gems").eq("id", profile?.id).single();
    if (pData) setGems(pData.gems || 0);

    if (!profile?.class_id) {
       setLoading(false);
       return;
    }

    // Get Class Info
    const { data: clsData } = await supabase.from("classes").select("*").eq("id", profile.class_id).single();
    if (clsData) setClassInfo(clsData);

    // Get Active Hideout Items
    const { data: invData } = await supabase.from("hideout_inventory")
      .select("*, hideout_items(*)")
      .eq("class_id", profile.class_id)
      .eq("is_active", true);
    if (invData) setInventory(invData);

    // Get Crowdfunds
    const { data: cfData } = await supabase.from("hideout_items").select("*");
    
    if (cfData) {
       // Filter items not in inventory
       const unownedItems = cfData.filter((item: any) => !invData?.some((inv: any) => inv.item_id === item.id));
       
       // Fetch current fund progress
       const { data: funds } = await supabase.from("hideout_crowdfunds").select("*").eq("class_id", profile.class_id);
       
       const mappedFunds = unownedItems.map((item: any) => {
           const fund = funds?.find((f: any) => f.item_id === item.id);
           return {
               ...item,
               fund_id: fund?.id,
               current_gems: fund?.current_gems || 0
           };
       });
       setCrowdfunds(mappedFunds);
    }
    
    setLoading(false);
  };

  const handleDonate = async (item: any, amount: number) => {
    if (gems < amount) {
       toast.error("Gems kamu tidak cukup!");
       return;
    }

    const confirmDonate = window.confirm(`Sumbang ${amount} Gems untuk ${item.name}?`);
    if (!confirmDonate) return;

    // Deduct gems
    const newGems = gems - amount;
    await supabase.from("profiles").update({ gems: newGems }).eq("id", profile?.id);
    
    // Update or Insert Crowdfund
    let newCurrentGems = item.current_gems + amount;
    
    if (item.fund_id) {
       await supabase.from("hideout_crowdfunds").update({ current_gems: newCurrentGems }).eq("id", item.fund_id);
    } else {
       const { data: newFund } = await supabase.from("hideout_crowdfunds").insert({
           class_id: profile?.class_id,
           item_id: item.id,
           current_gems: newCurrentGems
       }).select().single();
       if (newFund) item.fund_id = newFund.id;
    }
    
    setGems(newGems);
    toast.success(`Berhasil menyumbang ${amount} Gems!`);

    // Check if target reached
    if (newCurrentGems >= item.target_gems) {
       // Move to inventory
       await supabase.from("hideout_inventory").insert({
           class_id: profile?.class_id,
           item_id: item.id,
           is_active: true
       });
       // Delete crowdfund
       if (item.fund_id) {
           await supabase.from("hideout_crowdfunds").delete().eq("id", item.fund_id);
       }
       toast.success(`🎉 Target tercapai! ${item.name} sekarang terpasang di Markas!`);
       fetchHideoutData();
    } else {
       fetchHideoutData(); // Refresh progress
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>;

  if (!profile?.class_id) {
     return (
       <div className="max-w-4xl mx-auto py-12 px-4 text-center">
         <h1 className="text-3xl font-black text-slate-800 mb-4">Clan Hideout</h1>
         <div className="bg-white p-12 rounded-3xl border-2 border-slate-200">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Kamu belum tergabung dalam kelas (Guild) apapun.</p>
         </div>
       </div>
     )
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pb-24">
      {/* HEADER HIDEOUT */}
      <div className="relative w-full min-h-[300px] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl mb-12 border-4 border-slate-800 p-8 flex flex-col justify-end">
        {/* Render Active Decorations as Background Elements */}
        {inventory.map(inv => (
            <div key={inv.id} className={`absolute inset-0 opacity-20 pointer-events-none ${inv.hideout_items?.css_value}`}></div>
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        <div className="relative z-10 flex justify-between items-end">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <Shield className="w-8 h-8 text-indigo-400" />
                 <span className="text-indigo-400 font-bold tracking-widest uppercase text-sm">MARKAS KELAS</span>
              </div>
              <h1 className="text-5xl font-black text-white drop-shadow-lg">{classInfo?.name}</h1>
           </div>
           
           <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 flex flex-col items-center">
              <span className="text-xs font-bold text-pink-300 uppercase tracking-widest mb-1">Gems Pribadi</span>
              <div className="flex items-center gap-2">
                <Gem className="w-6 h-6 text-pink-400 fill-pink-400" />
                <span className="text-2xl font-black text-white">{gems}</span>
              </div>
           </div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
         <Target className="text-pink-500" /> Crowdfunding Markas
      </h2>
      <p className="text-slate-500 mb-8 font-medium">Patungan Gems bersama teman sekelasmu untuk membeli dekorasi mewah bagi markas kalian!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {crowdfunds.map(item => {
            const Icon = ICON_MAP[item.icon] || Shield;
            const progressPercent = Math.min(100, (item.current_gems / item.target_gems) * 100);
            
            return (
              <div key={item.id} className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-sm flex flex-col">
                 <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200">
                       <Icon className="w-8 h-8 text-slate-600" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-800">{item.name}</h3>
                       <p className="text-sm font-medium text-slate-500 mt-1">{item.description}</p>
                    </div>
                 </div>
                 
                 <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress Patungan</span>
                       <span className="font-black text-pink-600 flex items-center gap-1">
                          {item.current_gems} / {item.target_gems} <Gem className="w-3 h-3 fill-current" />
                       </span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mb-6">
                       <div className="h-full bg-pink-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => handleDonate(item, 10)} className="py-2 bg-pink-50 text-pink-600 font-black rounded-xl hover:bg-pink-100 transition-colors border border-pink-200">+10</button>
                       <button onClick={() => handleDonate(item, 50)} className="py-2 bg-pink-100 text-pink-600 font-black rounded-xl hover:bg-pink-200 transition-colors border border-pink-300">+50</button>
                       <button onClick={() => handleDonate(item, 100)} className="py-2 bg-pink-500 text-white font-black rounded-xl hover:bg-pink-600 shadow-[0_4px_0_rgb(190,24,93)] active:translate-y-1 active:shadow-none transition-all">+100</button>
                    </div>
                 </div>
              </div>
            );
         })}
         
         {crowdfunds.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-12 border-2 border-dashed border-slate-300 rounded-[2rem]">
               <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="font-bold text-slate-500">Semua item dekorasi sudah terbeli! Markas kalian sudah maksimal.</p>
            </div>
         )}
      </div>
    </div>
  );
}
