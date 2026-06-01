"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Bill {
  id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  payment_method: string | null;
  paid_at: string | null;
}

export default function FinancePage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [bills, setBills] = useState<Bill[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    
    // 1. Fetch Bills
    const query = profile.role === "teacher"
      ? supabase.from("finance_bills").select("*").order("created_at", { ascending: false })
      : supabase.from("finance_bills").select("*").eq("student_id", profile.id).order("created_at", { ascending: false });

    const { data: billsData } = await query;
    if (billsData) setBills(billsData as Bill[]);

    // 2. Fetch Wallet
    if (profile.role === "student" || profile.role === "parent") {
       const studentId = profile.role === "student" ? profile.id : null; // Handle parent child lookup if needed
       if (studentId) {
          const { data: walletData } = await supabase.from("wallets").select("balance").eq("student_id", studentId).single();
          if (walletData) setWallet(walletData);
       }
    }
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to Realtime
    const channel = supabase.channel('finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_bills' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => fetchData())
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, supabase]);

  const totalPaid = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const outstanding = bills.filter((b) => b.status === "unpaid").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Finance & Billing</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">Manage your tuition payments and wallet balance.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Wallet */}
        <div className="bg-[var(--bg-secondary)] backdrop-blur-lg p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">{formatCurrency(wallet?.balance || 0)}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Canteen Wallet</p>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-[var(--bg-secondary)] backdrop-blur-lg p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${outstanding > 0 ? "bg-rose-100/50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"}`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">{formatCurrency(outstanding)}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Outstanding SPP</p>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-[var(--bg-secondary)] backdrop-blur-lg p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">{formatCurrency(totalPaid)}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Total Paid</p>
          </div>
        </div>

        {/* Total Billing */}
        <div className="bg-[var(--bg-secondary)] backdrop-blur-lg p-6 rounded-3xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-2xl bg-purple-100/50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-1">{formatCurrency(totalPaid + outstanding)}</h3>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Total Billing</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Billing History</h2>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1.5 rounded-full">
            <Wallet className="h-3.5 w-3.5" /> SPP Records
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[var(--bg-tertiary)]/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : bills.length === 0 ? (
          <div className="py-12 text-center">
             <CreditCard className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
             <p className="text-sm font-medium text-[var(--text-secondary)]">No billing records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-secondary)] border-b border-[var(--border)]">
                  <th className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Month</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-[11px]">Method</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 font-bold text-[var(--text-primary)]">{bill.month}</td>
                    <td className="py-4 font-medium text-[var(--text-secondary)]">{formatCurrency(bill.amount)}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm border ${bill.status === "paid" ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                        {bill.status === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="py-4 text-[var(--text-secondary)] capitalize font-medium">{bill.payment_method || "—"}</td>
                    <td className="py-4 text-right">
                      {bill.status === "unpaid" ? (
                        <Link href={`/finance/checkout/${bill.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm">
                          Pay Now
                        </Link>
                      ) : (
                        <Link href={`/finance/receipt/${bill.id}`} className="inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-700 text-[var(--text-primary)] text-xs font-bold rounded-xl transition-colors shadow-sm">
                          Receipt
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
