"use client";

import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  UserPlus, 
  Building2, 
  GraduationCap, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  X,
  MoreVertical,
  Link2
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function TUClassroomManager() {
  const supabase = createClient();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [cls, tchr, stds] = await Promise.all([
      supabase.from("classes").select(`*, wali_kelas:profiles!wali_kelas_id(full_name)`).order("name"),
      supabase.from("profiles").select("*").eq("role", "teacher"),
      supabase.from("profiles").select("*").eq("role", "student").is("class_id", null)
    ]);
    
    setClasses(cls.data || []);
    setTeachers(tchr.data || []);
    setUnassignedStudents(stds.data || []);
    setLoading(false);
  };

  useEffect(() => {
    // Real-time listener for profile changes (assignments)
    const channel = supabase
      .channel('tu-roster-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload: any) => {
        if (payload.new.role === 'student') {
          fetchData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const handleAssignWaliKelas = async (classId: string, teacherId: string) => {
    const toastId = toast.loading("Assigning Wali Kelas...");
    const { error } = await supabase
      .from("classes")
      .update({ wali_kelas_id: teacherId })
      .eq("id", classId);
    
    if (error) {
      toast.error(`Assignment failed: ${error.message}`, { id: toastId });
      return;
    }

    // Also update the teacher's class_id for consistency
    await supabase.from("profiles").update({ class_id: classId }).eq("id", teacherId);
    toast.success("Wali Kelas assigned successfully!", { id: toastId });
    fetchData();
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClass) {
      toast.error("Please select a target class first!");
      return;
    }

    // Optimistic UI Update
    const studentToAssign = unassignedStudents.find(s => s.id === studentId);
    if (!studentToAssign) return;

    setUnassignedStudents(prev => prev.filter(s => s.id !== studentId));
    const toastId = toast.loading(`Assigning ${studentToAssign.full_name}...`);

    const { error } = await supabase
      .from("profiles")
      .update({ class_id: selectedClass.id })
      .eq("id", studentId);
    
    if (error) {
      toast.error(`Database Error: ${error.message} (Code: ${error.code})`, { id: toastId });
      // Rollback optimistic update
      setUnassignedStudents(prev => [...prev, studentToAssign]);
    } else {
      toast.success(`${studentToAssign.full_name} moved to Class ${selectedClass.name}`, { id: toastId });
      fetchData();
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    const toastId = toast.loading("Removing student from class...");
    const { error } = await supabase
      .from("profiles")
      .update({ class_id: null })
      .eq("id", studentId);
    
    if (error) {
      toast.error(`Removal failed: ${error.message}`, { id: toastId });
    } else {
      toast.success("Student unassigned.", { id: toastId });
      fetchData();
    }
  };

  if (loading) return <div className="p-12 text-center text-[var(--text-tertiary)]">Synchronizing Academy Roster...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Classroom Manager</h1>
          <p className="text-[var(--text-secondary)] mt-1">Assign students to classes and designate Home Room Teachers (Wali Kelas).</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="rounded-xl"><Building2 className="h-4 w-4 mr-2" /> Sync School Data</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-widest px-1">Active Classes</h3>
          <div className="space-y-3">
            {classes.map((cls) => (
              <Card 
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`p-5 cursor-pointer transition-all border-2 ${
                  selectedClass?.id === cls.id 
                    ? "border-[var(--accent)] bg-[var(--accent-light)] shadow-lg shadow-[var(--accent)]/10" 
                    : "border-transparent hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      selectedClass?.id === cls.id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                    }`}>
                      {cls.name}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Class {cls.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Users className="h-3 w-3 text-[var(--text-tertiary)]" />
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Academy Member</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 transition-transform ${selectedClass?.id === cls.id ? "translate-x-1 text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`} />
                </div>
                
                <div className="mt-4 pt-4 border-t border-[var(--border)]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">Wali Kelas:</span>
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-primary)] truncate max-w-[120px]">
                    {cls.wali_kelas?.full_name || "NOT ASSIGNED"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Class Detail / Student Assignment */}
        <div className="lg:col-span-2 space-y-6">
          {selectedClass ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedClass.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <Card className="p-8 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border-none shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-3xl bg-[var(--accent)] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-[var(--accent)]/30">
                        {selectedClass.name}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[var(--text-primary)]">Management: Class {selectedClass.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="info">Academic Year 2024/2025</Badge>
                          <Badge variant="success">Active Session</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase text-center md:text-right">Assign Wali Kelas</p>
                      <select 
                        value={selectedClass.wali_kelas_id || ""}
                        onChange={(e) => handleAssignWaliKelas(selectedClass.id, e.target.value)}
                        className="bg-white border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-[var(--accent)]"
                      >
                        <option value="">Select Teacher...</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </Card>

                {/* Unassigned Students Pool (Drawer-like) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-0 overflow-hidden border-2 border-dashed border-[var(--border)] bg-transparent">
                    <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-white/50">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-[var(--accent)]" /> Unassigned Students
                      </h4>
                      <Badge variant="default">{unassignedStudents.length}</Badge>
                    </div>
                    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                        <input 
                          type="text" 
                          placeholder="Search pool..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border-none text-[10px] focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </div>
                      {unassignedStudents.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map((student) => (
                        <div key={student.id} className="p-3 rounded-xl bg-white border border-[var(--border)] flex items-center justify-between group hover:border-[var(--accent)] transition-all">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[10px] font-bold">
                              {student.full_name?.[0]}
                            </div>
                            <span className="text-xs font-bold text-[var(--text-primary)]">{student.full_name}</span>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => handleAssignStudent(student.id)} className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-[var(--accent)]">
                            <Link2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Assigned Students */}
                  <Card className="p-0 overflow-hidden">
                    <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)]" /> Current Students
                      </h4>
                    </div>
                    <div className="p-4 space-y-2">
                      <ClassStudentsList classId={selectedClass.id} onRemove={handleRemoveStudent} />
                    </div>
                  </Card>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="h-24 w-24 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-6">
                <GraduationCap className="h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Select a class to manage</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto mt-2">
                Click on a class from the list on the left to start assigning students and Wali Kelas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassStudentsList({ classId, onRemove }: { classId: string; onRemove: (id: string) => void }) {
  const supabase = createClient();
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("class_id", classId).eq("role", "student");
      setStudents(data || []);
    };
    fetch();

    // Subscribe to changes
    const channel = supabase
      .channel(`class-${classId}-roster`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [classId]);

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <div key={student.id} className="p-3 rounded-xl bg-[var(--bg-secondary)]/50 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
              {student.full_name?.[0]}
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">{student.full_name}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => onRemove(student.id)} className="h-8 w-8 p-0 text-[var(--error)] opacity-0 group-hover:opacity-100">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {students.length === 0 && (
        <p className="text-[10px] text-center text-[var(--text-tertiary)] italic py-8">No students assigned to this class yet.</p>
      )}
    </div>
  );
}
