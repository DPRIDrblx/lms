"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { processPayment } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Building2, Smartphone, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { XenditPaymentModal } from "@/components/finance/XenditPaymentModal";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [bill, setBill] = useState<{ id: string; month: string; amount: number } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from("finance_bills")
      .select("id, month, amount")
      .eq("id", id)
      .single()
      .then(({ data }: { data: any }) => {
        if (data) setBill(data);
      });
  }, [id, supabase]);

  const handlePay = async () => {
    if (!selectedMethod || !bill) return;
    setProcessing(true);

    // Simulate high-fidelity payment gateway handshake
    await new Promise((r) => setTimeout(r, 2000));

    try {
      await processPayment(bill.id, selectedMethod);
    } catch (err: any) {
      toast.error("Payment sync failed: " + err.message);
      setProcessing(false);
      return;
    }

    toast.success("Payment verified by Academy Finance Gateway!");
    setProcessing(false);
    setSuccess(true);

    setTimeout(() => {
      router.push(`/finance/receipt/${bill.id}`);
    }, 2500);
  };

  if (!bill) {
    return <div className="flex items-center justify-center py-20 text-[var(--text-tertiary)]">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/finance" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Finance
      </Link>

      <XenditPaymentModal 
        isOpen={true} 
        onClose={() => router.push("/finance")}
        amount={bill.amount}
        title="SPP & Billing Payment"
        onSuccess={async () => {
          setProcessing(true);
          try {
            await processPayment(bill.id, "xendit_mock");
            router.push(`/finance/receipt/${bill.id}`);
          } catch (err: any) {
            toast.error("Payment sync failed: " + err.message);
          }
          setProcessing(false);
        }}
      />
    </div>
  );
}
