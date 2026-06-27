"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Gem, ShoppingBag, Snowflake, Zap, MonitorPlay, Crown, Droplets, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const ICON_MAP: any = {
  Snowflake,
  Zap,
  MonitorPlay,
  Crown,
  Droplets
};

export default function ShopPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gems, setGems] = useState(0);
  const [factionDiscount, setFactionDiscount] = useState(0);

  useEffect(() => {
    fetchShopData();
  }, [profile]);

  const fetchShopData = async () => {
    if (!profile) return;
    setLoading(true);
    
    // Fetch profile gems
    const { data: pData } = await supabase.from("profiles").select("gems").eq("id", profile.id).single();
    if (pData) setGems(pData.gems || 0);

    // Fetch shop items
    const { data: sData } = await supabase.from("shop_items").select("*").order("price", { ascending: true });
    if (sData) setItems(sData);

    // Fetch user inventory
    const { data: iData } = await supabase.from("user_inventory").select("item_id, quantity, is_equipped").eq("user_id", profile.id);
    if (iData) setInventory(iData);
    
    // Check Faction Zone Control for Buffs (10% discount)
    if (profile.class_id) {
       const { data: zones } = await supabase.from("territory_zones").select("id").eq("controlling_class_id", profile.class_id);
       if (zones && zones.length > 0) {
          setFactionDiscount(0.10); // 10% discount
       }
    }

    setLoading(false);
  };

  const handleBuy = async (item: any) => {
    if (gems < item.price) {
      toast.error("Gems tidak cukup!");
      return;
    }

    const confirmBuy = window.confirm(`Beli ${item.name} seharga ${item.price} Gems?`);
    if (!confirmBuy) return;

    // Check if user already owns it
    const existing = inventory.find(i => i.item_id === item.id);
    
    if (existing) {
      if (item.type !== 'consumable') {
        toast.error("Kamu sudah memiliki item ini!");
        return;
      }
      
      // Update quantity
      await supabase.from("user_inventory")
        .update({ quantity: existing.quantity + 1 })
        .eq("user_id", profile?.id)
        .eq("item_id", item.id);
    } else {
      // Insert new
      await supabase.from("user_inventory").insert({
        user_id: profile?.id,
        item_id: item.id,
        quantity: 1,
        is_equipped: false
      });
    }

    // Deduct gems
    const finalPrice = Math.floor(item.price * (1 - factionDiscount));
    const newGems = gems - finalPrice;
    await supabase.from("profiles").update({ gems: newGems }).eq("id", profile?.id);
    
    setGems(newGems);
    toast.success(`Berhasil membeli ${item.name}!`);
    fetchShopData();
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-indigo-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-4xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
            <ShoppingBag className="w-10 h-10 text-pink-300" /> IGNITE Shop
          </h1>
          <p className="text-indigo-200 font-medium">Beli item kosmetik dan power-up untuk memperkuat statusmu di akademi!</p>
        </div>
        <div className="bg-white/10 p-6 rounded-3xl border-2 border-white/20 flex flex-col items-center">
          <p className="text-indigo-200 font-bold text-sm uppercase tracking-wider mb-1">Saldo Kamu</p>
          <div className="flex items-center gap-2">
            <Gem className="w-8 h-8 text-pink-400 fill-pink-400" />
            <span className="text-4xl font-black">{gems}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] || ShoppingBag;
          const isOwned = inventory.some(i => i.item_id === item.id);
          const isConsumable = item.type === 'consumable';
          const qty = isOwned ? inventory.find(i => i.item_id === item.id)?.quantity : 0;

          return (
            <div key={item.id} className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_8px_0_rgb(226,232,240)] hover:-translate-y-2 hover:shadow-[0_12px_0_rgb(226,232,240)] transition-all flex flex-col">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{item.name}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 flex-1">{item.description}</p>
              
              {isOwned && !isConsumable ? (
                <button disabled className="w-full py-4 rounded-2xl font-bold bg-slate-100 text-slate-400 border-2 border-slate-200 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Sudah Dimiliki
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  {isOwned && isConsumable && (
                    <p className="text-center text-xs font-bold text-indigo-600">Dimiliki: {qty}</p>
                  )}
                  <button 
                    onClick={() => handleBuy(item)}
                    className="w-full py-4 rounded-2xl font-black text-white bg-pink-500 hover:bg-pink-600 border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {factionDiscount > 0 && (
                       <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-bl-lg">
                          -10% BUFF
                       </div>
                    )}
                    <Gem className="w-5 h-5 fill-white" /> 
                    {factionDiscount > 0 ? (
                       <div className="flex items-center gap-2">
                          <span className="line-through text-pink-300 opacity-70 text-sm">{item.price}</span>
                          <span>{Math.floor(item.price * (1 - factionDiscount))}</span>
                       </div>
                    ) : (
                       item.price
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
