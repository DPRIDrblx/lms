"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, Upload, FileText, AlertTriangle, Calculator, Lock, Loader2, XCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function ACEProfil() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditPoints, setCreditPoints] = useState(0);
  const [promotionRequested, setPromotionRequested] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ notes: "", file: null as File | null });
  const [promoSubmitting, setPromoSubmitting] = useState(false);
  
  const certFileInputRef = useRef<HTMLInputElement>(null);

  const [showCertModal, setShowCertModal] = useState(false);
  const [certForm, setCertForm] = useState({ title: "", issuer: "", date_issued: "", file: null as File | null });
  const [certSubmitting, setCertSubmitting] = useState(false);

  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalData, setDocModalData] = useState<{ type: string, requestId?: string, label: string, fields: any[] }>({ type: '', label: '', fields: [] });
  const [docFormData, setDocFormData] = useState<Record<string, string>>({});
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docSubmitting, setDocSubmitting] = useState(false);

  const standardForms: Record<string, { id: string, label: string, type: string }[]> = {
    ijazah: [
      { id: 'universitas', label: 'Universitas / Perguruan Tinggi', type: 'text' },
      { id: 'tanggal_terbit', label: 'Tanggal Terbit', type: 'date' },
      { id: 'nomor_ijazah', label: 'Nomor Ijazah', type: 'text' }
    ],
    sk_pengangkatan: [
      { id: 'instansi', label: 'Instansi Penerbit', type: 'text' },
      { id: 'tanggal_terbit', label: 'Tanggal Terbit', type: 'date' },
      { id: 'nomor_sk', label: 'Nomor SK', type: 'text' }
    ],
    sertifikat_pendidik: [
      { id: 'bidang_studi', label: 'Bidang Studi', type: 'text' },
      { id: 'tahun_sertifikasi', label: 'Tahun Sertifikasi', type: 'number' },
      { id: 'nomor_sertifikat', label: 'Nomor Sertifikat', type: 'text' }
    ]
  };


  const fetchDocs = async () => {
    if (profile) {
      const { data: docs } = await supabase.from('ace_documents').select('*').eq('teacher_id', profile.id);
      if (docs) setDocuments(docs);

      const { data: certs } = await supabase.from('ace_certificates').select('points').eq('teacher_id', profile.id).eq('status', 'verified');
      if (certs) {
        const total = certs.reduce((sum: number, cert: any) => sum + (cert.points || 0), 0);
        setCreditPoints(total);
      }

      const { data: reqs } = await supabase.from('ace_document_requests').select('*').or(`teacher_id.eq.${profile.id},teacher_id.is.null`);
      if (reqs) setDocRequests(reqs);

      const { data: promoReq } = await supabase
        .from('ace_promotion_requests')
        .select('*')
        .eq('teacher_id', profile.id)
        .in('status', ['pending'])
        .maybeSingle();
      if (promoReq) setPromotionRequested(true);
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

  const handleTriggerUpload = (type: string, label: string, requestId?: string, customFields?: any[]) => {
    let fields = [];
    if (type === 'custom' && customFields) fields = customFields;
    else if (standardForms[type]) fields = standardForms[type];
    
    setDocModalData({ type, label, requestId, fields });
    setDocFormData({});
    setDocFile(null);
    setShowDocModal(true);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !profile) {
      alert("Mohon pilih file dokumen terlebih dahulu.");
      return;
    }
    setDocSubmitting(true);
    
    try {
      const fileExt = docFile.name.split('.').pop();
      const fileName = `${profile.id}-${docModalData.type}-${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('ace_storage').upload(filePath, docFile);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ace_storage').getPublicUrl(filePath);

      let existingDoc = null;
      if (docModalData.type !== 'custom') {
        existingDoc = documents.find(d => d.doc_type === docModalData.type);
      } else if (docModalData.requestId) {
        existingDoc = documents.find(d => d.request_id === docModalData.requestId);
      }

      if (existingDoc) {
        await supabase.from('ace_documents').update({
          file_url: publicUrlData.publicUrl,
          status: 'pending',
          metadata: docFormData
        }).eq('id', existingDoc.id);
      } else {
        await supabase.from('ace_documents').insert({
          teacher_id: profile.id,
          doc_type: docModalData.type,
          file_url: publicUrlData.publicUrl,
          status: 'pending',
          request_id: docModalData.requestId || null,
          metadata: docFormData
        });
      }
      
      alert("Dokumen berhasil diunggah dan menunggu verifikasi!");
      setShowDocModal(false);
      fetchDocs();
    } catch (err: any) {
      alert("Error uploading file: " + err.message);
    } finally {
      setDocSubmitting(false);
    }
  };

  const handleCertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !certForm.title || !certForm.issuer || !certForm.date_issued || !certForm.file) {
      alert("Mohon lengkapi semua data dan unggah sertifikat.");
      return;
    }
    setCertSubmitting(true);
    try {
      const fileExt = certForm.file.name.split('.').pop();
      const fileName = `${profile.id}-cert-${Date.now()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('ace_storage').upload(filePath, certForm.file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ace_storage').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('ace_certificates').insert({
        teacher_id: profile.id,
        title: certForm.title,
        issuer: certForm.issuer,
        date_issued: certForm.date_issued,
        file_url: publicUrlData.publicUrl,
        points: 0,
        status: 'pending'
      });
      if (insertError) throw insertError;

      alert("Sertifikat berhasil diunggah dan menunggu verifikasi!");
      setShowCertModal(false);
      setCertForm({ title: "", issuer: "", date_issued: "", file: null });
      fetchDocs();
    } catch (err: any) {
      alert("Gagal mengunggah sertifikat: " + err.message);
    } finally {
      setCertSubmitting(false);
    }
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setPromoSubmitting(true);
    try {
      let fileUrl = null;
      if (promoForm.file) {
        const fileExt = promoForm.file.name.split('.').pop();
        const fileName = `${profile.id}-promo-${Date.now()}.${fileExt}`;
        const filePath = `promotions/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('ace_storage').upload(filePath, promoForm.file);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('ace_storage').getPublicUrl(filePath);
        fileUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('ace_promotion_requests').insert({
        teacher_id: profile.id,
        notes: promoForm.notes,
        file_url: fileUrl,
        status: 'pending'
      });
      if (error) throw error;

      alert("Pengajuan berhasil dikirim! Silakan menunggu verifikasi.");
      setShowPromoModal(false);
      setPromotionRequested(true);
      setPromoForm({ notes: "", file: null });
    } catch (err: any) {
      alert("Gagal mengirim pengajuan: " + err.message);
    } finally {
      setPromoSubmitting(false);
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

      {/* Form triggers modal now, removed file input */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-500" /> Dokumen Wajib
          </h2>
          
          <div className="space-y-3">
            {requiredDocs.map(docReq => {
              const status = getDocStatus(docReq.type);
              
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
                        onClick={() => handleTriggerUpload(docReq.type, docReq.label)}
                        className="px-3 py-1.5 bg-white text-slate-600 font-semibold text-xs rounded-md border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Unggah / Lengkapi
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

          {docRequests.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" /> Permintaan Dokumen Tambahan
              </h2>
              <div className="space-y-3">
                {docRequests.map(req => {
                  const submittedDoc = documents.find(d => d.request_id === req.id);
                  let status = { status: 'missing', text: 'Belum Diunggah', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
                  if (submittedDoc) {
                    if (submittedDoc.status === 'pending') status = { status: 'pending', text: 'Menunggu Verifikasi', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
                    if (submittedDoc.status === 'rejected') status = { status: 'rejected', text: 'Ditolak TU', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
                    if (submittedDoc.status === 'verified') status = { status: 'verified', text: 'Terverifikasi', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
                  }

                  return (
                    <Card key={req.id} className={`p-4 rounded-lg border ${status.bg} transition-colors shadow-sm`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-sm">{req.title}</h3>
                          {req.description && <p className="text-[10px] text-slate-500 mt-1">{req.description}</p>}
                          <p className={`text-xs ${status.color} mt-2 flex items-center gap-1 font-medium`}>
                            {status.status === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                            {status.text}
                          </p>
                        </div>
                        {status.status !== 'verified' && (
                          <button 
                            onClick={() => handleTriggerUpload('custom', req.title, req.id, req.form_fields)}
                            className="px-3 py-1.5 bg-white text-slate-600 font-semibold text-xs rounded-md border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                          >
                            <Upload className="w-3 h-3" /> Lengkapi Dokumen
                          </button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
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
                disabled={creditPoints < 100 || promotionRequested}
                onClick={() => setShowPromoModal(true)}
                className={`px-4 py-2 text-white rounded-md font-semibold text-xs shadow-sm transition-all ${
                  promotionRequested 
                    ? 'bg-emerald-500 cursor-default' 
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500'
                }`}
              >
                {promotionRequested ? "Pengajuan Terkirim ✓" : "Ajukan Kenaikan"}
              </button>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(creditPoints/100)*100}%` }} />
            </div>

            <button onClick={() => setShowCertModal(true)} className="w-full py-2.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Input Kegiatan Mandiri (+ Poin)
            </button>
          </Card>
        </div>
      </div>

      {/* Document Upload Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Unggah: {docModalData.label}</h2>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDocSubmit} className="p-6 space-y-4">
              {docModalData.fields.map(field => (
                <div key={field.id}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{field.label}</label>
                  <input 
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                    required 
                    value={docFormData[field.id] || ''} 
                    onChange={e => setDocFormData({...docFormData, [field.id]: e.target.value})} 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50" 
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">File Dokumen Pindaian (PDF/Image)</label>
                <input 
                  type="file" 
                  required 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setDocFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" 
                />
              </div>
              <div className="pt-2">
                <button disabled={docSubmitting} type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {docSubmitting ? 'Mengunggah & Menyimpan...' : 'Simpan & Unggah Dokumen'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Cert Modal */}
      {showCertModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Input Kegiatan Mandiri</h3>
              <button onClick={() => setShowCertModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kegiatan/Diklat</label>
                <input required type="text" value={certForm.title} onChange={e=>setCertForm({...certForm, title: e.target.value})} className="w-full p-2 rounded border border-slate-300 text-sm" placeholder="Contoh: Pelatihan Kurikulum Merdeka" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Penyelenggara</label>
                <input required type="text" value={certForm.issuer} onChange={e=>setCertForm({...certForm, issuer: e.target.value})} className="w-full p-2 rounded border border-slate-300 text-sm" placeholder="Contoh: Kemdikbud" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
                <input required type="date" value={certForm.date_issued} onChange={e=>setCertForm({...certForm, date_issued: e.target.value})} className="w-full p-2 rounded border border-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unggah Sertifikat (PDF/Gambar)</label>
                <input required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setCertForm({...certForm, file: e.target.files?.[0] || null})} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
              <button disabled={certSubmitting} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-bold text-xs flex justify-center items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 mt-2">
                {certSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {certSubmitting ? 'Menyimpan...' : 'Simpan & Ajukan Verifikasi'}
              </button>
            </form>
          </Card>
        </div>
      )}
      {/* Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl rounded-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Form Pengajuan Kenaikan Pangkat</h3>
              <button onClick={() => setShowPromoModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 mb-4">
                <p className="text-xs text-indigo-700 font-medium">Selamat! Poin Anda ({creditPoints}/100) sudah memenuhi syarat. Silakan lengkapi formulir di bawah ini.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea rows={3} value={promoForm.notes} onChange={e=>setPromoForm({...promoForm, notes: e.target.value})} className="w-full p-2 rounded border border-slate-300 text-sm" placeholder="Tuliskan catatan untuk tim penilai..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dokumen Pendukung Tambahan (PDF/Image)</label>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e=>setPromoForm({...promoForm, file: e.target.files?.[0] || null})} className="w-full p-2 rounded border border-slate-300 text-sm bg-white" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 py-2 rounded border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={promoSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {promoSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
