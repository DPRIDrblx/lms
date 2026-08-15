"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, CheckCircle2, ChevronRight, Star, Link2, KeyRound, FileText, Archive } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function ArsipLesPage() {
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
      .order("schedule_time", { ascending: false }); // Sort descending for archive
      
    if (schedData) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = schedData.filter((s: any) => new Date(s.schedule_time) < today);
      
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
        <Archive className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 font-bold max-w-md">Halaman ini khusus untuk siswa Center (7E, 8E, 9E).</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-100px)]",
      uiMode === 'clean' ? "bg-[var(--bg-secondary)] p-4 md:p-8 space-y-6" : ""
    )}>
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-2">
          <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Arsip Tatap Muka</h1>
        </div>
      ) : (
        <div className="bg-slate-200 rounded-3xl p-8 text-slate-900 relative overflow-hidden shadow-sm border-b-4 border-slate-300 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/30 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/40">
              <Archive className="w-10 h-10 text-slate-700" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-slate-800">Arsip Jadwal Les</h1>
              <p className="text-slate-600 font-bold text-lg">Lihat kembali ringkasan pertemuan sesi sebelumnya.</p>
            </div>
          </div>
        </div>
      )}

      {uiMode === 'clean' ? (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar">
             <div className="px-6 py-4 text-[#108B96] border-b-[3px] border-[#108B96] font-bold text-sm">
                Riwayat Sesi
             </div>
          </div>
          
          <div className="p-5 sm:p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full flex flex-col justify-center items-center py-12">
                  <CenterLoader size="md" />
                </div>
              ) : schedules.length > 0 ? (
                schedules.map(schedule => {
                  const date = new Date(schedule.schedule_time);
                  const isAttended = !!attendances[schedule.id];
                  
                  return (
                    <div 
                      key={schedule.id}
                      onClick={() => handleOpenSchedule(schedule)}
                      className="bg-white rounded-[16px] border border-slate-200 overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-[#108B96]/50 hover:shadow-md transition-all group"
                    >
                      <div className={cn(
                        "w-full sm:w-28 p-5 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-2 border-b sm:border-b-0 sm:border-r border-slate-100 transition-colors",
                        "bg-slate-50 text-slate-500 group-hover:bg-teal-50 group-hover:text-[#108B96]"
                      )}>
                        <span className="text-[11px] font-bold uppercase tracking-wider">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                        <span className="text-3xl sm:text-[32px] font-black leading-none">{date.getDate()}</span>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-[17px] font-black text-slate-800 leading-tight group-hover:text-[#108B96] transition-colors line-clamp-2">{schedule.title}</h3>
                        </div>
                        
                        {schedule.description && (
                          <p className="text-slate-500 text-[13px] font-medium mb-4 line-clamp-1">{schedule.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 mt-auto">
                          <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-[8px] border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-[#108B96]" />
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </div>
                          
                          {isAttended ? (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-[8px] border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-[8px] border border-rose-100">
                              <KeyRound className="w-3.5 h-3.5" /> Tidak Hadir
                            </div>
                          )}
                          
                          {isAttended && !attendances[schedule.id].rating && (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#E87525] bg-orange-50 px-2.5 py-1.5 rounded-[8px] border border-orange-100">
                              Belum isi rating
                            </div>
                          )}
                          {isAttended && attendances[schedule.id].rating && (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-[8px] border border-blue-100">
                              Sudah isi rating
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-[20px] border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Archive className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-700 mb-1">Arsip Kosong</h3>
                  <p className="text-slate-500 text-[13px]">Belum ada sesi les yang berlalu.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Legacy UI */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <CenterLoader size="md" />
            </div>
          ) : schedules.length > 0 ? (
            schedules.map(schedule => {
              const date = new Date(schedule.schedule_time);
              const isAttended = !!attendances[schedule.id];
              
              return (
                <Card 
                  key={schedule.id} 
                  className={cn(
                    "p-0 flex flex-col sm:flex-row items-stretch cursor-pointer transition-all overflow-hidden group border-2 border-slate-200 hover:border-slate-400 hover:shadow-lg"
                  )}
                  onClick={() => handleOpenSchedule(schedule)}
                >
                  <div className="w-full sm:w-28 p-6 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50 text-slate-500">
                    <span className="text-sm uppercase font-bold">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                    <span className="text-3xl sm:text-4xl leading-none font-black">{date.getDate()}</span>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl text-slate-800 transition-colors font-black group-hover:text-slate-600">{schedule.title}</h3>
                    </div>
                    
                    {schedule.description && (
                      <p className="text-slate-500 font-medium mb-4 line-clamp-1">{schedule.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-auto">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        <Clock className="w-4 h-4 text-slate-500" />
                        {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </div>
                      
                      {isAttended ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" /> Hadir
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                          <KeyRound className="w-4 h-4" /> Tidak Hadir
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex items-center justify-center p-6 text-slate-300 group-hover:text-slate-500 transition-colors">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-1">Arsip Kosong</h3>
              <p className="text-slate-500">Belum ada sesi les yang berlalu.</p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Arsip Les"
        size="xl"
      >
        {selectedSchedule && (() => {
          const dateObj = new Date(selectedSchedule.schedule_time);
          const attRecord = attendances[selectedSchedule.id];
          const isAttended = !!attRecord;

          return (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-[20px] border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between">
                <div>
                  <h2 className="text-[22px] font-black text-slate-800 mb-1">{selectedSchedule.title}</h2>
                  {selectedSchedule.description && (
                    <p className="text-slate-600 font-medium mb-3 text-[14px]">{selectedSchedule.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-[13px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>
                </div>
              </div>

              {selectedSchedule.drive_link && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Bahan Ajar / Materi</h4>
                  <a 
                    href={selectedSchedule.drive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-[16px] shadow-sm transition-colors group"
                  >
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#108B96] group-hover:text-white transition-all">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-[15px] group-hover:text-[#108B96] transition-colors">Buka Modul di Google Drive</h5>
                      <p className="text-[13px] text-slate-500 font-medium">Klik untuk melihat materi pelajaran</p>
                    </div>
                  </a>
                </div>
              )}

              {/* Attendance & Rating Section */}
              <div className="border-t border-slate-100 pt-6">
                {!isAttended ? (
                  <div className="bg-rose-50/80 border border-rose-200 p-6 rounded-[20px] flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-black text-rose-900 mb-1 text-[17px] flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-rose-600" /> Tidak Hadir
                      </h4>
                      <p className="text-[13px] text-rose-800/80 font-semibold">Anda belum melakukan presensi untuk sesi ini atau tidak hadir.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-[20px] flex flex-col sm:flex-row gap-5 items-center justify-between shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-[6px] bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> Anda Hadir
                        </span>
                      </div>
                      <h4 className="font-black text-amber-900 text-[17px] mb-1 flex items-center gap-2">
                        Beri Penilaian
                      </h4>
                      <p className="text-[13px] text-amber-800/80 font-semibold">
                        {attRecord.rating 
                          ? "Terima kasih atas penilaian Anda." 
                          : "Bagaimana pengalamanmu belajar di sesi ini?"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = attRecord.rating || 0;
                        const isFilled = star <= (ratingHover || currentRating);
                        return (
                          <button
                            key={star}
                            disabled={!!attRecord.rating}
                            className={`p-1 transition-transform ${!attRecord.rating ? 'hover:scale-110' : 'cursor-default'}`}
                            onMouseEnter={() => !attRecord.rating && setRatingHover(star)}
                            onMouseLeave={() => !attRecord.rating && setRatingHover(0)}
                            onClick={() => handleRate(star)}
                          >
                            <Star 
                              className={`w-10 h-10 ${isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'fill-transparent text-slate-300'}`} 
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
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Ringkasan Pertemuan
                  </h4>
                  <div className="bg-white p-5 rounded-[16px] text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap border border-slate-200/60 shadow-sm font-medium">
                    {selectedSchedule.summary}
                  </div>
                </div>
              )}

            </div>
          );
        })()}
      </Modal>
    </div>
    </div>
  );
}
