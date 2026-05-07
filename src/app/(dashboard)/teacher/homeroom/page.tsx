"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Trophy, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function HomeroomTeacherDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [managedClass, setManagedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClassData = useCallback(async () => {
    if (!profile) return;
    
    // 1. Get class where teacher is homeroom
    const { data: cls } = await supabase.from("classes").select("*").eq("homeroom_teacher_id", profile.id).single();
    
    if (cls) {
      setManagedClass(cls);
      // 2. Get students in this class
      const { data: stds } = await supabase.from("profiles").select("*").eq("class_id", cls.id).order("full_name");
      if (stds) setStudents(stds);
    }
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  if (loading) return <div className="p-20 text-center animate-pulse">Initializing Homeroom Authority...</div>;

  if (!managedClass) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-12">
         <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-slate-300" />
         </div>
         <h2 className="text-xl font-black text-slate-900">No Homeroom Assigned</h2>
         <p className="text-sm text-slate-500 mt-2 max-w-sm">
            You are currently not assigned as a Homeroom Teacher (Wali Kelas) for any class. Please contact the TU Administrator.
         </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <div className="flex items-center gap-2 mb-1">
               <Badge className="bg-[var(--accent)] text-white border-none uppercase text-[10px] font-black">Homeroom Authority</Badge>
            </div>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">Class {managedClass.name} Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Unified management portal for student performance and official report cards.</p>
         </div>
         <div className="flex gap-2">
            <Link href="/teacher/homeroom/rapot">
               <Button className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-[var(--accent)]/20" icon={<FileText className="h-4 w-4" />}>
                  Manage Report Cards
               </Button>
            </Link>
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-8 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10"><Users className="h-32 w-32" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Students</p>
            <h2 className="text-3xl font-black">{students.length} Pupils</h2>
         </Card>
         <Card className="p-8 bg-white border-[var(--border)] relative overflow-hidden">
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Academic Standing</p>
            <h2 className="text-3xl font-black text-[var(--text-primary)]">High</h2>
            <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
               <Trophy className="h-3 w-3" /> Top 3 across academy
            </div>
         </Card>
         <Card className="p-8 bg-white border-[var(--border)] relative overflow-hidden">
            <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Rapot Readiness</p>
            <h2 className="text-3xl font-black text-[var(--text-primary)]">85%</h2>
            <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
               <AlertCircle className="h-3 w-3" /> 4 students pending notes
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden border-[var(--border)] shadow-xl">
               <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Class Register</h3>
                  <Badge variant="info">Academic Year 2025/2026</Badge>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest border-b border-[var(--border)]">
                           <th className="px-6 py-4">Student Name</th>
                           <th className="px-6 py-4">Avg. Score</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[var(--border)]">
                        {students.map((student: any) => (
                           <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
                                       {student.full_name[0]}
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{student.full_name}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="text-sm font-black text-slate-700">88.5</span>
                              </td>
                              <td className="px-6 py-4">
                                 <Badge variant="success" className="font-bold">Active</Badge>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <Link href={`/teacher/homeroom/rapot?student=${student.id}`}>
                                    <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />}>Input Data</Button>
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="p-6 border-none bg-slate-900 text-white shadow-2xl">
               <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[var(--accent)]" /> Quick Analytics
               </h4>
               <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Class Median</p>
                     <p className="text-2xl font-black">84.2%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Attendance Rate</p>
                     <p className="text-2xl font-black">98.1%</p>
                  </div>
               </div>
               <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-white/90 border-none">Download Class Recap</Button>
            </Card>

            <Card className="p-6 bg-amber-50 border border-amber-100">
               <h4 className="text-xs font-black uppercase text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Deadlines
               </h4>
               <p className="text-xs text-amber-700 leading-relaxed mb-4 font-medium">
                  Rapot finalization deadline is in **4 days**. 12/28 students still have missing attitude scores.
               </p>
               <Button variant="secondary" className="w-full bg-amber-100 text-amber-900 border-amber-200">Notify Parents</Button>
            </Card>
         </div>
      </div>
    </div>
  );
}
