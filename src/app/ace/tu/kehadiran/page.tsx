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
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [scheduleForm, setScheduleForm] = useState({
    id: null as string | null,
    teacher_id: "",
    day_of_week: 1,
    start_time: "07:00",
    end_time: "08:30",
    subject_name: "",
    class_name: ""
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    late_time: "07:15:00",
    overtime_start: "15:00:00",
    is_holiday: false,
    routine_holidays: [0, 6] as number[]
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Emergency State (No mock data, wait for real emergency trigger in future)
  const [emergencyActive, setEmergencyActive] = useState(false);
  const standbyTeachers: string[] = [];
  const [subEdits, setSubEdits] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    // Fetch today's attendances (simplification: fetch latest per teacher)
    const { data: atts } = await supabase.from('ace_attendances').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20);
    if (atts) setAttendances(atts);

    // Fetch substitutions pending
    const { data: subs } = await supabase.from('ace_substitutions')
      .select('*, requestor:requestor_id(full_name), substitute:substitute_id(full_name), schedule:schedule_id(*)')
      .in('status', ['pending_tu', 'rejected_sub']);
    if (subs) setSubstitutions(subs);

    // Fetch teachers
    const { data: tData } = await supabase.from('profiles').select('id, full_name').eq('role', 'teacher');
    if (tData) {
      setTeachers(tData);
      if (tData.length > 0) {
        setScheduleForm(prev => ({ ...prev, teacher_id: prev.teacher_id || tData[0].id }));
      }
    }

    // Fetch schedules
    const { data: sData } = await supabase.from('ace_schedules').select('*, profiles(full_name)').order('day_of_week', { ascending: true });
    if (sData) setSchedules(sData);

    // Fetch settings
    const { data: setts } = await supabase.from('ace_attendance_settings').select('*').eq('id', 1).single();
    if (setts) {
      setSettings({
        late_time: setts.late_time,
        overtime_start: setts.overtime_start,
        is_holiday: setts.is_holiday,
        routine_holidays: setts.routine_holidays || [0, 6]
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleSubApproval = async (id: string, status: string, currentSubstituteId: string) => {
    const updateData: any = { status };
    if (subEdits[id] && subEdits[id] !== currentSubstituteId) {
      updateData.substitute_id = subEdits[id];
    }
    await supabase.from('ace_substitutions').update(updateData).eq('id', id);
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
      if (scheduleForm.id) {
        const { error } = await supabase.from('ace_schedules').update({
          teacher_id: scheduleForm.teacher_id,
          day_of_week: scheduleForm.day_of_week,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          subject_name: scheduleForm.subject_name,
          class_name: scheduleForm.class_name
        }).eq('id', scheduleForm.id);
        if (error) throw error;
        alert("Jadwal berhasil diperbarui!");
      } else {
        const { error } = await supabase.from('ace_schedules').insert({
          teacher_id: scheduleForm.teacher_id,
          day_of_week: scheduleForm.day_of_week,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          subject_name: scheduleForm.subject_name,
          class_name: scheduleForm.class_name
        });
        if (error) throw error;
        alert("Jadwal berhasil ditambahkan!");
      }
      setScheduleForm({ id: null, teacher_id: teachers[0]?.id || "", day_of_week: 1, start_time: "07:00", end_time: "08:30", subject_name: "", class_name: "" });
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleScheduleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    setScheduleLoading(true);
    try {
      const { error } = await supabase.from('ace_schedules').delete().eq('id', id);
      if (error) throw error;
      alert("Jadwal berhasil dihapus!");
      fetchData();
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const { error } = await supabase.from('ace_attendance_settings').upsert({
        id: 1,
        late_time: settings.late_time,
        overtime_start: settings.overtime_start,
        is_holiday: settings.is_holiday,
        routine_holidays: settings.routine_holidays,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      alert("Pengaturan kehadiran berhasil disimpan!");
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSyncTodayAttendances = async () => {
    if (!confirm("Fitur ini akan mengevaluasi ulang status Telat/Lembur semua absen yang masuk hari ini berdasarkan pengaturan terbaru. Lanjutkan?")) return;
    setSettingsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAtts, error: fetchErr } = await supabase.from('ace_attendances').select('*').eq('date', today);
      if (fetchErr) throw fetchErr;

      const dayOfWeek = new Date().getDay();
      const isWeekend = settings.routine_holidays.includes(dayOfWeek);
      const isHolidayMode = settings.is_holiday || isWeekend;

      for (const att of todayAtts) {
        if (!att.check_in_time) continue;
        const checkInDate = new Date(att.check_in_time);
        
        const [lateHour, lateMin] = settings.late_time.split(':').map(Number);
        const lateThreshold = new Date(checkInDate);
        lateThreshold.setHours(lateHour, lateMin, 0, 0);

        let isLate = false;
        let isOvertime = false;

        if (isHolidayMode) {
          isOvertime = true;
        } else {
          if (checkInDate > lateThreshold) isLate = true;
          // Check overtime based on checkout time if present
          if (att.check_out_time) {
            const checkOutDate = new Date(att.check_out_time);
            const [overHour, overMin] = settings.overtime_start.split(':').map(Number);
            const overThreshold = new Date(checkOutDate);
            overThreshold.setHours(overHour, overMin, 0, 0);
            if (checkOutDate >= overThreshold) isOvertime = true;
          }
        }

        await supabase.from('ace_attendances').update({
          is_late: isLate,
          is_overtime: isOvertime
        }).eq('id', att.id);
      }

      alert("Selesai! Seluruh absen hari ini telah disinkronisasi ulang dengan pengaturan baru.");
      fetchData();
    } catch (err: any) {
      alert("Gagal sinkronisasi: " + err.message);
    } finally {
      setSettingsLoading(false);
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
          { id: 'pengaturan', label: 'Pengaturan Jam & Libur' },
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
            <h2 className="text-sm font-bold text-slate-800">Antrean Verifikasi Guru Piket / Pengganti</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? <p className="p-4 text-xs text-slate-500">Memuat data...</p> : substitutions.length === 0 ? <p className="p-4 text-xs text-slate-500">Tidak ada antrean substitusi manual.</p> : substitutions.map(sub => (
              <div key={sub.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-bold text-slate-800">{sub.requestor?.full_name}</p>
                    <span className="text-xs text-slate-400">&rarr;</span>
                    {/* TU can override the substitute */}
                    <select 
                      className="p-1 border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold text-xs rounded"
                      value={subEdits[sub.id] || sub.substitute_id}
                      onChange={(e) => setSubEdits({ ...subEdits, [sub.id]: e.target.value })}
                    >
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                    </select>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                    <p>Mata Pelajaran: <span className="text-slate-700">{sub.schedule?.subject_name} ({sub.schedule?.class_name})</span></p>
                    <p>Waktu: <span className="text-slate-700">{sub.schedule?.start_time.substring(0,5)} - {sub.schedule?.end_time.substring(0,5)}</span></p>
                    <p>Tanggal Absen: <span className="text-rose-600">{sub.substitution_date}</span></p>
                    {sub.status === 'rejected_sub' && <p className="text-rose-600 font-bold mt-1">Ditolak oleh Guru Piket sebelumnya. Pilih guru lain.</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <button onClick={() => handleSubApproval(sub.id, 'rejected_tu', sub.substitute_id)} className="px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Tolak Total
                  </button>
                  <button onClick={() => handleSubApproval(sub.id, 'pending_sub', sub.substitute_id)} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded shadow-sm transition-colors flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Teruskan ke Guru Piket
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
              {scheduleForm.id ? "Simpan Perubahan Jadwal" : "Tambahkan Jadwal"}
            </button>
            {scheduleForm.id && (
              <button type="button" onClick={() => setScheduleForm({ id: null, teacher_id: teachers[0]?.id || "", day_of_week: 1, start_time: "07:00", end_time: "08:30", subject_name: "", class_name: "" })} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-xs shadow-sm hover:bg-slate-200 transition-colors mt-2">
                Batal Edit
              </button>
            )}
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Daftar Jadwal KBM Terdaftar</h3>
            <div className="space-y-3">
              {schedules.map(sch => (
                <div key={sch.id} className="p-3 border border-slate-200 rounded-md bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{sch.profiles?.full_name}</p>
                    <p className="text-xs text-slate-600">{['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][sch.day_of_week - 1]} | {sch.start_time} - {sch.end_time}</p>
                    <p className="text-xs font-semibold text-indigo-600 mt-1">{sch.subject_name} • Kelas {sch.class_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setScheduleForm(sch)} className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-xs font-bold transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleScheduleDelete(sch.id)} className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded text-xs font-bold transition-colors">
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
              {schedules.length === 0 && !loading && (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada jadwal KBM yang terdaftar.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'pengaturan' && (
        <Card className="p-6 rounded-lg border border-slate-200 bg-white shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Pengaturan Waktu Presensi Global</h2>
          <p className="text-sm text-slate-500 mb-6">Sesuaikan batas jam masuk, jam pulang (lembur), serta aktifkan mode libur jika seluruh jadwal sedang ditiadakan (contoh: libur semester) sehingga yang absen akan tercatat lembur.</p>
          
          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Jam Terlambat (Mulai Pagi)</label>
                <input 
                  type="time" 
                  step="1"
                  required 
                  value={settings.late_time} 
                  onChange={e => setSettings({...settings, late_time: e.target.value})} 
                  className="w-full p-2 rounded border border-slate-300 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Kepulangan (Hitungan Lembur)</label>
                <input 
                  type="time" 
                  step="1"
                  required 
                  value={settings.overtime_start} 
                  onChange={e => setSettings({...settings, overtime_start: e.target.value})} 
                  className="w-full p-2 rounded border border-slate-300 text-sm" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border border-rose-200 bg-rose-50 rounded-lg">
              <input 
                type="checkbox" 
                id="holiday-mode" 
                checked={settings.is_holiday}
                onChange={e => setSettings({...settings, is_holiday: e.target.checked})}
                className="w-5 h-5 accent-rose-600 rounded"
              />
              <div>
                <label htmlFor="holiday-mode" className="font-bold text-rose-800 text-sm cursor-pointer">Aktifkan Mode Libur/Akhir Pekan</label>
                <p className="text-xs text-rose-600 font-medium">Jika dicentang, seluruh guru yang absen hari ini akan langsung terhitung masuk status "Lembur".</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="block text-xs font-semibold text-slate-700 mb-2">Hari Libur Rutin Mingguan</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Senin", val: 1 }, { label: "Selasa", val: 2 }, { label: "Rabu", val: 3 },
                  { label: "Kamis", val: 4 }, { label: "Jumat", val: 5 }, { label: "Sabtu", val: 6 }, { label: "Minggu", val: 0 }
                ].map(day => (
                  <label key={day.val} className="flex items-center gap-1.5 p-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="accent-indigo-600 w-3.5 h-3.5"
                      checked={settings.routine_holidays.includes(day.val)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ ...settings, routine_holidays: [...settings.routine_holidays, day.val] });
                        } else {
                          setSettings({ ...settings, routine_holidays: settings.routine_holidays.filter(d => d !== day.val) });
                        }
                      }}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col md:flex-row gap-2">
              <button disabled={settingsLoading} type="submit" className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-md font-bold text-xs flex justify-center items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {settingsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {settingsLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              <button disabled={settingsLoading} type="button" onClick={handleSyncTodayAttendances} className="flex-1 px-6 py-2.5 bg-amber-500 text-white rounded-md font-bold text-xs flex justify-center items-center gap-2 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                <CalendarCheck className="w-4 h-4" /> Sinkronisasi Status Absen Hari Ini
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
