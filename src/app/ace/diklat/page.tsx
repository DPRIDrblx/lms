"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { GraduationCap, Upload, FileText, CheckCircle2, Clock, Loader2, FileBadge } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export default function ACEDiklat() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({ title: "", issuer: "", date_issued: "", points: 1 });
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchCertificates = async () => {
    let query = supabase.from('ace_certificates').select('*, profiles(full_name)').order('created_at', { ascending: false });
    
    if (profile?.role === 'teacher') {
      query = query.eq('teacher_id', profile.id);
    }
    
    const { data } = await query;
    if (data) setCertificates(data);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchCertificates();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitLoading(true);

    try {
      let file_url = null;
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${profile.id}-diklat-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ace_storage')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('ace_storage')
          .getPublicUrl(filePath);
        
        file_url = publicUrlData.publicUrl;
      }

      await supabase.from('ace_certificates').insert({
        teacher_id: profile.id,
        file_url,
        ...form
      });
      
      setForm({ title: "", issuer: "", date_issued: "", points: 1 });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchCertificates();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerify = async (id: string, status: string) => {
    await supabase.from('ace_certificates').update({ status }).eq('id', id);
    fetchCertificates();
  };

  if (!profile) return null;
  const isTeacher = profile.role === 'teacher';

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Diklat & Sertifikasi</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Pengembangan Diri dan Peningkatan Kompetensi Guru</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isTeacher && (
          <div className="lg:col-span-1">
            <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white sticky top-6">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Input Sertifikat Baru</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Diklat/Pelatihan</label>
                  <input required value={form.title} onChange={e=>setForm({...form, title: e.target.value})} type="text" className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Cth: Implementasi Kurikulum Merdeka" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Penyelenggara (Issuer)</label>
                  <input required value={form.issuer} onChange={e=>setForm({...form, issuer: e.target.value})} type="text" className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Cth: Kemendikbudristek" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
                    <input required value={form.date_issued} onChange={e=>setForm({...form, date_issued: e.target.value})} type="date" className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Est. Poin (JP)</label>
                    <input required value={form.points} onChange={e=>setForm({...form, points: parseInt(e.target.value)})} type="number" min="1" className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unggah Sertifikat (PDF/JPG)</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border border-dashed border-slate-300 rounded-md bg-slate-50 text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-300 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-xs font-medium text-slate-600">
                      {selectedFile ? selectedFile.name : 'Klik untuk memilih file'}
                    </span>
                  </div>
                </div>

                <button disabled={submitLoading || !selectedFile} className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                  {submitLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {submitLoading ? 'Menyimpan...' : 'Ajukan Sertifikat'}
                </button>
              </form>
            </Card>
          </div>
        )}

        <div className={`lg:col-span-${isTeacher ? '2' : '3'} space-y-4`}>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
            {isTeacher ? 'Riwayat Diklat Saya' : 'Antrean Verifikasi Diklat Guru'}
          </h2>
          
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm border border-slate-200 rounded-lg bg-white shadow-sm">Memuat data...</div>
          ) : certificates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm border border-slate-200 rounded-lg bg-white shadow-sm">Belum ada data sertifikat/diklat.</div>
          ) : (
            <div className="grid gap-3">
              {certificates.map(cert => (
                <Card key={cert.id} className="p-4 rounded-lg border border-slate-200 shadow-sm bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={`p-3 rounded-md ${cert.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : cert.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                        <FileBadge className="w-5 h-5" />
                      </div>
                      <div>
                        {!isTeacher && <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">{cert.profiles.full_name}</p>}
                        <h3 className="font-semibold text-slate-800 text-sm leading-tight mb-1">{cert.title}</h3>
                        <p className="text-xs text-slate-500">{cert.issuer} &bull; {new Date(cert.date_issued).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      {cert.status === 'pending' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Menunggu Verifikasi</span>}
                      {cert.status === 'verified' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Terverifikasi ({cert.points} pt)</span>}
                      {cert.status === 'rejected' && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase tracking-wider">Ditolak</span>}

                      {cert.file_url && (
                        <a href={cert.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                          Lihat Dokumen
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {!isTeacher && cert.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 justify-end">
                      <button onClick={() => handleVerify(cert.id, 'rejected')} className="px-3 py-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 font-semibold text-xs rounded border border-rose-200 transition-colors">Tolak Dokumen</button>
                      <button onClick={() => handleVerify(cert.id, 'verified')} className="px-3 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs rounded shadow-sm transition-colors">Setujui & Tambah Poin</button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
