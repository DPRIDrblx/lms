"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  Activity,
  MessageSquare,
  Clock,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

function RapotInputContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();
  
  const studentId = searchParams.get("student");
  
  const [student, setStudent] = useState<any>(null);
  const [rapot, setRapot] = useState<any>({
    semester: "Semester 2",
    academic_year: "2025/2026",
    attendance_sick: 0,
    attendance_excused: 0,
    attendance_unexcused: 0,
    homeroom_notes: "",
    attitude_spiritual: "",
    attitude_social: ""
  });
  const [extracurriculars, setExtracurriculars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    
    setLoading(true);
    const [stdRes, rapotRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", studentId).single(),
      supabase.from("report_cards").select("*, report_card_extracurriculars(*)").eq("student_id", studentId).single()
    ]);
    
    if (stdRes.data) setStudent(stdRes.data);
    if (rapotRes.data) {
       const { report_card_extracurriculars, ...mainData } = rapotRes.data;
       setRapot(mainData);
       setExtracurriculars(report_card_extracurriculars || []);
    }
    setLoading(false);
  }, [studentId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!studentId || !profile) return;
    setSaving(true);
    
    // 1. Get class ID for student
    const { data: std } = await supabase.from("profiles").select("class_id").eq("id", studentId).single();
    
    // 2. Upsert Rapot
    const { data: savedRapot, error: rapotError } = await supabase.from("report_cards").upsert({
      ...rapot,
      student_id: studentId,
      class_id: std?.class_id,
    }, { onConflict: 'student_id,semester,academic_year' }).select().single();
    
    if (rapotError) {
      toast.error(rapotError.message);
      setSaving(false);
      return;
    }

    // 3. Sync Extracurriculars
    await supabase.from("report_card_extracurriculars").delete().eq("report_card_id", savedRapot.id);
    const { error: ekskulError } = await supabase.from("report_card_extracurriculars").insert(
      extracurriculars.map(e => ({ ...e, report_card_id: savedRapot.id, id: undefined }))
    );

    if (ekskulError) toast.error(ekskulError.message);
    else toast.success("Academic report synchronized successfully!");
    
    setSaving(false);
  };

  const addEkskul = () => {
    setExtracurriculars([...extracurriculars, { activity_name: "", predicate: "B", description: "" }]);
  };

  const removeEkskul = (index: number) => {
    setExtracurriculars(extracurriculars.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Retrieving Student Academic History...</div>;

  if (!studentId) {
    return (
      <div className="text-center py-20">
         <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
         <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Please select a student from the dashboard first.</p>
         <Button variant="ghost" className="mt-4" onClick={() => router.push("/teacher/homeroom")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 transition-all">
               <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
               <h1 className="text-2xl font-black text-slate-900">Official Report Entry</h1>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">{student?.full_name}</span>
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-xs font-bold text-[var(--accent)] uppercase">{rapot.semester}</span>
               </div>
            </div>
         </div>
         <Button onClick={handleSave} loading={saving} size="lg" className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-[var(--accent)]/20" icon={<Save className="h-5 w-5" />}>
            Finalize Data
         </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* 1. Attendance Section */}
            <Card className="p-8 border-none shadow-xl bg-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="h-24 w-24" /></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8 border-b-2 border-slate-50 pb-4">Attendance Summary</h3>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Sakit (Sick)</label>
                     <input 
                       type="number" 
                       value={rapot.attendance_sick} 
                       onChange={e => setRapot({...rapot, attendance_sick: parseInt(e.target.value) || 0})}
                       className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg focus:border-[var(--accent)] outline-none transition-all"
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Izin (Excused)</label>
                     <input 
                       type="number" 
                       value={rapot.attendance_excused} 
                       onChange={e => setRapot({...rapot, attendance_excused: parseInt(e.target.value) || 0})}
                       className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg focus:border-[var(--accent)] outline-none transition-all"
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Alfa (Unexcused)</label>
                     <input 
                       type="number" 
                       value={rapot.attendance_unexcused} 
                       onChange={e => setRapot({...rapot, attendance_unexcused: parseInt(e.target.value) || 0})}
                       className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-lg focus:border-[var(--accent)] outline-none transition-all"
                     />
                  </div>
               </div>
            </Card>

            {/* 2. Attitude & Spiritual */}
            <Card className="p-8 border-none shadow-xl bg-white">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8 border-b-2 border-slate-50 pb-4">Behavioral Assessments</h3>
               <div className="space-y-6">
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Spiritual Attitude</label>
                     <textarea 
                       rows={4}
                       value={rapot.attitude_spiritual} 
                       onChange={e => setRapot({...rapot, attitude_spiritual: e.target.value})}
                       placeholder="Describe the student's spiritual growth..."
                       className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-medium text-sm focus:border-[var(--accent)] outline-none transition-all resize-none"
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Social Attitude</label>
                     <textarea 
                       rows={4}
                       value={rapot.attitude_social} 
                       onChange={e => setRapot({...rapot, attitude_social: e.target.value})}
                       placeholder="Describe the student's social interactions..."
                       className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-medium text-sm focus:border-[var(--accent)] outline-none transition-all resize-none"
                     />
                  </div>
               </div>
            </Card>

            {/* 3. Extracurriculars */}
            <Card className="p-8 border-none shadow-xl bg-white">
               <div className="flex items-center justify-between mb-8 border-b-2 border-slate-50 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Extracurricular Activities</h3>
                  <Button variant="ghost" size="sm" onClick={addEkskul} icon={<Plus className="h-4 w-4" />}>Add Entry</Button>
               </div>
               <div className="space-y-4">
                  <AnimatePresence>
                     {extracurriculars.map((e, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 relative group">
                           <button onClick={() => removeEkskul(idx)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="h-4 w-4" />
                           </button>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Activity Name</label>
                                 <input 
                                   value={e.activity_name} 
                                   onChange={(val: any) => {
                                      const next = [...extracurriculars];
                                      next[idx].activity_name = val.target.value;
                                      setExtracurriculars(next);
                                   }}
                                   placeholder="e.g. Scouts, Basketball"
                                   className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Predicate</label>
                                 <select 
                                   value={e.predicate}
                                   onChange={(val: any) => {
                                      const next = [...extracurriculars];
                                      next[idx].predicate = val.target.value;
                                      setExtracurriculars(next);
                                   }}
                                   className="w-full h-11 px-4 rounded-xl bg-white border border-slate-200 font-bold text-sm outline-none"
                                 >
                                    <option value="A">A (Excellent)</option>
                                    <option value="B">B (Good)</option>
                                    <option value="C">C (Fair)</option>
                                    <option value="D">D (Poor)</option>
                                 </select>
                              </div>
                           </div>
                           <textarea 
                             value={e.description}
                             onChange={(val: any) => {
                                const next = [...extracurriculars];
                                next[idx].description = val.target.value;
                                setExtracurriculars(next);
                             }}
                             placeholder="Briefly describe achievement..."
                             className="w-full p-4 rounded-xl bg-white border border-slate-200 font-medium text-xs outline-none resize-none"
                           />
                        </motion.div>
                     ))}
                  </AnimatePresence>
                  {extracurriculars.length === 0 && (
                     <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No extracurricular entries recorded.</p>
                     </div>
                  )}
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl">
               <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-[var(--accent)]" /> Student Context
               </h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl">
                        {student?.full_name[0]}
                     </div>
                     <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{student?.full_name}</p>
                        <p className="text-[10px] opacity-60 uppercase font-black">ID: {student?.id.slice(0,8)}</p>
                     </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                     <p className="text-[10px] font-black text-white/40 uppercase mb-2">Wali Kelas</p>
                     <p className="text-sm font-bold">{profile?.full_name}</p>
                  </div>
               </div>
            </Card>

            <Card className="p-6 border-none shadow-xl bg-white">
               <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500" /> General Notes
               </h4>
               <textarea 
                 rows={10}
                 value={rapot.homeroom_notes} 
                 onChange={e => setRapot({...rapot, homeroom_notes: e.target.value})}
                 placeholder="Important development notes for the parents..."
                 className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-medium text-xs focus:border-[var(--accent)] outline-none transition-all resize-none shadow-inner"
               />
               <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-[9px] font-bold uppercase leading-relaxed">These notes will be printed on the official academic transcript.</p>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

export default function RapotEntryPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse">Loading Secure Rapot Module...</div>}>
      <RapotInputContent />
    </Suspense>
  );
}
