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
  ChevronRight,
  ClipboardCheck,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  full_name: string;
}

interface Category {
  id: string;
  name: string;
}

export default function OfflineGradingPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);

  const fetchData = useCallback(async () => {
    const [stds, cats] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name"),
      supabase.from("assessment_categories").select("*").order("created_at")
    ]);
    
    if (stds.data) setStudents(stds.data as Student[]);
    if (cats.data) {
      setCategories(cats.data as Category[]);
      if (cats.data.length > 0 && !selectedCategory) setSelectedCategory(cats.data[0].id);
    }
    setLoading(false);
  }, [supabase, selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const { data, error } = await supabase.from("assessment_categories").insert({
      name: newCategoryName,
      course_id: "00000000-0000-0000-0000-000000000000" // Generic for now, or link to active course
    }).select().single();

    if (error) toast.error(error.message);
    else {
      setCategories([...categories, data]);
      setSelectedCategory(data.id);
      setNewCategoryName("");
      setShowAddCategory(false);
      toast.success("Assessment category created!");
    }
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedCategory) {
      toast.error("Please select a student and assessment category.");
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("student_scores").insert({
      student_id: selectedStudent.id,
      category_id: selectedCategory,
      target_id: "00000000-0000-0000-0000-000000000000",
      target_type: "offline",
      score: score,
      is_graded: true,
      graded_at: new Date().toISOString()
    });

    if (error) toast.error(error.message);
    else {
      toast.success(`Score for ${selectedStudent.full_name} saved!`);
      setScore(0);
      setSelectedStudent(null);
    }
    setSaving(false);
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gradebook & Multi-Assessment</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Dynamically manage assessment columns and input student scores.</p>
        </div>
        <Button variant="secondary" onClick={() => setShowAddCategory(true)} icon={<Plus className="h-4 w-4" />}>
          Add Column
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Student Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
            />
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto text-[var(--accent)]" /></div>
            ) : filteredStudents.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedStudent?.id === s.id ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                }`}
              >
                <span className="text-sm font-medium truncate">{s.full_name}</span>
                <ChevronRight size={14} className={selectedStudent?.id === s.id ? "text-white" : "text-[var(--text-tertiary)]"} />
              </button>
            ))}
          </div>
        </Card>

        {/* Grading Area */}
        <div className="lg:col-span-3">
          {selectedStudent ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <Card className="p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-[var(--border)]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-3xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shadow-inner">
                      <ClipboardCheck className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">Active Assessment</p>
                      <h2 className="text-2xl font-black text-[var(--text-primary)]">{selectedStudent.full_name}</h2>
                    </div>
                  </div>
                  <Badge variant="info" className="px-4 py-1 rounded-full">Academic Year 2024</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Select Assessment Column</label>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                              selectedCategory === cat.id 
                                ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" 
                                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex justify-between items-center mb-4">
                         <label className="block text-xs font-black text-[var(--text-tertiary)] uppercase tracking-wider">Input Score</label>
                         <div className="px-6 py-2 rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--accent)]/20">
                            <span className="text-3xl font-black text-[var(--accent)]">{score}</span>
                         </div>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={score}
                        onChange={e => setScore(parseInt(e.target.value))}
                        className="w-full h-3 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
                      />
                      <div className="flex justify-between mt-3 px-1">
                         <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Remedial</span>
                         <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Distinction</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border-none">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-[var(--accent)]" /> Grading Impact
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        This score will be synchronized instantly to the student&apos;s portal and parent&apos;s oversight dashboard. 
                        XP rewards will be calculated based on the achievement tier.
                      </p>
                    </div>

                    <Button 
                      className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-[var(--accent)]/20 mt-6" 
                      onClick={handleSave} 
                      loading={saving} 
                      icon={<Save className="h-5 w-5" />}
                    >
                      Confirm Entry
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center py-32 border-2 border-dashed bg-transparent">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-[var(--text-tertiary)] opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Ready to Grade</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Select a student from the roster to begin evaluation.</p>
            </Card>
          )}
        </div>
      </div>

      {/* New Category Modal */}
      <AnimatePresence>
        {showAddCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[var(--bg-primary)] p-8 rounded-3xl shadow-2xl border border-[var(--border)]">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">New Assessment Column</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Define a new evaluation type for this academic session.</p>
              <input 
                autoFocus
                type="text" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="e.g. Science Quiz 2, Project A"
                className="w-full h-12 px-4 rounded-xl bg-[var(--bg-secondary)] border-none mb-6 focus:ring-2 focus:ring-[var(--accent)]"
              />
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl h-12 font-bold" onClick={handleAddCategory}>Create Column</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
