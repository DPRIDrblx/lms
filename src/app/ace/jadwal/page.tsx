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
  const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(currentDayOfWeek);

  useEffect(() => {
    const fetchSchedules = async () => {
      // Fetch from ace_schedules
      const { data } = await supabase.from('ace_schedules').select('*').eq('teacher_id', profile?.id).order('day_of_week').order('start_time');
      if (data) setSchedules(data);
      setLoading(false);
    };
    if (profile) fetchSchedules();
  }, [profile, supabase]);

  const handleChangeDay = async (id: string, currentDay: number) => {
    const daysStr = ["1 (Senin)", "2 (Selasa)", "3 (Rabu)", "4 (Kamis)", "5 (Jumat)", "6 (Sabtu)", "7 (Minggu)"].join(", ");
    const newDayStr = prompt(`Masukkan angka hari baru (1-7):\n${daysStr}`, currentDay.toString());
    
    if (!newDayStr) return;
    
    const newDay = parseInt(newDayStr);
    if (isNaN(newDay) || newDay < 1 || newDay > 7) {
      alert("Input tidak valid. Harap masukkan angka 1-7.");
      return;
    }

    try {
      await supabase.from('ace_schedules').update({ day_of_week: newDay }).eq('id', id);
      alert("Hari berhasil diubah!");
      
      // Refresh
      const { data } = await supabase.from('ace_schedules').select('*').eq('teacher_id', profile?.id).order('day_of_week').order('start_time');
      if (data) setSchedules(data);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (!profile) return null;

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const filteredSchedules = schedules.filter(sch => Number(sch.day_of_week) === selectedDay);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Jadwal KBM</h1>
        <p className="text-slate-500 font-medium mt-1">Roster Mengajar Resmi Sekolah</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {days.map((day, idx) => {
          const isSelected = selectedDay === (idx + 1);
          return (
            <div 
              key={day} 
              onClick={() => setSelectedDay(idx + 1)}
              className={`px-6 py-3 rounded-2xl shrink-0 font-bold text-sm border-2 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {loading ? <p>Memuat jadwal...</p> : filteredSchedules.length === 0 ? (
          <div className="text-center p-12 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
            <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada jadwal KBM untuk hari ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules.map(sch => (
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
                      <span className="flex items-center gap-1 text-sm font-bold text-indigo-500">Hari ke-{sch.day_of_week}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleChangeDay(sch.id, sch.day_of_week)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  Ganti Hari
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
