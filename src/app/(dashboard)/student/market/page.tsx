"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { ShoppingCart, Gem, PlusCircle, Tag, Loader2, Package } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DynamicMarketPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [listings, setListings] = useState<any[]>([]);
  const [myInventory, setMyInventory] = useState<any[]>([]);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showSell, setShowSell] = useState(false);
  const [sellItem, setSellItem] = useState<any>(null);
  const [sellPrice, setSellPrice] = useState(50);

  useEffect(() => {
    if (profile?.id) fetchData();
  }, [profile?.id]);

  const fetchData = async () => {
    setLoading(true);
    
    // Get Gems
    const { data: pData } = await supabase.from("profiles").select("gems").eq("id", profile?.id).single();
    if (pData) setGems(pData.gems || 0);

    // Get Active Listings
    const { data: lData } = await supabase.from("marketplace_listings")
      .select("*, seller:profiles!marketplace_listings_seller_id_fkey(full_name), item:shop_items(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (lData) setListings(lData);

    // Get My Inventory
    const { data: iData } = await supabase.from("user_inventory")
      .select("*, item:shop_items(*)")
      .eq("user_id", profile?.id)
      .gt("quantity", 0);
    if (iData) setMyInventory(iData);

    setLoading(false);
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellItem || sellPrice < 5) return;

    // Deduct from inventory
    await supabase.from("user_inventory").update({ quantity: sellItem.quantity - 1 }).eq("id", sellItem.id);
    
    // Create listing
    await supabase.from("marketplace_listings").insert({
       seller_id: profile?.id,
       shop_item_id: sellItem.item_id,
       price: sellPrice,
       status: 'active'
    });

    toast.success("Barang berhasil dipajang di Market!");
    setShowSell(false);
    fetchData();
  };

  const handleBuy = async (listing: any) => {
    if (listing.seller_id === profile?.id) {
       toast.error("Kamu tidak bisa membeli barangmu sendiri.");
       return;
    }
    if (gems < listing.price) {
       toast.error("Gems kamu tidak cukup!");
       return;
    }
    
    const confirm = window.confirm(`Beli ${listing.item?.name} seharga ${listing.price} Gems?`);
    if (!confirm) return;

    // 1. Deduct Gems from Buyer
    const newGems = gems - listing.price;
    await supabase.from("profiles").update({ gems: newGems }).eq("id", profile?.id);
    
    // 2. Add Gems to Seller
    const { data: seller } = await supabase.from("profiles").select("gems").eq("id", listing.seller_id).single();
    if (seller) {
       await supabase.from("profiles").update({ gems: (seller.gems || 0) + listing.price }).eq("id", listing.seller_id);
    }
    
    // 3. Mark Listing as sold
    await supabase.from("marketplace_listings").update({ status: 'sold' }).eq("id", listing.id);
    
    // 4. Add item to buyer's inventory
    const existing = myInventory.find(i => i.item_id === listing.shop_item_id);
    if (existing) {
       await supabase.from("user_inventory").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
       await supabase.from("user_inventory").insert({
          user_id: profile?.id,
          item_id: listing.shop_item_id,
          quantity: 1
       });
    }

    setGems(newGems);
    toast.success(`Berhasil membeli ${listing.item?.name}!`);
    fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-indigo-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden border-4 border-indigo-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="text-center md:text-left mb-6 md:mb-0 relative z-10">
          <h1 className="text-4xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
            <ShoppingCart className="w-10 h-10 text-emerald-400" /> IGNITE Market
          </h1>
          <p className="text-indigo-200 font-medium">Pasar bebas antar siswa. Jual barang berlebihmu atau berburu harta karun diskon!</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex flex-col items-center relative z-10">
          <p className="text-indigo-200 font-bold text-sm uppercase tracking-wider mb-1">Saldo Kamu</p>
          <div className="flex items-center gap-2">
            <Gem className="w-8 h-8 text-pink-400 fill-pink-400" />
            <span className="text-4xl font-black">{gems}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">Lelang Aktif</h2>
        <button 
          onClick={() => setShowSell(!showSell)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition-all"
        >
          <PlusCircle className="w-5 h-5" /> Jual Barang
        </button>
      </div>

      {showSell && (
        <div className="bg-white p-6 rounded-[2rem] border-4 border-emerald-100 shadow-xl mb-8 animate-in slide-in-from-top-4 fade-in">
          <h3 className="text-xl font-black text-slate-800 mb-4">Jual Barang dari Inventory</h3>
          {myInventory.length === 0 ? (
            <p className="text-slate-500 font-bold bg-slate-50 p-4 rounded-xl">Kamu tidak memiliki barang yang bisa dijual.</p>
          ) : (
            <form onSubmit={handleSell} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Pilih Barang</label>
                <select 
                   onChange={(e) => setSellItem(myInventory.find(i => i.id === e.target.value))}
                   className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-emerald-500"
                   required
                >
                   <option value="">-- Pilih Barang --</option>
                   {myInventory.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.item?.name} (Tersisa: {inv.quantity})</option>
                   ))}
                </select>
              </div>
              {sellItem && (
                 <div>
                   <label className="block text-sm font-bold text-slate-600 mb-1">Harga Jual (Gems)</label>
                   <div className="relative">
                     <Gem className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                     <input type="number" min="5" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 pl-12 font-black text-emerald-600 outline-none focus:border-emerald-500" required />
                   </div>
                 </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={!sellItem} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(4,120,87)] active:translate-y-1 active:shadow-none transition-all">
                  Pajang di Market
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-12 h-12 text-indigo-500 animate-spin" /></div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[3rem]">
           <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
           <p className="font-bold text-slate-400 text-lg">Pasar sedang sepi. Belum ada barang yang dijual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-[2rem] border-2 border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col">
               <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-lg border border-indigo-200">
                     Penjual: {listing.seller?.full_name?.split(" ")[0]}
                  </div>
                  <Tag className="text-slate-300" />
               </div>
               
               <h3 className="text-xl font-black text-slate-800 mb-2">{listing.item?.name}</h3>
               <p className="text-slate-500 text-sm font-medium mb-6 flex-1">{listing.item?.description}</p>
               
               <div className="pt-4 border-t border-slate-100 mt-auto">
                  {listing.seller_id === profile?.id ? (
                     <div className="w-full py-4 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-slate-200">
                        Barang Kamu
                     </div>
                  ) : (
                     <button 
                        onClick={() => handleBuy(listing)}
                        className="w-full py-4 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_4px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                     >
                        Beli <Gem className="w-5 h-5 fill-white" /> {listing.price}
                     </button>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
