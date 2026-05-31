"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText, Download, Users, RefreshCw, Save, Loader2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function MonthlyReportPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get("readonly") === "true";

  const [managedClass, setManagedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [historyMonths, setHistoryMonths] = useState<string[]>([]);
  const [globalPrincipalRemarks, setGlobalPrincipalRemarks] = useState("Terus tingkatkan prestasi belajar Anda di Mainan Middle International School.");
  
  // Data State
  const [reportsData, setReportsData] = useState<Record<string, any>>({});
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // default to current month
    const d = new Date();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    setSelectedMonth(`${months[d.getMonth()]} ${d.getFullYear()}`);
    
    const fetchData = async () => {
      const { data: cls } = await supabase.from("classes").select("*").eq("id", classId).single();
      if (cls) setManagedClass(cls);
      
      const { data: stds } = await supabase.from("profiles").select("*").eq("class_id", classId).order("full_name");
      if (stds) setStudents(stds);
      
      const { data: monthHistory } = await supabase
        .from("monthly_reports")
        .select("month_year")
        .eq("class_id", classId);
        
      if (monthHistory) {
        const uniqueMonths = Array.from(new Set(monthHistory.map((m: any) => m.month_year)));
        setHistoryMonths(uniqueMonths as string[]);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [classId, supabase]);

  useEffect(() => {
    if (selectedMonth && students.length > 0) {
      loadSavedReports();
    }
  }, [selectedMonth, students]);

  const loadSavedReports = async () => {
    const { data } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("class_id", classId)
      .eq("month_year", selectedMonth);
      
    if (data) {
      const map: any = {};
      data.forEach((r: any) => {
        map[r.student_id] = {
          id: r.id,
          grades_summary: r.grades_summary,
          attendance_summary: r.attendance_summary,
          homeroom_notes: r.homeroom_notes,
          is_published: r.is_published
        };
      });
      setReportsData(map); // Reset to only data from this month
    } else {
      setReportsData({});
    }
  };

  const handleSyncGrades = async () => {
    setSyncing(true);
    // Fetch all courses for this class
    const { data: courses } = await supabase.from("courses").select("id, title").eq("class_id", classId);
    
    // Fetch scores for all students in this class (final course scores from advanced gradebook)
    const { data: scores } = await supabase
      .from("student_scores")
      .select("student_id, score, target_id")
      .eq("target_type", "course")
      .in("student_id", students.map((s: any) => s.id));
      
    const newData = { ...reportsData };
    
    students.forEach((student: any) => {
      const stdScores = scores?.filter((s: any) => s.student_id === student.id) || [];
      const grades: any = {};
      
      courses?.forEach((course: any) => {
        const courseScore = stdScores.find((s: any) => s.target_id === course.id);
        if (courseScore) {
          grades[course.title] = courseScore.score;
        } else {
          grades[course.title] = 0;
        }
      });
      
      if (!newData[student.id]) {
        newData[student.id] = {
          grades_summary: grades,
          attendance_summary: { present: 0, sick: 0, excused: 0, unexcused: 0 },
          homeroom_notes: "",
          is_published: false
        };
      } else {
        newData[student.id].grades_summary = grades;
      }
    });
    
    setReportsData(newData);
    setSyncing(false);
    toast.success("Data Nilai berhasil ditarik!");
  };

  const handleSyncAttendance = async () => {
    setSyncing(true);
    const { data: attendance } = await supabase
      .from("attendance_logs")
      .select("student_id, session_id");
      
    const newData = { ...reportsData };
    
    students.forEach((student: any) => {
      const stdAtt = attendance?.filter((a: any) => a.student_id === student.id) || [];
      
      if (!newData[student.id]) {
        newData[student.id] = {
          grades_summary: {},
          attendance_summary: { present: stdAtt.length, sick: 0, excused: 0, unexcused: 0 },
          homeroom_notes: "",
          is_published: false
        };
      } else {
        newData[student.id].attendance_summary = {
          ...newData[student.id].attendance_summary,
          present: stdAtt.length
        };
      }
    });
    
    setReportsData(newData);
    setSyncing(false);
    toast.success("Data Presensi berhasil ditarik!");
  };

  const handleDataChange = (studentId: string, field: string, value: any) => {
    setReportsData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveReport = async (studentId: string, isPublish: boolean) => {
    setSaving(true);
    const data = reportsData[studentId];
    if (!data) return;
    
    const payload = {
      student_id: studentId,
      class_id: classId,
      month_year: selectedMonth,
      grades_summary: data.grades_summary || {},
      attendance_summary: data.attendance_summary || { sick: 0, excused: 0, unexcused: 0, present: 0 },
      homeroom_notes: data.homeroom_notes || "",
      principal_remarks: globalPrincipalRemarks,
      is_published: isPublish
    };
    
    const { data: savedReport, error } = await supabase.from("monthly_reports").upsert(payload, { onConflict: 'student_id,month_year' }).select().single();
    
    if (error) {
      toast.error("Gagal menyimpan laporan: " + error.message);
      setSaving(false);
      return;
    }
    
    if (savedReport) {
      setReportsData(prev => ({ ...prev, [studentId]: { ...prev[studentId], id: savedReport.id } }));
    }
    
    // update local state
    setReportsData(prev => ({ ...prev, [studentId]: { ...prev[studentId], is_published: isPublish } }));
    setSaving(false);
  };

  const deleteReport = async (studentId: string) => {
    const data = reportsData[studentId];
    if (!data?.id) return;
    
    if (!confirm("Yakin ingin menghapus laporan bulan ini? Laporan yang dihapus tidak bisa dikembalikan.")) return;
    
    const { error } = await supabase.from("monthly_reports").delete().eq("id", data.id);
    
    if (error) {
      toast.error("Gagal menghapus laporan: " + error.message);
    } else {
      toast.success("Laporan berhasil dihapus");
      setReportsData(prev => {
        const newData = { ...prev };
        delete newData[studentId];
        return newData;
      });
      // Update history months if needed by refetching data, but for now we just delete from UI
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Memuat Data Kelas...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/teacher/homeroom">
            <Button variant="ghost" className="mb-2 -ml-4" icon={<ChevronLeft className="h-4 w-4" />}>Back to Homeroom</Button>
          </Link>
          <h1 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[var(--accent)]" /> Laporan Hasil Belajar Bulanan
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Class {managedClass?.name} • Sinkronisasi nilai gradebook & presensi.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm bg-white font-bold text-center w-40"
            placeholder="e.g. Agustus 2026"
            list="history-months"
          />
          <datalist id="history-months">
            {historyMonths.map(m => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {!isReadOnly && (
            <>
              <Button onClick={handleSyncGrades} disabled={syncing} variant="secondary" icon={<RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />}>
                Tarik Nilai
              </Button>
              <Button onClick={handleSyncAttendance} disabled={syncing} variant="secondary" className="border border-[var(--accent)] text-[var(--accent)] bg-transparent hover:bg-slate-50" icon={<RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />}>
                Tarik Presensi
              </Button>
            </>
          )}
        </div>
      </header>

      <Card className="p-6 border-[var(--border)] shadow-sm bg-indigo-50/50">
        <h3 className="text-sm font-black uppercase text-indigo-900 mb-2">Sambutan Kepala Sekolah (Global)</h3>
        <p className="text-xs text-indigo-700 mb-4">Teks ini akan dicetak di semua Laporan Hasil Belajar Bulanan siswa di kelas ini.</p>
        <textarea 
          className="w-full min-h-[60px] p-3 text-sm border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          value={globalPrincipalRemarks}
          onChange={(e) => setGlobalPrincipalRemarks(e.target.value)}
          disabled={isReadOnly}
        />
      </Card>

      <div className="space-y-6">
        {students.map(student => {
          const sData = reportsData[student.id] || {};
          const grades = sData.grades_summary || {};
          const att = sData.attendance_summary || { present: 0, sick: 0, excused: 0, unexcused: 0 };
          
          return (
            <Card key={student.id} className="p-6 border-[var(--border)] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                    {student.full_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{student.full_name}</h3>
                    <Badge variant={sData.is_published ? "success" : "warning"} className="mt-1 text-[10px]">
                      {sData.is_published ? "Published to Parents" : "Draft"}
                    </Badge>
                  </div>
                </div>
                {!isReadOnly && (
                  <div className="flex gap-2">
                    {sData.id && (
                      <Button 
                        onClick={() => deleteReport(student.id)} 
                        disabled={saving} 
                        variant="danger"
                        size="sm"
                        className="text-white border-red-200"
                      >
                        Hapus
                      </Button>
                    )}
                    <Button 
                      onClick={() => saveReport(student.id, false)} 
                      disabled={saving} 
                      variant="ghost" 
                      size="sm" 
                      icon={<Save className="h-4 w-4" />}
                    >
                      Save Draft
                    </Button>
                    <Button 
                      onClick={() => saveReport(student.id, true)} 
                      disabled={saving || sData.is_published} 
                      size="sm" 
                      className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
                    >
                      {sData.is_published ? "Already Published" : "Publish Report"}
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--text-tertiary)] tracking-widest mb-3">Data Nilai Rata-rata (Tarik Otomatis)</h4>
                  {Object.keys(grades).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(grades).map(([course, score]: any) => (
                        <div key={course} className="flex justify-between items-center text-sm p-2 bg-slate-50 border border-slate-100 rounded">
                          <span className="font-medium text-slate-700">{course}</span>
                          <input 
                            type="number"
                            disabled={isReadOnly}
                            value={score}
                            onChange={(e) => handleDataChange(student.id, 'grades_summary', { ...grades, [course]: parseFloat(e.target.value) || 0 })}
                            className="w-16 bg-transparent text-right font-black text-slate-900 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded">Belum ada data nilai. Klik Tarik Data.</div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-[var(--text-tertiary)] tracking-widest mb-3">Rekap Kehadiran</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2 bg-emerald-50 rounded text-center border border-emerald-100">
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase">Hadir</span>
                        <span className="block font-black text-emerald-900 mt-1">{att.present || 0}</span>
                      </div>
                      <div className="p-2 bg-amber-50 rounded text-center border border-amber-100">
                        <span className="block text-[10px] text-amber-600 font-bold uppercase">Sakit</span>
                        <input type="number" disabled={isReadOnly} value={att.sick || 0} onChange={e => setReportsData({...reportsData, [student.id]: {...sData, attendance_summary: {...att, sick: parseInt(e.target.value)||0}}})} className="w-full text-center bg-transparent mt-1 font-black focus:outline-none disabled:opacity-50" />
                      </div>
                      <div className="p-2 bg-blue-50 rounded text-center border border-blue-100">
                        <span className="block text-[10px] text-blue-600 font-bold uppercase">Izin</span>
                        <input type="number" disabled={isReadOnly} value={att.excused || 0} onChange={e => setReportsData({...reportsData, [student.id]: {...sData, attendance_summary: {...att, excused: parseInt(e.target.value)||0}}})} className="w-full text-center bg-transparent mt-1 font-black focus:outline-none disabled:opacity-50" />
                      </div>
                      <div className="p-2 bg-red-50 rounded text-center border border-red-100">
                        <span className="block text-[10px] text-red-600 font-bold uppercase">Alpa</span>
                        <input type="number" disabled={isReadOnly} value={att.unexcused || 0} onChange={e => setReportsData({...reportsData, [student.id]: {...sData, attendance_summary: {...att, unexcused: parseInt(e.target.value)||0}}})} className="w-full text-center bg-transparent mt-1 font-black focus:outline-none disabled:opacity-50" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-black uppercase text-[var(--text-tertiary)] tracking-widest mb-3">Catatan Wali Kelas</h4>
                    <textarea 
                      className="w-full min-h-[80px] p-3 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                      placeholder="Masukkan nasihat/catatan wali kelas untuk bulan ini..."
                      value={sData.homeroom_notes || ""}
                      onChange={(e) => setReportsData({...reportsData, [student.id]: {...sData, homeroom_notes: e.target.value}})}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
