"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Plus, 
  History, 
  CreditCard as CardIcon, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { MockPaymentModal } from "@/components/finance/MockPaymentModal";

export default function WalletPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50000);
  
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [serialInput, setSerialInput] = useState("");
  const [activationError, setActivationError] = useState("");
  const [activationSuccess, setActivationSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchWalletData();
      fetchCardData();

      // Real-time wallet sync
      const channel = supabase
        .channel(`wallet-${profile.id}`)
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'wallets', filter: `student_id=eq.${profile.id}` }, 
          () => fetchWalletData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile, supabase]);

  const fetchWalletData = async () => {
    if (!profile) return;
    
    const { data: w } = await supabase
      .from("wallets")
      .select("*")
      .eq("student_id", profile.id)
      .single();
    
    if (w) {
      setWallet(w);
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", w.id)
        .order("created_at", { ascending: false });
      setTransactions(txs || []);
    }
    setLoading(false);
  };

  const fetchCardData = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("student_id", profile.id)
      .single();
    setCardInfo(data);
  };

  const handleActivateCard = async () => {
    if (!profile || !serialInput) return;
    setActivationError("");
    setActivationSuccess(false);

    // 1. Find available card
    const { data: card, error } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("serial_number", serialInput)
      .eq("status", "available")
      .single();

    if (error || !card) {
      setActivationError("Invalid serial number or card already active.");
      return;
    }

    // 2. Link card to student
    const { error: updateErr } = await supabase
      .from("card_inventory")
      .update({
        status: "active",
        student_id: profile.id
      })
      .eq("id", card.id);

    if (updateErr) {
      setActivationError("Failed to activate card. Please try again.");
      return;
    }

    setActivationSuccess(true);
    setCardInfo({ ...card, status: "active", student_id: profile.id });
  };

  const handleTopUpSuccess = async () => {
    if (!wallet || !profile) return;

    const { error } = await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      amount: topUpAmount,
      type: "topup",
      description: "Wallet Top Up via Academy-Pay"
    });

    if (!error) {
      fetchWalletData();
      setIsTopUpOpen(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--text-tertiary)]">Loading wallet...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">School Digital Wallet</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your campus balance and ID card activation.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Wallet Card */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-gradient-to-br from-[var(--accent)] to-[#4f46e5] border-none p-8 text-white relative overflow-hidden shadow-xl shadow-[var(--accent)]/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
            
            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-lg">Main Balance</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md" />
                  <div className="h-8 w-8 rounded-full border-2 border-white/20 bg-white/20 backdrop-blur-md" />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-white/70 text-sm font-medium">Available Funds</p>
                <h2 className="text-5xl font-black tracking-tight">
                  Rp {wallet?.balance?.toLocaleString() || "0"}
                </h2>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  onClick={() => setIsTopUpOpen(true)}
                  className="bg-white text-[var(--accent)] hover:bg-white/90 font-bold px-8 h-14 rounded-2xl flex-1 shadow-lg"
                >
                  <Plus className="h-5 w-5 mr-2" /> Top Up
                </Button>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                  <History className="h-6 w-6" />
                </div>
              </div>
            </div>
          </Card>

          {/* Transactions List */}
          <Card className="p-0 overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h3>
              <Badge variant="default" className="rounded-full">View All</Badge>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {transactions.length > 0 ? transactions.map((tx) => (
                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                      tx.type === 'topup' ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-[var(--error-light)] text-[var(--error)]"
                    }`}>
                      {tx.type === 'topup' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{tx.description}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${
                    tx.type === 'topup' ? "text-[var(--success)]" : "text-[var(--text-primary)]"
                  }`}>
                    {tx.type === 'topup' ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                  </p>
                </div>
              )) : (
                <div className="p-12 text-center text-[var(--text-tertiary)]">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No transactions found.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Side Panel: Card Activation & Stats */}
        <div className="space-y-8">
          {/* Card Management */}
          <Card className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <CardIcon className="h-5 w-5 text-[var(--text-tertiary)] opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Digital ID Card</h3>
            
            {cardInfo?.status === "active" ? (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--success)]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--success)]/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-[var(--success)]/10 transition-colors" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--success-light)] flex items-center justify-center text-[var(--success)]">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--success)] uppercase tracking-widest">Active</p>
                      <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{cardInfo.serial_number}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">Your physical card is linked to your account and ready for campus payments.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Issued On</span>
                    <span className="font-bold text-[var(--text-primary)]">{new Date(cardInfo.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Security Status</span>
                    <span className="font-bold text-[var(--success)]">Encrypted</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] text-center">
                  <CardIcon className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[var(--text-primary)]">No Card Active</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Activate your student ID card to enable canteen payments.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <CardIcon className="absolute left-4 top-3.5 h-5 w-5 text-[var(--text-tertiary)]" />
                    <input 
                      type="text" 
                      placeholder="Enter Serial Number" 
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border-none text-sm focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  {activationError && (
                    <div className="p-3 rounded-lg bg-[var(--error-light)] text-[var(--error)] text-[10px] font-bold flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" /> {activationError}
                    </div>
                  )}
                  {activationSuccess && (
                    <div className="p-3 rounded-lg bg-[var(--success-light)] text-[var(--success)] text-[10px] font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Activation successful!
                    </div>
                  )}
                  <Button 
                    className="w-full h-12 rounded-xl font-bold" 
                    onClick={handleActivateCard}
                    disabled={!serialInput}
                  >
                    Activate Card
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Top Categories</h3>
            <div className="space-y-4">
              {[
                { name: "Canteen & Snacks", val: "Rp 85,000", color: "bg-orange-500" },
                { name: "Stationery", val: "Rp 12,000", color: "bg-blue-500" },
                { name: "Print & Photocopy", val: "Rp 5,000", color: "bg-purple-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{item.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <MockPaymentModal 
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        amount={topUpAmount}
        onSuccess={handleTopUpSuccess}
        title="Wallet Top-Up"
      />
    </div>
  );
}
