"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Search, FileText, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TeacherQuizReviewListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [quizRes, scoresRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("student_scores")
          .select("*, profiles(id, full_name, avatar_url)")
          .eq("target_id", id)
          .eq("target_type", "quiz")
      ]);
      
      if (quizRes.data) setQuiz(quizRes.data);
      if (scoresRes.data) setSubmissions(scoresRes.data);
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const filteredSubmissions = submissions.filter(s => s.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse text-[var(--accent)] font-bold">Memuat Data Submissions...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <Link href={`/teacher/quizzes/${id}/builder`}>
               <Button variant="ghost" className="mb-2 -ml-4" icon={<ChevronLeft className="h-4 w-4" />}>Back to Builder</Button>
            </Link>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">Review Submissions</h1>
            <p className="text-[var(--text-secondary)] font-medium mt-1">Quiz: <span className="font-bold text-[var(--accent)]">{quiz?.title}</span></p>
         </div>
         <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Cari nama siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
         </div>
      </header>

      <Card className="p-0 overflow-hidden shadow-xl border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Submitted At</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-[var(--accent)] border border-[var(--accent)]/20">
                        {sub.profiles?.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{sub.profiles?.full_name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{sub.profiles?.id.split("-")[0]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-black text-[var(--text-primary)]">{sub.score}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">/100</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={sub.is_graded ? "success" : "warning"} className="font-bold py-1">
                      {sub.is_graded ? <CheckCircle2 className="h-3 w-3 mr-1 inline" /> : <AlertCircle className="h-3 w-3 mr-1 inline" />}
                      {sub.is_graded ? "Finalized" : "Need Review"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className="text-xs text-[var(--text-secondary)] font-medium">
                        {new Date(sub.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/teacher/quizzes/${id}/review/${sub.profiles?.id}`}>
                      <Button size="sm" variant={sub.is_graded ? "outline" : "default"} icon={<Eye className="h-4 w-4" />}>
                         {sub.is_graded ? "View" : "Review"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[var(--text-tertiary)]">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Belum ada submission dari siswa.</p>
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
