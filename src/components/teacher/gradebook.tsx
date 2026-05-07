"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  Save, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GradebookProps {
  courseId: string;
  classId: string;
}

export function Gradebook({ courseId, classId }: GradebookProps) {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingGrade, setEditingGrade] = useState<{ id: string, score: string } | null>(null);

  const fetchGrades = useCallback(async () => {
    // 1. Get all students in the class
    const { data: stds } = await supabase
      .from("profiles")
      .select("*")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name");

    // 2. Get existing grades for this course
    const { data: scores } = await supabase
      .from("student_scores")
      .select("*")
      .eq("course_id", courseId);

    if (stds) {
      const merged = stds.map(s => ({
        ...s,
        grade: scores?.find(sc => sc.student_id === s.id) || null
      }));
      setStudents(merged);
    }
    setLoading(false);
  }, [courseId, classId, supabase]);

  useEffect(() => {
    fetchGrades();

    // Real-time sync for grades
    const channel = supabase
      .channel(`gradebook-${courseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_scores', filter: `course_id=eq.${courseId}` }, () => fetchGrades())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchGrades]);

  const handleUpdateGrade = async (studentId: string, score: string) => {
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) return;

    setSavingId(studentId);
    
    // Upsert the score
    const { error } = await supabase
      .from("student_scores")
      .upsert({
        student_id: studentId,
        course_id: courseId,
        score: numScore,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,course_id' });

    if (!error) {
      setEditingGrade(null);
    }
    setSavingId(null);
  };

  const filteredStudents = students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[var(--accent)]" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Academic Gradebook</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Manage and manually input exam scores for Class members.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[var(--bg-secondary)]/50 border-none">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Class Average</p>
          <div className="flex items-end justify-between">
            <h4 className="text-2xl font-black text-[var(--text-primary)]">
              {students.filter(s => s.grade).length > 0 
                ? Math.round(students.reduce((acc, s) => acc + (s.grade?.score || 0), 0) / students.filter(s => s.grade).length)
                : 0}%
            </h4>
            <TrendingUp className="h-5 w-5 text-[var(--success)]" />
          </div>
        </Card>
        <Card className="p-4 bg-[var(--bg-secondary)]/50 border-none">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Total Graded</p>
          <h4 className="text-2xl font-black text-[var(--accent)]">{students.filter(s => s.grade).length} / {students.length}</h4>
        </Card>
        <Card className="p-4 bg-[var(--bg-secondary)]/50 border-none">
          <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Pending Sync</p>
          <h4 className="text-2xl font-black text-amber-500">{students.filter(s => !s.grade).length}</h4>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-[var(--border)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-center">Score (0-100)</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
                      {student.full_name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{student.full_name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{student.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {editingGrade?.id === student.id ? (
                    <div className="flex items-center justify-center gap-2">
                      <input 
                        autoFocus
                        type="number" 
                        max="100" min="0"
                        value={editingGrade.score}
                        onChange={(e) => setEditingGrade({ ...editingGrade, score: e.target.value })}
                        className="w-16 px-2 py-1 rounded-lg bg-white border border-[var(--accent)] text-center font-black text-[var(--accent)]"
                      />
                      <button onClick={() => handleUpdateGrade(student.id, editingGrade.score)} className="p-1 rounded bg-[var(--success)] text-white shadow-sm hover:scale-110 transition-transform">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => setEditingGrade(null)} className="p-1 rounded bg-[var(--error)] text-white shadow-sm hover:scale-110 transition-transform">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 group">
                      <span className={`text-lg font-black ${student.grade ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                        {student.grade?.score ?? "--"}
                      </span>
                      <button 
                        onClick={() => setEditingGrade({ id: student.id, score: student.grade?.score?.toString() || "" })}
                        className="p-1 opacity-0 group-hover:opacity-100 text-[var(--accent)] hover:bg-[var(--accent-light)] rounded-md transition-all"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {student.grade ? (
                    <Badge variant={student.grade.score >= 60 ? "success" : "error"} className="rounded-full">
                      {student.grade.score >= 60 ? "Passed" : "Failed"}
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-full">Not Graded</Badge>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {savingId === student.id ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto text-[var(--accent)]" />
                  ) : (
                    <p className="text-[10px] text-[var(--text-tertiary)] font-medium">
                      {student.grade ? `Sync: ${new Date(student.grade.updated_at).toLocaleDateString()}` : "--"}
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="py-20 text-center text-[var(--text-tertiary)]">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No students found in this class.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
