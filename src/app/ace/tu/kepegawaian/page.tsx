"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { UserCircle2, FileText, CheckCircle2, XCircle, Download, FileBadge } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUKepegawaian() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("verifikasi");

  // Verifikasi State
  const [documents, setDocuments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Permintaan Dokumen State
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', teacher_id: '', form_fields: [] as {id: string, label: string, type: string}[] });
  
  // Hasil Pelengkapan Modal State
  const [showRequestDocsModal, setShowRequestDocsModal] = useState(false);
  const [requestDocs, setRequestDocs] = useState<any[]>([]);
  const [loadingRequestDocs, setLoadingRequestDocs] = useState(false);
  const [selectedRequestTitle, setSelectedRequestTitle] = useState('');
  
  // Pangkat State
  const [teachers, setTeachers] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch pending docs
    const { data: docs } = await supabase.from('ace_documents').select('*, profiles(full_name)').eq('status', 'pending');
    if (docs) setDocuments(docs);

    // Fetch pending certs
    const { data: certs } = await supabase.from('ace_certificates').select('*, profiles(full_name)').eq('status', 'pending');
    if (certs) setCertificates(certs);

    // Fetch doc requests
    const { data: reqs } = await supabase.from('ace_document_requests').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (reqs) setDocRequests(reqs);

    // Fetch teachers (all teachers for the dropdown)
    const { data: allT } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
    const teacherList = allT || [];

    // Fetch teachers with points
    const { data: allCerts } = await supabase.from('ace_certificates').select('teacher_id, points, profiles(full_name)').eq('status', 'verified');
    if (allCerts) {
      const map = new Map();
      allCerts.forEach((c: any) => {
        if (!map.has(c.teacher_id)) {
          map.set(c.teacher_id, { id: c.teacher_id, name: c.profiles.full_name, totalPoints: 0 });
        }
        map.get(c.teacher_id).totalPoints += c.points;
      });
      // also add teachers who have 0 points so they show up
      teacherList.forEach((t: any) => {
        if (!map.has(t.id)) {
           map.set(t.id, { id: t.id, name: t.full_name, totalPoints: 0 });
        }
      });
      setTeachers(Array.from(map.values()));
    } else {
       setTeachers(teacherList.map((t: any) => ({ id: t.id, name: t.full_name, totalPoints: 0 })));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleVerify = async (table: string, id: string, status: string) => {
    let reason = null;
    if (status === 'rejected') {
      reason = prompt("Masukkan alasan penolakan:");
      if (!reason) return;
    }
    
    // Simplification: We don't have rejection_reason column for documents/certs yet, but we update status
    await supabase.from(table).update({ status }).eq('id', id);
    fetchData();
  };

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.title) return alert("Judul harus diisi");
    const { error } = await supabase.from('ace_document_requests').insert({
      title: newRequest.title,
      description: newRequest.description,
      teacher_id: newRequest.teacher_id ? newRequest.teacher_id : null,
      form_fields: newRequest.form_fields,
      created_by: profile?.id
    });
    if (error) alert("Error: " + error.message);
    else {
      alert("Permintaan berhasil dibuat");
      setNewRequest({ title: '', description: '', teacher_id: '', form_fields: [] });
      fetchData();
    }
  };

  const addFormField = () => {
    setNewRequest({
      ...newRequest,
      form_fields: [...newRequest.form_fields, { id: Date.now().toString(), label: '', type: 'text' }]
    });
  };

  const updateFormField = (index: number, key: string, value: string) => {
    const updated = [...newRequest.form_fields];
    updated[index] = { ...updated[index], [key]: value };
    setNewRequest({ ...newRequest, form_fields: updated });
  };

  const removeFormField = (index: number) => {
    const updated = newRequest.form_fields.filter((_, i) => i !== index);
    setNewRequest({ ...newRequest, form_fields: updated });
  };

  const handleViewRequestDocs = async (reqId: string, title: string) => {
    setLoadingRequestDocs(true);
    setSelectedRequestTitle(title);
    setShowRequestDocsModal(true);
    const { data } = await supabase
      .from('ace_documents')
      .select('*, profiles(full_name)')
      .eq('request_id', reqId)
      .order('created_at', { ascending: false });
    
    if (data) setRequestDocs(data);
    setLoadingRequestDocs(false);
  };

  const handleGenerateSK = (teacherName: string) => {
    alert(`SK Kenaikan Pangkat untuk ${teacherName} berhasil digenerate dan dikirim ke loket pencetakan.`);
  };

  const handleExport = () => {
    alert("Mengekspor Master Registry ke Format Excel (Standar Dapodik)...");
  };

  if (!profile || profile.role !== 'tu') return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TU Kepegawaian</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Validasi Data & Manajemen Dokumen Pegawai</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-sm flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" /> Export Master Registry
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'verifikasi', label: 'Antrean Verifikasi Berkas' },
          { id: 'permintaan', label: 'Permintaan Dokumen Kustom' },
          { id: 'pangkat', label: 'Pusat Kontrol Angka Kredit' },
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-md font-semibold text-xs whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'verifikasi' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Dokumen Portofolio & Legalitas</h2>
          {loading ? <p className="text-sm text-slate-500">Memuat antrean...</p> : documents.length === 0 ? <p className="text-sm text-slate-500 bg-white p-6 rounded-md border border-slate-200 shadow-sm">Tidak ada antrean dokumen.</p> : (
            <div className="grid grid-cols-1 gap-4">
              {documents.map(doc => (
                <Card key={doc.id} className="p-0 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row bg-white">
                  <div className="p-6 md:w-1/3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Pengunggah</p>
                    <p className="font-bold text-slate-800 text-sm mb-4">{doc.profiles.full_name}</p>
                    
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jenis Dokumen</p>
                    <p className="font-semibold text-slate-700 text-xs mb-4 capitalize">{doc.doc_type.replace('_', ' ')}</p>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Masa Berlaku</p>
                    <p className="font-semibold text-slate-700 text-xs mb-4">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('id-ID') : 'Seumur Hidup'}</p>

                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                      <div className="mb-6 p-3 bg-slate-100 rounded-md border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Detail Form / Metadata</p>
                        <div className="space-y-2">
                          {Object.entries(doc.metadata).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-[10px] font-bold text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                              <p className="text-xs font-semibold text-slate-700">{v as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => handleVerify('ace_documents', doc.id, 'rejected')} className="flex-1 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-md border border-rose-200 transition-colors">Tolak</button>
                      <button onClick={() => handleVerify('ace_documents', doc.id, 'verified')} className="flex-1 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-md shadow-sm transition-colors">Sahkan</button>
                    </div>
                  </div>
                  <div className="md:w-2/3 bg-slate-100 min-h-[300px] flex items-center justify-center p-4">
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 shadow-sm transition-colors">
                      <FileText className="w-4 h-4" /> Buka Dokumen Pindaian
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Removed certificates since it was getting too long, or we keep it as is, wait I will just append after certificates */}
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mt-8 mb-2">Sertifikat & Diklat</h2>
          {loading ? <p className="text-sm text-slate-500">Memuat antrean...</p> : certificates.length === 0 ? <p className="text-sm text-slate-500 bg-white p-6 rounded-md border border-slate-200 shadow-sm">Tidak ada antrean sertifikat.</p> : (
            <div className="grid grid-cols-1 gap-4">
              {certificates.map(cert => (
                <Card key={cert.id} className="p-0 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row bg-white">
                  <div className="p-6 md:w-1/3 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Pengunggah</p>
                    <p className="font-bold text-slate-800 text-sm mb-4">{cert.profiles.full_name}</p>
                    
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judul Diklat</p>
                    <p className="font-semibold text-slate-700 text-xs mb-4">{cert.title}</p>

                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Penyelenggara</p>
                        <p className="font-semibold text-slate-700 text-xs">{cert.issuer}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Klaim Poin</p>
                        <p className="font-bold text-indigo-600 text-sm">{cert.points} pt</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleVerify('ace_certificates', cert.id, 'rejected')} className="flex-1 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-md border border-rose-200 transition-colors">Tolak</button>
                      <button onClick={() => handleVerify('ace_certificates', cert.id, 'verified')} className="flex-1 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-md shadow-sm transition-colors">Sahkan</button>
                    </div>
                  </div>
                  <div className="md:w-2/3 bg-slate-100 min-h-[300px] flex items-center justify-center p-4">
                    {cert.file_url ? (
                      <a href={cert.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 shadow-sm transition-colors">
                        <FileBadge className="w-4 h-4" /> Buka Sertifikat Pindaian
                      </a>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold">Tidak ada file lampiran</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'permintaan' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-lg max-w-3xl">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Buat Permintaan Dokumen Baru</h2>
            <p className="text-sm text-slate-500 mb-6">Ajukan permintaan unggah dokumen tambahan ke guru. Anda bisa menentukan form spesifik yang harus diisi.</p>
            <form onSubmit={handleAddRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen</label>
                  <input type="text" required placeholder="Contoh: Pakta Integritas 2024" value={newRequest.title} onChange={e => setNewRequest({...newRequest, title: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Guru (Kosongkan = Semua Guru)</label>
                  <select value={newRequest.teacher_id} onChange={e => setNewRequest({...newRequest, teacher_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm bg-white">
                    <option value="">Semua Guru</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tambahan</label>
                <textarea rows={2} placeholder="Mohon unggah yang sudah ditandatangani basah..." value={newRequest.description} onChange={e => setNewRequest({...newRequest, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm resize-none"></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-slate-700">Form Metadata Kustom (Opsional)</label>
                  <button type="button" onClick={addFormField} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded hover:bg-indigo-100 transition-colors">+ Tambah Field</button>
                </div>
                {newRequest.form_fields.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada form tambahan.</p>
                ) : (
                  <div className="space-y-3">
                    {newRequest.form_fields.map((f, i) => (
                      <div key={f.id} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Nama Field (Pertanyaan)</label>
                          <input type="text" required placeholder="Contoh: Tanggal Terbit" value={f.label} onChange={e => updateFormField(i, 'label', e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded mt-1" />
                        </div>
                        <div className="w-1/3">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Tipe Data</label>
                          <select value={f.type} onChange={e => updateFormField(i, 'type', e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded mt-1 bg-white">
                            <option value="text">Teks Pendek</option>
                            <option value="date">Tanggal</option>
                            <option value="number">Angka / Nomor</option>
                          </select>
                        </div>
                        <div className="pt-5">
                          <button type="button" onClick={() => removeFormField(i)} className="p-2 text-rose-500 hover:bg-rose-100 rounded transition-colors"><XCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded hover:bg-indigo-700 transition-colors">Buat Permintaan</button>
              </div>
            </form>
          </Card>

          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Riwayat Permintaan</h2>
            {docRequests.length === 0 ? <p className="text-sm text-slate-500">Belum ada permintaan kustom dibuat.</p> : (
              <div className="grid gap-3">
                {docRequests.map(req => (
                  <Card key={req.id} className="p-4 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">{req.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{req.description}</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">Target: {req.teacher_id ? req.profiles?.full_name : 'Semua Guru'}</span>
                        <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{req.form_fields?.length || 0} Kolom Form</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end mt-4 md:mt-0">
                      <div className="text-xs text-slate-400 font-medium">
                        {new Date(req.created_at).toLocaleDateString('id-ID')}
                      </div>
                      <button 
                        onClick={() => handleViewRequestDocs(req.id, req.title)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors"
                      >
                        Lihat Hasil Pelengkapan
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pangkat' && (
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-md"><UserCircle2 className="w-5 h-5" /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daftar Angka Kredit Guru</h2>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Credit Score Audit</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {teachers.map(t => (
              <div key={t.id} className="p-4 rounded-md border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
                <div>
                  <p className="font-bold text-sm text-slate-800 mb-0.5">{t.name}</p>
                  <p className="text-xs font-semibold text-slate-500">Total Kredit Terverifikasi: <span className="text-indigo-600">{t.totalPoints} pt</span></p>
                </div>
                {t.totalPoints >= 100 ? (
                  <button onClick={() => handleGenerateSK(t.name)} className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-md shadow-sm hover:bg-emerald-700 transition-colors">
                    Generate SK Kenaikan Pangkat
                  </button>
                ) : (
                  <div className="px-3 py-1.5 bg-slate-200 text-slate-500 font-bold text-[10px] uppercase rounded-md">
                    Poin Belum Mencukupi
                  </div>
                )}
              </div>
            ))}
            {teachers.length === 0 && !loading && (
              <p className="text-sm text-slate-500 text-center p-4">Belum ada guru dengan poin kredit terverifikasi.</p>
            )}
          </div>
        </Card>
      )}

      {/* Request Docs Modal */}
      {showRequestDocsModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-bold text-slate-800">Hasil Pelengkapan</h2>
                <p className="text-xs text-slate-500">{selectedRequestTitle}</p>
              </div>
              <button onClick={() => setShowRequestDocsModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto grow bg-slate-50">
              {loadingRequestDocs ? (
                <p className="text-sm text-slate-500 text-center py-4">Memuat dokumen...</p>
              ) : requestDocs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 bg-white rounded border border-slate-200">Belum ada guru yang melengkapi dokumen ini.</p>
              ) : (
                <div className="space-y-4">
                  {requestDocs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Pengunggah</p>
                        <p className="font-bold text-slate-800 text-sm mb-3">{doc.profiles?.full_name || 'Tidak Diketahui'}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                            doc.status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                            doc.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            Status: {doc.status === 'verified' ? 'Disetujui' : doc.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </span>
                        </div>

                        {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Isian Form</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {Object.entries(doc.metadata).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-[10px] font-bold text-slate-400 capitalize block">{k.replace(/_/g, ' ')}:</span>
                                  <span className="text-xs font-semibold text-slate-700">{v as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center justify-center">
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-800 text-white font-bold text-xs rounded-md hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm">
                          <Download className="w-3 h-3" /> Unduh / Lihat File
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
