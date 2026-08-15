"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle2, ChevronRight, Star, Link2, KeyRound, FileText } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function JadwalLesPage() {
  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [attendanceCodeInput, setAttendanceCodeInput] = useState("");
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const fetchData = async () => {
    if (!profile?.class_id) {
      setLoading(false);
      return;
    }
    
    // Fetch Schedules
    const { data: schedData } = await supabase
      .from("center_schedules")
      .select("*")
      .eq("class_id", profile.class_id)
      .order("schedule_time", { ascending: true });
      
    if (schedData) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = schedData.filter((s: any) => new Date(s.schedule_time) >= today);
      setSchedules(filtered);

      // Fetch Attendances
      const scheduleIds = filtered.map((s: any) => s.id);
      if (scheduleIds.length > 0) {
        const { data: attData } = await supabase
          .from("center_schedule_attendances")
          .select("*")
          .eq("student_id", profile.id)
          .in("schedule_id", scheduleIds);
          
        if (attData) {
          const attMap: Record<string, any> = {};
          attData.forEach((a: any) => {
            attMap[a.schedule_id] = a;
          });
          setAttendances(attMap);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.class_id, supabase]);

  const handleOpenSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setAttendanceCodeInput("");
    setIsModalOpen(true);
  };

  const handleAttend = async () => {
    if (!selectedSchedule) return;
    if (!attendanceCodeInput) {
      toast.error("Masukkan kode presensi dari guru/TU");
      return;
    }
    
    if (attendanceCodeInput.toUpperCase() !== selectedSchedule.attendance_code?.toUpperCase()) {
      toast.error("Kode presensi tidak valid");
      return;
    }

    setIsSubmittingAttendance(true);
    const { data, error } = await supabase
      .from("center_schedule_attendances")
      .insert({
        schedule_id: selectedSchedule.id,
        student_id: profile?.id
      })
      .select()
      .single();

    setIsSubmittingAttendance(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil presensi!");
      setAttendances(prev => ({ ...prev, [selectedSchedule.id]: data }));
    }
  };

  const handleRate = async (rating: number) => {
    if (!selectedSchedule) return;
    const attendance = attendances[selectedSchedule.id];
    if (!attendance || attendance.rating) return; // Cannot rate if not attended or already rated

    const { error } = await supabase
      .from("center_schedule_attendances")
      .update({ rating })
      .eq("id", attendance.id);

    if (error) {
      toast.error("Gagal mengirim rating");
    } else {
      toast.success("Terima kasih atas penilaianmu!");
      setAttendances(prev => ({
        ...prev,
        [selectedSchedule.id]: { ...attendance, rating }
      }));
    }
  };

  if (!isCenterStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 font-bold max-w-md">Halaman ini khusus untuk siswa Center (7E, 8E, 9E).</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-6 pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">Jadwal Les & Interaksi</h1>
          <p className="text-slate-500 mt-1">Akses bahan ajar, presensi, dan ringkasan pertemuan.</p>
        </div>
      ) : (
        <div className="bg-yellow-400 rounded-3xl p-8 text-slate-900 relative overflow-hidden shadow-lg border-b-4 border-yellow-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/30 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/40">
              <Calendar className="w-10 h-10 text-yellow-900" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Jadwal Les & Interaksi</h1>
              <p className="text-yellow-800 font-bold text-lg">Akses bahan ajar, presensi, dan ringkasan pertemuan.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <CenterLoader size="md" />
          </div>
        ) : schedules.length > 0 ? (
          schedules.map(schedule => {
            const date = new Date(schedule.schedule_time);
            const isToday = new Date().toDateString() === date.toDateString();
            const isAttended = !!attendances[schedule.id];
            
            return (
              <Card 
                key={schedule.id} 
                className={cn(
                  "p-0 flex flex-col sm:flex-row items-stretch cursor-pointer transition-all overflow-hidden group",
                  uiMode === 'clean'
                    ? (isToday ? 'border border-teal-500 bg-white shadow-sm' : 'border border-slate-200 bg-white hover:border-slate-300 shadow-sm')
                    : (isToday ? 'border-2 border-yellow-400 bg-yellow-50/30 hover:scale-[1.01] hover:shadow-yellow-400/20' : 'border-2 border-slate-200 hover:scale-[1.01] hover:border-blue-300 hover:shadow-lg')
                )}
                onClick={() => handleOpenSchedule(schedule)}
              >
                <div className={cn(
                  "w-full sm:w-28 p-6 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100",
                  uiMode === 'clean' 
                    ? (isToday ? 'bg-teal-50 text-teal-700' : 'bg-slate-50 text-slate-500')
                    : (isToday ? 'bg-yellow-100/50 text-yellow-700' : 'bg-slate-50 text-slate-500')
                )}>
                  <span className={cn("text-sm uppercase", uiMode === 'clean' ? "font-semibold" : "font-bold")}>{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className={cn("text-3xl sm:text-4xl leading-none", uiMode === 'clean' ? "font-bold" : "font-black")}>{date.getDate()}</span>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={cn("text-xl text-slate-800 transition-colors", uiMode === 'clean' ? "font-semibold group-hover:text-teal-600" : "font-black group-hover:text-blue-600")}>{schedule.title}</h3>
                    {isToday && <span className={cn(
                      "px-2 py-0.5 text-[10px] uppercase rounded-full tracking-wider",
                      uiMode === 'clean' ? "bg-teal-100 text-teal-700 font-bold" : "bg-yellow-400 text-yellow-900 font-black"
                    )}>Hari Ini</span>}
                  </div>
                  
                  {schedule.description && (
                    <p className="text-slate-500 font-medium mb-4 line-clamp-1">{schedule.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-3 mt-auto">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                    
                    {isAttended ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> Hadir
                      </div>
                    ) : isToday ? (
                      <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        <KeyRound className="w-4 h-4" /> Belum Presensi
                      </div>
                    ) : null}
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center justify-center p-6 text-slate-300 group-hover:text-blue-500 transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-1">Jadwal Masih Kosong</h3>
            <p className="text-slate-500">Belum ada jadwal les terbaru untuk kelasmu.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Jadwal Les"
        size="lg"
      >
        {selectedSchedule && (() => {
          const dateObj = new Date(selectedSchedule.schedule_time);
          const attRecord = attendances[selectedSchedule.id];
          const isAttended = !!attRecord;

          return (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedSchedule.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
                {selectedSchedule.description && (
                  <p className="text-slate-600">{selectedSchedule.description}</p>
                )}
              </div>

              {selectedSchedule.drive_link && (
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2">Bahan Ajar / Materi</h4>
                  <a 
                    href={selectedSchedule.drive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-indigo-900">Buka Modul di Google Drive</h5>
                      <p className="text-xs text-indigo-700/70 font-medium">Klik untuk melihat materi pelajaran</p>
                    </div>
                  </a>
                </div>
              )}

              {/* Attendance & Rating Section */}
              <div className="border-t border-slate-100 pt-6">
                {!isAttended ? (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h4 className="font-black text-amber-900 mb-1 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-amber-600" /> Presensi Kehadiran
                      </h4>
                      <p className="text-sm text-amber-800/80 font-medium">Masukkan kode unik dari guru untuk konfirmasi kehadiran.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input 
                        type="text" 
                        placeholder="KODE"
                        className="w-24 p-3 text-center font-black tracking-widest uppercase bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-900"
                        value={attendanceCodeInput}
                        onChange={e => setAttendanceCodeInput(e.target.value.toUpperCase())}
                        maxLength={6}
                      />
                      <Button 
                        onClick={handleAttend} 
                        disabled={isSubmittingAttendance || attendanceCodeInput.length < 4}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-[50px] rounded-xl"
                      >
                        Hadir
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h4 className="font-black text-emerald-900 mb-1 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Anda Telah Hadir
                      </h4>
                      <p className="text-sm text-emerald-800/80 font-medium">
                        {attRecord.rating 
                          ? "Terima kasih atas penilaian Anda." 
                          : "Beri penilaian untuk sesi pembelajaran ini:"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = attRecord.rating || 0;
                        const isFilled = star <= (ratingHover || currentRating);
                        return (
                          <button
                            key={star}
                            disabled={!!attRecord.rating} // disabled if already rated
                            className={`p-1 transition-transform ${!attRecord.rating ? 'hover:scale-110' : 'cursor-default'}`}
                            onMouseEnter={() => !attRecord.rating && setRatingHover(star)}
                            onMouseLeave={() => !attRecord.rating && setRatingHover(0)}
                            onClick={() => handleRate(star)}
                          >
                            <Star 
                              className={`w-7 h-7 ${isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'fill-transparent text-slate-300'}`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Summary Section */}
              {selectedSchedule.summary && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Ringkasan Pertemuan
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                    {selectedSchedule.summary}
                  </div>
                </div>
              )}

            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
