"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { MapPin, Camera, BookOpen, AlertTriangle, UserPlus, Plane, CalendarClock, Phone } from "lucide-react";
import { useState } from "react";

export default function ACEKehadiran() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("presensi");
  const [loadingGps, setLoadingGps] = useState(false);

  const handleAbsen = () => {
    setLoadingGps(true);
    setTimeout(() => {
      alert("Koordinat GPS berhasil dikunci (di dalam pagar sekolah). Presensi tersimpan.");
      setLoadingGps(false);
    }, 1500);
  };

  const handleEmergency = () => {
    if (window.confirm("Tombol ini akan memotong kuota cuti darurat dan menyalakan alarm di TU. Lanjutkan?")) {
      alert("Alarm Darurat TU telah dibunyikan! Menunggu penunjukan guru pengganti manual.");
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Presensi & Mobilitas</h1>
          <p className="text-slate-500 font-medium mt-1">Attendance & Mobility Management</p>
        </div>
        <button onClick={handleEmergency} className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-transform active:scale-95">
          <AlertTriangle className="w-5 h-5 animate-pulse" /> Emergency Report
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
            className={`px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'presensi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-8 rounded-3xl border-2 border-indigo-100 bg-indigo-50/30 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10 relative">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <MapPin className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Absen Kehadiran</h2>
            <p className="text-slate-500 text-sm mb-8 px-4">Sistem akan mengunci koordinat GPS perangkat Anda untuk memastikan Anda berada di dalam area pagar sekolah.</p>
            <button 
              onClick={handleAbsen}
              disabled={loadingGps}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loadingGps ? "Mencari Satelit GPS..." : "Kunci Koordinat GPS"}
            </button>
          </Card>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Riwayat Bulan Ini</h3>
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 rounded-2xl border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Senin, {i}0 Juni 2026</p>
                  <p className="text-xs text-emerald-600 font-bold">Tepat Waktu &bull; Dalam Area</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg text-slate-800">06:45</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Masuk</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logbook' && (
        <Card className="p-8 rounded-3xl border-2 border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl"><BookOpen className="w-8 h-8" /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Berita Acara Mengajar</h2>
              <p className="text-slate-500 font-medium">Wajib diisi sebelum meninggalkan area sekolah</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kelas & Mata Pelajaran</label>
              <select className="w-full p-4 rounded-xl border-2 border-slate-200 bg-white">
                <option>XII MIPA 1 - Matematika Lanjut</option>
                <option>XII MIPA 2 - Matematika Lanjut</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Siswa Hadir</label>
                <input type="number" defaultValue="30" className="w-full p-4 rounded-xl border-2 border-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Siswa Absen/Sakit</label>
                <input type="number" defaultValue="2" className="w-full p-4 rounded-xl border-2 border-slate-200" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Bab / Materi Pembahasan</label>
              <input type="text" placeholder="Contoh: Limit Fungsi Trigonometri..." className="w-full p-4 rounded-xl border-2 border-slate-200" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Kejadian Kelas</label>
              <textarea placeholder="Contoh: Siswa A tertidur di kelas..." rows={3} className="w-full p-4 rounded-xl border-2 border-slate-200"></textarea>
            </div>
            <button className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600">Simpan Logbook</button>
          </div>
        </Card>
      )}

      {activeTab === 'cuti' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 rounded-3xl border-2 border-slate-200 bg-white">
            <h2 className="text-xl font-black text-slate-800 mb-6">Formulir Cuti Berjenjang</h2>
            <div className="space-y-4">
              <input type="date" className="w-full p-4 rounded-xl border-2 border-slate-200" />
              <select className="w-full p-4 rounded-xl border-2 border-slate-200">
                <option>Cuti Sakit</option>
                <option>Cuti Alasan Penting</option>
                <option>Cuti Tahunan</option>
              </select>
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 cursor-pointer">
                <p className="text-sm font-bold text-slate-500">Upload Surat Pendukung (PDF/JPG)</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-800 mb-2">Alur Persetujuan Digital:</p>
                <p className="text-xs text-indigo-600">Ketua Rumpun &rarr; Wakasek Kurikulum &rarr; Kepala TU &rarr; Principal</p>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-3xl border-2 border-indigo-200 bg-indigo-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <UserPlus className="w-10 h-10 mb-4 text-indigo-300" />
              <h2 className="text-2xl font-black mb-2">Sistem Antrean Substitusi</h2>
              <p className="text-indigo-200 text-sm mb-6">Pilih guru serumpun yang sedang "Jam Kosong" di waktu Anda cuti untuk mendelegasikan tugas mengajar.</p>
              
              <div className="space-y-3">
                <div className="bg-indigo-500/50 p-4 rounded-xl border border-indigo-400/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold">Pak Budi (Matematika)</p>
                    <p className="text-xs text-indigo-200">Kosong di Jam ke 3-4</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg shadow-sm">Minta Tolong</button>
                </div>
                <div className="bg-indigo-500/50 p-4 rounded-xl border border-indigo-400/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold">Bu Dina (Fisika)</p>
                    <p className="text-xs text-indigo-200">Kosong di Jam ke 3-5</p>
                  </div>
                  <button className="px-4 py-2 bg-white text-indigo-600 font-bold text-xs rounded-lg shadow-sm">Minta Tolong</button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'dinas' && (
        <Card className="p-8 rounded-3xl border-2 border-slate-200 text-center py-20 bg-slate-50">
          <Plane className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Check-in Dinas Luar</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
            Anda belum memiliki SPPD aktif saat ini. Saat dinas luar, tombol kamera akan muncul di sini untuk memotret lokasi Anda beserta koordinat GPS.
          </p>
          <button className="px-8 py-4 bg-slate-800 text-white font-bold rounded-2xl opacity-50 cursor-not-allowed flex items-center gap-2 mx-auto">
            <Camera className="w-5 h-5" /> Mulai Check-in Dinas
          </button>
        </Card>
      )}
    </div>
  );
}
