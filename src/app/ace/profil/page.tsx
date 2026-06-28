"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, Upload, FileText, AlertTriangle, Calculator, Lock } from "lucide-react";
import { useEffect, useState } from "react";

export default function ACEProfil() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditPoints, setCreditPoints] = useState(45); // Mock points

  useEffect(() => {
    const fetchDocs = async () => {
      if (profile) {
        const { data } = await supabase.from('ace_documents').select('*').eq('teacher_id', profile.id);
        if (data) setDocuments(data);
      }
      setLoading(false);
    };
    fetchDocs();
  }, [profile, supabase]);

  if (!profile) return null;

  const requiredDocs = [
    { type: 'ijazah', label: 'Ijazah Terakhir' },
    { type: 'sk_pengangkatan', label: 'SK Pengangkatan' },
    { type: 'sertifikat_pendidik', label: 'Sertifikat Pendidik' }
  ];

  const getDocStatus = (type: string) => {
    const doc = documents.find(d => d.doc_type === type);
    if (!doc) return { status: 'missing', text: 'Belum Diunggah', color: 'text-rose-500', bg: 'bg-rose-50' };
    if (doc.status === 'pending') return { status: 'pending', text: 'Menunggu Verifikasi', color: 'text-amber-500', bg: 'bg-amber-50' };
    if (doc.status === 'rejected') return { status: 'rejected', text: 'Ditolak TU', color: 'text-rose-500', bg: 'bg-rose-50' };
    
    // Check expiry
    if (doc.expiry_date) {
      const daysLeft = Math.floor((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysLeft < 0) return { status: 'expired', text: 'Kedaluwarsa (Terkunci)', color: 'text-rose-600 font-black', bg: 'bg-rose-100 border-2 border-rose-500' };
      if (daysLeft <= 30) return { status: 'warning-30', text: `Sisa ${daysLeft} Hari (Kritis)`, color: 'text-rose-500 font-bold', bg: 'bg-rose-50 border border-rose-300' };
      if (daysLeft <= 60) return { status: 'warning-60', text: `Sisa ${daysLeft} Hari`, color: 'text-amber-500', bg: 'bg-amber-50' };
      if (daysLeft <= 90) return { status: 'warning-90', text: `Sisa ${daysLeft} Hari`, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    }
    
    return { status: 'verified', text: 'Terverifikasi (Aktif)', color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200' };
  };

  const isLocked = requiredDocs.some(d => {
    const s = getDocStatus(d.type);
    return s.status === 'missing' || s.status === 'expired' || s.status === 'rejected';
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Faculty Passport</h1>
        <p className="text-slate-500 font-medium mt-1">Pusat Data Induk, Legalitas, & Portofolio</p>
      </div>

      {isLocked && (
        <div className="p-6 bg-rose-600 rounded-3xl text-white shadow-2xl shadow-rose-600/30 flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-2xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black mb-1">Data Locking Aktif (Akses Dibatasi)</h2>
            <p className="text-rose-100 font-medium text-sm">
              Sistem mengunci fitur pengajuan tunjangan dan layanan helpdesk karena ada dokumen wajib Anda yang belum diunggah, ditolak, atau sudah kedaluwarsa. Silakan lengkapi dokumen di bawah ini agar diverifikasi oleh TU Kepegawaian.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-500" /> Dokumen Wajib
          </h2>
          
          <div className="space-y-4">
            {requiredDocs.map(docReq => {
              const status = getDocStatus(docReq.type);
              return (
                <Card key={docReq.type} className={`p-5 rounded-3xl ${status.bg} transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{docReq.label}</h3>
                      <p className={`text-sm ${status.color} mt-0.5 flex items-center gap-1`}>
                        {status.status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {status.text}
                      </p>
                    </div>
                    {status.status !== 'verified' && (
                      <button className="px-4 py-2 bg-white text-slate-700 font-bold text-xs rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                        <Upload className="w-3 h-3" /> Unggah Ulang
                      </button>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${status.status === 'verified' ? 'bg-emerald-500 w-full' : status.status === 'pending' ? 'bg-amber-400 w-1/2 animate-pulse' : 'bg-rose-500 w-1/4'}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-500" /> Credit Points Tracker
          </h2>

          <Card className="p-8 rounded-3xl bg-slate-800 text-white relative overflow-hidden border-0 shadow-xl shadow-slate-900/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Angka Kredit Terkumpul</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{creditPoints}</span>
                <span className="text-slate-500 font-bold">/ 100 pt</span>
              </div>

              <div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full" style={{ width: `${(creditPoints/100)*100}%` }} />
              </div>

              {creditPoints >= 100 ? (
                <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">
                  Ajukan Kenaikan Pangkat
                </button>
              ) : (
                <button className="w-full py-4 bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm cursor-not-allowed">
                  Belum Memenuhi Syarat Kenaikan
                </button>
              )}
            </div>
          </Card>

          <Card className="p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center hover:border-indigo-300 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800">Input Kegiatan Mandiri</h3>
            <p className="text-xs text-slate-500 mt-1">Modul Ajar Baru (+2), Pembicara (+5)</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
