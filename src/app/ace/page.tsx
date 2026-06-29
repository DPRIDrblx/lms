"use client";

import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { MapPin, FileSignature, BookOpen, AlertCircle, CalendarCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ACEDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ present: 0, leave: 0, requests: 0 });

  useEffect(() => {
    if (!profile) return;
    const fetchStats = async () => {
      // Just mock/basic stats for demo
      const today = new Date().toISOString().split('T')[0];
      
      if (profile.role === 'principal' || profile.role === 'tu') {
        const { count: present } = await supabase.from('ace_attendances').select('*', { count: 'exact', head: true }).eq('status', 'hadir').gte('created_at', today);
        const { count: pending } = await supabase.from('ace_leaves').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        setStats({ present: present || 0, leave: 0, requests: pending || 0 });
      }
    };
    fetchStats();
  }, [profile]);

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Selamat Datang, {profile.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-500 font-medium mt-1">Portal Academic & Educator Center IGNITE</p>
      </div>

      {/* Hero / Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Absensi Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-20 transform group-hover:scale-110 transition-transform">
            <MapPin className="w-40 h-40" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-4 border border-white/20">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-black mb-1">Presensi Hari Ini</h2>
              <p className="text-indigo-100 text-sm font-medium mb-6">Catat kehadiran Anda dari sekolah</p>
            </div>
            <Link href="/ace/kehadiran" className="block w-full py-3 bg-white text-indigo-600 text-center font-black rounded-xl hover:bg-indigo-50 transition-colors shadow-sm">
              Buka Portal Kehadiran
            </Link>
          </div>
        </div>

        {/* E-Kinerja Card */}
        <div className="bg-white rounded-[2rem] p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200 mb-4">
              <FileSignature className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">Pengelolaan Kinerja</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">Kelola target dan hasil observasi</p>
          </div>
          <Link href="/ace/kinerja" className="block w-full py-3 bg-slate-100 text-slate-700 text-center font-black rounded-xl hover:bg-slate-200 transition-colors">
            Mulai Penilaian
          </Link>
        </div>

        {/* Principal Only / Admin Card */}
        {(profile.role === 'principal' || profile.role === 'tu') && (
          <div className="bg-white rounded-[2rem] p-6 border-2 border-amber-200 shadow-sm flex flex-col justify-between relative overflow-hidden bg-amber-50/30">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                {stats.requests > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse shadow-sm">
                    {stats.requests} Pending
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-1">Persetujuan</h2>
              <p className="text-slate-500 text-sm font-medium mb-6">Cuti & Dinas Luar Guru</p>
            </div>
            <Link href={profile.role === 'principal' ? "/ace/principal/izin" : "/ace/tu/kehadiran"} className="block w-full py-3 bg-amber-500 text-white text-center font-black rounded-xl hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20">
              Tinjau Sekarang
            </Link>
          </div>
        )}

      </div>

      {/* Info Section */}
      <Card className="p-8 border-2 border-slate-200 bg-white rounded-3xl">
        <div className="flex gap-6 items-start">
          <div className="p-4 bg-slate-100 rounded-2xl shrink-0">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Informasi Ruang ACE</h3>
            <p className="text-slate-600 leading-relaxed">
              Ruang ACE merupakan portal terpusat untuk segala urusan kepegawaian dan performa akademik pendidik di IGNITE. Pastikan Anda melakukan presensi harian hanya dari dalam area sekolah, dan lengkapi dokumen E-Kinerja Anda setiap semesternya sesuai dengan jadwal yang ditentukan oleh Kepala Sekolah.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
