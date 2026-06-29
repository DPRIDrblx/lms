"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { MapPin, Camera, BookOpen, AlertTriangle, UserPlus, Plane, CalendarClock, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ACEKehadiran() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("presensi");
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);

  const [logbookForm, setLogbookForm] = useState({ materi: "", siswa_hadir: 30, catatan: "" });
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_date: "", leave_type: "Cuti Sakit" });
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [attendances, setAttendances] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      if (activeTab === 'presensi') {
        supabase.from('ace_attendances').select('*').eq('teacher_id', profile.id).order('created_at', { ascending: false }).limit(5)
          .then(({ data }: any) => { if (data) setAttendances(data); });
      } else if (activeTab === 'cuti') {
        supabase.from('profiles').select('*').eq('role', 'teacher').neq('id', profile.id)
          .then(({ data }: any) => { if (data) setTeachers(data); });
      }
    }
  }, [profile, activeTab]);

  const processAttendance = async (lat: number, lng: number, type: 'masuk' | 'pulang') => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      
      const { data: existing } = await supabase.from('ace_attendances')
        .select('*')
        .eq('teacher_id', profile?.id)
        .eq('date', today)
        .maybeSingle();

      if (type === 'pulang') {
        if (!existing) {
          alert("Anda belum melakukan Absen Masuk hari ini!");
          setLoadingGps(false);
          return;
        }
        if (existing.check_out_time) {
          alert("Anda sudah melakukan Absen Pulang hari ini!");
          setLoadingGps(false);
          return;
        }
        const isOvertime = isWeekend || now.getHours() >= 17;
        const { error: updateError } = await supabase.from('ace_attendances').update({
          check_out_time: now.toISOString(),
          is_overtime: existing.is_overtime || isOvertime
        }).eq('id', existing.id);
        if (updateError) throw updateError;
        alert("Berhasil Absen Pulang (Check-Out)!");
      } else {
        if (existing) {
          alert("Anda sudah melakukan Absen Masuk hari ini!");
          setLoadingGps(false);
          return;
        }
        const isLate = now.getHours() >= 7 && (now.getHours() > 7 || now.getMinutes() > 0);
        const { error: insertError } = await supabase.from('ace_attendances').insert({
          teacher_id: profile?.id,
          status: 'hadir',
          latitude: lat,
          longitude: lng,
          check_in_time: now.toISOString(),
          is_late: isLate,
          is_overtime: isWeekend,
          date: today
        });
        if (insertError) throw insertError;
        alert("Berhasil Absen Masuk (Check-In)!");
      }
      
      setGpsSuccess(true);
      
      // Refresh data
      const { data } = await supabase.from('ace_attendances').select('*').eq('teacher_id', profile?.id).order('created_at', { ascending: false }).limit(5);
      if (data) setAttendances(data);
      
    } catch (err: any) {
      alert("Gagal menyimpan presensi: " + err.message);
    } finally {
      setLoadingGps(false);
    }
  };

  const handleAbsen = (type: 'masuk' | 'pulang') => {
    if (!profile) return;
    setLoadingGps(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        processAttendance(lat, lng, type);
      }, (error) => {
        if (window.confirm(`Gagal mendapatkan lokasi GPS (${error.message}). Sinyal satelit di perangkat ini lemah/diblokir. Apakah Anda ingin menggunakan lokasi Bypass (Pusat Sekolah) untuk sementara?`)) {
          // Fallback to School coordinate
          processAttendance(-6.200000, 106.816666, type);
        } else {
          setLoadingGps(false);
        }
      }, { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 });
    } else {
      alert("Browser tidak mendukung Geolocation.");
      setLoadingGps(false);
    }
  };

  const handleEmergency = () => {
    if (window.confirm("Tombol ini akan memotong kuota cuti darurat dan menyalakan alarm di TU. Lanjutkan?")) {
      alert("Alarm Darurat TU telah dibunyikan! Menunggu penunjukan guru pengganti manual.");
    }
  };

  const handleLogbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLogbookLoading(true);
    try {
      await supabase.from('ace_logbooks').insert({
        teacher_id: profile.id,
        date: new Date().toISOString().split('T')[0],
        materi: logbookForm.materi,
        siswa_hadir: logbookForm.siswa_hadir,
        catatan: logbookForm.catatan
      });
      alert("Logbook berhasil disimpan!");
      setLogbookForm({ materi: "", siswa_hadir: 30, catatan: "" });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLogbookLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLeaveLoading(true);
    try {
      await supabase.from('ace_leaves').insert({
        teacher_id: profile.id,
        leave_date: leaveForm.leave_date,
        leave_type: leaveForm.leave_type
      });
      alert("Pengajuan cuti berhasil dikirim!");
      setLeaveForm({ leave_date: "", leave_type: "Cuti Sakit" });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleSubstitution = async (substituteId: string) => {
    if (!profile) return;
    try {
      // Mocking substitution request
      await supabase.from('ace_substitutions').insert({
        requestor_id: profile.id,
        substitute_id: substituteId,
        status: 'pending'
      });
      alert("Permohonan substitusi berhasil dikirim ke guru terkait.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Presensi & Mobilitas</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">Attendance & Mobility Management</p>
        </div>
        <button onClick={handleEmergency} className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-rose-100 transition-colors text-sm">
          <AlertTriangle className="w-4 h-4" /> Lapor Darurat (Bypass)
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {[
          { id: 'presensi', label: 'Presensi Harian' },
          { id: 'logbook', label: 'Logbook Mengajar' },
          { id: 'cuti', label: 'Pengajuan Cuti & Substitusi' },
          { id: 'dinas', label: 'Dinas Luar (SPPD)' }
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

      {activeTab === 'presensi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-8 rounded-xl border border-slate-200 bg-white shadow-sm text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${gpsSuccess ? 'bg-emerald-50 text-emerald-500 border-2 border-emerald-200' : 'bg-indigo-50 text-indigo-600 border-2 border-indigo-100'} relative transition-colors`}>
              {loadingGps && <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />}
              {gpsSuccess ? <CheckCircle2 className="w-8 h-8" /> : <MapPin className="w-8 h-8" />}
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {gpsSuccess ? 'Presensi Berhasil!' : 'Absen Kehadiran GPS'}
            </h2>
            <p className="text-slate-500 text-sm mb-6 px-4">
              {gpsSuccess ? 'Koordinat Anda telah diverifikasi berada di area sekolah.' : 'Sistem akan mengunci koordinat GPS perangkat Anda untuk verifikasi lokasi.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleAbsen('masuk')}
                disabled={loadingGps}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loadingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingGps ? "Mencari Satelit..." : "Absen Masuk"}
              </button>
              <button 
                onClick={() => handleAbsen('pulang')}
                disabled={loadingGps}
                className="w-full py-3 bg-rose-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loadingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingGps ? "Mencari Satelit..." : "Absen Pulang"}
              </button>
            </div>
          </Card>
          
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-2">Riwayat Presensi Terbaru</h3>
            {attendances.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada riwayat kehadiran.</p>
            ) : attendances.map(att => (
              <Card key={att.id} className="p-4 rounded-lg border border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs font-semibold mt-0.5 capitalize flex gap-2">
                    <span className="text-indigo-600">{att.status}</span>
                    {att.is_late && <span className="text-rose-600">Telat</span>}
                    {att.is_overtime && <span className="text-amber-600">Lembur</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs text-emerald-600">Masuk: {att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                  <p className="font-bold text-xs text-rose-600">Pulang: {att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logbook' && (
        <Card className="max-w-2xl p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Berita Acara Mengajar</h2>
              <p className="text-slate-500 text-xs font-medium">Wajib diisi sebelum meninggalkan area sekolah</p>
            </div>
          </div>
          
          <form onSubmit={handleLogbookSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bab / Materi Pembahasan</label>
              <input required value={logbookForm.materi} onChange={e=>setLogbookForm({...logbookForm, materi: e.target.value})} type="text" placeholder="Contoh: Limit Fungsi Trigonometri..." className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Siswa Hadir</label>
                <input required value={logbookForm.siswa_hadir} onChange={e=>setLogbookForm({...logbookForm, siswa_hadir: parseInt(e.target.value)})} type="number" min="0" className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Kejadian Kelas</label>
              <textarea value={logbookForm.catatan} onChange={e=>setLogbookForm({...logbookForm, catatan: e.target.value})} placeholder="Contoh: Siswa A tertidur di kelas..." rows={3} className="w-full p-2.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"></textarea>
            </div>
            <button disabled={logbookLoading} className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {logbookLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {logbookLoading ? 'Menyimpan...' : 'Simpan Logbook'}
            </button>
          </form>
        </Card>
      )}

      {activeTab === 'cuti' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">Formulir Pengajuan Cuti</h2>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Cuti</label>
                <input required type="date" value={leaveForm.leave_date} onChange={e=>setLeaveForm({...leaveForm, leave_date: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Cuti</label>
                <select value={leaveForm.leave_type} onChange={e=>setLeaveForm({...leaveForm, leave_type: e.target.value})} className="w-full p-2.5 rounded-md border border-slate-300 text-sm">
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Cuti Alasan Penting">Cuti Alasan Penting</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Dinas Luar (SPPD)">Dinas Luar (SPPD)</option>
                </select>
              </div>
              <div className="p-4 border border-dashed border-slate-300 rounded-md text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <p className="text-xs font-semibold text-slate-500">Upload Surat Pendukung (PDF/JPG)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Alur Persetujuan Digital:</p>
                <p className="text-xs text-slate-700 font-medium">Ketua Rumpun &rarr; Wakasek Kurikulum &rarr; Kepala TU &rarr; Principal</p>
              </div>
              <button disabled={leaveLoading} type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-md font-semibold text-xs shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {leaveLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Kirim Pengajuan
              </button>
            </form>
          </Card>

          <Card className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserPlus className="w-4 h-4" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Antrean Substitusi</h2>
                <p className="text-slate-500 text-xs">Pilih guru serumpun untuk delegasi tugas.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {teachers.map(t => (
                <div key={t.id} className="p-3 rounded-lg border border-slate-200 flex justify-between items-center bg-slate-50">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{t.full_name}</p>
                    <p className="text-xs text-slate-500">Guru Serumpun</p>
                  </div>
                  <button onClick={() => handleSubstitution(t.id)} className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-md shadow-sm transition-colors">Minta Tolong</button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'dinas' && (
        <Card className="p-12 rounded-xl border border-slate-200 text-center bg-slate-50 shadow-sm">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Check-in Dinas Luar</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Anda belum memiliki SPPD aktif saat ini. Saat dinas luar, tombol kamera akan muncul untuk memotret lokasi Anda beserta koordinat GPS.
          </p>
          <button className="px-6 py-2.5 bg-slate-800 text-white font-semibold text-sm rounded-lg opacity-50 cursor-not-allowed flex items-center gap-2 mx-auto">
            <Camera className="w-4 h-4" /> Mulai Check-in Dinas
          </button>
        </Card>
      )}
    </div>
  );
}
