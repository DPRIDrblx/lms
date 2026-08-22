"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, Plus, Users, Link2, KeyRound, FileText, ChevronRight, Edit3 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";

const PREDEFINED_BANNERS = [
  "BAHASA INDONESIA.png",
  "BAHASA INGGRIS.png",
  "DASAR PEMROGRAMAN.png",
  "DESIGN GRAFIS & UI_UX APLIKASI.png",
  "IPA.png",
  "IPS.png",
  "KEAMANAN SIBER.png",
  "LOGIKA & ALGORITMA DIGITAL.png",
  "Matematika.png",
  "PENGEMBANGAN GAME KOMPUTER DASAR.png",
  "PENGENALAN IOT & SENSOR.png",
  "PPKN.png",
  "TES MINAT BAKAT.png",
  "TRYOUT.png",
  "NTC SKILL UP.png",
  "Skill Up Agustusan.png"
];

export default function CenterSchedulesManager() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Summary Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [summaryText, setSummaryText] = useState("");
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch classes (filter for center classes only)
    const { data: clsData } = await supabase.from("classes").select("*").order("name");
    const regularClasses = ["7A", "7B", "7C", "7D", "8A", "8B", "8C", "8D", "9A", "9B", "9C", "9D"];
    if (clsData) setClasses(clsData.filter((c: any) => !regularClasses.includes(c.name)));

    // Fetch schedules
    const { data: schedData } = await supabase
      .from("center_schedules")
      .select("*, classes(name)")
      .order("schedule_time", { ascending: true });
    if (schedData) setSchedules(schedData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateAttendanceCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAddOrEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduleDate || !scheduleTime || !classId) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    const timestamp = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    
    if (editingId) {
      const { error } = await supabase.from("center_schedules").update({
        title,
        schedule_time: timestamp,
        description,
        class_id: classId,
        drive_link: driveLink,
        banner_url: bannerUrl || null
      }).eq("id", editingId);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Jadwal Les berhasil diubah");
        resetForm();
        fetchData();
      }
    } else {
      const attendanceCode = generateAttendanceCode();
      const { error } = await supabase.from("center_schedules").insert({
        title,
        schedule_time: timestamp,
        description,
        class_id: classId,
        drive_link: driveLink,
        attendance_code: attendanceCode,
        banner_url: bannerUrl || null
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Jadwal Les berhasil ditambahkan");
        resetForm();
        fetchData();
      }
    }
  };

  const resetForm = () => {
    setTitle("");
    setScheduleDate("");
    setScheduleTime("");
    setDescription("");
    setDriveLink("");
    setBannerUrl("");
    setClassId("");
    setEditingId(null);
  };

  const handleEditClick = (schedule: any) => {
    const d = new Date(schedule.schedule_time);
    setTitle(schedule.title);
    setScheduleDate(d.toISOString().split('T')[0]);
    setScheduleTime(d.toTimeString().substring(0, 5));
    setDescription(schedule.description || "");
    setClassId(schedule.class_id);
    setDriveLink(schedule.drive_link || "");
    setBannerUrl(schedule.banner_url || "");
    setEditingId(schedule.id);
    
    // Scroll to form (mobile friendly)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus jadwal ini?")) return;
    
    const { error } = await supabase.from("center_schedules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Jadwal berhasil dihapus");
      fetchData();
    }
  };

  const handleOpenSummary = (schedule: any) => {
    setSelectedSchedule(schedule);
    setSummaryText(schedule.summary || "");
    setIsSummaryModalOpen(true);
  };

  const handleSaveSummary = async () => {
    if (!selectedSchedule) return;
    setIsSavingSummary(true);

    const { error } = await supabase
      .from("center_schedules")
      .update({ summary: summaryText })
      .eq("id", selectedSchedule.id);

    setIsSavingSummary(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ringkasan berhasil disimpan");
      setIsSummaryModalOpen(false);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Jadwal Les</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola jadwal les interaktif untuk kelas Center (7E, 8E, 9E)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit3 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                {editingId ? "Ubah Jadwal" : "Tambah Jadwal Baru"}
              </h2>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-slate-500">Batal</Button>
              )}
            </div>
            
            <form onSubmit={handleAddOrEditSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Kelas</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banner Pilihan (Opsional)</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                >
                  <option value="">-- Tanpa Banner --</option>
                  {PREDEFINED_BANNERS.map(b => (
                    <option key={b} value={`/banners/${b}`}>{b.replace('.png', '')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul / Materi</label>
                <input 
                  type="text"
                  placeholder="Contoh: Pendalaman Materi IPA"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bahan Ajar (Link G-Drive)</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal</label>
                  <input 
                    type="date"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input 
                    type="time"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi / Ruangan (Opsional)</label>
                <textarea 
                  placeholder="Contoh: Bawa buku cetak IPA, di Ruang Center 1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl">
                {editingId ? "Simpan Perubahan" : "Simpan Jadwal"}
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT PANEL: Schedule List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada jadwal les yang terdaftar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((s) => {
                const dateObj = new Date(s.schedule_time);
                return (
                  <Card key={s.id} className="p-0 border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl relative group overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                    
                    <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-3 ml-2">
                        <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {s.classes?.name || "Semua Kelas"}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEditClick(s)}
                            className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ubah Jadwal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-black text-lg text-slate-800 ml-2 mb-3 leading-tight">{s.title}</h3>
                      
                      <div className="ml-2 space-y-2 text-sm text-slate-500 font-medium mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {s.attendance_code && (
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                            <KeyRound className="w-4 h-4" />
                            Kode Presensi: <span className="font-black tracking-widest">{s.attendance_code}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 ml-2 border-t border-slate-100 mt-auto">
                      <button 
                        onClick={() => handleOpenSummary(s)}
                        className="w-full flex items-center justify-between text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {s.summary ? "Edit Ringkasan Pertemuan" : "Isi Ringkasan Pertemuan"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Ringkasan Pertemuan"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
            <p className="font-bold mb-1">Materi: {selectedSchedule?.title}</p>
            <p>Ringkasan ini akan dapat dilihat oleh semua siswa, baik yang hadir maupun yang tidak hadir. Berguna untuk catatan (*review*).</p>
          </div>
          
          <textarea
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Ketik ringkasan kelas, catatan penting, atau PR di sini..."
          />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsSummaryModalOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSaveSummary} 
              disabled={isSavingSummary}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSavingSummary ? "Menyimpan..." : "Simpan Ringkasan"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
