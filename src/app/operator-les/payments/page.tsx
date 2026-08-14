"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useConfirmStore } from "@/components/ui/GlobalConfirmModal";
import { Loader2, CheckCircle2, XCircle, Search, Clock, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function OperatorPaymentsPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, refunded, all
  const [searchTerm, setSearchTerm] = useState("");
  const [noteModal, setNoteModal] = useState<{isOpen: boolean, tx: any, action: 'approve' | 'reject', note: string}>({isOpen: false, tx: null, action: 'approve', note: ''});

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    let query = supabase
      .from("nia_transactions")
      .select(`
        *,
        student:student_id (full_name, email, phone),
        package:package_id (name, level, price)
      `)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Fetch Transactions Error:", error);
      toast.error("Gagal mengambil data transaksi: " + error.message);
    } else if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const handleApprove = (tx: any) => {
    setNoteModal({isOpen: true, tx, action: 'approve', note: ''});
  };

  const handleReject = (tx: any) => {
    setNoteModal({isOpen: true, tx, action: 'reject', note: ''});
  };

  const submitNoteAction = async () => {
    if (!noteModal.tx) return;
    const { tx, action, note } = noteModal;
    const isApprove = action === 'approve';
    
    const toastId = toast.loading(isApprove ? "Memproses persetujuan..." : "Memproses penolakan...");
    try {
      // 1. Update transaction status and notes
      const { error: txError } = await supabase
        .from("nia_transactions")
        .update({ 
          status: isApprove ? 'approved' : 'refunded', 
          notes: note || null,
          updated_at: new Date().toISOString() 
        })
        .eq("id", tx.id);
      
      if (txError) throw txError;

      if (isApprove) {
        // 2. Update subscription status to active
        const { error: subError } = await supabase
          .from("nia_subscriptions")
          .update({ status: 'active' })
          .eq("student_id", tx.student_id)
          .eq("package_id", tx.package_id);

        if (subError) throw subError;
        toast.success("Pembayaran disetujui, paket aktif!", { id: toastId });
      } else {
        // 2. Delete subscription if rejected
        await supabase
          .from("nia_subscriptions")
          .delete()
          .eq("student_id", tx.student_id)
          .eq("package_id", tx.package_id);
        toast.success("Pembayaran ditolak & direfund.", { id: toastId });
      }

      setNoteModal({isOpen: false, tx: null, action: 'approve', note: ''});
      fetchTransactions();
    } catch (error: any) {
      toast.error("Gagal memproses: " + error.message, { id: toastId });
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Persetujuan Pembayaran</h1>
        <p className="text-slate-500 font-medium">Verifikasi pembayaran siswa dan aktifkan paket bimbingan mereka.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex bg-white rounded-xl border border-slate-200 p-1">
          {["pending", "approved", "refunded", "all"].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {f === 'pending' ? 'Menunggu' : f === 'approved' ? 'Disetujui' : f === 'refunded' ? 'Refund/Tolak' : 'Semua'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Invoice / Siswa..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-4 font-bold">Invoice & Waktu</th>
                <th className="p-4 font-bold">Siswa</th>
                <th className="p-4 font-bold">Paket & Total</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-500">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Tidak ada transaksi.
                  </td>
                </tr>
              ) : filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-mono font-bold text-slate-900">{tx.invoice_id}</div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(tx.created_at).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{tx.student?.full_name}</div>
                    <div className="text-xs text-slate-500">{tx.student?.email} • {tx.student?.phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{tx.package?.name}</div>
                    <div className="text-xs text-orange-600 font-bold mt-1">Rp {tx.amount.toLocaleString()} ({tx.payment_method})</div>
                  </td>
                  <td className="p-4">
                    {tx.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full"><Clock className="w-3 h-3"/> Menunggu</span>}
                    {tx.status === 'approved' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>}
                    {tx.status === 'refunded' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"><XCircle className="w-3 h-3"/> Refund/Tolak</span>}
                    {tx.status === 'rejected' && <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"><XCircle className="w-3 h-3"/> Refund/Tolak</span>}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {tx.status === 'pending' ? (
                      <>
                        <button onClick={() => handleApprove(tx)} className="px-3 py-1.5 bg-green-500 text-white font-bold text-xs rounded-lg hover:bg-green-600 transition-colors">Setujui</button>
                        <button onClick={() => handleReject(tx)} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition-colors">Tolak</button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">Telah Diproses</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {noteModal.action === 'approve' ? 'Setujui Pembayaran' : 'Tolak Pembayaran'}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Tambahkan catatan untuk siswa (opsional). Catatan ini akan ditampilkan di riwayat pembelian mereka.
            </p>
            
            <textarea
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none min-h-[100px] mb-6"
              placeholder="Ketik catatan di sini..."
              value={noteModal.note}
              onChange={(e) => setNoteModal({...noteModal, note: e.target.value})}
            ></textarea>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setNoteModal({isOpen: false, tx: null, action: 'approve', note: ''})}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button 
                onClick={submitNoteAction}
                className={`px-4 py-2 text-white font-bold rounded-xl ${noteModal.action === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {noteModal.action === 'approve' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
