"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, BookOpen, Loader2, TrendingUp, BookCheck, GraduationCap, Medal, Star } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export default function ChildReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [child, setChild] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [gradebookScores, setGradebookScores] = useState<any[]>([]);
  const [gradebookColumns, setGradebookColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildData = async () => {
      // Security check: Make sure this parent actually owns this child
      const { data: link } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_id", profile?.id)
        .eq("student_id", childId)
        .limit(1)
        .maybeSingle();
        
      if (!link) {
        setLoading(false);
        return; // Unauthorized or not found
      }

      const { data: c } = await supabase.from("profiles").select("*").eq("id", childId).single();
      
      const { data: s } = await supabase
        .from("student_scores")
        .select("*, courses(*)")
        .eq("student_id", childId)
        .eq("target_type", "course"); // or just get everything and filter
        
      const { data: gsc } = await supabase.from("gradebook_scores").select("*").eq("student_id", childId);
      
      // Get all unique course IDs to fetch columns
      const courseIds = [...new Set(s?.map((x: any) => x.course_id).filter(Boolean))];
      
      let gcols: any[] = [];
      if (courseIds.length > 0) {
        const { data: cols } = await supabase.from("gradebook_columns").select("*").in("course_id", courseIds);
        gcols = cols || [];
      }

      if (c) setChild(c);
      if (s) setScores(s.filter((x: any) => x.courses)); // Ensure course relation exists
      if (gsc) setGradebookScores(gsc);
      if (gcols) setGradebookColumns(gcols);
      
      setLoading(false);
    };

    if (profile?.id) {
      fetchChildData();
    }
  }, [profile, childId, supabase]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--accent)]" /></div>;
  if (!child) return <div className="text-center py-20 text-[var(--text-tertiary)]">Student not found or access denied.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-black mb-2 px-4 py-2 bg-white rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none transition-all">
        <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        Kembali ke Family Hub
      </Link>

      {/* Premium Profile Banner */}
      <div className="relative bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] mt-4">
        <div className="h-32 md:h-40 w-full bg-indigo-500 relative border-b-2 border-slate-200">
          <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
        </div>
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-[0_4px_0_rgb(226,232,240)] border-2 border-slate-200 relative z-10">
               <div className="w-full h-full rounded-2xl bg-indigo-400 flex items-center justify-center text-white font-black text-5xl overflow-hidden">
                  {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover" /> : child.full_name[0]}
               </div>
            </div>
            <div className="text-center md:text-left flex-1 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-800">{child.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <div className="bg-indigo-100 text-indigo-600 border-2 border-indigo-200 shadow-[0_2px_0_rgb(199,210,254)] font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" strokeWidth={3} /> Siswa {child.rank || 'Aktif'}
                </div>
                <div className="bg-amber-100 text-amber-600 border-2 border-amber-200 shadow-[0_2px_0_rgb(253,230,138)] font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Star className="h-4 w-4" strokeWidth={3} /> {child.xp || 0} XP
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10 mb-6">
        <div className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgb(147,51,234)] border-2 border-purple-600 rotate-3">
          <Medal className="h-7 w-7" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Rapor Mata Pelajaran</h2>
          <p className="text-slate-500 font-bold">Ringkasan performa di setiap kelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {scores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-black">No grades available yet.</p>
          </div>
        ) : (
          scores.map(score => {
            const course = score.courses;
            const courseCols = gradebookColumns.filter(c => c.course_id === course.id);
            
            return (
              <div key={score.id} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_0_rgb(226,232,240)] border-2 border-slate-200">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 border-2 border-indigo-600 shadow-sm -rotate-3">
                      <BookCheck className="h-7 w-7" strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 font-bold">Diampu oleh pengajar khusus.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-0.5">Nilai Akhir</p>
                      <p className={`text-3xl font-black ${score.score >= 75 ? "text-emerald-500" : score.score >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                        {score.score}
                      </p>
                    </div>
                    <div className={cn(
                      "px-4 py-2 text-sm font-black rounded-xl border-2",
                      score.score >= 75 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : 
                      score.score >= 60 ? "bg-amber-100 text-amber-600 border-amber-200" : 
                      "bg-rose-100 text-rose-600 border-rose-200"
                    )}>
                      {score.score >= 75 ? "Sangat Baik" : score.score >= 60 ? "Cukup" : "Kurang"}
                    </div>
                  </div>
                </div>
                
                {courseCols.length > 0 ? (
                  <div className="p-6 md:p-8">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Komponen Penilaian (Tugas & Ujian)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courseCols.map(col => {
                        const colScore = gradebookScores.find(g => g.column_id === col.id);
                        const isScored = !!colScore;
                        const finalScore = colScore?.score || 0;
                        const statusColor = !isScored ? "slate" : finalScore >= 75 ? "emerald" : finalScore >= 60 ? "amber" : "rose";
                        
                        return (
                          <div key={col.id} className="p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-black text-slate-800 leading-tight">{col.title}</p>
                                <p className="text-xs font-black text-slate-400 mt-1">Bobot: {col.weight}x</p>
                              </div>
                              {isScored ? (
                                <div className={`text-2xl font-black text-${statusColor}-500`}>{finalScore}</div>
                              ) : (
                                <div className="bg-slate-100 text-slate-500 border-2 border-slate-200 px-2 py-1 rounded-xl text-xs font-black">Pending</div>
                              )}
                            </div>
                            {isScored ? (
                              <ProgressBar value={finalScore} max={100} size="md" color={`var(--${statusColor}-500, #${statusColor === 'emerald' ? '10b981' : statusColor === 'amber' ? 'f59e0b' : 'f43f5e'})`} />
                            ) : (
                              <div className="h-2 w-full bg-slate-100 rounded-full mt-2"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 m-6 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-black">Belum ada rincian komponen nilai yang diatur oleh guru pengampu.</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
