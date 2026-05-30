"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Award, BookOpen, Loader2, TrendingUp, TrendingDown, BookCheck } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";

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
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/parent/dashboard">
          <button className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors">
            <ChevronLeft className="h-5 w-5 text-[var(--text-primary)]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rapor Anak: {child.full_name}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Detailed academic performance and grades.</p>
        </div>
      </header>

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
              <Card key={score.id} className="overflow-hidden border-[var(--border)]">
                <div className="p-6 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <BookCheck className="h-5 w-5 text-[var(--accent)]" /> {course.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Nilai Akhir: <strong className="text-[var(--accent)]">{score.score}</strong> / 100</p>
                  </div>
                  <Badge variant={score.score >= 75 ? "success" : score.score >= 60 ? "warning" : "error"} className="px-4 py-1 text-sm font-bold">
                    {score.score >= 75 ? "Sangat Baik" : score.score >= 60 ? "Cukup" : "Kurang"}
                  </Badge>
                </div>
                
                {courseCols.length > 0 && (
                  <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--bg-primary)] border-b border-[var(--border)]">
                          <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Komponen Nilai</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-tertiary)] uppercase text-center">Bobot</th>
                          <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-tertiary)] uppercase text-right">Skor (0-100)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {courseCols.map(col => {
                          const colScore = gradebookScores.find(g => g.column_id === col.id);
                          return (
                            <tr key={col.id} className="hover:bg-[var(--bg-secondary)]/30">
                              <td className="px-6 py-4 font-semibold text-[var(--text-primary)] text-sm">{col.title}</td>
                              <td className="px-6 py-4 text-center text-xs text-[var(--text-tertiary)]">{col.weight}x</td>
                              <td className="px-6 py-4 text-right">
                                {colScore ? (
                                  <span className={`font-black ${colScore.score >= 75 ? 'text-[var(--success)]' : colScore.score >= 60 ? 'text-[var(--warning)]' : 'text-[var(--error)]'}`}>
                                    {colScore.score}
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-tertiary)] text-xs">Belum dinilai</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {courseCols.length === 0 && (
                  <div className="p-6 text-center text-sm text-[var(--text-tertiary)]">
                    Detail komponen nilai (tugas/ujian) belum diatur oleh Wali Kelas/Guru.
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
