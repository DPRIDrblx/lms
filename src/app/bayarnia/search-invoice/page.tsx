"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, FileText, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { searchInvoiceAction } from "./actions";

function SearchInvoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [invoiceId, setInvoiceId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("id")) {
      handleSearch(searchParams.get("id")!);
    }
  }, [searchParams]);

  const handleSearch = async (idToSearch: string) => {
    if (!idToSearch) return;
    setLoading(true);
    setError("");
    setTransaction(null);
    
    // We use service role to search securely by invoice id, but since this is client component,
    // we must allow public read access for search, or use an RPC/Server Action.
    // For simplicity, we assume RLS allows reading if invoice_id matches (we need to update RLS or use a server action).
    // Let's call a server action for this to bypass RLS safely, or just fetch if RLS allows.
    // Since we didn't expose it in RLS for public, let's just use the supabase client. 
    // Wait, the RLS policy only allows student_id = auth.uid() or Operator.
    // To allow public search, we need a server action. 
    // I will write the server action `searchInvoiceAction` below.
    const result = await searchInvoiceAction(idToSearch);
    if (result.success) {
      setTransaction(result.data);
    } else {
      setError("Invoice tidak ditemukan.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black text-teal-600 tracking-tight cursor-pointer" onClick={() => router.push('/bayarnia')}>
            NIA<span className="text-slate-800">Tutoring</span>
          </div>
          <a href="/bayarnia" className="text-sm font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto p-6 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Pencarian Invoice</h1>
          <p className="text-slate-500">Lacak status pendaftaran atau pembayaran kamu menggunakan Nomor Invoice.</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={invoiceId}
              onChange={e => setInvoiceId(e.target.value.toUpperCase())}
              placeholder="Contoh: INV-20240815-1234"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
              onKeyDown={e => e.key === 'Enter' && handleSearch(invoiceId)}
            />
          </div>
          <button 
            onClick={() => handleSearch(invoiceId)}
            disabled={loading || !invoiceId}
            className="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cari"}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100 font-medium">
            {error}
          </div>
        )}

        {transaction && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Nomor Invoice</div>
                <div className="text-xl font-bold font-mono text-slate-900">{transaction.invoice_id}</div>
              </div>
              <div>
                {transaction.status === 'approved' && <span className="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-full flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> LUNAS / DISETUJUI</span>}
                {transaction.status === 'pending' && <span className="px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-full flex items-center gap-2"><Clock className="w-5 h-5"/> MENUNGGU VERIFIKASI</span>}
                {transaction.status === 'rejected' && <span className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-full flex items-center gap-2"><XCircle className="w-5 h-5"/> DITOLAK</span>}
                {transaction.status === 'refunded' && <span className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center gap-2"><XCircle className="w-5 h-5"/> DIREFUND</span>}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-medium text-slate-900">{new Date(transaction.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Nama Siswa</span>
                <span className="font-medium text-slate-900">{transaction.student?.full_name}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Paket Belajar</span>
                <span className="font-medium text-slate-900">{transaction.package?.name}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Metode Bayar</span>
                <span className="font-medium text-slate-900">{transaction.payment_method}</span>
              </div>
              
              <div className="pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total Pembayaran</span>
                <span className="text-2xl font-black text-orange-600">Rp {transaction.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchInvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-500" /></div>}>
      <SearchInvoiceContent />
    </Suspense>
  );
}

// Removed inline server action
