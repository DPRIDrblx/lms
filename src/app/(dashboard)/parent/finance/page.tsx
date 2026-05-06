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

  const fetchBills = useCallback(async () => {
    if (!profile) return;
    
    // Get linked children
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", profile.id);
    
    if (links && links.length > 0) {
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

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const unpaidBills = bills.filter(b => b.status === "unpaid");
  const totalOutstanding = unpaidBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">School Fees & SPP</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage tuition payments and view transaction history for your children.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-[var(--accent)] text-white overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80 mb-1">Total Outstanding Balance</p>
            <h2 className="text-3xl font-bold mb-6">{formatCurrency(totalOutstanding)}</h2>
            <div className="flex gap-4">
              <Button variant="secondary" className="bg-white text-[var(--accent)] hover:bg-white/90 border-none shadow-lg">
                Pay All Dues
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20">
                View Policy
              </Button>
            </div>
          </div>
          <Wallet className="absolute right-[-20px] bottom-[-20px] h-48 w-48 opacity-10 rotate-12" />
        </Card>

        <Card className="flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success-light)] flex items-center justify-center text-[var(--success)] mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-[var(--text-primary)]">Auto-Pay Active</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Next payment scheduled for June 1, 2026</p>
          <Button variant="ghost" size="sm" className="mt-4 text-[var(--accent)]">Manage Settings</Button>
        </Card>
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
    </div>
  );
}
