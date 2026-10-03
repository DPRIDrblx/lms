"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, CheckCircle2, ChevronRight, Star, Link2, KeyRound, FileText, PackageOpen, User, BookOpen, MapPin } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { DateSlider, DateItem } from "@/components/ui/date-slider";
import { LeaderboardWidget } from "@/components/student/LeaderboardWidget";

const THEME_STYLES: Record<string, string> = {
  ocean_blue: "from-blue-600 via-blue-500 to-cyan-500",
  sunset_orange: "from-orange-500 via-orange-400 to-amber-500",
  royal_purple: "from-purple-600 via-purple-500 to-indigo-500",
  emerald_green: "from-emerald-500 via-emerald-400 to-teal-500",
  slate_gray: "from-slate-600 via-slate-500 to-slate-400",
  default: "from-[#108B96] via-teal-500 to-emerald-400"
};

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
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Layout State
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const dateItems = useMemo(() => generateDates(), []);

  const fetchData = async () => {
    if (!profile?.class_id) {
      setLoading(false);
      return;
    }
    
    // Fetch Schedules
    const { data: schedData } = await supabase
      .from("center_schedules")
      .select("*, tutor:tutor_id(full_name), branch:branch_id(name), room:room_id(room_number)")
      .contains("target_class_ids", [profile.class_id])
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
    router.push(`/student/jadwal-les/${schedule.id}`);
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

  const filteredSchedules = schedules.filter(s => new Date(s.schedule_time).toDateString() === activeDate.toDateString());

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

      <LeaderboardWidget />

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
                      <div className={cn("w-full aspect-[21/9] sm:h-36 relative overflow-hidden bg-gradient-to-br", THEME_STYLES[schedule.color_theme] || THEME_STYLES.default)}>
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        
                        <div className={cn(
                          "absolute top-3 left-3 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border backdrop-blur-md",
                          isToday ? "bg-white/90 text-slate-800 border-white/50" : "bg-black/20 text-white border-white/10"
                        )}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        
                        <div className="absolute bottom-3 right-3 opacity-20">
                          <BookOpen className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      
                      <div className="p-5 flex-1 flex flex-col min-w-0">
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
                          
                          {schedule.tutor?.full_name && (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-[8px] border border-indigo-200 max-w-full">
                              <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{schedule.tutor.full_name}</span>
                            </div>
                          )}
                          
                          {isAttended ? (
                            <div className={cn(
                              "flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-[8px] border",
                              attendances[schedule.id].status === 'izin' 
                                ? "text-amber-700 bg-amber-50 border-amber-100" 
                                : "text-emerald-700 bg-emerald-50 border-emerald-100"
                            )}>
                              {attendances[schedule.id].status === 'izin' ? (
                                <span className="truncate max-w-[200px] inline-block">Izin: {attendances[schedule.id].excuse_reason}</span>
                              ) : (
                                <><CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Hadir</>
                              )}
                            </div>
                          ) : isToday ? (
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-[8px] border border-amber-100 max-w-full">
                              <KeyRound className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Belum Presensi</span>
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
                  
                  <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
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

                      {schedule.tutor?.full_name && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 max-w-full">
                          <User className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="truncate">{schedule.tutor.full_name}</span>
                        </div>
                      )}
                      
                      {isAttended ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" /> Hadir
                        </div>
                      ) : isToday ? (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 max-w-full">
                          <KeyRound className="w-4 h-4 shrink-0" /> <span className="truncate">Belum Presensi</span>
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


    </div>
    </div>
  );
}
