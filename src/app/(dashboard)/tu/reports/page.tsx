"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  Download, 
  Printer, 
  Users,
  GraduationCap,
  Trophy,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  full_name: string;
  xp: number;
  rank: string;
}

interface Score {
  id: string;
  score: number;
  target_type: string;
  task_name?: string;
  created_at: string;
}

export default function ReportGeneratorPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState("");
  const [fetchingScores, setFetchingScores] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, xp, rank")
        .eq("role", "student")
        .order("full_name");
      if (data) setStudents(data as Student[]);
      setLoading(false);
    };
    fetchStudents();
  }, [supabase]);

  const fetchStudentScores = async (studentId: string) => {
    setFetchingScores(true);
    const { data } = await supabase
      .from("student_scores")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    if (data) setScores(data as Score[]);
    setFetchingScores(false);
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searching.toLowerCase())
  );

  const calculateGPA = () => {
    if (scores.length === 0) return 0;
    const total = scores.reduce((acc: number, s: any) => acc + (s.score || 0), 0);
    return Math.round(total / scores.length);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Report Card Generator</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Generate and print digital student reports based on academic performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searching}
              onChange={e => setSearching(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none text-sm"
            />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--text-tertiary)] animate-pulse">Loading students...</div>
            ) : filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  fetchStudentScores(student.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedStudent?.id === student.id 
                    ? "bg-[var(--accent)] text-white" 
                    : "hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                }`}
              >
                <span className="text-sm font-medium">{student.full_name}</span>
                <ChevronRight className={`h-4 w-4 ${selectedStudent?.id === student.id ? "text-white" : "text-[var(--text-tertiary)]"}`} />
              </button>
            ))}
          </div>
        </Card>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-t-4 border-t-[var(--accent)]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--accent)]">
                        <GraduationCap className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedStudent.full_name}</h2>
                        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold mt-1">Student Academic Record</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Average Score</p>
                      <p className="text-3xl font-black text-[var(--accent)]">{calculateGPA()}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-1">Total Assessments</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{scores.length}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase mb-1">Gamified Rank</p>
                      <p className="text-lg font-bold text-[var(--accent)]">{selectedStudent.rank}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">Detailed Results</h3>
                    {fetchingScores ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                    ) : scores.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] text-[var(--text-tertiary)] uppercase border-b border-[var(--border)]">
                            <th className="pb-2">Assessment / Task</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2 text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {scores.map(s => (
                            <tr key={s.id} className="text-sm">
                              <td className="py-3 font-medium text-[var(--text-primary)]">{s.task_name || `Exam #${s.id.slice(0, 4)}`}</td>
                              <td className="py-3 capitalize text-[var(--text-secondary)]">{s.target_type}</td>
                              <td className="py-3 text-right font-bold text-[var(--accent)]">{s.score}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                        <Trophy className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-[var(--text-tertiary)]">No scores recorded for this student.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 flex gap-3">
                    <Button variant="secondary" className="flex-1" icon={<Printer className="h-4 w-4" />}>Print Report</Button>
                    <Button className="flex-1" icon={<Download className="h-4 w-4" />}>Download PDF</Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed">
                <Users className="h-12 w-12 text-[var(--text-tertiary)] mb-4 opacity-20" />
                <p className="text-[var(--text-secondary)]">Select a student from the sidebar to generate report</p>
              </Card>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" height="16" 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
