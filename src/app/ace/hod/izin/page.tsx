"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarCheck, ShieldCheck, UserMinus, Clock, Users, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HoDIzin() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [leaves, setLeaves] = useState<any[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch pending tier-1 leaves
    const { data: pendingLeaves } = await supabase
      .from('ace_leaves')
      .select('*, profiles(full_name)')
      .eq('hod_status', 'pending');
      
    if (pendingLeaves) setLeaves(pendingLeaves);

    // Fetch schedules for today (0=Sun, 6=Sat)
    const today = new Date().getDay();
    const { data: schedules } = await supabase
      .from('ace_schedules')
      .select('*, profiles(full_name)')
      .eq('day_of_week', today)
      .order('start_time');

    // Fetch approved/pending leaves for today to see who is absent
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: activeLeaves } = await supabase
      .from('ace_leaves')
      .select('teacher_id, type')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .neq('hod_status', 'rejected'); // Only consider not rejected

    if (schedules) {
      const absentTeacherIds = new Set(activeLeaves?.map((l: any) => l.teacher_id) || []);
      const enrichedSchedules = schedules.map((s: any) => ({
        ...s,
        is_absent: absentTeacherIds.has(s.teacher_id),
        leave_type: activeLeaves?.find((l: any) => l.teacher_id === s.teacher_id)?.type
      }));
      setTodaySchedules(enrichedSchedules);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      await supabase.from('ace_leaves').update({ hod_status: action }).eq('id', id);
      setLeaves(prev => prev.filter(l => l.id !== id));
      alert(`Persetujuan Tier-1 telah di-${action === 'approved' ? 'Setujui' : 'Tolak'}.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!profile || !profile.is_hod) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Otorisasi Cuti & Substitusi Kelas</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Departmental Cover & Leave Control (Tier-1)</p>
      </div>

      {/* Timeline Room Allocation (Cover Sheet Audit) */}
      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <CalendarCheck className="w-32 h-32 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Timeline Room Allocation (Hari Ini)</h2>
          </div>
          
          <div className="space-y-3">
            {todaySchedules.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Tidak ada jadwal terdaftar untuk hari ini.</p>
            ) : todaySchedules.map(schedule => (
              <div key={schedule.id} className="flex gap-4 items-center">
                <div className="w-24 text-xs font-bold text-slate-500 shrink-0">{schedule.start_time.substring(0,5)} - {schedule.end_time.substring(0,5)}</div>
                {schedule.is_absent ? (
                  <div className="flex-1 bg-rose-100 border border-rose-200 rounded p-2 text-xs font-bold text-rose-700 flex justify-between items-center">
                    <span>{schedule.class_name} ({schedule.subject}) - KOSONG (Guru {schedule.leave_type === 'cuti' ? 'Cuti' : 'Dinas Luar'})</span>
                    <button onClick={() => alert("Mengirim permintaan tukar jam ke guru yang bersangkutan...")} className="px-2 py-0.5 bg-rose-600 text-white rounded shadow-sm text-[10px]">Tukar Jam</button>
                  </div>
                ) : (
                  <div className="flex-1 bg-emerald-100 border border-emerald-200 rounded p-2 text-xs font-bold text-emerald-700">
                    {schedule.class_name} ({schedule.subject}) - Pengajar: {schedule.profiles?.full_name}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 max-w-md">Jika ada kelas kosong, gunakan fitur <strong>Inter-Exchange Log</strong> untuk mencari substitusi guru serumpun yang memiliki jam kosong.</p>
            <button onClick={() => alert("Membuka sistem pencarian guru serumpun yang sedang tidak memiliki jadwal kelas...")} className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-xs rounded hover:bg-indigo-100 transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" /> Cari Guru Pengganti
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Antrean Persetujuan Dampak Akademis (Tier-1)</h2>
            <p className="text-xs text-slate-500 font-medium">Validasi apakah kelas aman sebelum pengajuan diteruskan ke Kepsek.</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : leaves.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan cuti/dinas yang menunggu validasi Anda.</p>
            </div>
          ) : leaves.map(leave => (
            <div key={leave.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">{leave.profiles?.full_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${leave.type === 'dinas_luar' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {leave.type === 'dinas_luar' ? 'Dinas Luar' : 'Cuti'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Periode: {leave.start_date} s/d {leave.end_date}
                </p>
                <p className="text-sm text-slate-700">"{leave.reason}"</p>
              </div>
              <div className="flex shrink-0 gap-2 w-full md:w-auto">
                <button 
                  disabled={processing}
                  onClick={() => handleAction(leave.id, 'approved')}
                  className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded shadow-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validate Substitution
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
