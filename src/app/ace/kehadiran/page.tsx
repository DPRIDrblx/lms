"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { MapPin, Navigation, CalendarClock, Briefcase, FileText } from "lucide-react";
import { useState } from "react";

export default function ACEKehadiran() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  const [leaveForm, setLeaveForm] = useState({
    type: "cuti",
    start_date: "",
    end_date: "",
    reason: ""
  });

  const handlePresensi = async () => {
    setLoading(true);
    setMessage(null);

    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Browser tidak mendukung GPS." });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { error } = await supabase.from('ace_attendances').insert({
          teacher_id: profile?.id,
          status: 'hadir',
          latitude,
          longitude
        });

        if (error) {
          setMessage({ type: "error", text: "Gagal menyimpan presensi." });
        } else {
          setMessage({ type: "success", text: "Presensi berhasil dicatat!" });
        }
        setLoading(false);
      },
      (error) => {
        setMessage({ type: "error", text: "Akses lokasi ditolak atau gagal." });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCuti = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('ace_leaves').insert({
      teacher_id: profile?.id,
      ...leaveForm
    });

    if (error) {
      setMessage({ type: "error", text: "Gagal mengajukan cuti." });
    } else {
      setMessage({ type: "success", text: "Pengajuan berhasil dikirim ke Kepala Sekolah." });
      setLeaveForm({ type: "cuti", start_date: "", end_date: "", reason: "" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Presensi & Cuti</h1>
        <p className="text-slate-500 font-medium mt-1">Catat kehadiran dan kelola perizinan Anda</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border-2 font-bold ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Presensi Panel */}
        <Card className="p-8 border-2 border-slate-200 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Absen Masuk</h2>
              <p className="text-sm text-slate-500 font-medium">Berdasarkan lokasi GPS</p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center mb-6">
            <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 mb-1">Pastikan Anda berada di area sekolah</p>
            <p className="text-xs text-slate-500">Sistem akan mengambil koordinat GPS perangkat Anda.</p>
          </div>

          <button 
            onClick={handlePresensi}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : "Rekam Presensi Sekarang"}
          </button>
        </Card>

        {/* Cuti Form */}
        <Card className="p-8 border-2 border-slate-200 rounded-3xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <CalendarClock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Pengajuan Izin</h2>
              <p className="text-sm text-slate-500 font-medium">Cuti atau Dinas Luar</p>
            </div>
          </div>

          <form onSubmit={handleCuti} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Izin</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setLeaveForm({...leaveForm, type: 'cuti'})} className={`py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 ${leaveForm.type === 'cuti' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <CalendarClock className="w-4 h-4" /> Cuti
                </button>
                <button type="button" onClick={() => setLeaveForm({...leaveForm, type: 'dinas_luar'})} className={`py-3 rounded-xl font-bold border-2 flex items-center justify-center gap-2 ${leaveForm.type === 'dinas_luar' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  <Briefcase className="w-4 h-4" /> Dinas Luar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Mulai</label>
                <input required type="date" value={leaveForm.start_date} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Selesai</label>
                <input required type="date" value={leaveForm.end_date} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Alasan / Keterangan</label>
              <textarea required rows={3} value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0" placeholder="Jelaskan alasan pengajuan Anda..." />
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black transition-colors disabled:opacity-50">
              {loading ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
