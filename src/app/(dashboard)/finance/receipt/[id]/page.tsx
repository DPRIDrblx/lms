"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Download, GraduationCap } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Receipt {
  id: string;
  month: string;
  amount: number;
  status: string;
  payment_method: string;
  paid_at: string;
}

export default function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    supabase
      .from("finance_bills")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) setReceipt(data as Receipt);
      });
  }, [id, supabase]);

  if (!receipt) {
    return <div className="flex items-center justify-center py-20 text-[var(--text-tertiary)]">Loading...</div>;
  }

  const txId = `NIA-${receipt.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/finance" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Finance
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="mb-6"
          >
            <CheckCircle2 className="h-16 w-16 text-[var(--success)] mx-auto" />
          </motion.div>

          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Payment Receipt</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Transaction completed successfully</p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Nusantara International Academy</span>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3 text-left mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Transaction ID</span>
              <span className="text-sm font-mono font-medium text-[var(--text-primary)]">{txId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Bill Period</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{receipt.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Amount</span>
              <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(receipt.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Method</span>
              <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{receipt.payment_method?.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Date</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{receipt.paid_at ? formatDate(receipt.paid_at) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Status</span>
              <Badge variant="success">Paid</Badge>
            </div>
          </div>

          <Button variant="secondary" className="w-full" icon={<Download className="h-4 w-4" />}>
            Download Receipt
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
