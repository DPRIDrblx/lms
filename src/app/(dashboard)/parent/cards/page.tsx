"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  ShieldCheck, 
  Smartphone, 
  ArrowRight,
  BellRing,
  Wallet,
  Activity,
  User,
  Info
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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
        student:profiles!card_inventory_student_id_fkey(full_name, id),
        wallet:wallets!card_inventory_student_id_fkey(balance)
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
      <header>
        <h1 className="text-3xl font-black text-[var(--text-primary)]">Family Smart Cards</h1>
        <p className="text-[var(--text-secondary)] mt-1">Monitor active hardware and synchronized wallet balances.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="h-48 rounded-3xl bg-[var(--bg-secondary)] animate-pulse" />
          ) : cards.length > 0 ? (
            cards.map((card) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-0 overflow-hidden border-2 border-[var(--border)] hover:border-[var(--accent)] transition-all shadow-xl">
                  <div className="p-8 flex flex-col md:flex-row gap-8">
                    {/* Visual Card */}
                    <div className="w-full md:w-64 aspect-[1.6/1] rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#6366f1] p-6 text-white relative shadow-2xl shadow-[var(--accent)]/30 shrink-0">
                      <div className="flex justify-between items-start mb-8">
                         <CreditCard className="h-8 w-8 opacity-80" />
                         <Badge className="bg-white/20 text-white border-none text-[8px] uppercase tracking-tighter">Active Binding</Badge>
                      </div>
                      <div className="font-mono text-lg tracking-[0.2em] mb-4">
                        •••• {card.serial_number.slice(-4)}
                      </div>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[8px] uppercase opacity-60 font-black">Authorized User</p>
                            <p className="text-xs font-bold truncate max-w-[120px]">{card.student?.full_name}</p>
                         </div>
                         <ShieldCheck className="h-5 w-5 opacity-80" />
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <Activity className="h-24 w-24" />
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Student Balance</p>
                           <h3 className="text-3xl font-black text-[var(--text-primary)]">
                             Rp {card.wallet?.balance?.toLocaleString() || 0}
                           </h3>
                        </div>
                        <Link href="/parent/finance">
                           <Button variant="secondary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>Top Up</Button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Status</p>
                           <Badge variant="success" className="rounded-full">Synchronized</Badge>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Notifications</p>
                           <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--success)]">
                              <BellRing className="h-3 w-3" /> Enabled
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="py-20 text-center border-dashed border-2">
               <CreditCard className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4 opacity-20" />
               <h4 className="text-lg font-bold text-[var(--text-primary)]">No Active Cards</h4>
               <p className="text-sm text-[var(--text-secondary)] mt-2">Cards linked by the TU will appear here automatically.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-[var(--bg-secondary)] border-none">
             <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-4">
                <Smartphone className="h-6 w-6" />
             </div>
             <h4 className="text-lg font-bold text-[var(--text-primary)]">Real-time Push</h4>
             <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                As a linked parent, you receive instant push notifications every time this card is tapped for:
             </p>
             <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-primary)]">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> Attendance Check-in
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-primary)]">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> Canteen Wallet Transactions
                </li>
                <li className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-primary)]">
                   <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> Library Asset Checkout
                </li>
             </ul>
          </Card>

          <Card className="p-6 bg-[var(--bg-secondary)] border-none">
             <div className="flex items-center gap-3 mb-4">
                <Info className="h-5 w-5 text-[var(--text-tertiary)]" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Joint Ownership</h4>
             </div>
             <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                Smart cards are bound to the Student's identity. Your oversight is linked via the academy's <strong>Joint Ownership Policy</strong>, allowing shared wallet control and activity monitoring.
             </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
