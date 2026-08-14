"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Loader2, Search, Calendar, User, BookOpen, Clock, FileText, CheckCircle2, MapPin, Eye, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OperatorReportsPage() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    // Fetch schedules that have at least some data (ongoing or completed)
    const { data, error } = await supabase
      .from("center_schedules")
      .select(`
        *,
        classes (name, branches (name)),
        profiles!tutor_id (full_name)
      `)
      .in("status", ["ongoing", "completed"])
      .order("start_time", { ascending: false });

    if (data) setSchedules(data);
    setLoading(false);
  };

  const openDetails = async (schedule: any) => {
    setSelectedSchedule(schedule);
    setLoadingDetails(true);
    
    // Fetch attendances
    const { data } = await supabase
      .from("center_schedule_attendances")
      .select(`
        status,
        profiles!student_id (full_name, nis)
      `)
      .eq("schedule_id", schedule.id);
      
    if (data) setAttendances(data);
    setLoadingDetails(false);
  };

  const filteredSchedules = schedules.filter(s => 
    s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classes?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.topic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Kelas & Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Pantau jalannya kelas, materi, dan laporan yang disubmit oleh Tutor.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari tutor, kelas, atau topik..." 
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 w-full rounded-lg bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => (
            <Card key={schedule.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-1.5 w-full ${schedule.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{schedule.classes?.name || 'Umum'}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {schedule.classes?.branches?.name || '-'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    schedule.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {schedule.status === 'completed' ? 'Selesai' : 'Berjalan'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{schedule.profiles?.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{schedule.topic || 'Belum ada topik'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{new Date(schedule.start_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <Button onClick={() => openDetails(schedule)} variant="secondary" className="w-full gap-2 border border-slate-200 bg-white">
                  <Eye className="w-4 h-4" /> Lihat Detail Laporan
                </Button>
              </div>
            </Card>
          ))}
          {filteredSchedules.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Tidak ada laporan yang sesuai pencarian.
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 rounded-t-2xl flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">Detail Laporan Kelas</h2>
              <button onClick={() => setSelectedSchedule(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Tutor</p>
                  <p className="font-bold text-slate-900">{selectedSchedule.profiles?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Kelas</p>
                  <p className="font-bold text-slate-900">{selectedSchedule.classes?.name || 'Umum'} ({selectedSchedule.classes?.branches?.name || '-'})</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Jadwal</p>
                  <p className="font-bold text-slate-900">{new Date(selectedSchedule.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
                    selectedSchedule.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {selectedSchedule.status === 'completed' ? 'Selesai' : 'Sedang Berjalan'}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" /> Rencana Pembelajaran
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-4 text-sm border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Topik Pokok:</span>
                      <p className="text-slate-600">{selectedSchedule.topic || '-'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Subtopik:</span>
                      <p className="text-slate-600">{selectedSchedule.subtopic || '-'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Tujuan Pembelajaran:</span>
                      <p className="text-slate-600 whitespace-pre-wrap">{selectedSchedule.learning_objectives || '-'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Metode:</span>
                      <p className="text-slate-600">{selectedSchedule.learning_methods || '-'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> Ringkasan Pertemuan
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 border border-slate-100 whitespace-pre-wrap">
                    {selectedSchedule.meeting_summary || 'Belum ada ringkasan yang ditulis.'}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" /> Kehadiran Siswa
                  </h3>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                    {loadingDetails ? (
                      <div className="p-4 text-center text-slate-500 text-sm">Memuat absen...</div>
                    ) : attendances.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {attendances.map((a, i) => (
                          <li key={i} className="p-3 flex justify-between items-center text-sm bg-white">
                            <span className="font-medium text-slate-700">{a.profiles?.full_name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              a.status === 'hadir' ? 'bg-emerald-100 text-emerald-700' :
                              a.status === 'izin' ? 'bg-blue-100 text-blue-700' :
                              a.status === 'sakit' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {a.status.toUpperCase()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-sm">Belum ada data kehadiran.</div>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Dokumentasi Kelas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-2 bg-white">
                      <p className="text-xs font-bold text-slate-500 mb-2 text-center">FOTO AWAL KELAS</p>
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {selectedSchedule.photo_start_url ? (
                          <img src={selectedSchedule.photo_start_url} alt="Foto Awal" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-sm">Belum ada foto</span>
                        )}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-2 bg-white">
                      <p className="text-xs font-bold text-slate-500 mb-2 text-center">FOTO AKHIR KELAS</p>
                      <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {selectedSchedule.photo_end_url ? (
                          <img src={selectedSchedule.photo_end_url} alt="Foto Akhir" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-slate-400 text-sm">Belum ada foto</span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
              <Button onClick={() => setSelectedSchedule(null)} variant="secondary" className="border border-slate-200 bg-white">
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
