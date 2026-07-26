"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, Plus, Users, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

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

  const fetchData = async () => {
    setLoading(true);
    // Fetch classes (filter for center classes if needed, or get all)
    const { data: clsData } = await supabase.from("classes").select("*").order("name");
    if (clsData) setClasses(clsData);

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

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduleDate || !scheduleTime || !classId) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    // Combine date and time into a single timestamp
    const timestamp = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    const { error } = await supabase.from("center_schedules").insert({
      title,
      schedule_time: timestamp,
      description,
      class_id: classId
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Jadwal Les berhasil ditambahkan");
      setTitle("");
      setScheduleDate("");
      setScheduleTime("");
      setDescription("");
      fetchData();
    }
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

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Jadwal Les</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola jadwal les/tambahan untuk kelas Center (7E, 8E, 9E)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm rounded-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" /> Tambah Jadwal Baru
            </h2>
            
            <form onSubmit={handleAddSchedule} className="space-y-4">
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

              <Button type="submit" className="w-full py-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-lg shadow-blue-500/20">
                Simpan Jadwal Les
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
                  <Card key={s.id} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                    
                    <div className="flex justify-between items-start mb-3 ml-2">
                      <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {s.classes?.name || "Semua Kelas"}
                      </div>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-black text-lg text-slate-800 ml-2 mb-3 leading-tight">{s.title}</h3>
                    
                    <div className="ml-2 space-y-2 text-sm text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {s.description && (
                      <div className="mt-4 pt-3 border-t border-slate-100 ml-2 text-sm text-slate-600">
                        {s.description}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
