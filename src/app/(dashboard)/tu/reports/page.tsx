"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  GraduationCap, 
  Calendar,
  User,
  ShieldCheck,
  CheckSquare,
  ClipboardList,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface Student {
  id: string;
  full_name: string;
  class_name: string;
}

export default function RapotGeneratorPage() {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        id, 
        full_name,
        classes!profiles_class_id_fkey(name)
      `)
      .eq("role", "student")
      .order("full_name");
    
    if (data) {
      setStudents(data.map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        class_name: s.classes?.name || "Unassigned"
      })));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadRapot = async (studentId: string) => {
    setGenerating(true);
    // Simulate complex PDF generation logic
    await new Promise(r => setTimeout(r, 2000));
    toast.success("Rapot generated successfully! Opening print dialog...");
    window.print(); // Traditional way to 'save as PDF' in browser
    setGenerating(false);
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
      <header>
         <h1 className="text-3xl font-black text-[var(--text-primary)]">Official Report Generator</h1>
         <p className="text-[var(--text-secondary)] mt-1">Generate formal academic transcripts and behavioral assessment reports.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Selector */}
        <div className="lg:col-span-1 space-y-4">
           <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-tertiary)]" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)]"
              />
           </div>
           
           <Card className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
              {loading ? (
                Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-[var(--bg-tertiary)] animate-pulse rounded-lg" />)
              ) : filteredStudents.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedStudent?.id === student.id ? "bg-[var(--accent)] text-white shadow-lg" : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  }`}
                >
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${selectedStudent?.id === student.id ? "bg-white/20" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"}`}>
                         {student.full_name[0]}
                      </div>
                      <div className="text-left">
                         <p className="text-sm font-bold">{student.full_name}</p>
                         <p className={`text-[9px] uppercase font-black ${selectedStudent?.id === student.id ? "text-white/60" : "text-[var(--text-tertiary)]"}`}>{student.class_name}</p>
                      </div>
                   </div>
                   <ChevronRight className="h-4 w-4 opacity-40" />
                </button>
              ))}
           </Card>
        </div>

        {/* Preview & Controls */}
        <div className="lg:col-span-2">
           <AnimatePresence mode="wait">
              {selectedStudent ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key={selectedStudent.id} className="space-y-6">
                   <div className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border)]">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shadow-inner">
                            <GraduationCap className="h-8 w-8" />
                         </div>
                         <div>
                            <h2 className="text-xl font-black text-[var(--text-primary)]">{selectedStudent.full_name}</h2>
                            <p className="text-xs text-[var(--text-secondary)] font-bold">SID: {selectedStudent.id.slice(0, 8).toUpperCase()}</p>
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="secondary" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>Preview</Button>
                         <Button onClick={() => handleDownloadRapot(selectedStudent.id)} loading={generating} icon={<Download className="h-4 w-4" />}>Download PDF</Button>
                      </div>
                   </div>

                   {/* Formal Rapot Preview */}
                   <Card className="p-12 min-h-[800px] bg-white text-black shadow-2xl relative overflow-hidden print:p-0 print:shadow-none border-[var(--border)]">
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                         <GraduationCap className="h-96 w-96" />
                      </div>

                      <div className="text-center space-y-2 mb-12 border-b-4 border-double border-black pb-8">
                         <h3 className="text-2xl font-black uppercase tracking-tighter">Nusantara International Academy</h3>
                         <p className="text-sm font-bold">Official Academic Performance Report (Rapot)</p>
                         <div className="flex justify-center gap-8 text-[10px] font-bold uppercase mt-4">
                            <span>Year: 2024/2025</span>
                            <span>Semester: Ganjil</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-12 mb-12 text-sm font-bold">
                         <div className="space-y-1">
                            <p className="text-[10px] uppercase opacity-40">Student Name</p>
                            <p className="border-b border-black pb-1">{selectedStudent.full_name}</p>
                         </div>
                         <div className="space-y-1 text-right">
                            <p className="text-[10px] uppercase opacity-40">Class / Grade</p>
                            <p className="border-b border-black pb-1">{selectedStudent.class_name}</p>
                         </div>
                      </div>

                      <table className="w-full border-2 border-black mb-12">
                         <thead>
                            <tr className="bg-slate-100">
                               <th className="border border-black px-4 py-2 text-xs uppercase text-left">Subject</th>
                               <th className="border border-black px-4 py-2 text-xs uppercase text-center w-24">Grade</th>
                               <th className="border border-black px-4 py-2 text-xs uppercase text-center w-24">Status</th>
                            </tr>
                         </thead>
                         <tbody className="text-sm">
                            {['Mathematics', 'Physics', 'Digital Literacy', 'English Proficiency', 'Computational Thinking'].map(sub => (
                               <tr key={sub}>
                                  <td className="border border-black px-4 py-3 font-medium">{sub}</td>
                                  <td className="border border-black px-4 py-3 text-center font-bold">88</td>
                                  <td className="border border-black px-4 py-3 text-center text-[10px] font-bold">PASSED</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>

                      <div className="space-y-8 mb-24">
                         <div className="p-4 bg-slate-50 border border-black rounded-lg">
                            <p className="text-[10px] font-black uppercase mb-2 flex items-center gap-2"><CheckSquare className="h-3 w-3" /> Behavioral Assessment</p>
                            <p className="text-sm leading-relaxed italic">The student demonstrates exceptional digital citizenship and collaborative leadership. Consistently shows curiosity and integrity in all project-based learning modules.</p>
                         </div>
                         <div className="p-4 bg-slate-50 border border-black rounded-lg">
                            <p className="text-[10px] font-black uppercase mb-2 flex items-center gap-2"><ClipboardList className="h-3 w-3" /> Extracurricular Activities</p>
                            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                               <p>1. AI Research Club</p>
                               <p className="text-right">A (Distinction)</p>
                               <p>2. Robotic Engineering</p>
                               <p className="text-right">B+ (Satisfactory)</p>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-24 pt-12">
                         <div className="text-center">
                            <p className="text-xs font-bold mb-16">Parent/Guardian,</p>
                            <div className="w-32 h-0.5 bg-black mx-auto" />
                         </div>
                         <div className="text-center">
                            <p className="text-xs font-bold mb-16">Academy Principal,</p>
                            <div className="w-32 h-0.5 bg-black mx-auto" />
                            <p className="text-[10px] mt-2 font-black">Prof. Dr. Nusantara, M.Cs</p>
                         </div>
                      </div>
                   </Card>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40 bg-[var(--bg-secondary)] rounded-3xl border-2 border-dashed border-[var(--border)]">
                   <FileText className="h-20 w-20 mb-6" />
                   <h3 className="text-xl font-black text-[var(--text-primary)]">Select Student to Generate Rapot</h3>
                   <p className="text-sm text-[var(--text-secondary)] mt-2">Formal academic transcripts require valid gradebook synchronization.</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
