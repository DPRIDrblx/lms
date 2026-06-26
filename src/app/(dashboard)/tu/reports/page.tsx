"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Printer, 
  Search, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Filter,
  Download
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function TUReportGenerationPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    const { data: cls } = await supabase.from("classes").select("*, profiles:homeroom_teacher_id(full_name)");
    if (cls) setClasses(cls);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchStudents = async (cls: any) => {
    setSelectedClass(cls);
    setLoading(true);
    const { data: stds } = await supabase
      .from("profiles")
      .select("*, report_cards(*)")
      .eq("class_id", cls.id)
      .eq("role", "student")
      .order("full_name");
    
    if (stds) setStudents(stds);
    setLoading(false);
  };

  const publishAll = async () => {
    if (!selectedClass) return;
    const { error } = await supabase
      .from("report_cards")
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq("class_id", selectedClass.id);
    
    if (error) toast.error(error.message);
    else {
       toast.success(`Successfully published all reports for Class ${selectedClass.name}`);
       fetchStudents(selectedClass);
    }
  };

  const filteredStudents = students.filter((s: any) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  if (loading && classes.length === 0) return <div className="p-20 text-center animate-pulse">Synchronizing Academic Archives...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">Academic Report Archives</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Official certificate and transcript generation hub for Nusantara Academy.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="secondary" icon={<Filter className="h-4 w-4" />}>Academic Year</Button>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Export Batch</Button>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Class Selection Sidebar */}
         <aside className="space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border)]">
               <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest mb-4">Select Classroom</p>
               <div className="space-y-2">
                  {classes.map(cls => (
                     <button
                       key={cls.id}
                       onClick={() => fetchStudents(cls)}
                       className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedClass?.id === cls.id ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "hover:bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                     >
                        <span className="text-sm font-bold">{cls.name}</span>
                        <ChevronRight className={`h-4 w-4 ${selectedClass?.id === cls.id ? "opacity-100" : "opacity-0"}`} />
                     </button>
                  ))}
               </div>
            </div>
         </aside>

         {/* Student List & Actions */}
         <div className="lg:col-span-3 space-y-6">
            {selectedClass ? (
               <Card padding="none" className="overflow-hidden border-none shadow-2xl">
                  <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shadow-sm">
                           <Users className="h-6 w-6" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-[var(--text-primary)]">{selectedClass.name} — Register</h3>
                           <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Homeroom: {selectedClass.profiles?.full_name}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                           <input 
                             placeholder="Filter students..." 
                             value={search}
                             onChange={e => setSearch(e.target.value)}
                             className="h-10 pl-10 pr-4 rounded-xl bg-[var(--bg-secondary)] border-none text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]/20" 
                           />
                        </div>
                        <Button className="h-10 bg-emerald-600 hover:bg-emerald-700" onClick={publishAll} icon={<CheckCircle2 className="h-4 w-4" />}>Publish All</Button>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border-b border-[var(--border)] bg-[var(--bg-secondary)]/30">
                              <th className="px-6 py-4">Student Name</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Last Published</th>
                              <th className="px-6 py-4 text-right">Certificate Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                           {filteredStudents.map(student => {
                              const rapot = student.report_cards?.[0];
                              return (
                                 <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors group">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                             {student.full_name[0]}
                                          </div>
                                          <span className="text-sm font-bold text-slate-900">{student.full_name}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <Badge variant={rapot?.is_published ? "success" : "warning"} className="font-bold">
                                          {rapot?.is_published ? "Ready to View" : "Awaiting Input"}
                                       </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-[var(--text-secondary)] font-medium">
                                       {rapot?.published_at ? new Date(rapot.published_at).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100" icon={<Printer className="h-4 w-4" />} />
                                          <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:bg-[var(--accent-light)]">
                                             View Transcript
                                          </Button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </Card>
            ) : (
               <div className="h-[60vh] flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-secondary)]/30 rounded-3xl border-2 border-dashed border-[var(--border)]">
                  <FileText className="h-16 w-16 text-[var(--text-tertiary)] opacity-20 mb-6" />
                  <h3 className="text-xl font-black text-[var(--text-primary)]">No Class Selected</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-xs mx-auto">
                     Select a classroom from the left directory to begin generating academic reports.
                  </p>
               </div>
            )}
         </div>
      </div>

      <div className="flex items-center gap-3 p-6 rounded-3xl bg-blue-50 border border-blue-100 text-blue-700">
         <AlertCircle className="h-6 w-6 shrink-0" />
         <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
            Legal Disclaimer: Report cards must be verified by the Homeroom Teacher before Batch Publishing is authorized.
         </p>
      </div>
    </div>
  );
}
