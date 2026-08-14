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
  Camera, FileText, Loader2, KeyRound 
} from "lucide-react";
import toast from "react-hot-toast";

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
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");

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
      setSelectedSubtopic(sched.subtopic || "");
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

  const saveWorkspace = async () => {
    setSaving(true);
    const toastId = toast.loading("Menyimpan data kelas...");
    try {
      // 1. Update schedule
      const { error: schedError } = await supabase
        .from("center_schedules")
        .update({
          topic: selectedTopic,
          subtopic: selectedSubtopic,
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

      // Because unique constraint might conflict, we use upsert
      const { error: attError } = await supabase
        .from("center_schedule_attendances")
        .upsert(attendancePayload, { onConflict: 'schedule_id, student_id' });

      if (attError) throw attError;

      toast.success("Workspace berhasil disimpan!", { id: toastId });
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Jenjang Pendidikan</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedLevel} onChange={e => { setSelectedLevel(e.target.value); setSelectedSubject(""); setSelectedTopic(""); setSelectedSubtopic(""); }}
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
                  value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic(""); setSelectedSubtopic(""); }}
                  disabled={!selectedLevel || isCompleted}
                >
                  <option value="">-- Pilih Mapel --</option>
                  {selectedLevelData?.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Topik Pokok</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedTopic} onChange={e => { setSelectedTopic(e.target.value); setSelectedSubtopic(""); }}
                  disabled={!selectedSubject || isCompleted}
                >
                  <option value="">-- Pilih Topik --</option>
                  {selectedSubjectData?.topics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Subtopik</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  value={selectedSubtopic} onChange={e => setSelectedSubtopic(e.target.value)}
                  disabled={!selectedTopic || isCompleted}
                >
                  <option value="">-- Pilih Subtopik --</option>
                  {selectedTopicData?.subtopics.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {(selectedTopic || schedule.topic) && !selectedLevel && (
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700">
                <span className="font-bold">Topik Tersimpan:</span> {schedule.topic} - {schedule.subtopic}
              </div>
            )}
          </Card>

          {/* Student Attendance */}
          <Card className="p-6">
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

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="p-6">
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
