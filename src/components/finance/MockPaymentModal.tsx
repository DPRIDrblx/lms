"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Wallet, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: () => void;
  title?: string;
}

const PAYMENT_METHODS = [
  { id: "va_mandiri", name: "Mandiri Virtual Account", icon: CreditCard, group: "Virtual Account" },
  { id: "va_bca", name: "BCA Virtual Account", icon: CreditCard, group: "Virtual Account" },
  { id: "va_bni", name: "BNI Virtual Account", icon: CreditCard, group: "Virtual Account" },
  { id: "ovo", name: "OVO", icon: Smartphone, group: "E-Wallet" },
  { id: "dana", name: "DANA", icon: Smartphone, group: "E-Wallet" },
  { id: "qris", name: "QRIS", icon: Smartphone, group: "E-Wallet" },
];

export function MockPaymentModal({ isOpen, onClose, amount, onSuccess, title = "School Payment" }: MockPaymentModalProps) {
  const [step, setStep] = useState<"select" | "processing" | "success">("select");
  const [selectedId, setSelectedId] = useState<string>("");

  const handleSimulate = () => {
    if (!selectedId) return;
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      onSuccess();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-primary)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
              <div>
                <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest mb-1">Academy Checkout</p>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors">
                <X className="h-5 w-5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            <div className="p-6">
              {step === "select" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent)]/10">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">Total Amount</span>
                    <span className="text-2xl font-bold text-[var(--accent)]">
                      Rp {amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Select Payment Method</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedId(method.id)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            selectedId === method.id
                              ? "border-[var(--accent)] bg-[var(--accent-light)]"
                              : "border-[var(--border)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          <method.icon className={`h-5 w-5 ${selectedId === method.id ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`} />
                          <div className="text-left">
                            <p className="text-xs font-bold text-[var(--text-primary)]">{method.name}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">{method.group}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] justify-center">
                      <ShieldCheck className="h-3 w-3" />
                      Secure payment powered by Academy-Pay Mock Gateway
                    </div>
                    <Button
                      size="lg"
                      className="w-full h-14 rounded-2xl font-bold text-lg"
                      disabled={!selectedId}
                      onClick={handleSimulate}
                    >
                      Pay Now
                    </Button>
                  </div>
                </div>
              )}

              {step === "processing" && (
                <div className="py-20 text-center space-y-6">
                  <div className="relative h-20 w-20 mx-auto">
                    <div className="absolute inset-0 border-4 border-[var(--accent)]/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">Verifying Payment</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Please wait while we confirm your transaction...</p>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="py-12 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="h-24 w-24 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto text-[var(--success)]"
                  >
                    <CheckCircle2 className="h-12 w-12" />
                  </motion.div>
                  <div>
                    <h4 className="text-2xl font-bold text-[var(--text-primary)]">Payment Successful!</h4>
                    <p className="text-sm text-[var(--text-secondary)]">Your wallet/fee has been updated successfully.</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-tertiary)]">Reference ID</span>
                      <span className="font-mono text-[var(--text-primary)] uppercase">TRX-{Math.random().toString(36).substring(7)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-tertiary)]">Date & Time</span>
                      <span className="text-[var(--text-primary)]">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full h-12 rounded-xl" onClick={onClose}>
                    Back to Dashboard
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
