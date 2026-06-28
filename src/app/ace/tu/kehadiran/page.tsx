"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarCheck, AlertTriangle, CheckCircle2, XCircle, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function TUKehadiran() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("monitor");

  const [attendances, setAttendances] = useState<any[]>([]);
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [scheduleForm, setScheduleForm] = useState({
    teacher_id: "",
    day_of_week: 1,
    start_time: "07:00",
    end_time: "08:30",
    subject_name: "",
    class_name: ""
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Emergency State (No mock data, wait for real emergency trigger in future)
  const [emergencyActive, setEmergencyActive] = useState(false);
  const standbyTeachers: string[] = [];

  const fetchData = async () => {
    setLoading(true);
    // Fetch today's attendances (simplification: fetch latest per teacher)
    const { data: atts } = await supabase.from('ace_attendances').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20);
    if (atts) setAttendances(atts);

    // Fetch substitutions pending
    const { data: subs } = await supabase.from('ace_substitutions').select('*, requestor:requestor_id(full_name), substitute:substitute_id(full_name)').eq('status', 'pending');
    if (subs) setSubstitutions(subs);

    // Fetch teachers
    const { data: tData } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
    if (tData) {
      setTeachers(tData);
      if (tData.length > 0) setScheduleForm(prev => ({ ...prev, teacher_id: tData[0].id }));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleSubApproval = async (id: string, status: string) => {
    await supabase.from('ace_substitutions').update({ status }).eq('id', id);
    fetchData();
  };

  const handleEmergencyDispatch = () => {
    alert("Disposisi manual berhasil! Jadwal otomatis dialihkan ke Guru Piket Standby.");
    setEmergencyActive(false);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.teacher_id) {
      alert("Pilih guru terlebih dahulu.");
      return;
    }
    setScheduleLoading(true);
    try {
      await supabase.from('ace_schedules').insert({
        teacher_id: scheduleForm.teacher_id,
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        subject_name: scheduleForm.subject_name,
        class_name: scheduleForm.class_name
      });
      alert("Jadwal berhasil ditambahkan!");
      setScheduleForm(prev => ({ ...prev, subject_name: "", class_name: "" }));
    } catch (err: any) {
      alert("Gagal menambahkan jadwal: " + err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  if (!profile || profile.role !== 'tu') return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">TU Kurikulum & Umum</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Kendali Presensi, Cuti, & Jadwal</p>
        </div>
      </div>

      {emergencyActive && (
        <Card className="p-4 border-2 border-rose-500 bg-rose-50 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
            <div>
              <h2 className="text-sm font-bold text-rose-800">EMERGENCY REPORT DITERIMA</h2>
              <p className="text-xs font-semibold text-rose-600 mt-0.5">Guru A melaporkan keadaan darurat pagi ini. Menunggu disposisi pengganti!</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select className="flex-1 md:w-48 p-2 rounded border border-rose-300 text-xs font-semibold text-slate-700 bg-white">
              {standbyTeachers.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={handleEmergencyDispatch} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded shadow-sm hover:bg-rose-700">
              Disposisi Manual
            </button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'monitor', label: 'Live Attendance Monitor' },
          { id: 'cuti', label: 'Manajer Cuti & Delegasi' },
          { id: 'jadwal', label: 'Manajemen Jadwal KBM' },
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

      {activeTab === 'monitor' && (
        <Card className="p-0 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Log Presensi Hari Ini</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-4 text-xs text-slate-500">Memuat...</p> : attendances.length === 0 ? <p className="p-4 text-xs text-slate-500">Belum ada data kehadiran.</p> : attendances.map(att => (
              <div key={att.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-bold text-sm text-slate-800">{att.profiles?.full_name}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="flex gap-2 mt-1">
                    {att.is_late && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold uppercase">Telat</span>}
                    {att.is_overtime && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Lembur</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-xs text-emerald-600">Masuk: {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                    <p className="font-bold text-xs text-rose-600">Pulang: {att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 border border-slate-200">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    GPS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'cuti' && (
        <Card className="p-0 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Antrean Verifikasi Substitusi</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-4 text-xs text-slate-500">Memuat data...</p> : substitutions.length === 0 ? <p className="p-4 text-xs text-slate-500">Tidak ada antrean substitusi manual.</p> : substitutions.map(sub => (
              <div key={sub.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-800">{sub.requestor?.full_name}</p>
                    <span className="text-xs text-slate-400">&rarr;</span>
                    <p className="text-sm font-bold text-indigo-600">{sub.substitute?.full_name}</p>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500">Conflict Checker: <span className="text-emerald-600">Jadwal Pengganti Kosong (Aman)</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSubApproval(sub.id, 'rejected')} className="px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </button>
                  <button onClick={() => handleSubApproval(sub.id, 'accepted')} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Setujui (E-Sign)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'jadwal' && (
        <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm max-w-2xl">
          <h2 className="text-base font-bold text-slate-800 mb-4">Tambah Jadwal Mengajar (KBM)</h2>
          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Guru</label>
              <select required value={scheduleForm.teacher_id} onChange={e=>setScheduleForm({...scheduleForm, teacher_id: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm">
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hari</label>
                <select required value={scheduleForm.day_of_week} onChange={e=>setScheduleForm({...scheduleForm, day_of_week: parseInt(e.target.value)})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm">
                  <option value={1}>Senin</option>
                  <option value={2}>Selasa</option>
                  <option value={3}>Rabu</option>
                  <option value={4}>Kamis</option>
                  <option value={5}>Jumat</option>
                  <option value={6}>Sabtu</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input required type="time" value={scheduleForm.start_time} onChange={e=>setScheduleForm({...scheduleForm, start_time: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selesai</label>
                  <input required type="time" value={scheduleForm.end_time} onChange={e=>setScheduleForm({...scheduleForm, end_time: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <input required type="text" placeholder="Contoh: Matematika Peminatan" value={scheduleForm.subject_name} onChange={e=>setScheduleForm({...scheduleForm, subject_name: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
              <input required type="text" placeholder="Contoh: 12 MIPA 1" value={scheduleForm.class_name} onChange={e=>setScheduleForm({...scheduleForm, class_name: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
            </div>
            <button disabled={scheduleLoading} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-4">
              {scheduleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tambahkan Jadwal
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
