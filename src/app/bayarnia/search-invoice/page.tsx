"use client";

import React, { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, FileText, CheckCircle2, XCircle, Clock, ArrowLeft, Download } from "lucide-react";
import { searchInvoiceAction, submitRefundAction } from "./actions";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function SearchInvoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [invoiceId, setInvoiceId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState("");
  
  const [refundBank, setRefundBank] = useState("");
  const [refundAccount, setRefundAccount] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

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

  const handleRefundSubmit = async () => {
    if (!refundBank || !refundAccount) {
      toast.error("Harap lengkapi nama bank dan nomor rekening");
      return;
    }
    setSubmittingRefund(true);
    const res = await submitRefundAction(transaction.invoice_id, refundBank, refundAccount);
    if (res.success) {
      toast.success("Pengajuan refund berhasil disubmit!");
      handleSearch(transaction.invoice_id); // Refresh
    } else {
      toast.error("Gagal memproses refund: " + res.error);
    }
    setSubmittingRefund(false);
  };

  const downloadRefundPdf = () => {
    if (!transaction) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(239, 68, 68); // Red
    doc.text("NIA Tutoring", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("INVOICE DIKEMBALIKAN (REFUND)", 14, 28);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 32, 196, 32);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Tanggal: ${new Date(transaction.created_at).toLocaleDateString('id-ID')}`, 14, 42);
    doc.text(`Nama Lengkap: ${transaction.student?.full_name || '-'}`, 14, 49);
    
    doc.text(`Paket: ${transaction.package?.name || '-'}`, 120, 42);
    doc.text(`Metode: ${transaction.payment_method}`, 120, 49);
    
    autoTable(doc, {
      startY: 65,
      head: [['Deskripsi', 'Nominal']],
      body: [['Pengembalian Dana: ' + (transaction.package?.name || ''), 'Rp ' + transaction.amount.toLocaleString('id-ID')]],
      foot: [['TOTAL REFUND', 'Rp ' + transaction.amount.toLocaleString('id-ID')]],
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      footStyles: { fillColor: [153, 27, 27], textColor: 255, fontStyle: 'bold' }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice ID: ${transaction.invoice_id}`, 14, finalY + 15);
    doc.text(`Refund via: ${transaction.refund_bank} - ${transaction.refund_account}`, 14, finalY + 20);
    doc.text("Dana Anda telah dikembalikan.", 14, finalY + 25);
    
    doc.save(`Refund_NIA_${transaction.invoice_id}.pdf`);
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
                {(transaction.status === 'refunded' || transaction.status === 'refund_success') && <span className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> REFUND BERHASIL</span>}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Tanggal</span>
                <span className="font-medium text-slate-900">{new Date(transaction.created_at).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-slate-100">
                <span className="text-slate-500">Nama Siswa</span>
                <span className="font-medium text-slate-900">{transaction.student?.full_name || 'Akun Dihapus'}</span>
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

            {transaction.notes && (
              <div className="bg-orange-50 p-6 border-t border-orange-100">
                <div className="font-bold text-orange-800 mb-1">Catatan Operator:</div>
                <div className="text-orange-700">{transaction.notes}</div>
              </div>
            )}

            {transaction.status === 'rejected' && !transaction.refund_requested_at && (
              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <h3 className="font-bold text-slate-900 mb-2">Ajukan Pengembalian Dana (Refund)</h3>
                <p className="text-sm text-slate-500 mb-4">Mohon isi data rekening Anda agar kami dapat mengembalikan dana Anda sepenuhnya.</p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Bank / E-Wallet</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-teal-500"
                      placeholder="Contoh: BCA / GoPay"
                      value={refundBank}
                      onChange={e => setRefundBank(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nomor Rekening / No HP</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-teal-500"
                      placeholder="Contoh: 1234567890"
                      value={refundAccount}
                      onChange={e => setRefundAccount(e.target.value)}
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleRefundSubmit}
                  disabled={submittingRefund}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50"
                >
                  {submittingRefund ? 'Memproses...' : 'Kirim Pengajuan Refund'}
                </button>
              </div>
            )}

            {transaction.status === 'rejected' && transaction.refund_requested_at && (
              <div className="p-6 bg-indigo-50 border-t border-indigo-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900">Refund Sedang Diproses</h3>
                  <p className="text-sm text-indigo-700">Dana akan dikirimkan ke {transaction.refund_bank} ({transaction.refund_account}). Proses memakan waktu ±3 menit (Silakan refresh halaman ini).</p>
                </div>
              </div>
            )}

            {transaction.status === 'refund_success' && (
              <div className="p-6 bg-teal-50 border-t border-teal-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-teal-900">Dana Berhasil Dikembalikan</h3>
                  <p className="text-sm text-teal-700">Refund senilai Rp {transaction.amount.toLocaleString()} telah dikirim ke {transaction.refund_bank} Anda.</p>
                </div>
                <button onClick={downloadRefundPdf} className="shrink-0 px-4 py-2 bg-teal-600 text-white font-bold text-sm rounded-lg hover:bg-teal-700 shadow-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            )}
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
