"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, Search, TrendingUp, AlertCircle, Edit3, Check, X, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface GradebookColumn {
  id: string;
  course_id: string;
  title: string;
  max_score: number;
  weight: number;
  linked_quiz_id?: string | null;
}

interface GradebookScore {
  id: string;
  column_id: string;
  student_id: string;
  score: number;
}

export function Gradebook({ courseId, classId }: { courseId: string; classId: string }) {
  const supabase = createClient();
  const [students, setStudents] = useState<Profile[]>([]);
  const [columns, setColumns] = useState<GradebookColumn[]>([]);
  const [scores, setScores] = useState<GradebookScore[]>([]);
  const [finalGrades, setFinalGrades] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingGrade, setEditingGrade] = useState<{ student_id: string, column_id: string, score: string } | null>(null);

  // New Column State
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [newColWeight, setNewColWeight] = useState("1");
  const [newColLinkedQuiz, setNewColLinkedQuiz] = useState<string>("none");
  const [addingCol, setAddingCol] = useState(false);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    // 1. Get all students in the class
    const { data: stds } = await supabase
      .from("profiles")
      .select("*")
      .eq("class_id", classId)
      .eq("role", "student")
      .order("full_name");

    // 2. Get gradebook columns
    const { data: cols } = await supabase
      .from("gradebook_columns")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at");
      
    // 2.5 Get quizzes for the dropdown
    const { data: qzs } = await supabase.from("quizzes").select("id, title").eq("course_id", courseId);
    if (qzs) setCourseQuizzes(qzs);

    if (stds) setStudents(stds);
    if (cols) {
      setColumns(cols);
      // 3. Get scores if we have columns
      if (cols.length > 0) {
        const { data: scs } = await supabase
          .from("gradebook_scores")
          .select("*")
          .in("column_id", cols.map((c: any) => c.id));
          
        let finalScores = scs ? [...scs] : [];
        
        // Auto-sync: Fetch student_scores for linked quizzes
        const linkedCols = cols.filter((c: any) => c.linked_quiz_id);
        if (linkedCols.length > 0) {
          const quizIds = linkedCols.map((c: any) => c.linked_quiz_id);
          const { data: stdScs } = await supabase.from("student_scores").select("*").in("target_id", quizIds);
          if (stdScs) {
            stdScs.forEach((ss: any) => {
               const col = linkedCols.find((c: any) => c.linked_quiz_id === ss.target_id);
               if (col) {
                  finalScores.push({
                     id: `auto-${ss.id}`,
                     column_id: col.id,
                     student_id: ss.student_id,
                     score: ss.score
                  });
               }
            });
          }
        }
        setScores(finalScores);
      }
    }
    setLoading(false);
  }, [courseId, classId, supabase]);

  // Calculate final grades whenever scores or columns change
  useEffect(() => {
    const newFinals: Record<string, number> = {};
    const totalWeight = columns.reduce((sum, col) => sum + col.weight, 0);

    students.forEach(std => {
      let weightedSum = 0;
      let hasAnyScore = false;

      columns.forEach(col => {
        const sc = scores.find(s => s.student_id === std.id && s.column_id === col.id);
        if (sc) {
          hasAnyScore = true;
          // Normalize score to 100 based on max_score, then apply weight
          const normalized = (sc.score / col.max_score) * 100;
          weightedSum += normalized * col.weight;
        }
      });

      if (hasAnyScore && totalWeight > 0) {
        newFinals[std.id] = Math.round(weightedSum / totalWeight);
      }
    });

    setFinalGrades(newFinals);
  }, [scores, columns, students]);

  useEffect(() => {
    fetchData();
    // Real-time sync
    const channel = supabase
      .channel(`gradebook-${courseId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gradebook_scores' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gradebook_columns' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData, courseId, supabase]);

  const handleUpdateGrade = async (studentId: string, columnId: string, scoreStr: string) => {
    const numScore = parseInt(scoreStr);
    if (isNaN(numScore) || numScore < 0) return;

    setSavingId(`${studentId}-${columnId}`);
    
    const { error } = await supabase
      .from("gradebook_scores")
      .upsert({
        student_id: studentId,
        column_id: columnId,
        score: numScore,
        updated_at: new Date().toISOString()
      }, { onConflict: 'column_id,student_id' });

    if (!error) {
      setEditingGrade(null);
      // Update local state for immediate UI reaction
      setScores(prev => {
        const idx = prev.findIndex(s => s.student_id === studentId && s.column_id === columnId);
        const next = [...prev];
        if (idx >= 0) {
          next[idx] = { ...next[idx], score: numScore };
        } else {
          next.push({ id: `temp-${Date.now()}`, student_id: studentId, column_id: columnId, score: numScore } as any);
        }
        
        // Compute new final grade for this student immediately and save to student_scores for Parent Dashboard
        let totalWeight = 0;
        let weightedSum = 0;
        columns.forEach(col => {
          totalWeight += col.weight;
          const s = next.find(x => x.student_id === studentId && x.column_id === col.id);
          weightedSum += (s?.score || 0) * col.weight;
        });
        const newFinal = Math.round(weightedSum / (totalWeight || 1));
        
        supabase.from("student_scores").upsert({
          student_id: studentId,
          target_id: courseId,
          score: newFinal,
          target_type: "course",
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,target_id' }).then();

        return next;
      });
      
      setTimeout(async () => {
         await fetchData();
      }, 500);
    }
    setSavingId(null);
  };

  const handleAddColumn = async () => {
    if (!newColTitle.trim()) return;
    setAddingCol(true);
    const weight = parseInt(newColWeight) || 1;
    
    await supabase.from("gradebook_columns").insert({
      course_id: courseId,
      title: newColTitle,
      weight,
      max_score: 100,
      linked_quiz_id: newColLinkedQuiz === "none" ? null : newColLinkedQuiz
    });
    
    setNewColTitle("");
    setNewColWeight("1");
    setNewColLinkedQuiz("none");
    setShowAddColumn(false);
    setAddingCol(false);
    fetchData();
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      const payloads: any[] = [];
      let totalWeight = 0;
      columns.forEach(col => totalWeight += col.weight);

      students.forEach(student => {
        let weightedSum = 0;
        columns.forEach(col => {
          const s = scores.find(x => x.student_id === student.id && x.column_id === col.id);
          weightedSum += (s?.score || 0) * col.weight;
        });
        const finalScore = Math.round(weightedSum / (totalWeight || 1));
        
        payloads.push({
          student_id: student.id,
          target_id: courseId,
          score: finalScore,
          target_type: "course",
          updated_at: new Date().toISOString()
        });
      });

      if (payloads.length > 0) {
        const { error } = await supabase.from("student_scores").upsert(payloads, { onConflict: 'student_id,target_id' });
        if (error) {
          toast.error("Sync failed: " + error.message);
        } else {
          toast.success("Final grades synced to database successfully!");
        }
      }
    } catch (err: any) {
      toast.error("Failed to sync grades: " + (err.message || err));
    }
    setLoading(false);
  };

  const filteredStudents = students.filter(s => s.full_name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[var(--accent)]" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Advanced Gradebook</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Manage multiple assessment columns with weights.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>
          <Button onClick={handleForceSync} variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
            Save & Sync
          </Button>
          <Button onClick={() => setShowAddColumn(true)} size="sm" icon={<Plus className="h-4 w-4" />}>
            Add Column
          </Button>
        </div>
      </header>

      {showAddColumn && (
        <Card className="p-6 bg-[var(--bg-secondary)] border-dashed border-2 border-[var(--border)] flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-1 block">Column Title</label>
            <input 
              type="text" 
              value={newColTitle}
              onChange={e => setNewColTitle(e.target.value)}
              placeholder="e.g. Tugas 1, UTS, UAS..."
              className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] focus:outline-[var(--accent)]"
            />
          </div>
          <div className="w-32">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-1 block">Bobot</label>
            <input 
              type="number" min="1"
              value={newColWeight}
              onChange={e => setNewColWeight(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] focus:outline-[var(--accent)]"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-1 block">Tautkan Kuis (Otomatis)</label>
            <select 
              value={newColLinkedQuiz}
              onChange={e => setNewColLinkedQuiz(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] focus:outline-[var(--accent)]"
            >
               <option value="none">-- Jangan Tautkan (Manual) --</option>
               {courseQuizzes.map(q => (
                  <option key={q.id} value={q.id}>{q.title}</option>
               ))}
            </select>
          </div>
          <Button onClick={handleAddColumn} loading={addingCol}>Save</Button>
          <Button variant="ghost" onClick={() => setShowAddColumn(false)}>Cancel</Button>
        </Card>
      )}

      <div className="overflow-x-auto pb-4">
        <Card className="p-0 overflow-hidden border-[var(--border)] min-w-max">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider sticky left-0 bg-[var(--bg-secondary)] z-10">Student Name</th>
                
                {columns.map(col => (
                  <th key={col.id} className="px-6 py-4 text-center border-l border-[var(--border)]">
                    <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center justify-center gap-1">
                       {col.title}
                       {col.linked_quiz_id && <Badge variant="info" className="scale-75 px-1 py-0">Auto</Badge>}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mt-1">Bobot: {col.weight}</div>
                  </th>
                ))}

                <th className="px-6 py-4 text-xs font-bold text-[var(--accent)] uppercase tracking-wider text-center border-l border-2 border-[var(--accent)]/20 bg-[var(--accent-light)]/10">Nilai Akhir (Rapot)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredStudents.map((student) => {
                const finalGrade = finalGrades[student.id];
                return (
                  <tr key={student.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                    <td className="px-6 py-4 sticky left-0 bg-[var(--bg-primary)] z-10 border-r border-[var(--border)] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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

                    {columns.map(col => {
                      const sc = scores.find(s => s.student_id === student.id && s.column_id === col.id);
                      const isEditing = editingGrade?.student_id === student.id && editingGrade?.column_id === col.id;
                      const isSaving = savingId === `${student.id}-${col.id}`;

                      return (
                        <td key={col.id} className="px-6 py-4 text-center border-l border-[var(--border)]">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <input 
                                autoFocus
                                type="number" 
                                value={editingGrade.score}
                                onChange={(e) => setEditingGrade({ ...editingGrade, score: e.target.value })}
                                className="w-16 px-2 py-1 rounded-lg bg-white border border-[var(--accent)] text-center font-black text-[var(--accent)]"
                              />
                              <button onClick={() => handleUpdateGrade(student.id, col.id, editingGrade.score)} className="p-1 rounded bg-[var(--success)] text-white shadow-sm">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => setEditingGrade(null)} className="p-1 rounded bg-[var(--error)] text-white shadow-sm">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto text-[var(--accent)]" />
                          ) : col.linked_quiz_id ? (
                            <div className="flex items-center justify-center gap-2 cursor-not-allowed opacity-80" title="Nilai otomatis tersinkron dari Kuis">
                              <span className={`text-lg font-black ${sc ? "text-[var(--info)]" : "text-[var(--text-tertiary)]"}`}>
                                {sc?.score ?? "--"}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setEditingGrade({ student_id: student.id, column_id: col.id, score: sc?.score?.toString() || "" })}>
                              <span className={`text-lg font-black ${sc ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}>
                                {sc?.score ?? "--"}
                              </span>
                              <Edit3 className="h-3.5 w-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-center border-l-2 border-[var(--accent)]/20 bg-[var(--accent-light)]/10 font-black text-xl text-[var(--accent)]">
                      {finalGrade !== undefined ? finalGrade : "--"}
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="py-20 text-center text-[var(--text-tertiary)]">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No students found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
