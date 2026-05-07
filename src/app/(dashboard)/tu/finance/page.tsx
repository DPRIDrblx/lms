"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { 
  CreditCard, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Loader2,
  Filter
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Bill {
  id: string;
  student_id: string;
  month: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  profiles: { full_name: string };
  created_at: string;
}

export default function TUFinanceHub() {
  const supabase = createClient();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState("May 2026");
  const [genAmount, setGenAmount] = useState(500000); // Default 500k IDR
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  const fetchBills = async () => {
    const { data } = await supabase
      .from("finance_bills")
      .select("*, profiles:student_id(full_name)")
      .order("created_at", { ascending: false });
    if (data) setBills(data as unknown as Bill[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBills();
  }, [supabase]);

  const totalCollected = bills.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const pendingAmount = bills.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0);
  const unpaidCount = Array.from(new Set(bills.filter(b => b.status !== "paid").map(b => b.student_id))).length;

  const handleGenerate = async () => {
    setGenerating(true);
    // 1. Get all students
    const { data: students } = await supabase.from("profiles").select("id").eq("role", "student");
    
    if (students) {
      const newBills = students.map((s: any) => ({
        student_id: s.id,
        month: genMonth,
        amount: genAmount,
        status: "pending"
      }));

      const { error } = await supabase.from("finance_bills").insert(newBills);
      if (error) alert(error.message);
      else {
        alert(`Successfully generated bills for ${students.length} students.`);
        setShowGenModal(false);
        fetchBills();
      }
    }
    setGenerating(false);
  };

  const markAsPaid = async (id: string) => {
    const { error } = await supabase.from("finance_bills").update({ status: "paid" }).eq("id", id);
    if (!error) fetchBills();
  };

  const filteredBills = bills.filter(b => 
    b.profiles?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    b.month.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">School Financial Hub</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage tuition (SPP) bills and track school collections.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowGenModal(true)} icon={<Plus className="h-4 w-4" />}>
            Generate Batch Bills
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <Card className="bg-indigo-600 text-white border-none shadow-lg shadow-indigo-500/20">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Total Collections</p>
            <p className="text-2xl font-black">Rp {totalCollected.toLocaleString()}</p>
            <TrendingUp className="absolute top-4 right-4 h-5 w-5 opacity-40" />
         </Card>
         <Card className="bg-white border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Pending Receivables</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">Rp {pendingAmount.toLocaleString()}</p>
            <Clock className="absolute top-4 right-4 h-5 w-5 text-orange-500 opacity-40" />
         </Card>
         <Card className="bg-white border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Unpaid Students</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">{unpaidCount} Students</p>
            <AlertCircle className="absolute top-4 right-4 h-5 w-5 text-red-500 opacity-40" />
         </Card>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search by student name or month..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
            />
          </div>
          <Button variant="ghost" size="sm" icon={<Filter className="h-4 w-4" />}>Filter</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-[var(--text-tertiary)] uppercase font-black tracking-widest border-b border-[var(--border)]">
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Billing Month</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin text-[var(--accent)] mx-auto" /></td></tr>
              ) : filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[var(--text-primary)]">{bill.profiles?.full_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{bill.month}</td>
                    <td className="px-6 py-4 text-sm font-medium">Rp {bill.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge variant={bill.status === "paid" ? "success" : bill.status === "overdue" ? "error" : "info"}>
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.status !== "paid" && (
                        <button 
                          onClick={() => markAsPaid(bill.id)}
                          className="text-[10px] font-bold text-[var(--accent)] hover:underline uppercase tracking-wider"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-20 text-center text-sm text-[var(--text-tertiary)]">No billing records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Batch Generation Modal */}
      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Batch Generate Bills">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/10">
            <p className="text-xs text-[var(--accent)] leading-relaxed">
              This action will create a new tuition bill for <strong>all registered students</strong> in the system.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Billing Month</label>
            <input 
              type="text" 
              value={genMonth} 
              onChange={e => setGenMonth(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
              placeholder="e.g. May 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Monthly Fee (IDR)</label>
            <input 
              type="number" 
              value={genAmount} 
              onChange={e => setGenAmount(parseInt(e.target.value))}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none"
            />
          </div>
          <Button className="w-full h-12" onClick={handleGenerate} loading={generating} icon={<CheckCircle2 className="h-4 w-4" />}>
            Generate for All Students
          </Button>
        </div>
      </Modal>
    </div>
  );
}
