"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CalendarClock, MapPin, Users, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function ACEJadwal() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      // Mocking for now, but in reality we'd fetch from ace_schedules
      // and group by day.
      const { data } = await supabase.from('ace_schedules').select('*').eq('teacher_id', profile?.id).order('day_of_week').order('start_time');
      if (data) setSchedules(data);
      setLoading(false);
    };
    if (profile) fetchSchedules();
  }, [profile, supabase]);

  if (!profile) return null;

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const currentDay = new Date().getDay() === 0 ? 7 : new Date().getDay();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal KBM</h1>
        <p className="text-slate-500 font-medium mt-1">Roster Mengajar Resmi Sekolah</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {days.map((day, idx) => {
          const isToday = currentDay === (idx + 1);
          return (
            <div key={day} className={`px-6 py-3 rounded-2xl shrink-0 font-bold text-sm border-2 transition-colors cursor-pointer ${isToday ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {day}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {loading ? <p>Memuat jadwal...</p> : schedules.length === 0 ? (
          <div className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada jadwal KBM yang diinput oleh TU.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map(sch => (
              <Card key={sch.id} className="p-6 border-2 border-slate-200 rounded-2xl flex items-center justify-between group hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                    <span className="font-black text-lg leading-none mb-1">{sch.start_time.substring(0,5)}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mulai</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">{sch.subject_name}</h3>
                    <div className="flex items-center gap-3 text-slate-500 mt-1">
                      <span className="flex items-center gap-1 text-sm font-bold"><Users className="w-4 h-4" /> {sch.class_name}</span>
                      <span className="flex items-center gap-1 text-sm font-bold"><MapPin className="w-4 h-4" /> {sch.room || "Ruang Kelas"}</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
