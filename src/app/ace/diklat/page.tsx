"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { GraduationCap, Upload, FileText, CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function ACEDiklat() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [form, setForm] = useState({ title: "", issuer: "", date_issued: "", points: 1 });
  const [submitLoading, setSubmitLoading] = useState(false);

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
    setSubmitLoading(true);
    await supabase.from('ace_certificates').insert({
      teacher_id: profile?.id,
      ...form
    });
    setForm({ title: "", issuer: "", date_issued: "", points: 1 });
    fetchCertificates();
    setSubmitLoading(false);
  };

  const handleVerify = async (id: string, status: string) => {
    await supabase.from('ace_certificates').update({ status }).eq('id', id);
    fetchCertificates();
  };

  if (!profile) return null;
  const isTeacher = profile.role === 'teacher';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Diklat & Sertifikasi</h1>
        <p className="text-slate-500 font-medium mt-1">Pengembangan Diri dan Peningkatan Kompetensi Guru</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form (Teacher Only) */}
        {isTeacher && (
          <div className="lg:col-span-1">
            <Card className="p-6 border-2 border-slate-200 rounded-3xl sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-black text-slate-800">Unggah Sertifikat</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Pelatihan/Diklat</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500" placeholder="Contoh: Bimbingan Teknis Kurikulum..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Penyelenggara</label>
                  <input required value={form.issuer} onChange={e => setForm({...form, issuer: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500" placeholder="Contoh: Kemdikbud / Dinas..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal</label>
                    <input required type="date" value={form.date_issued} onChange={e => setForm({...form, date_issued: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Poin / JP</label>
                    <input required type="number" min="1" value={form.points} onChange={e => setForm({...form, points: Number(e.target.value)})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500" />
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 cursor-not-allowed">
                  <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <span className="text-xs font-bold block">Upload PDF (Coming Soon)</span>
                </div>

                <button disabled={submitLoading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
                  {submitLoading ? "Menyimpan..." : "Simpan Dokumen"}
                </button>
              </form>
            </Card>
          </div>
        )}

        {/* Right Column: List of Certificates */}
        <div className={isTeacher ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {isTeacher ? "Riwayat Diklat Saya" : "Verifikasi Diklat Pendidik"}
            </h2>
          </div>

          <div className="space-y-4">
            {loading ? <p>Memuat...</p> : certificates.length === 0 ? (
              <div className="text-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                <p className="text-slate-500 font-bold">Belum ada riwayat sertifikat.</p>
              </div>
            ) : certificates.map(cert => (
              <Card key={cert.id} className="p-5 border-2 border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center hover:border-slate-300 transition-colors">
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-2xl shrink-0 ${cert.status === 'verified' ? 'bg-emerald-100 text-emerald-600' : cert.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                    {cert.status === 'verified' ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    {!isTeacher && <p className="text-xs font-black text-indigo-500 mb-1">{cert.profiles.full_name}</p>}
                    <h3 className="font-bold text-slate-800">{cert.title}</h3>
                    <p className="text-sm font-medium text-slate-500">{cert.issuer} &bull; {cert.date_issued}</p>
                    <div className="mt-2 inline-flex items-center px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                      +{cert.points} Poin Kompetensi
                    </div>
                  </div>
                </div>

                {!isTeacher && cert.status === 'pending' && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => handleVerify(cert.id, 'rejected')} className="px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-sm flex-1 sm:flex-none hover:bg-rose-100">
                      Tolak
                    </button>
                    <button onClick={() => handleVerify(cert.id, 'verified')} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm flex-1 sm:flex-none shadow-sm shadow-emerald-500/20 hover:bg-emerald-600">
                      Verifikasi
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
