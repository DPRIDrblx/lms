"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Building2, Smartphone, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

const METHODS = [
  { id: "bank_transfer", label: "Bank Transfer", icon: Building2, banks: ["BCA", "Mandiri", "BNI"] },
  { id: "gopay", label: "GoPay", icon: Smartphone },
  { id: "ovo", label: "OVO", icon: Smartphone },
  { id: "credit_card", label: "Credit Card", icon: CreditCard },
];

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

    const { error } = await supabase
      .from("finance_bills")
      .update({
        status: "paid",
        payment_method: selectedMethod,
        transaction_id: `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        paid_at: new Date().toISOString(),
      })
      .eq("id", bill.id);

    if (error) {
      toast.error("Payment sync failed: " + error.message);
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

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <CheckCircle2 className="h-20 w-20 text-[var(--success)] mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Payment Successful!</h2>
            <p className="text-sm text-[var(--text-secondary)]">Redirecting to your receipt...</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Payment Summary</h2>
              <div className="flex justify-between py-3 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--text-secondary)]">Bill Period</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{bill.month}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-[var(--text-secondary)]">Amount</span>
                <span className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(bill.amount)}</span>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                      selectedMethod === method.id
                        ? "border-[var(--accent)] bg-[var(--accent-light)] ring-2 ring-[var(--accent)]/20"
                        : "border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-primary)]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedMethod === method.id ? "bg-[var(--accent)]/10" : "bg-[var(--bg-tertiary)]"}`}>
                      <method.icon className={`h-5 w-5 ${selectedMethod === method.id ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{method.label}</p>
                      {method.banks && (
                        <p className="text-xs text-[var(--text-tertiary)]">{method.banks.join(", ")}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selectedMethod && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-[var(--bg-secondary)]">
                  {selectedMethod === "bank_transfer" && (
                    <div className="text-center space-y-2">
                      <p className="text-sm text-[var(--text-secondary)]">Virtual Account Number</p>
                      <p className="text-2xl font-mono font-bold text-[var(--text-primary)] tracking-wider">8800 1234 5678 9012</p>
                      <p className="text-xs text-[var(--text-tertiary)]">Transfer exactly {formatCurrency(bill.amount)}</p>
                    </div>
                  )}
                  {selectedMethod === "gopay" && (
                    <div className="text-center space-y-2">
                      <div className="w-40 h-40 mx-auto bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center">
                        <p className="text-xs text-[var(--text-tertiary)]">GoPay QR Code</p>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">Scan with your GoPay app</p>
                    </div>
                  )}
                  {selectedMethod === "ovo" && (
                    <div className="space-y-2">
                      <p className="text-sm text-[var(--text-secondary)]">OVO Phone Number</p>
                      <input
                        type="tel"
                        placeholder="08xx xxxx xxxx"
                        className="w-full h-11 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                      />
                    </div>
                  )}
                  {selectedMethod === "credit_card" && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-[var(--text-secondary)] mb-1">Card Number</p>
                        <input placeholder="•••• •••• •••• ••••" className="w-full h-10 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[var(--text-secondary)] mb-1">Expiry</p>
                          <input placeholder="MM/YY" className="w-full h-10 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-secondary)] mb-1">CVV</p>
                          <input placeholder="•••" className="w-full h-10 px-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all" />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {selectedMethod && !processing && !success && (
               <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 mb-6">
                  <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                     Tip: You are in **Sandbox Mode**. Click the button below to simulate a real payment confirmation through our Academy Gateway.
                  </p>
               </div>
            )}

            <div className="flex flex-col gap-3">
               <Button
                 size="lg"
                 className="w-full h-14 text-base font-bold shadow-xl shadow-[var(--accent)]/20"
                 disabled={!selectedMethod}
                 loading={processing}
                 onClick={handlePay}
                 icon={<ShieldCheck className="h-5 w-5" />}
               >
                 {processing ? "Verifying Transaction..." : `Confirm Payment Simulation — ${formatCurrency(bill.amount)}`}
               </Button>
               
               <p className="text-[10px] text-center text-[var(--text-tertiary)] uppercase font-black tracking-widest">
                  Secure Payment Powered by Academy Finance Gateway
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
