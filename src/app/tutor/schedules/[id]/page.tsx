"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TUTORING_TOPICS, EducationLevel, Subject, Topic } from "@/lib/tutoring-topics";
import { 
  ArrowLeft, Clock, Users, BookOpen, Save, CheckCircle2, 
  Camera, FileText, Loader2, KeyRound, Sparkles 
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

export default function LessonWorkspacePage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [schedule, setSchedule] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lesson Plan States
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [learningObjectives, setLearningObjectives] = useState<string>("");
  const [learningMethods, setLearningMethods] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>(""); // for Lainnya
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Summary & Photos States
  const [meetingSummary, setMeetingSummary] = useState("");
  const [photoStartUrl, setPhotoStartUrl] = useState("");
  const [photoEndUrl, setPhotoEndUrl] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: sched } = await supabase
      .from("center_schedules")
      .select("*, classes(name)")
      .eq("id", id)
      .single();

    if (sched) {
      setSchedule(sched);
      setSelectedTopic(sched.topic || "");
      if (sched.subtopic) {
        setSelectedSubtopics(sched.subtopic.split(", "));
      } else {
        setSelectedSubtopics([]);
      }
      setLearningObjectives(sched.learning_objectives || "");
      setLearningMethods(sched.learning_methods || "");
      setMeetingSummary(sched.meeting_summary || "");
      setPhotoStartUrl(sched.photo_start_url || "");
      setPhotoEndUrl(sched.photo_end_url || "");

      if (sched.class_id) {
        const { data: stds } = await supabase
          .from("profiles")
          .select("id, full_name, nis")
          .eq("class_id", sched.class_id)
          .eq("role", "student")
          .order("full_name");
        
        if (stds) {
          setStudents(stds);
          
          // Fetch existing attendances
          const { data: attData } = await supabase
            .from("center_schedule_attendances")
            .select("student_id, status")
            .eq("schedule_id", sched.id);
            
          if (attData) {
            const attMap: Record<string, string> = {};
            attData.forEach((a: any) => { attMap[a.student_id] = a.status; });
            // For students without attendance record yet, default to 'hadir'
            stds.forEach((s: any) => {
              if (!attMap[s.id]) attMap[s.id] = 'hadir';
            });
            setAttendances(attMap);
          }
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendances(prev => ({ ...prev, [studentId]: status }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload by creating an object URL (In production, upload to Supabase Storage)
      const url = URL.createObjectURL(file);
      if (type === 'start') setPhotoStartUrl(url);
      else setPhotoEndUrl(url);
    }
  };

  const generateAiPdf = async () => {
    if (!selectedLevel || !selectedSubject || (!selectedTopic && !schedule.topic)) {
      toast.error("Pilih jenjang, mapel, dan topik terlebih dahulu.");
      return;
    }
    
    setIsGeneratingAi(true);
    const toastId = toast.loading("AI sedang menyusun dan membuat PDF...");

    try {
      const res = await fetch("/api/ai/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang: selectedLevel,
          mapel: selectedSubject,
          topik: selectedTopic || schedule.topic,
          subtopik: selectedSubtopics.length > 0 ? selectedSubtopics : (schedule.subtopic || ''),
          materiLainnya: customTopic,
          tujuanPembelajaran: learningObjectives,
          metodePembelajaran: learningMethods
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Generate PDF
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Header Background
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, pageWidth, 40, "F");

      // Header Text - Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("MODUL PEMBELAJARAN (AI)", 15, 25);
      
      // Header Text - Logo/Brand
      doc.setFontSize(14);
      doc.setFont("helvetica", "italic");
      doc.text("NIA Tutoring AKSES", pageWidth - 15, 25, { align: "right" });

      // Reset Text Color for body
      doc.setTextColor(50, 50, 50);

      // Metadata Section
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informasi Kelas", 15, 55);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Kelas / Jenjang : ${schedule.classes?.name || 'Umum'} / ${selectedLevel}`, 15, 63);
      doc.text(`Mata Pelajaran  : ${selectedSubject}`, 15, 70);
      doc.text(`Topik Pokok     : ${selectedTopic === 'Lainnya' ? customTopic : selectedTopic}`, 15, 77);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 83, pageWidth - 15, 83); // divider

      let cursorY = 95;

      const addSection = (title: string, content: string) => {
        if (cursorY > 260) { doc.addPage(); cursorY = 25; }
        
        // Section Title with background highlight
        doc.setFillColor(240, 245, 255); // very light blue
        doc.rect(15, cursorY - 6, pageWidth - 30, 10, "F");
        
        doc.setTextColor(37, 99, 235); // Blue-600
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), 18, cursorY + 1);
        cursorY += 12;
        
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        
        // Remove markdown artifacts for cleaner PDF text
        const cleanContent = content.replace(/\*\*/g, "").replace(/\#/g, "");
        const lines = doc.splitTextToSize(cleanContent, pageWidth - 30);
        
        for (let i = 0; i < lines.length; i++) {
          if (cursorY > 275) { doc.addPage(); cursorY = 25; }
          doc.text(lines[i], 15, cursorY);
          cursorY += 6;
        }
        cursorY += 10;
      };

      addSection("1. Rencana Aktivitas Kelas", data.aktivitas);
      addSection("2. Dialog Kelas (Socratic Method)", data.dialog);
      addSection("3. Catatan Papan Tulis / Materi PPT", data.papan_tulis);

      // Add Watermark and Footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        // Watermark
        doc.setTextColor(240, 242, 245); // Very faint grey
        doc.setFontSize(60);
        doc.setFont("helvetica", "bold");
        doc.text("NIA TUTORING", pageWidth / 2, pageHeight / 2 + 20, { angle: 45, align: "center" });
        
        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Dicetak otomatis oleh Sistem AI NIA Tutoring AKSES - Halaman ${i} dari ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
      }

      doc.save(`Modul_NIA_${schedule.classes?.name || 'Umum'}_${selectedSubject.replace(/ /g, "_")}.pdf`);
      toast.success("PDF Rencana Pembelajaran berhasil dibuat!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
    setIsGeneratingAi(false);
  };

  const saveWorkspace = async () => {
    setSaving(true);
    const toastId = toast.loading("Menyimpan data kelas...");
    try {
      // 1. Update schedule
      const { error: schedError } = await supabase
        .from("center_schedules")
        .update({
          topic: selectedTopic,
          subtopic: selectedSubtopics.join(", "),
          learning_objectives: learningObjectives,
          learning_methods: learningMethods,
          meeting_summary: meetingSummary,
          photo_start_url: photoStartUrl,
          photo_end_url: photoEndUrl,
          status: 'ongoing'
        })
        .eq("id", schedule.id);

      if (schedError) throw schedError;

      // 2. Upsert attendances
      const attendancePayload = students.map(s => ({
        schedule_id: schedule.id,
        student_id: s.id,
        status: attendances[s.id] || 'hadir',
        created_at: new Date().toISOString()
      }));

      const { error: attError } = await supabase
        .from("center_schedule_attendances")
        .upsert(attendancePayload, { onConflict: 'schedule_id, student_id' });

      if (attError) throw attError;

      toast.success("Workspace berhasil disimpan!", { id: toastId });
      
      // Auto-generate AI if this is the first save of the topic
      if ((selectedTopic || customTopic) && !isCompleted) {
        await generateAiPdf();
      }
      
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
    setSaving(false);
  };

  const finishClass = async () => {
    if (!meetingSummary || !photoStartUrl || !photoEndUrl) {
      toast.error("Harap isi ringkasan pertemuan dan lengkapi foto awal & akhir sebelum menyelesaikan kelas.");
      return;
    }
    
    if (window.confirm("Selesaikan sesi kelas ini?")) {
      const toastId = toast.loading("Menyelesaikan kelas...");
      const { error } = await supabase
        .from("center_schedules")
        .update({ status: 'completed' })
        .eq("id", schedule.id);

      if (error) toast.error(error.message, { id: toastId });
      else {
        toast.success("Kelas berhasil diselesaikan!", { id: toastId });
        router.push("/tutor/schedules");
      }
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-500" /></div>;
  if (!schedule) return <div className="p-10 text-center">Jadwal tidak ditemukan</div>;

  const isCompleted = schedule.status === 'completed';
  
  const selectedLevelData = TUTORING_TOPICS.find(l => l.level === selectedLevel);
  const selectedSubjectData = selectedLevelData?.subjects.find(s => s.name === selectedSubject);
  const selectedTopicData = selectedSubjectData?.topics.find(t => t.name === selectedTopic);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push("/tutor/schedules")} className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">{schedule.title}</h1>
            {isCompleted && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">Selesai</span>}
          </div>
          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm mt-1">
            <Clock className="w-4 h-4" /> {new Date(schedule.schedule_time).toLocaleString('id-ID')}
            <span className="mx-2">•</span>
            <Users className="w-4 h-4" /> Kelas: {schedule.classes?.name || 'Umum'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Lesson Plan */}
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Rencana Pembelajaran
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Jenjang Pendidikan</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedSubject(""); setSelectedTopic(""); setSelectedSubtopics([]); setCustomTopic(""); }}
                  disabled={isCompleted}
                >
                  <option value="">-- Pilih Jenjang --</option>
                  {TUTORING_TOPICS.map(l => <option key={l.level} value={l.level}>{l.level}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Mata Pelajaran</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(""); setSelectedSubtopics([]); setCustomTopic(""); }}
                  disabled={!selectedLevel || isCompleted}
                >
                  <option value="">-- Pilih Mapel --</option>
                  {selectedLevelData?.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Topik Pokok</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedTopic} onChange={e => { setSelectedTopic(e.target.value); setSelectedSubtopics([]); setCustomTopic(""); }}
                  disabled={!selectedSubject || isCompleted}
                >
                  <option value="">-- Pilih Topik --</option>
                  {selectedSubjectData?.topics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>
              
              {/* Dynamic Subtopics */}
              {selectedTopic && selectedTopic !== 'Lainnya' && (
                <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-500 block">Subtopik yang Akan Diajarkan</label>
                  {/* Render existing selected subtopics plus one empty slot at the end */}
                  {[...selectedSubtopics, ""].map((subVal, index) => {
                    // Only show empty slot if the previous slot is filled (or if it's the very first slot)
                    if (index > 0 && selectedSubtopics[index - 1] === "") return null;
                    
                    return (
                      <select 
                        key={index}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm shadow-sm"
                        value={subVal} 
                        onChange={e => { 
                          const newVal = e.target.value;
                          const newArr = [...selectedSubtopics];
                          if (newVal === "") {
                            // Remove this and everything after it
                            newArr.splice(index);
                          } else {
                            if (index < newArr.length) {
                              newArr[index] = newVal;
                            } else {
                              newArr.push(newVal);
                            }
                          }
                          setSelectedSubtopics(newArr);
                        }}
                        disabled={isCompleted}
                      >
                        <option value="">{index === 0 ? '-- Pilih Subtopik 1 --' : `-- Pilih Subtopik ${index + 1} (Opsional) --`}</option>
                        {selectedTopicData?.subtopics
                          .filter(s => !selectedSubtopics.includes(s) || s === subVal)
                          .map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="Lainnya">Lainnya...</option>
                      </select>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Topic Input */}
            {(selectedTopic === 'Lainnya' || selectedSubtopics.includes('Lainnya')) && (
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" /> Deskripsi Materi Khusus (AI akan membantu menyusun materinya)
                </label>
                <input 
                  type="text" 
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder="Ketik topik & subtopik spesifik yang ingin diajarkan..."
                  className="w-full px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  disabled={isCompleted}
                />
              </div>
            )}
            
            <div className="mt-4 space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Tujuan Pembelajaran</label>
                <textarea 
                  value={learningObjectives}
                  onChange={e => setLearningObjectives(e.target.value)}
                  placeholder="Contoh: Siswa dapat menghitung luas bangun datar kompleks..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none h-20"
                  disabled={isCompleted}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Metode Pembelajaran (Opsional)</label>
                <input 
                  type="text"
                  value={learningMethods}
                  onChange={e => setLearningMethods(e.target.value)}
                  placeholder="Contoh: Diskusi Kelompok, Ceramah & Latihan Soal..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  disabled={isCompleted}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end items-center border-t border-slate-100 pt-4">
              <div className="mr-4 text-xs text-slate-400 italic">
                Rencana ini akan dikirim & disimpan di sistem Student Advisor.
              </div>
              <div className="flex gap-2">
                <Button onClick={generateAiPdf} disabled={isGeneratingAi || (!selectedTopic && !customTopic)} variant="secondary" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 border bg-white">
                  {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  Unduh Modul (PDF)
                </Button>
                <Button onClick={saveWorkspace} disabled={saving || isCompleted || isGeneratingAi} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  {saving || isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isGeneratingAi ? 'Menyusun Modul...' : 'Simpan Rencana & Kirim ke Student Advisor'}
                </Button>
              </div>
            </div>

            {(selectedTopic || schedule.topic) && !selectedLevel && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                <span className="font-bold">Topik Tersimpan:</span> {schedule.topic} - {schedule.subtopic}
              </div>
            )}
          </Card>

          {/* Student Attendance */}
          <div className={!schedule.topic ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
            <Card className="p-6 relative overflow-hidden">
              {!schedule.topic && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-orange-200 text-orange-700 font-bold text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Isi Rencana Pembelajaran Dulu
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" /> Absensi Siswa
              </h2>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span className="font-mono font-bold tracking-widest text-slate-900">{schedule.attendance_code}</span>
              </div>
            </div>
            
            {students.length === 0 ? (
              <p className="text-slate-500 text-sm italic">Belum ada siswa di kelas ini.</p>
            ) : (
              <div className="space-y-2">
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{student.full_name}</p>
                      <p className="text-xs text-slate-500">{student.nis || 'NIS -'}</p>
                    </div>
                    <div className="flex gap-1">
                      {['hadir', 'sakit', 'izin', 'absen'].map(status => (
                        <button
                          key={status}
                          disabled={isCompleted}
                          onClick={() => handleAttendanceChange(student.id, status)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                            attendances[student.id] === status
                              ? status === 'hadir' ? 'bg-green-100 text-green-700' :
                                status === 'sakit' ? 'bg-amber-100 text-amber-700' :
                                status === 'izin' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </Card>
          </div>
        </div>

        {/* Right Column: Documentation & Finish */}
        <div className={`space-y-6 ${!schedule.topic ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}`}>
          <Card className="p-6 relative overflow-hidden">
            {!schedule.topic && (
                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-orange-200 text-orange-700 font-bold text-sm text-center">
                    <BookOpen className="w-4 h-4 mx-auto mb-1" /> Terkunci
                  </div>
                </div>
            )}
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-teal-500" /> Dokumentasi
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Foto Awal Kelas</label>
                {photoStartUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 h-32">
                    <img src={photoStartUrl} alt="Awal Kelas" className="w-full h-full object-cover" />
                    {!isCompleted && (
                      <button onClick={() => setPhotoStartUrl("")} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Ganti</button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Camera className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-500">Upload Foto Awal</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoUpload(e, 'start')} />
                  </label>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Foto Akhir Kelas</label>
                {photoEndUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 h-32">
                    <img src={photoEndUrl} alt="Akhir Kelas" className="w-full h-full object-cover" />
                    {!isCompleted && (
                      <button onClick={() => setPhotoEndUrl("")} className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Ganti</button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Camera className="w-6 h-6 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-500">Upload Foto Akhir</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handlePhotoUpload(e, 'end')} />
                  </label>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> Ringkasan
            </h2>
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 min-h-[120px] text-sm"
              placeholder="Tulis ringkasan kemajuan belajar hari ini..."
              value={meetingSummary}
              onChange={e => setMeetingSummary(e.target.value)}
              disabled={isCompleted}
            ></textarea>
          </Card>

          {!isCompleted && (
            <div className="space-y-3">
              <Button 
                onClick={saveWorkspace}
                disabled={saving}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Menyimpan...' : 'Simpan Sementara'}
              </Button>
              <Button 
                onClick={finishClass}
                disabled={saving}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Selesaikan Kelas
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
