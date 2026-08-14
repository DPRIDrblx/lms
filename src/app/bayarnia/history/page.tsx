"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, FileText, CheckCircle2, XCircle, Clock, Search, ChevronRight } from "lucide-react";

export default function HistoryPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push("/app?redirect=/bayarnia/history");
      return;
    }

    if (profile) {
      fetchTransactions();
    }
  }, [profile, authLoading]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("nia_transactions")
      .select(`
        *,
        package:package_id (name, level, learning_mode)
      `)
      .eq("student_id", profile?.id)
      .order("created_at", { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Disetujui</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Ditolak</span>;
      case 'refunded':
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Direfund</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> Menunggu</span>;
    }
  };

  if (authLoading || (!profile && loading)) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black text-teal-600 tracking-tight cursor-pointer" onClick={() => router.push('/bayarnia')}>
            NIA<span className="text-slate-800">Tutoring</span>
          </div>
          <a href="/bayarnia" className="text-sm font-bold text-slate-500 hover:text-slate-900">Kembali ke Produk</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 md:py-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Riwayat & Status Pembelian</h1>
        <p className="text-slate-500 mb-8">Pantau status pendaftaran dan invoice pembayaran Anda di sini.</p>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>
        ) : (
          <div className="space-y-4">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-slate-500">{tx.invoice_id}</span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{tx.package?.name || 'Paket tidak ditemukan'}</h3>
                  <div className="text-sm text-slate-500 flex gap-4">
                    <span>{new Date(tx.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</span>
                    <span>•</span>
                    <span>Metode: {tx.payment_method}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">Total Pembayaran</div>
                  <div className="text-xl font-black text-orange-600 mb-2">Rp {tx.amount.toLocaleString()}</div>
                  <a href={`/bayarnia/search-invoice?id=${tx.invoice_id}`} className="text-teal-600 text-sm font-bold flex items-center hover:underline">
                    Lihat Detail Invoice <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">Belum Ada Transaksi</h3>
                <p className="text-slate-500 text-sm mt-1 mb-4">Kamu belum pernah membeli paket apapun.</p>
                <a href="/bayarnia" className="px-5 py-2.5 bg-teal-500 text-white font-bold rounded-full hover:bg-teal-600 inline-block">Mulai Belanja</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
