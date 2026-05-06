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
  ClipboardCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  full_name: string;
}

export default function OfflineGradingPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [taskName, setTaskName] = useState("");
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "student").order("full_name");
      if (data) setStudents(data as Student[]);
      setLoading(false);
    };
    fetchStudents();
  }, [supabase]);

  const handleSave = async () => {
    if (!selectedStudent || !taskName) return;
    setSaving(true);

    const { error } = await supabase.from("student_scores").insert({
      student_id: selectedStudent.id,
      target_id: "00000000-0000-0000-0000-000000000000", // Dummy ID for offline tasks
      target_type: "offline",
      task_name: taskName,
      score: score,
      is_graded: true,
      graded_at: new Date().toISOString()
    });

    if (error) alert(error.message);
    else {
      alert(`Score for ${selectedStudent.full_name} saved successfully!`);
      setTaskName("");
      setScore(0);
      setSelectedStudent(null);
    }
    setSaving(false);
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Offline Assessment Grading</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manually input grades for physical projects, presentations, or offline exams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto text-[var(--accent)]" /></div>
            ) : filteredStudents.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedStudent?.id === s.id ? "bg-[var(--accent)] text-white" : "hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                }`}
              >
                <span className="text-sm font-medium">{s.full_name}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2">
          {selectedStudent ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Card>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
                    <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Grading Student</p>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedStudent.full_name}</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Task / Project Name</label>
                    <input 
                      type="text" 
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="e.g. Science Fair Presentation"
                      className="w-full h-12 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <label className="block text-sm font-medium text-[var(--text-primary)]">Score (0 - 100)</label>
                       <span className="text-2xl font-black text-[var(--accent)]">{score}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={score}
                      onChange={e => setScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                    />
                    <div className="flex justify-between mt-2">
                       <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Needs Work</span>
                       <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Perfect</span>
                    </div>
                  </div>

                  <Button className="w-full h-12" onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>
                    Confirm & Save Grade
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed">
              <Award className="h-12 w-12 text-[var(--text-tertiary)] mb-4 opacity-20" />
              <p className="text-[var(--text-secondary)]">Select a student from the left to start grading</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
