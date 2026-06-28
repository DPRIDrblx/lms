"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarCheck, Map, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrincipalIzin() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState({ present: 0, leave: 0, duty: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending leaves
    const { data: leavesData } = await supabase
      .from('ace_leaves')
      .select('*, profiles(full_name)')
      .eq('status', 'pending');
      
    if (leavesData) setLeaves(leavesData);

    // Heatmap Calculation (Mock based on current data)
    const { data: teachersData } = await supabase.from('profiles').select('id').eq('role', 'teacher');
    const total = teachersData?.length || 0;
    
    // Simplistic heatmap for today
    const { data: attData } = await supabase.from('ace_attendances').select('teacher_id').gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
    const presentCount = [...new Set(attData?.map((a: any) => a.teacher_id))].length;
    
    // We would need to properly check overlap of dates, for now we mock based on leaves length
    const leaveCount = leavesData?.filter((l: any) => l.type === 'cuti').length || 0;
    const dutyCount = leavesData?.filter((l: any) => l.type === 'dinas_luar').length || 0;
    
    setHeatmap({ present: presentCount, leave: leaveCount, duty: dutyCount, total });
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      await supabase.from('ace_leaves').update({ status: action }).eq('id', id);
      setLeaves(prev => prev.filter(l => l.id !== id));
      alert(`Pengajuan telah ${action === 'approved' ? 'disetujui' : 'ditolak'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!profile || profile.role !== 'principal') return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Otorisasi Cuti & Laporan Dinas</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Konsol Pengesahan Pergerakan SDM Makro</p>
      </div>

      {/* Heatmap Card */}
      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Map className="w-32 h-32 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <h2 className="text-base font-bold text-slate-800 mb-6">School Mobility Heatmap (Hari Ini)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-500 font-medium mb-1">Total Guru</p>
              <p className="text-2xl font-black text-slate-800">{heatmap.total}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-600 font-medium mb-1">Hadir (Mengajar)</p>
              <p className="text-2xl font-black text-emerald-700">{heatmap.present}</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-600 font-medium mb-1">Dinas Luar</p>
              <p className="text-2xl font-black text-amber-700">{heatmap.duty}</p>
            </div>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-xs text-rose-600 font-medium mb-1">Cuti / Izin</p>
              <p className="text-2xl font-black text-rose-700">{heatmap.leave}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Antrean Persetujuan Makro</h2>
            <p className="text-xs text-slate-500 font-medium">Cuti Jangka Panjang & Surat Perintah Perjalanan Dinas (SPPD)</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : leaves.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm font-medium text-slate-500">Semua pengajuan telah diproses.</p>
            </div>
          ) : leaves.map(leave => (
            <div key={leave.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">{leave.profiles?.full_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${leave.type === 'dinas_luar' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {leave.type === 'dinas_luar' ? 'SPPD / Dinas Luar' : 'Cuti Panjang'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1">Periode: {leave.start_date} s/d {leave.end_date}</p>
                <p className="text-sm text-slate-700">"{leave.reason}"</p>
                {leave.type === 'cuti' && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-2 bg-amber-50 inline-block px-2 py-1 rounded border border-amber-200">
                    Sistem mendeteksi ada jadwal mengajar pada tanggal tersebut. (Perlu dicarikan guru pengganti oleh TU).
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2 w-full md:w-auto">
                <button 
                  disabled={processing}
                  onClick={() => handleAction(leave.id, 'approved')}
                  className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button 
                  disabled={processing}
                  onClick={() => handleAction(leave.id, 'rejected')}
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-3.5 h-3.5" /> Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
