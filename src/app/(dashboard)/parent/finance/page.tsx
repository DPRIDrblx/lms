"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Smartphone,
  Banknote
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Bill {
  id: string;
  month: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
}

export default function ParentFinancePage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    
    // 1. Get linked child
    const { data: link } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", profile.id).single();
    if (link) {
       const [childRes, billsRes, walletRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", link.student_id).single(),
          supabase.from("finance_bills").select("*").eq("student_id", link.student_id).order("created_at", { ascending: false }),
          supabase.from("wallets").select("balance").eq("student_id", link.student_id).single()
       ]);
       
       if (childRes.data) setChild(childRes.data);
       if (billsRes.data) setBills(billsRes.data as any);
       if (walletRes.data) setWallet(walletRes.data);
    }
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('parent-finance-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_bills' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  if (loading) return <div className="p-20 text-center animate-pulse">Synchronizing child financial data...</div>;

  const outstanding = bills.filter(b => b.status !== "paid").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
         <h1 className="text-3xl font-black text-[var(--text-primary)]">Finance Oversight</h1>
         <p className="text-[var(--text-secondary)] mt-1">Manage school fees and monitor canteen allowance for {child?.full_name}.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="p-8 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                 <div className="absolute -right-4 -bottom-4 opacity-10"><CreditCard className="h-32 w-32" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Outstanding Fees</p>
                 <h2 className="text-3xl font-black">{formatCurrency(outstanding)}</h2>
                 <p className="text-[10px] mt-4 font-bold bg-white/20 w-fit px-2 py-1 rounded">Next due: 15th Next Month</p>
              </Card>
              <Card className="p-8 bg-emerald-600 text-white border-none shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                 <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="h-32 w-32" /></div>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Canteen Wallet Balance</p>
                 <h2 className="text-3xl font-black">{formatCurrency(wallet?.balance || 0)}</h2>
                 <Button variant="secondary" className="mt-4 bg-white/20 text-white border-none hover:bg-white/30 text-[10px] h-8">Top Up Now</Button>
              </Card>
           </div>

           {/* Billing History */}
           <Card className="p-0 overflow-hidden border-[var(--border)]">
              <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                 <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Billing History</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border-b border-[var(--border)]">
                          <th className="px-6 py-4">Billing Period</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                       {bills.map(bill => (
                          <tr key={bill.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                             <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">{bill.month}</td>
                             <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{formatCurrency(bill.amount)}</td>
                             <td className="px-6 py-4">
                                <Badge variant={bill.status === "paid" ? "success" : "warning"} className="font-bold">
                                   {bill.status}
                                </Badge>
                             </td>
                             <td className="px-6 py-4 text-right">
                                {bill.status !== "paid" ? (
                                   <Link href={`/finance/checkout/${bill.id}`}>
                                      <Button size="sm" icon={<ArrowRight className="h-4 w-4" />}>Pay Now</Button>
                                   </Link>
                                ) : (
                                   <Button variant="ghost" size="sm" icon={<CheckCircle2 className="h-4 w-4" />}>Receipt</Button>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="p-6 bg-[var(--bg-secondary)] border-none">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)] mb-4 flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4 text-indigo-500" /> Secure Payments
              </h4>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-6">
                 All school fee payments are processed via our encrypted Academy Gateway. We support Virtual Accounts, E-Wallets, and Credit Cards.
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">Bank Virtual Accounts</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <Smartphone className="h-4 w-4 text-[var(--text-tertiary)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">OVO, GoPay & QRIS</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <Banknote className="h-4 w-4 text-[var(--text-tertiary)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">Instant Over-the-Counter</span>
                 </div>
              </div>
           </Card>

           <Card className="p-6 bg-slate-900 text-white border-none shadow-xl">
              <h4 className="text-sm font-bold mb-2">Automated Billing</h4>
              <p className="text-xs opacity-60 leading-relaxed mb-4">
                 Enable auto-debit from your child's canteen wallet for seamless monthly fee settlements.
              </p>
              <Button className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 border-none">Enable Auto-Pay</Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
