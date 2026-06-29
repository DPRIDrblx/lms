"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { FileBadge, CheckCircle2, XCircle, FileText, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

export default function HoDKredit() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // State for points input
  const [points, setPoints] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    // Fetch pending certs
    const { data: certs } = await supabase.from('ace_certificates').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (certs) {
      setCertificates(certs);
      const pts: Record<string, number> = {};
      certs.forEach((c: any) => {
        pts[c.id] = c.points || 0;
      });
      setPoints(pts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleVerify = async (id: string, status: string) => {
    setSavingId(id);
    try {
      const p = points[id] || 0;
      await supabase.from('ace_certificates').update({ status, points: p }).eq('id', id);
      alert(`Sertifikat berhasil di${status === 'verified' ? 'sahkan' : 'tolak'}!`);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdatePoints = async (id: string) => {
    setSavingId(id);
    try {
      const p = points[id] || 0;
      await supabase.from('ace_certificates').update({ points: p }).eq('id', id);
      alert("Angka kredit berhasil diubah!");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (!profile || !profile.is_hod) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Angka Kredit Guru</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Verifikasi Sertifikat & Penilaian Kegiatan Mandiri</p>
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-sm text-slate-500">Memuat data...</p> : certificates.length === 0 ? <p className="text-sm text-slate-500 bg-white p-6 rounded-md border border-slate-200 shadow-sm">Belum ada pengajuan kegiatan mandiri.</p> : (
          <div className="grid grid-cols-1 gap-4">
            {certificates.map(cert => (
              <Card key={cert.id} className="p-0 rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row bg-white">
                <div className="p-6 md:w-1/2 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Pengunggah</p>
                      <p className="font-bold text-slate-800 text-sm">{cert.profiles?.full_name}</p>
                    </div>
                    <div>
                      {cert.status === 'pending' && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Menunggu</span>}
                      {cert.status === 'verified' && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">Disahkan</span>}
                      {cert.status === 'rejected' && <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase">Ditolak</span>}
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kegiatan / Diklat</p>
                  <p className="font-semibold text-slate-700 text-xs mb-4">{cert.title}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Penyelenggara</p>
                      <p className="font-semibold text-slate-700 text-xs">{cert.issuer}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal</p>
                      <p className="font-semibold text-slate-700 text-xs">{cert.date_issued ? new Date(cert.date_issued).toLocaleDateString('id-ID') : '-'}</p>
                    </div>
                  </div>

                  <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                    <label className="block text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Tetapkan Angka Kredit (Poin)</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0"
                        value={points[cert.id] ?? 0}
                        onChange={(e) => setPoints(prev => ({...prev, [cert.id]: parseInt(e.target.value) || 0}))}
                        className="w-24 p-2 rounded border border-indigo-200 text-sm font-bold text-indigo-700" 
                      />
                      <span className="text-xs font-semibold text-indigo-600">Poin</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cert.status === 'pending' ? (
                      <>
                        <button disabled={savingId === cert.id} onClick={() => handleVerify(cert.id, 'rejected')} className="flex-1 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-md border border-rose-200 transition-colors disabled:opacity-50">Tolak</button>
                        <button disabled={savingId === cert.id} onClick={() => handleVerify(cert.id, 'verified')} className="flex-1 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                          {savingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Sahkan
                        </button>
                      </>
                    ) : (
                      <button disabled={savingId === cert.id} onClick={() => handleUpdatePoints(cert.id)} className="w-full py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50">
                        {savingId === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Ubah Angka Kredit
                      </button>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 bg-slate-100 min-h-[300px] flex items-center justify-center p-4">
                  {cert.file_url ? (
                    <a href={cert.file_url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 shadow-sm transition-colors">
                      <FileBadge className="w-4 h-4" /> Buka Bukti Kegiatan
                    </a>
                  ) : (
                    <p className="text-xs text-slate-400 font-bold">Tidak ada lampiran bukti</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
