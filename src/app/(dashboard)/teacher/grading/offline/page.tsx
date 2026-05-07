"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Award, 
  Save, 
  Search, 
  Loader2, 
  Table as TableIcon,
  Plus,
  Trash2,
  Filter,
  Download,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  full_name: string;
  scores: Record<string, number>;
}

interface Category {
  id: string;
  name: string;
}

export default function ExcelGradebookPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = useCallback(async () => {
    const [stdsRes, catsRes, scoresRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
      supabase.from("assessment_categories").select("*").order("created_at"),
      supabase.from("student_scores").select("*").eq("target_type", "offline")
    ]);
    
    if (stdsRes.data && catsRes.data) {
      const cats = catsRes.data as Category[];
      setCategories(cats);
      
      const scores = scoresRes.data || [];
      const stdData = stdsRes.data.map((s: any) => {
        const studentScores: Record<string, number> = {};
        scores.filter((sc: any) => sc.student_id === s.id).forEach((sc: any) => {
          studentScores[sc.category_id] = sc.score;
        });
        return { ...s, scores: studentScores };
      });
      setStudents(stdData);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScoreChange = (studentId: string, categoryId: string, value: string) => {
    const score = parseInt(value) || 0;
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, scores: { ...s.scores, [categoryId]: score } };
      }
      return s;
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const updates = students.flatMap(s => 
      Object.entries(s.scores).map(([catId, score]) => ({
        student_id: s.id,
        category_id: catId,
        score,
        target_id: "00000000-0000-0000-0000-000000000000",
        target_type: "offline",
        is_graded: true,
        graded_at: new Date().toISOString()
      }))
    );

    const { error } = await supabase.from("student_scores").upsert(updates, { onConflict: 'student_id,category_id' });

    if (error) toast.error(error.message);
    else toast.success("All grades synchronized to cloud!");
    setSaving(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { data, error } = await supabase.from("assessment_categories").insert({
      name: newCategoryName,
      course_id: "00000000-0000-0000-0000-000000000000" // Generic
    }).select().single();

    if (error) toast.error(error.message);
    else {
      setCategories([...categories, data]);
      setNewCategoryName("");
      setShowAddCategory(false);
      toast.success("New column added to gradebook!");
    }
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Gradebook Grid...</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-[var(--text-primary)]">Excel-Style Gradebook</h1>
           <p className="text-sm text-[var(--text-secondary)] mt-1">High-performance grid for bulk grading and academic synchronization.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={() => setShowAddCategory(true)} icon={<Plus className="h-4 w-4" />}>Add Column</Button>
           <Button onClick={handleSaveAll} loading={saving} icon={<Save className="h-4 w-4" />}>Save Changes</Button>
        </div>
      </header>

      {/* Grid Controls */}
      <Card className="p-4 border-none bg-[var(--bg-secondary)]/50 flex flex-wrap gap-4 items-center">
         <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Filter students by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
         </div>
         <Button variant="ghost" size="sm" icon={<Filter className="h-4 w-4" />}>Filters</Button>
         <Button variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>Export CSV</Button>
      </Card>

      {/* Excel Grid */}
      <Card className="p-0 overflow-hidden shadow-2xl border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest sticky left-0 bg-[var(--bg-secondary)] z-10 w-64">Student Profile</th>
                {categories.map(cat => (
                  <th key={cat.id} className="px-6 py-4 text-center text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border-l border-[var(--border)] min-w-[120px]">
                    {cat.name}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border-l border-[var(--border)] bg-[var(--accent-light)] text-[var(--accent)]">Final Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredStudents.map((student) => {
                const studentScores = Object.values(student.scores);
                const avg = studentScores.length > 0 ? Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length) : 0;
                
                return (
                  <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors group">
                    <td className="px-6 py-4 font-bold text-sm text-[var(--text-primary)] sticky left-0 bg-[var(--bg-primary)] group-hover:bg-[var(--bg-secondary)] z-10">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] text-[10px]">
                             {student.full_name[0]}
                          </div>
                          {student.full_name}
                       </div>
                    </td>
                    {categories.map(cat => (
                      <td key={cat.id} className="p-0 border-l border-[var(--border)]">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={student.scores[cat.id] ?? ""}
                          onChange={(e) => handleScoreChange(student.id, cat.id, e.target.value)}
                          className="w-full h-12 px-4 bg-transparent text-center text-sm font-semibold text-[var(--text-primary)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] transition-all"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center bg-[var(--accent-light)]/30">
                       <Badge className={`${avg >= 75 ? "bg-green-500" : "bg-orange-500"} text-white border-none`}>{avg}%</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700">
         <AlertCircle className="h-5 w-5 shrink-0" />
         <p className="text-xs">
            Tip: Use <strong>Tab</strong> to move between columns and <strong>Enter</strong> to jump to the next student. Grades are auto-calculated but require a "Save" action for cloud persistence.
         </p>
      </div>

      {/* New Column Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-3xl shadow-2xl border border-[var(--border)]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]"><FileSpreadsheet /></div>
                 <h3 className="text-xl font-bold text-[var(--text-primary)]">New Grade Column</h3>
              </div>
              <input 
                autoFocus
                type="text" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g. UAS, Daily Quiz 3"
                className="w-full h-12 px-4 rounded-xl bg-[var(--bg-secondary)] border-none mb-6 focus:ring-2 focus:ring-[var(--accent)]"
              />
              <div className="flex gap-3">
                 <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                 <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleAddCategory}>Add to Grid</Button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}
