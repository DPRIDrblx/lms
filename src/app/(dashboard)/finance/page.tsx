"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const query = profile.role === "teacher"
      ? supabase.from("finance_bills").select("*").order("created_at", { ascending: false })
      : supabase.from("finance_bills").select("*").eq("student_id", profile.id).order("created_at", { ascending: false });

    query.then(({ data }: { data: any }) => {
      if (data) setBills(data as Bill[]);
      setLoading(false);
    });
  }, [profile, supabase]);

  const totalDue = bills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = bills.filter((b: any) => b.status === "paid").reduce((s: number, b: any) => s + b.amount, 0);
  const outstanding = totalDue - totalPaid;

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Finance & Billing</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your tuition payments (SPP).</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Due" value={formatCurrency(totalDue)} icon={CreditCard} color="#4F46E5" />
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} color="#059669" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} icon={AlertCircle} color={outstanding > 0 ? "#DC2626" : "#059669"} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Billing History</h2>
          <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            <Wallet className="h-3.5 w-3.5" /> SPP Records
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : bills.length === 0 ? (
          <p className="py-8 text-center text-[var(--text-tertiary)]">No billing records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-tertiary)] border-b border-[var(--border)]">
                  <th className="pb-3 font-medium">Month</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="py-3 font-medium text-[var(--text-primary)]">{bill.month}</td>
                    <td className="py-3 text-[var(--text-secondary)]">{formatCurrency(bill.amount)}</td>
                    <td className="py-3">
                      <Badge variant={bill.status === "paid" ? "success" : "warning"}>
                        {bill.status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    </td>
                    <td className="py-3 text-[var(--text-secondary)] capitalize">{bill.payment_method || "—"}</td>
                    <td className="py-3 text-right">
                      {bill.status === "unpaid" ? (
                        <Link href={`/finance/checkout/${bill.id}`}>
                          <Button size="sm">Pay Now</Button>
                        </Link>
                      ) : (
                        <Link href={`/finance/receipt/${bill.id}`}>
                          <Button size="sm" variant="ghost">Receipt</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
