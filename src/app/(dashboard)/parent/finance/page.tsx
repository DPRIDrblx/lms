"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
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
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { MockPaymentModal } from "@/components/finance/MockPaymentModal";

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
  const [wallet, setWallet] = useState<any>(null);
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50000);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    
    // 1. Get linked child
    const { data: link } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", profile.id).single();
    if (link) {
       const [childRes, billsRes, walletRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", link.student_id).single(),
          supabase.from("finance_bills").select("*").eq("student_id", link.student_id).order("created_at", { ascending: false }),
          supabase.from("wallets").select("*").eq("student_id", link.student_id).single()
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

  const handleTopUpSuccess = async () => {
    if (!wallet || !child) return;

    const { error } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: topUpAmount,
      type: "topup",
      description: "Parent Canteen Top Up",
      status: "completed"
    });

    if (!error) {
      // Balance updates via real-time trigger in DB or real-time listener
    }
  };

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
              <div className="rounded-3xl p-8 bg-indigo-500 text-white border-2 border-indigo-600 shadow-[0_8px_0_rgb(79,70,229)] relative overflow-hidden transition-all duration-200">
                 <div className="absolute -right-4 -bottom-4 opacity-20"><CreditCard className="h-32 w-32" /></div>
                 <p className="text-xs font-black uppercase tracking-widest opacity-90 mb-2">Total Outstanding Fees</p>
                 <h2 className="text-4xl font-black mb-4">{formatCurrency(outstanding)}</h2>
                 <div className="inline-block text-xs font-black bg-white/20 px-3 py-1.5 rounded-xl">Next due: 15th Next Month</div>
              </div>
              <div className="rounded-3xl p-8 bg-emerald-500 text-white border-2 border-emerald-600 shadow-[0_8px_0_rgb(5,150,105)] relative overflow-hidden transition-all duration-200 flex flex-col justify-between">
                 <div className="absolute -right-4 -bottom-4 opacity-20"><Wallet className="h-32 w-32" /></div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-widest opacity-90 mb-2">Canteen Wallet Balance</p>
                   <h2 className="text-4xl font-black">{formatCurrency(wallet?.balance || 0)}</h2>
                 </div>
                 <button onClick={() => setIsTopUpOpen(true)} className="mt-6 bg-white text-emerald-600 border-2 border-emerald-200 font-black rounded-xl px-4 py-3 shadow-[0_4px_0_rgb(209,250,229)] active:translate-y-1 active:shadow-none transition-all w-fit z-10 relative text-sm">
                   Top Up Now
                 </button>
              </div>
           </div>

           {/* Billing History */}
           <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
              <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                   <Clock className="w-5 h-5 text-indigo-500" strokeWidth={3} /> Billing History
                 </h3>
              </div>
              <div className="p-6 space-y-4">
                 {bills.map(bill => (
                    <div key={bill.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 transition-colors bg-white">
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className="font-black text-slate-800 text-lg">{bill.month}</h4>
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 ${bill.status === "paid" ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-amber-100 text-amber-600 border-amber-200"}`}>
                                {bill.status}
                             </div>
                          </div>
                          <p className="text-sm font-bold text-slate-500">School Fees & Miscellaneous</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-slate-800">{formatCurrency(bill.amount)}</span>
                          {bill.status !== "paid" ? (
                             <Link href={`/finance/checkout/${bill.id}`}>
                                <button className="bg-indigo-500 text-white rounded-xl px-4 py-2 font-black text-sm border-2 border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
                                   Pay Now <ArrowRight className="w-4 h-4" strokeWidth={3} />
                                </button>
                             </Link>
                          ) : (
                             <button className="bg-slate-100 text-slate-500 rounded-xl px-4 py-2 font-black text-sm border-2 border-slate-200 active:translate-y-1 transition-all flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={3} /> Receipt
                             </button>
                          )}
                       </div>
                    </div>
                 ))}
                 
                 {bills.length === 0 && (
                   <div className="text-center py-8 text-slate-400 font-bold">
                     No bills found.
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-200 border-dashed">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5 text-indigo-500" strokeWidth={3} /> Secure Payments
              </h4>
              <p className="text-sm font-bold text-slate-500 leading-relaxed mb-6">
                 All school fee payments are processed via our encrypted Academy Gateway. We support Virtual Accounts, E-Wallets, and Credit Cards.
              </p>
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Building2 className="h-5 w-5" strokeWidth={3} /></div>
                    <span className="text-sm font-black text-slate-700">Bank Virtual Accounts</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                    <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600"><Smartphone className="h-5 w-5" strokeWidth={3} /></div>
                    <span className="text-sm font-black text-slate-700">OVO, GoPay & QRIS</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><Banknote className="h-5 w-5" strokeWidth={3} /></div>
                    <span className="text-sm font-black text-slate-700">Over-the-Counter</span>
                 </div>
              </div>
           </div>

           <div className="rounded-3xl p-6 bg-slate-800 text-white border-2 border-slate-900 shadow-[0_8px_0_rgb(15,23,42)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
              <h4 className="text-lg font-black mb-2 relative z-10">Automated Billing</h4>
              <p className="text-sm font-bold text-slate-300 leading-relaxed mb-6 relative z-10">
                 Enable auto-debit from your child's canteen wallet for seamless monthly fee settlements.
              </p>
              <button className="w-full bg-indigo-500 text-white border-2 border-indigo-600 font-black rounded-xl px-4 py-3 shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all relative z-10">
                Enable Auto-Pay
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isTopUpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-2xl">
                <h3 className="text-xl font-black mb-6 text-slate-800 text-center">Select Top Up Amount</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   {[20000, 50000, 100000, 200000].map(amt => (
                      <button 
                         key={amt} 
                         className={cn(
                           "h-14 rounded-2xl font-black text-sm transition-all border-2",
                           topUpAmount === amt 
                             ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner" 
                             : "bg-white border-slate-200 text-slate-600 shadow-[0_4px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none"
                         )}
                         onClick={() => setTopUpAmount(amt)}
                      >
                         {formatCurrency(amt)}
                      </button>
                   ))}
                </div>
                <div className="flex gap-4">
                   <button 
                     className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black border-2 border-slate-200 active:translate-y-1 transition-all"
                     onClick={() => setIsTopUpOpen(false)}
                   >
                     Cancel
                   </button>
                   <button 
                     className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black border-2 border-emerald-600 shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all"
                     onClick={() => {
                        setIsTopUpOpen(false);
                        setIsPaymentModalOpen(true);
                     }}
                   >
                     Proceed
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MockPaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={topUpAmount}
        onSuccess={async () => {
          // Add to wallet
          if (wallet && child) {
             const { error } = await supabase.from("wallets").update({
                balance: (wallet.balance || 0) + topUpAmount
             }).eq("id", wallet.id);
             
             if (!error) {
                setWallet({ ...wallet, balance: (wallet.balance || 0) + topUpAmount });
             }
          }
          setIsPaymentModalOpen(false);
        }}
      />
    </div>
  );
}
