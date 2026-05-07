"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CreditCard, Clock, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

interface Bill {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  created_at: string;
  profiles: { full_name: string } | null;
}

export default function ParentFinancePage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [topUpChild, setTopUpChild] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState(50000);

  const fetchBills = useCallback(async () => {
    if (!profile) return;
    
    // Get linked children with their wallets
    const { data: links } = await supabase
      .from("parent_student_links")
      .select(`
        student_id,
        profiles!parent_student_links_student_id_fkey(
          full_name,
          wallets(id, balance)
        )
      `)
      .eq("parent_id", profile.id);
    
    if (links) {
      setChildren(links.map((l: any) => ({
        id: l.student_id,
        full_name: l.profiles.full_name,
        wallet: l.profiles.wallets[0]
      })));

      const childIds = links.map((l: any) => l.student_id);
      const { data } = await supabase
        .from("finance_bills")
        .select("*, profiles!finance_bills_student_id_fkey(full_name)")
        .in("student_id", childIds)
        .order("created_at", { ascending: false });
      
      if (data) setBills(data as unknown as Bill[]);
    }
    setLoading(false);
  }, [profile, supabase]);

  const handleTopUpSuccess = async () => {
    if (!topUpChild?.wallet || !profile) return;

    await supabase.from("wallet_transactions").insert({
      wallet_id: topUpChild.wallet.id,
      amount: topUpAmount,
      type: "topup",
      description: `Parental Top-Up (${profile.full_name})`
    });

    fetchBills();
    setTopUpChild(null);
  };

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const unpaidBills = bills.filter(b => b.status === "unpaid");
  const totalOutstanding = unpaidBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Financial Oversight</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage tuition payments and canteen wallets for your children.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-[var(--accent)] to-[#4f46e5] text-white overflow-hidden relative shadow-xl shadow-[var(--accent)]/20 p-8">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80 mb-1">Tuition Outstanding</p>
            <h2 className="text-4xl font-black mb-10 tracking-tight">{formatCurrency(totalOutstanding)}</h2>
            <div className="flex gap-3">
              <Button variant="secondary" className="bg-white text-[var(--accent)] hover:bg-white/90 border-none shadow-lg h-12 px-8">
                Pay All Dues
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20 h-12">
                Download Statement
              </Button>
            </div>
          </div>
          <Wallet className="absolute right-[-20px] bottom-[-20px] h-48 w-48 opacity-10 rotate-12" />
        </Card>

        <Card className="flex flex-col justify-center items-center text-center p-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--success-light)] flex items-center justify-center text-[var(--success)] mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Safe-Pay Active</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">Auto-billing is enabled for monthly installments.</p>
          <Button variant="ghost" size="sm" className="mt-6 text-[var(--accent)] font-bold">Configure Settings</Button>
        </Card>
      </div>

      {/* Child Wallets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Child Canteen Wallets</h3>
          <Badge variant="success" className="px-3">Real-time Sync</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => (
            <Card key={child.id} className="p-6 hover:shadow-lg transition-all border-[var(--border)] group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold">
                    {child.full_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{child.full_name}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-black">Student ID: {child.id.substring(0,8)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-6">
                <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-1">Current Balance</p>
                <p className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(child.wallet?.balance || 0)}</p>
              </div>
              <Button 
                variant="secondary" 
                className="w-full h-11 font-bold group-hover:bg-[var(--accent)] group-hover:text-white transition-all"
                onClick={() => setTopUpChild(child)}
              >
                Instant Top-Up
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-[var(--text-primary)] px-1">Payment History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
            ))}
          </div>
        ) : bills.length > 0 ? (
          <div className="space-y-3">
            {bills.map((bill) => (
              <motion.div key={bill.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="hover:border-[var(--accent)]/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        bill.status === "paid" ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-[var(--warning-light)] text-[var(--warning)]"
                      }`}>
                        {bill.status === "paid" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[var(--text-primary)]">{bill.month}</p>
                          <Badge variant="info" className="text-[9px] py-0">{bill.profiles?.full_name}</Badge>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">{formatCurrency(bill.amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={bill.status === "paid" ? "success" : "warning"}>
                        {bill.status.toUpperCase()}
                      </Badge>
                      {bill.status === "unpaid" ? (
                        <Link href={`/finance/checkout/${bill.id}`}>
                          <Button size="sm" icon={<ChevronRight className="h-3.5 w-3.5" />}>Pay Now</Button>
                        </Link>
                      ) : (
                        <Link href={`/finance/receipt/${bill.id}`}>
                          <Button variant="ghost" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>Receipt</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-12">No billing records found.</p>
        )}
      </div>

      <MockPaymentModal 
        isOpen={!!topUpChild}
        onClose={() => setTopUpChild(null)}
        amount={topUpAmount}
        onSuccess={handleTopUpSuccess}
        title={`Top-up for ${topUpChild?.full_name}`}
      />
    </div>
  );
}

import { MockPaymentModal } from "@/components/finance/MockPaymentModal";
