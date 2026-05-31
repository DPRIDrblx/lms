"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Search, ShieldAlert, CheckCircle2, User, Activity, WifiOff } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProctoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [activeStudentsMap, setActiveStudentsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data } = await supabase.from("quizzes").select("*").eq("id", id).single();
      if (data) setQuiz(data);
      setLoading(false);
    };
    fetchQuiz();
  }, [id, supabase]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel(`room:exam_${id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        setActiveStudentsMap(prev => {
           const next = { ...prev };
           
           // Default everyone currently tracked to offline status if they haven't submitted yet
           Object.keys(next).forEach(studentId => {
              if (next[studentId].status !== 'Submitted') {
                 next[studentId].status = 'Keluar dari Ruang CBT';
              }
           });
           
           // Overwrite with actual present users
           for (const [key, presences] of Object.entries(state)) {
              if (Array.isArray(presences) && presences.length > 0) {
                 const latestPresence = presences[presences.length - 1] as any;
                 if (latestPresence && latestPresence.student_id) {
                   next[latestPresence.student_id] = latestPresence;
                 }
              }
           }
           
           return next;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, profile, supabase]);

  const activeStudents = Object.values(activeStudentsMap);
  const filteredStudents = activeStudents.filter(s => s.student_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse text-[var(--accent)] font-bold">Memuat Data Ujian...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
      {/* Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none flex flex-col items-center justify-center">
        <ShieldAlert className="w-96 h-96 mb-8" />
        <h1 className="text-6xl font-black uppercase tracking-widest text-center whitespace-nowrap">Provided by Ruang CBT</h1>
      </div>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
         <div>
            <Link href={`/teacher/quizzes`}>
               <Button variant="ghost" className="mb-2 -ml-4" icon={<ChevronLeft className="h-4 w-4" />}>Back to Quizzes</Button>
            </Link>
            <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
              <Activity className="h-8 w-8 text-red-500 animate-pulse" />
              Live Proctoring
            </h1>
            <p className="text-[var(--text-secondary)] font-medium mt-1">Quiz: <span className="font-bold text-[var(--accent)]">{quiz?.title}</span></p>
         </div>
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Cari siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
         <Card className="p-6 bg-white border border-[var(--border)] shadow-sm">
           <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Total Terhubung</h3>
           <p className="text-4xl font-black text-[var(--text-primary)]">{activeStudents.filter(s => s.status !== 'Keluar dari Ruang CBT').length}</p>
         </Card>
         <Card className="p-6 bg-white border border-red-100 shadow-sm">
           <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">Peringatan Kecurangan</h3>
           <p className="text-4xl font-black text-red-600">{activeStudents.filter(s => s.warnings > 0).length}</p>
         </Card>
         <Card className="p-6 bg-white border border-green-100 shadow-sm">
           <h3 className="text-sm font-bold text-green-500 uppercase tracking-wider mb-2">Selesai Ujian</h3>
           <p className="text-4xl font-black text-green-600">{activeStudents.filter(s => s.status === 'Submitted').length}</p>
         </Card>
      </div>

      <Card className="p-0 overflow-hidden shadow-xl border border-[var(--border)] bg-white relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Cheat Warnings</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Last Ping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredStudents.map((sub, idx) => (
                <tr key={sub.student_id || idx} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-[var(--accent)] border border-[var(--accent)]/20">
                        {sub.student_name?.[0] || <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{sub.student_name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{sub.student_id?.split("-")[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge 
                      variant={sub.status === 'Active' ? 'success' : sub.status === 'Submitted' ? 'info' : 'error'} 
                      className="font-bold py-1"
                    >
                      {sub.status === 'Submitted' ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : sub.status === 'Active' ? <Activity className="h-3 w-3 mr-1 inline" /> : sub.status === 'Keluar dari Ruang CBT' ? <WifiOff className="h-3 w-3 mr-1 inline" /> : <ShieldAlert className="h-3 w-3 mr-1 inline" />}
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xl font-black ${sub.warnings > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                       {sub.warnings}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <span className="text-xs text-[var(--text-secondary)] font-medium">
                        {new Date(sub.last_ping).toLocaleTimeString('id-ID')}
                     </span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-[var(--text-tertiary)]">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Belum ada aktivitas siswa yang terdeteksi.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
