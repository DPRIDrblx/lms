"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, Upload, FileText, AlertTriangle, Calculator, Lock, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function ACEProfil() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditPoints, setCreditPoints] = useState(0);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchDocs = async () => {
    if (profile) {
      const { data: docs } = await supabase.from('ace_documents').select('*').eq('teacher_id', profile.id);
      if (docs) setDocuments(docs);

      const { data: certs } = await supabase.from('ace_certificates').select('points').eq('teacher_id', profile.id).eq('status', 'verified');
      if (certs) {
        const total = certs.reduce((sum: number, cert: any) => sum + (cert.points || 0), 0);
        setCreditPoints(total);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
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
    if (!doc) return { status: 'missing', text: 'Belum Diunggah', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
    if (doc.status === 'pending') return { status: 'pending', text: 'Menunggu Verifikasi', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    if (doc.status === 'rejected') return { status: 'rejected', text: 'Ditolak TU', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
    
    if (doc.expiry_date) {
      const daysLeft = Math.floor((new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      if (daysLeft < 0) return { status: 'expired', text: 'Kedaluwarsa (Terkunci)', color: 'text-rose-700 font-bold', bg: 'bg-rose-100 border-rose-500' };
      if (daysLeft <= 30) return { status: 'warning-30', text: `Sisa ${daysLeft} Hari (Kritis)`, color: 'text-amber-600 font-bold', bg: 'bg-amber-50 border-amber-300' };
    }
    
    return { status: 'verified', text: 'Terverifikasi (Aktif)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  };

  const missingOrExpiredDocs = requiredDocs.filter(d => {
    const s = getDocStatus(d.type);
    return s.status === 'missing' || s.status === 'expired' || s.status === 'rejected';
  });
  
  const isLocked = missingOrExpiredDocs.length > 0;

  const handleTriggerUpload = (type: string) => {
    setSelectedType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType || !profile) return;
    
    setUploadingDoc(selectedType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${selectedType}-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ace_storage')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('ace_storage')
        .getPublicUrl(filePath);

      // Upsert doc record
      const existingDoc = documents.find(d => d.doc_type === selectedType);
      
      if (existingDoc) {
        await supabase.from('ace_documents').update({
          file_url: publicUrlData.publicUrl,
          status: 'pending'
        }).eq('id', existingDoc.id);
      } else {
        await supabase.from('ace_documents').insert({
          teacher_id: profile.id,
          doc_type: selectedType,
          file_url: publicUrlData.publicUrl,
          status: 'pending'
        });
      }
      
      await fetchDocs();
    } catch (err: any) {
      alert("Gagal mengunggah: " + err.message);
    } finally {
      setUploadingDoc(null);
      setSelectedType(null);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Faculty Passport</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Data Induk, Legalitas, & Portofolio</p>
      </div>

      {isLocked && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
          <div className="mt-0.5">
            <Lock className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-rose-800 font-bold text-sm mb-1">Akses Dibatasi (Data Locking)</h2>
            <p className="text-rose-600 font-medium text-xs mb-2">
              Sistem mengunci fitur pengajuan tunjangan dan layanan helpdesk karena dokumen wajib berikut bermasalah:
            </p>
            <ul className="list-disc pl-5 text-rose-700 text-xs font-semibold space-y-1">
              {missingOrExpiredDocs.map(d => {
                const s = getDocStatus(d.type);
                return <li key={d.type}>{d.label} - {s.text}</li>;
              })}
            </ul>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-500" /> Dokumen Wajib
          </h2>
          
          <div className="space-y-3">
            {requiredDocs.map(docReq => {
              const status = getDocStatus(docReq.type);
              const isUploading = uploadingDoc === docReq.type;
              
              return (
                <Card key={docReq.type} className={`p-4 rounded-lg border ${status.bg} transition-colors shadow-sm`}>
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">{docReq.label}</h3>
                      <p className={`text-xs ${status.color} mt-0.5 flex items-center gap-1 font-medium`}>
                        {status.status === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {status.text}
                      </p>
                    </div>
                    {status.status !== 'verified' && (
                      <button 
                        onClick={() => handleTriggerUpload(docReq.type)}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white text-slate-600 font-semibold text-xs rounded-md border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? 'Mengunggah...' : 'Unggah File'}
                      </button>
                    )}
                  </div>
                  <div className="h-1 w-full bg-slate-200/50 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${status.status === 'verified' ? 'bg-emerald-500 w-full' : status.status === 'pending' ? 'bg-amber-400 w-1/2 animate-pulse' : 'bg-rose-500 w-1/4'}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-500" /> Angka Kredit (Kenaikan Pangkat)
          </h2>

          <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-slate-500 font-medium text-xs mb-1">Total Poin Valid</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{creditPoints}</span>
                  <span className="text-slate-500 font-semibold text-sm">/ 100 pt</span>
                </div>
              </div>
              <button 
                disabled={creditPoints < 100}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
              >
                Ajukan Kenaikan
              </button>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(creditPoints/100)*100}%` }} />
            </div>

            <button className="w-full py-2.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Input Kegiatan Mandiri (+ Poin)
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
