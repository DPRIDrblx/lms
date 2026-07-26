"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";

export default function JadwalLesPage() {
  const { profile, isCenterStudent } = useAuth();
  const supabase = createClient();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.class_id) {
      setLoading(false);
      return;
    }
    
    const fetchSchedules = async () => {
      const { data } = await supabase
        .from("center_schedules")
        .select("*")
        .eq("class_id", profile.class_id)
        .order("schedule_time", { ascending: true });
        
      if (data) {
        // Only show future schedules, or past schedules within today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = data.filter((s: any) => new Date(s.schedule_time) >= today);
        setSchedules(filtered);
      }
      setTimeout(() => setLoading(false), 1500);
    };

    fetchSchedules();
  }, [profile?.class_id, supabase]);

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
      <div className="bg-yellow-400 rounded-3xl p-8 text-slate-900 relative overflow-hidden shadow-lg border-b-4 border-yellow-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-white/30 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/40">
            <Calendar className="w-10 h-10 text-yellow-900" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Jadwal Les</h1>
            <p className="text-yellow-800 font-bold text-lg">Jangan sampai terlewat sesi belajarmu minggu ini.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <CenterLoader size="md" />
          </div>
        ) : schedules.length > 0 ? (
          schedules.map(schedule => {
            const date = new Date(schedule.schedule_time);
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <Card key={schedule.id} className={`p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center border-2 ${isToday ? 'border-yellow-400 bg-yellow-50/50' : 'border-slate-200'}`}>
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 ${isToday ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                  <span className="text-sm font-bold uppercase">{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className="text-3xl font-black leading-none">{date.getDate()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-xl text-slate-800">{schedule.title}</h3>
                    {isToday && <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-black uppercase rounded-full tracking-wider">Hari Ini</span>}
                  </div>
                  {schedule.description && (
                    <p className="text-slate-500 font-medium mb-3">{schedule.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100 inline-flex">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Hadir Tepat Waktu
                    </span>
                  </div>
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
    </div>
  );
}
