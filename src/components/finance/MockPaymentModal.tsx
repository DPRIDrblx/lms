"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2, ChevronRight, Copy, Loader2, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "react-hot-toast";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  title?: string;
}

const PAYMENT_METHODS = [
  { id: "va_mandiri", name: "Mandiri Virtual Account", icon: Building2, group: "Virtual Account" },
  { id: "va_bca", name: "BCA Virtual Account", icon: Building2, group: "Virtual Account" },
  { id: "qris", name: "QRIS / E-Wallet", icon: Smartphone, group: "E-Wallet" },
];

export function MockPaymentModal({ isOpen, onClose, amount, onSuccess, title = "School Payment" }: MockPaymentModalProps) {
  const [step, setStep] = useState<"select" | "va_view" | "processing" | "success">("select");
  const [selectedMethod, setSelectedMethod] = useState<any>(null);

  const vaNumber = "8890" + Math.random().toString().substring(2, 10);

  const handleSelectMethod = (method: any) => {
    setSelectedMethod(method);
    setStep("va_view");
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      onSuccess();
    }, 2500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white"><ShieldCheck className="h-6 w-6" /></div>
                 <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)]">{title}</h3>
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Secured by Academy-Pay</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
                <X className="h-5 w-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            <div className="p-8">
              {step === "select" && (
                <div className="space-y-8">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border-none text-center">
                    <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Total to Pay</p>
                    <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
                      Rp {amount.toLocaleString()}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-black text-[var(--text-tertiary)] uppercase tracking-widest px-1">Select Payment Method</p>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handleSelectMethod(method)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]/30 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] group-hover:text-[var(--accent)]">
                               <method.icon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-bold text-[var(--text-primary)]">{method.name}</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">{method.group}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "va_view" && (
                <div className="space-y-8">
                  <div className="text-center">
                     <p className="text-sm font-bold text-[var(--text-secondary)] mb-1">{selectedMethod?.name}</p>
                     <p className="text-xs text-[var(--text-tertiary)]">Complete your payment before session expires</p>
                  </div>

                  <Card className="p-8 border-none bg-[var(--bg-secondary)] relative overflow-hidden">
                     <div className="relative z-10 space-y-6">
                        <div>
                           <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2 text-center">Virtual Account Number</p>
                           <div className="flex items-center justify-center gap-3">
                              <span className="text-3xl font-black text-[var(--accent)] tracking-widest">{vaNumber}</span>
                              <button onClick={() => handleCopy(vaNumber)} className="p-2 rounded-lg bg-white/50 hover:bg-white text-[var(--accent)] transition-all">
                                 <Copy className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                        <div className="border-t border-[var(--border)] pt-4 text-center">
                           <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Total Amount</p>
                           <p className="text-xl font-black text-[var(--text-primary)]">Rp {amount.toLocaleString()}</p>
                        </div>
                     </div>
                  </Card>

                  <div className="space-y-4">
                     <div className="p-4 rounded-xl bg-[var(--warning-light)] text-[var(--warning)] flex gap-3 text-xs">
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        <p>Awaiting transfer confirmation from <span className="font-bold">{selectedMethod?.name}</span> network...</p>
                     </div>
                     <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-[var(--accent)]/20" onClick={handleConfirmPayment}>
                        Simulate Transfer Success
                     </Button>
                     <button onClick={() => setStep("select")} className="w-full text-xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">Change payment method</button>
                  </div>
                </div>
              )}

              {step === "processing" && (
                <div className="py-20 text-center space-y-6">
                  <div className="relative h-24 w-24 mx-auto">
                    <div className="absolute inset-0 border-8 border-[var(--accent)]/10 rounded-full" />
                    <div className="absolute inset-0 border-8 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[var(--text-primary)]">Syncing with Bank</h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">Processing payment confirmation via <span className="font-bold">Academy Gateway v2</span>.</p>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="py-8 text-center space-y-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="h-24 w-24 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto text-white shadow-2xl shadow-[var(--success)]/30">
                    <CheckCircle2 className="h-12 w-12" />
                  </motion.div>
                  <div>
                    <h4 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Payment Approved!</h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">Transaction <span className="font-mono text-[var(--accent)]">#{Math.random().toString(36).substring(7).toUpperCase()}</span> is finalized.</p>
                  </div>
                  <Card className="p-6 bg-[var(--bg-secondary)] border-none text-left">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px]"><span className="text-[var(--text-tertiary)] uppercase font-bold">Channel</span><span className="text-[var(--text-primary)] font-bold">{selectedMethod?.name}</span></div>
                        <div className="flex justify-between text-[10px]"><span className="text-[var(--text-tertiary)] uppercase font-bold">Status</span><span className="text-[var(--success)] font-black">COMPLETED</span></div>
                        <div className="flex justify-between text-[10px]"><span className="text-[var(--text-tertiary)] uppercase font-bold">Wallet Update</span><span className="text-[var(--text-primary)] font-bold">+{amount.toLocaleString()}</span></div>
                     </div>
                  </Card>
                  <Button variant="secondary" className="w-full h-14 rounded-2xl font-black" onClick={onClose}>
                    Return to Financial Hub
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
