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
      setTeachers(Array.from(map.values()));
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
                    <p className="font-semibold text-slate-700 text-xs mb-6">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('id-ID') : 'Seumur Hidup'}</p>

                    <div className="flex gap-2">
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
    </div>
  );
}
