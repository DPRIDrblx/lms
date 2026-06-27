"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight,
  BellRing,
  Activity,
  Info
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function ParentCardsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("card_inventory")
      .select(`
        *,
        student:profiles!card_inventory_student_id_fkey(full_name, id, wallets(balance))
      `)
      .eq("parent_id", profile.id);
    
    if (data) setCards(data);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchCards();
    const channel = supabase.channel('parent-cards')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_inventory' }, () => fetchCards())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCards, supabase]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <header className="mb-8 bg-indigo-500 rounded-3xl p-8 border-2 border-indigo-600 shadow-[0_8px_0_rgb(79,70,229)] text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <h1 className="text-3xl font-black flex items-center gap-3 mb-2 relative z-10">
          <div className="p-3 bg-white text-indigo-500 rounded-2xl shadow-sm -rotate-3">
            <CreditCard className="h-6 w-6" strokeWidth={3} />
          </div>
          Family Smart Cards
        </h1>
        <p className="text-indigo-100 font-bold relative z-10">Monitor active hardware and synchronized wallet balances.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="h-48 rounded-3xl bg-[var(--bg-secondary)] animate-pulse" />
          ) : cards.length > 0 ? (
            cards.map((card) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white p-0 overflow-hidden rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] hover:border-indigo-300 transition-all">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    {/* Visual Card */}
                    <div className="w-full md:w-64 aspect-[1.6/1] rounded-2xl bg-indigo-500 p-6 text-white relative shadow-[0_4px_0_rgb(79,70,229)] border-2 border-indigo-600 shrink-0 overflow-hidden">
                      <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                           <CreditCard className="h-8 w-8 opacity-80" strokeWidth={2.5} />
                           <div className="bg-white/20 text-white font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider">Active Binding</div>
                        </div>
                        <div className="font-mono text-xl font-black tracking-[0.2em] mb-4">
                          •••• {card.serial_number.slice(-4)}
                        </div>
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[8px] uppercase opacity-70 font-black tracking-widest">Authorized User</p>
                              <p className="text-sm font-black truncate max-w-[120px]">{card.student?.full_name}</p>
                           </div>
                           <ShieldCheck className="h-6 w-6 opacity-80" strokeWidth={2.5} />
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Activity className="h-32 w-32" />
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Student Balance</p>
                           <h3 className="text-3xl font-black text-slate-800">
                             {formatCurrency(card.student?.wallets?.[0]?.balance || card.student?.wallets?.balance || 0)}
                           </h3>
                        </div>
                        <Link href="/parent/finance">
                           <button className="bg-indigo-50 text-indigo-600 border-2 border-indigo-200 font-black rounded-xl px-4 py-2 shadow-[0_4px_0_rgb(199,210,254)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                             Top Up <ArrowRight className="h-4 w-4" strokeWidth={3} />
                           </button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-slate-100">
                        <div className="space-y-2">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</p>
                           <div className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-600 border-2 border-emerald-200 rounded-xl font-black text-xs">
                             Synchronized
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Notifications</p>
                           <div className="flex items-center gap-1.5 text-xs font-black text-indigo-500 bg-indigo-50 border-2 border-indigo-100 px-3 py-1 rounded-xl w-fit">
                              <BellRing className="h-4 w-4" strokeWidth={3} /> Enabled
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center border-dashed border-2 border-slate-200 rounded-3xl bg-white">
               <CreditCard className="h-16 w-16 text-slate-300 mx-auto mb-4 opacity-50" strokeWidth={1.5} />
               <h4 className="text-xl font-black text-slate-800">No Active Cards</h4>
               <p className="text-sm font-bold text-slate-500 mt-2">Cards linked by the TU will appear here automatically.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-slate-50 border-2 border-slate-200 border-dashed rounded-3xl">
             <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-500 mb-4 border-2 border-indigo-200 shadow-sm rotate-3">
                <Smartphone className="h-6 w-6" strokeWidth={3} />
             </div>
             <h4 className="text-lg font-black text-slate-800">Real-time Push</h4>
             <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
                As a linked parent, you receive instant push notifications every time this card is tapped for:
             </p>
             <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_4px_0_rgb(226,232,240)] text-xs font-black text-slate-700">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" /> Attendance Check-in
                </li>
                <li className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_4px_0_rgb(226,232,240)] text-xs font-black text-slate-700">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" /> Canteen Wallet Transactions
                </li>
                <li className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_4px_0_rgb(226,232,240)] text-xs font-black text-slate-700">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" /> Library Asset Checkout
                </li>
             </ul>
          </div>

          <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-3xl shadow-[0_4px_0_rgb(253,230,138)]">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-200 text-amber-600 rounded-xl rotate-3">
                  <Info className="h-5 w-5" strokeWidth={3} />
                </div>
                <h4 className="text-sm font-black text-amber-800">Joint Ownership</h4>
             </div>
             <p className="text-xs font-bold text-amber-700/80 leading-relaxed">
                Smart cards are bound to the Student's identity. Your oversight is linked via the academy's <strong>Joint Ownership Policy</strong>, allowing shared wallet control and activity monitoring.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
