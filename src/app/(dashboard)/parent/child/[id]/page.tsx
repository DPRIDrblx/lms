"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Award, BookOpen, Loader2, TrendingUp, TrendingDown, BookCheck, GraduationCap, Medal, Star } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";

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
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold mb-2">
        <div className="p-2 bg-indigo-50 rounded-full">
          <ChevronLeft className="h-4 w-4" />
        </div>
        Kembali ke Family Hub
      </Link>

      {/* Premium Profile Banner */}
      <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-50 mt-4">
        <div className="h-32 md:h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
        </div>
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white p-2 shadow-xl relative z-10">
               <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-black text-5xl overflow-hidden">
                  {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover" /> : child.full_name[0]}
               </div>
            </div>
            <div className="text-center md:text-left flex-1 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-800">{child.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold px-3 py-1 text-sm flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> Siswa {child.rank || 'Aktif'}
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 border-none font-bold px-3 py-1 text-sm flex items-center gap-1.5">
                  <Star className="h-4 w-4" /> {child.xp || 0} XP
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-10 mb-6">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Medal className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Rapor Mata Pelajaran</h2>
          <p className="text-slate-500">Ringkasan performa di setiap kelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {scores.length === 0 ? (
          <Card className="p-12 text-center text-[var(--text-tertiary)]">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-bold">No grades available yet.</p>
          </Card>
        ) : (
          scores.map(score => {
            const course = score.courses;
            const courseCols = gradebookColumns.filter(c => c.course_id === course.id);
            
            return (
              <div key={score.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <BookCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">Diampu oleh pengajar khusus.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Nilai Akhir</p>
                      <p className={`text-2xl font-black ${score.score >= 75 ? "text-emerald-600" : score.score >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                        {score.score}
                      </p>
                    </div>
                    <Badge className={`px-4 py-2 text-sm font-bold border-none ${score.score >= 75 ? "bg-emerald-100 text-emerald-700" : score.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                      {score.score >= 75 ? "Sangat Baik" : score.score >= 60 ? "Cukup" : "Kurang"}
                    </Badge>
                  </div>
                </div>
                
                {courseCols.length > 0 ? (
                  <div className="p-6 md:p-8">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Komponen Penilaian (Tugas & Ujian)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courseCols.map(col => {
                        const colScore = gradebookScores.find(g => g.column_id === col.id);
                        const isScored = !!colScore;
                        const finalScore = colScore?.score || 0;
                        const statusColor = !isScored ? "slate" : finalScore >= 75 ? "emerald" : finalScore >= 60 ? "amber" : "rose";
                        
                        return (
                          <div key={col.id} className="p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-bold text-slate-800 leading-tight">{col.title}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Bobot: {col.weight}x</p>
                              </div>
                              {isScored ? (
                                <div className={`text-xl font-black text-${statusColor}-600`}>{finalScore}</div>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-500 border-none">Pending</Badge>
                              )}
                            </div>
                            {isScored ? (
                              <ProgressBar value={finalScore} max={100} size="sm" color={`var(--${statusColor}-500, #${statusColor === 'emerald' ? '10b981' : statusColor === 'amber' ? 'f59e0b' : 'f43f5e'})`} />
                            ) : (
                              <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 m-6 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">Belum ada rincian komponen nilai yang diatur oleh guru pengampu.</p>
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
