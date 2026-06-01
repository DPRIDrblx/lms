"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Loader2, Users, Calendar, ArrowLeft, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrincipalAttendancesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== "principal") {
      router.push("/dashboard");
      return;
    }

    const fetchData = async () => {
      const { data } = await supabase
        .from("attendance_sessions")
        .select(`
          *,
          profiles (full_name),
          attendance_logs (id)
        `)
        .order("created_at", { ascending: false });

      if (data) setSessions(data);
      setLoading(false);
    };

    if (profile) fetchData();
  }, [profile, router, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Calendar className="h-48 w-48 text-white" />
        </div>
        <div className="relative z-10">
          <Link href="/principal" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">Rekapitulasi Absensi</h1>
          <p className="text-slate-400 mt-2">Daftar semua sesi absensi kelas yang dilakukan oleh guru.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map(session => {
          const checkinCount = session.attendance_logs ? session.attendance_logs.length : 0;
          return (
            <div key={session.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl hover:-translate-y-1 transition-transform group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <QrCode className="h-24 w-24 text-amber-500" />
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-500 border border-amber-500/30">
                      {session.class_name || "Semua Kelas"}
                    </span>
                    {session.is_active && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                        Sedang Aktif
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{session.subject}</h3>
                  <p className="text-sm font-medium text-slate-400">Guru: {session.profiles?.full_name}</p>
                </div>

                <div className="mt-auto space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Users className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold">Hadir:</span>
                    </div>
                    <span className="text-lg font-black text-white">{checkinCount} Siswa</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right">
                    Dibuat: {new Date(session.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">Belum ada sesi absensi</p>
            <p className="text-sm">Guru belum membuat sesi absensi QR atau AI.</p>
          </div>
        )}
      </div>
    </div>
  );
}
