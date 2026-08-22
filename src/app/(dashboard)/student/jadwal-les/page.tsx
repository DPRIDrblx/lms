"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, CheckCircle2, ChevronRight, Star, Link2, KeyRound, FileText, PackageOpen } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { DateSlider, DateItem } from "@/components/ui/date-slider";

const generateDates = (): DateItem[] => {
  const dates: DateItem[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d,
      label: d.getDate().toString(),
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' })
    });
  }
  return dates;
};

export default function JadwalLesPage() {
  const { profile, isCenterStudent } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Layout State
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const dateItems = useMemo(() => generateDates(), []);

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

  const activeDateString = activeDate.toISOString().split('T')[0];
  const filteredSchedules = schedules.filter(s => s.schedule_time.startsWith(activeDateString));

  return (
    <div className={cn(
      "min-h-[calc(100vh-100px)]",
      uiMode === 'clean' ? "bg-[var(--bg-secondary)] p-4 md:p-8 space-y-6" : ""
    )}>
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-2">
          <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Tatap Muka</h1>
        </div>
      ) : (
        <div className="bg-yellow-400 rounded-3xl p-8 text-slate-900 relative overflow-hidden shadow-lg border-b-4 border-yellow-500 mb-6">
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

      {uiMode === 'clean' ? (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center border-b border-slate-200 overflow-x-auto no-scrollbar">
             <div className="px-6 py-4 text-[#108B96] border-b-[3px] border-[#108B96] font-bold text-sm">
                Sesi Tersedia
             </div>
          </div>
          
          <div className="p-5 sm:p-6 bg-slate-50/50">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 overflow-hidden">
                <DateSlider dates={dateItems} activeDate={activeDate} onChange={setActiveDate} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                <div className="col-span-full flex flex-col justify-center items-center py-12">
                  <CenterLoader size="md" />
                </div>
              ) : filteredSchedules.length > 0 ? (
                filteredSchedules.map(schedule => {
                  const date = new Date(schedule.schedule_time);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isAttended = !!attendances[schedule.id];
                  
                  return (
                    <div 
                      key={schedule.id}
                      onClick={() => handleOpenSchedule(schedule)}
                      className="bg-white rounded-[16px] border border-slate-200 overflow-hidden flex flex-col cursor-pointer hover:border-[#108B96]/50 hover:shadow-md transition-all group"
                    >
                      {schedule.banner_url ? (
                        <div className="w-full aspect-[21/9] bg-slate-100 relative">
                          <img src={schedule.banner_url} alt={schedule.title} className="w-full h-full object-cover" />
                          <div className={cn(
                            "absolute top-3 left-3 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border",
                            isToday ? "bg-teal-50 text-[#108B96] border-teal-200" : "bg-white text-slate-600 border-slate-200"
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          "w-full h-16 sm:h-auto sm:w-28 p-3 sm:p-5 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-2 border-b sm:border-b-0 sm:border-r border-slate-100 transition-colors",
                          isToday ? "bg-teal-50 text-[#108B96]" : "bg-slate-50 text-slate-500 group-hover:bg-teal-50 group-hover:text-[#108B96]"
                        )}>
                          <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:block">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                          <span className="text-2xl sm:text-[32px] font-black leading-none">{date.getDate()}</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider sm:hidden">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                        </div>
                      )}
                      
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-[17px] font-black text-slate-800 leading-tight group-hover:text-[#108B96] transition-colors line-clamp-2">{schedule.title}</h3>
                          {isToday && (
                            <span className="shrink-0 px-2.5 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider bg-teal-100 text-[#0D6D76]">
                              Hari Ini
                            </span>
                          )}
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
                          ) : isToday ? (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-[8px] border border-amber-100">
                              <KeyRound className="w-3.5 h-3.5" /> Belum Presensi
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 bg-white rounded-[20px] border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                    <PackageOpen className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-700 mb-1">Master Teacher sedang libur, nih...</h3>
                  <p className="text-slate-500 text-[13px]">Belum ada jadwal les pada tanggal ini.</p>
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
              const isToday = new Date().toDateString() === date.toDateString();
              const isAttended = !!attendances[schedule.id];
              
              return (
                <Card 
                  key={schedule.id} 
                  className={cn(
                    "p-0 flex flex-col sm:flex-row items-stretch cursor-pointer transition-all overflow-hidden group border-2 border-slate-200 hover:scale-[1.01] hover:border-blue-300 hover:shadow-lg",
                    isToday && 'border-2 border-yellow-400 bg-yellow-50/30 hover:shadow-yellow-400/20'
                  )}
                  onClick={() => handleOpenSchedule(schedule)}
                >
                  <div className={cn(
                    "w-full sm:w-28 p-6 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100",
                    isToday ? 'bg-yellow-100/50 text-yellow-700' : 'bg-slate-50 text-slate-500'
                  )}>
                    <span className="text-sm uppercase font-bold">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                    <span className="text-3xl sm:text-4xl leading-none font-black">{date.getDate()}</span>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl text-slate-800 transition-colors font-black group-hover:text-blue-600">{schedule.title}</h3>
                      {isToday && <span className="px-2 py-0.5 text-[10px] uppercase rounded-full tracking-wider bg-yellow-400 text-yellow-900 font-black">
                        Hari Ini
                      </span>}
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
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detail Jadwal Les"
        size="lg"
      >
        {selectedSchedule && (() => {
          const dateObj = new Date(selectedSchedule.schedule_time);
          const isAttended = !!attendances[selectedSchedule.id];
          const attendanceData = attendances[selectedSchedule.id];

          return (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedSchedule.title}</h2>
                <p className="text-slate-600 font-medium mb-4">{selectedSchedule.description || "Tidak ada deskripsi."}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {selectedSchedule.schedule_time.substring(0, 5)} WIB
                  </span>
                </div>
              </div>

              {selectedSchedule.meeting_link && (
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2">Link Pertemuan (Zoom/Meet)</h4>
                  <a 
                    href={selectedSchedule.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 text-blue-700 font-bold">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Link2 className="w-5 h-5 text-blue-500" />
                      </div>
                      Gabung ke Kelas Online
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors" />
                  </a>
                </div>
              )}

              {selectedSchedule.material_link && (
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2">Bahan Ajar / Modul</h4>
                  <a 
                    href={selectedSchedule.material_link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3 text-emerald-700 font-bold">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-emerald-500" />
                      </div>
                      Buka Materi Pelajaran
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                  </a>
                </div>
              )}

              {/* Attendance Section */}
              <div className="border-t border-slate-100 pt-6">
                {!isAttended ? (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                    <h4 className="font-black text-amber-900 mb-2 flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-amber-600" /> Presensi Kehadiran
                    </h4>
                    <p className="text-sm text-amber-800 font-medium mb-4">
                      Masukkan 6 digit kode dari Tutor/TU untuk mencatat kehadiranmu.
                    </p>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Kode Presensi"
                        maxLength={6}
                        value={attendanceCodeInput}
                        onChange={(e) => setAttendanceCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 px-4 py-3 rounded-xl border border-amber-300 focus:border-amber-500 outline-none font-black text-center tracking-[0.3em] uppercase bg-white text-slate-800"
                      />
                      <Button 
                        onClick={handleAttend}
                        disabled={isSubmittingAttendance || attendanceCodeInput.length < 4}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 h-auto rounded-xl"
                      >
                        {isSubmittingAttendance ? <CenterLoader size="sm" /> : "Hadir"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900 mb-0.5">Kehadiran Tercatat</h4>
                      <p className="text-sm text-emerald-800 font-medium">Kamu sudah presensi pada {new Date(attendanceData.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Section - Updated Redesign */}
              {isAttended && (
                <div className="pt-2">
                  <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-[20px] flex flex-col sm:flex-row gap-5 items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-black text-amber-900 text-[17px] mb-1 flex items-center gap-2">
                        Beri Penilaian
                      </h4>
                      <p className="text-[13px] text-amber-800/80 font-semibold">
                        {attendanceData.rating 
                          ? "Terima kasih atas penilaian Anda." 
                          : "Bagaimana pengalamanmu belajar di sesi ini?"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = attendanceData.rating || 0;
                        const isFilled = star <= (ratingHover || currentRating);
                        return (
                          <button
                            key={star}
                            disabled={!!attendanceData.rating}
                            className={`p-1 transition-transform ${!attendanceData.rating ? 'hover:scale-110' : 'cursor-default'}`}
                            onMouseEnter={() => !attendanceData.rating && setRatingHover(star)}
                            onMouseLeave={() => !attendanceData.rating && setRatingHover(0)}
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
