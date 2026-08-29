"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Clock, MapPin, User, BookOpen, Link2, FileText, ChevronLeft, Star, KeyRound, CheckCircle2, MessageSquare, Send, ThumbsUp, AlertCircle } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import StudentLiveInteractions from '@/components/student/LiveClassInteractions';
import { SessionLeaderboard } from '@/components/student/SessionLeaderboard';
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const FEEDBACK_TAGS_GOOD = [
  "Tutor sangat interaktif",
  "Penjelasan mudah dipahami",
  "Suasana kelas asyik",
  "Materi sangat jelas",
  "Tutor ramah & sabar",
  "Tulisan di papan rapi"
];

const FEEDBACK_TAGS_BAD = [
  "Terlalu cepat menjelaskan",
  "Suara tutor kurang jelas",
  "Tulisan di papan kurang rapi",
  "Materi terlalu sulit",
  "Kelas kurang interaktif",
  "Kondisi kelas berisik"
];

export default function StudentScheduleDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();

  const [schedule, setSchedule] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isPast, setIsPast] = useState(false);

  // Attendance Form
  const [attendanceMode, setAttendanceMode] = useState<'hadir' | 'izin'>('hadir');
  const [attendanceCodeInput, setAttendanceCodeInput] = useState("");
  const [excuseReason, setExcuseReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rating & Feedback Form
  const [ratingHover, setRatingHover] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.id) return;
      
      const { data: schedData } = await supabase
        .from("center_schedules")
        .select("*, tutor:tutor_id(full_name), branch:branch_id(name), room:room_id(room_number)")
        .eq("id", resolvedParams.id)
        .single();
        
      if (schedData) {
        setSchedule(schedData);
        
        const { data: attData } = await supabase
          .from("center_schedule_attendances")
          .select("*")
          .eq("schedule_id", schedData.id)
          .eq("student_id", profile.id)
          .single();
          
        if (attData) {
          setAttendance(attData);
          if (attData.rating) setSelectedRating(attData.rating);
          if (attData.feedback_tags) setSelectedTags(attData.feedback_tags);
          if (attData.feedback_text) setFeedbackText(attData.feedback_text);
        }
      }
      setLoading(false);
    }
    
    fetchData();
  }, [profile?.id, resolvedParams.id, supabase]);

  useEffect(() => {
    if (!schedule) return;

    const timer = setInterval(() => {
      const now = new Date();
      const schedTime = new Date(schedule.schedule_time);
      const diff = schedTime.getTime() - now.getTime();

      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft("Sedang Berlangsung / Selesai");
      } else {
        setIsPast(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        let timeStr = "";
        if (hours > 0) timeStr += `${hours} Jam `;
        if (mins > 0 || hours > 0) timeStr += `${mins} Menit `;
        timeStr += `${secs} Detik`;
        
        setTimeLeft(timeStr);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [schedule]);

  const handleAttend = async () => {
    if (!schedule || !profile) return;
    if (!attendanceCodeInput) {
      toast.error("Masukkan kode presensi dari guru/TU");
      return;
    }
    
    if (attendanceCodeInput.toUpperCase() !== schedule.attendance_code?.toUpperCase()) {
      toast.error("Kode presensi tidak valid");
      return;
    }
    
    if (schedule.is_attendance_closed) {
      toast.error("Presensi sudah ditutup oleh Tutor");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("center_schedule_attendances")
      .upsert({
        schedule_id: schedule.id,
        student_id: profile.id,
        status: "hadir"
      }, { onConflict: 'schedule_id, student_id' })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil presensi kehadiran! +2 Bintang 🌟");
      setAttendance(data);
      
      // Give 2 stars automatically
      const { data: existing } = await supabase
        .from("student_stars")
        .select("id, stars")
        .eq("schedule_id", schedule.id)
        .eq("student_id", profile.id)
        .single();
        
      if (existing) {
        await supabase.from("student_stars").update({ stars: existing.stars + 2 }).eq("id", existing.id);
      } else {
        await supabase.from("student_stars").insert({
          student_id: profile.id,
          schedule_id: schedule.id,
          stars: 2
        });
      }
    }
  };

  const handleExcuse = async () => {
    if (!schedule || !profile) return;
    if (!excuseReason) {
      toast.error("Pilih alasan izin");
      return;
    }
    
    if (schedule.is_attendance_closed) {
      toast.error("Presensi sudah ditutup oleh Tutor");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from("center_schedule_attendances")
      .upsert({
        schedule_id: schedule.id,
        student_id: profile.id,
        status: "izin",
        excuse_reason: excuseReason
      }, { onConflict: 'schedule_id, student_id' })
      .select()
      .single();

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil mengajukan izin!");
      setAttendance(data);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (attendance?.rating) return; // locked
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = async () => {
    if (!attendance) return;
    if (selectedRating === 0) {
      toast.error("Pilih bintang terlebih dahulu");
      return;
    }

    setIsSubmittingFeedback(true);
    const { data, error } = await supabase
      .from("center_schedule_attendances")
      .update({ 
        rating: selectedRating,
        feedback_tags: selectedTags,
        feedback_text: feedbackText
      })
      .eq("id", attendance.id)
      .select()
      .single();

    setIsSubmittingFeedback(false);

    if (error) {
      toast.error("Gagal mengirim feedback");
    } else {
      toast.success("Terima kasih atas feedback Anda!");
      setAttendance(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <CenterLoader size="lg" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Jadwal Tidak Ditemukan</h2>
        <Button onClick={() => router.push('/student/jadwal-les')} variant="secondary" className="mt-4">
          Kembali ke Jadwal
        </Button>
      </div>
    );
  }

  const dateObj = new Date(schedule.schedule_time);
  const isAttended = !!attendance && attendance.status !== 'absen';
  const isHadir = attendance?.status === 'hadir';
  const isIzin = attendance?.status === 'izin';
  const isCompleted = schedule.status === 'completed';
  const tagsList = selectedRating >= 4 ? FEEDBACK_TAGS_GOOD : FEEDBACK_TAGS_BAD;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header Banner - Colorful aesthetic */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-yellow-500 pt-8 pb-16 px-6 md:px-12 relative overflow-hidden shadow-xl rounded-b-[40px] md:rounded-b-[60px]">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-300/30 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/40 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-overlay"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-8 transition-colors bg-black/10 hover:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 w-fit"
          >
            <ChevronLeft className="w-5 h-5" /> Kembali
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="text-white max-w-2xl min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-md border border-white/20 font-bold text-sm mb-4 shadow-sm">
                <Calendar className="w-4 h-4 text-yellow-300" />
                {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md leading-tight break-words whitespace-pre-wrap">
                {schedule.title}
              </h1>
              <p className="text-red-100 font-medium text-base md:text-xl drop-shadow-sm opacity-90 max-w-xl break-words whitespace-pre-wrap">
                {schedule.description || "Mari bersiap untuk sesi belajar yang menyenangkan!"}
              </p>
            </div>

            {/* Countdown Badge */}
            {!isPast && (
              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-white/40 transform md:-translate-y-4 md:rotate-3 flex flex-col items-center justify-center min-w-[200px] backdrop-blur-xl bg-white/90">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Mulai dalam</p>
                <div className="text-xl font-black text-blue-600">
                  {timeLeft || "Menghitung..."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-6">
        
        {/* Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 truncate">Waktu</p>
              <p className="font-bold text-slate-800 text-sm md:text-lg truncate">{schedule.schedule_time.substring(0, 5)} WIB</p>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <User className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 truncate">Tutor</p>
              <p className="font-bold text-slate-800 text-sm md:text-lg truncate">{schedule.tutor?.full_name || "TBA"}</p>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-[24px] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-4 min-w-0 col-span-2 lg:col-span-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-50 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] md:text-xs font-black uppercase text-slate-400 truncate">Lokasi</p>
              <p className="font-bold text-slate-800 text-sm md:text-lg truncate">
                {schedule.branch?.name ? `${schedule.branch.name} - Lt.${schedule.room?.room_number?.toString()[0] || ''} R.${schedule.room?.room_number || ''}` : 'Online / TBA'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Tabs / Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Voting Banner */}
            {!schedule.topic && schedule.is_voting_active && (
              <div className="bg-blue-600 rounded-[32px] p-8 shadow-md border border-blue-500 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative z-10 text-white">
                  <h3 className="text-2xl font-black mb-2">Voting Topik Pembelajaran Dibuka!</h3>
                  <p className="text-blue-100 font-medium max-w-md">Tutor telah meminta partisipasi kelas untuk memilih materi apa yang akan dipelajari hari ini. Pilih sekarang!</p>
                </div>
                <Button 
                  onClick={() => router.push(`/student/jadwal-les/${schedule.id}/voting`)}
                  className="shrink-0 bg-white text-blue-700 hover:bg-blue-50 h-14 px-8 rounded-2xl font-black text-lg shadow-lg relative z-10 border-0"
                >
                  <ThumbsUp className="w-5 h-5 mr-2" /> Ikut Voting
                </Button>
              </div>
            )}

            {/* Materi */}
            {schedule.topic && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  Materi Pembelajaran
                </h3>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-800 text-lg mb-1 break-words whitespace-pre-wrap">{schedule.topic}</p>
                  {schedule.subtopic && <p className="text-slate-500 font-medium break-words whitespace-pre-wrap">{schedule.subtopic}</p>}
                </div>
              </div>
            )}

            {/* Links */}
            {(schedule.meeting_link || schedule.material_link) && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-blue-500" />
                  </div>
                  Tautan Penting
                </h3>
                <div className="space-y-3">
                  {schedule.meeting_link && (
                    <a href={schedule.meeting_link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors group">
                      <div className="flex items-center gap-3 font-bold text-blue-800">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-blue-600" />
                        </div>
                        Join Meeting
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-400 group-hover:text-blue-600">
                         →
                      </div>
                    </a>
                  )}
                  {schedule.material_link && (
                    <a href={schedule.material_link} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors group">
                      <div className="flex items-center gap-3 font-bold text-emerald-800">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        Modul Pelajaran
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-400 group-hover:text-emerald-600">
                         →
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Feedback & Rating - ONLY IF HADIR */}
            {isAttended && isHadir && (
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  Rating & Feedback Kelas
                </h3>
                <p className="text-slate-500 font-medium mb-8">Beritahu kami bagaimana pengalaman belajarmu hari ini!</p>

                {attendance?.rating ? (
                  // Submitted State
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center space-y-4 flex flex-col items-center">
                    <div className="flex justify-center gap-2 mb-4">
                      {[1,2,3,4,5].map(star => (
                         <Star key={star} className={`w-12 h-12 ${star <= attendance.rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'fill-transparent text-slate-200'}`} />
                      ))}
                    </div>
                    {attendance.feedback_tags?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                        {attendance.feedback_tags.map((tag: string, i: number) => (
                          <span key={i} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-bold border border-blue-200 break-words max-w-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {attendance.feedback_text && (
                      <p className="text-slate-600 italic mt-4 bg-white p-4 rounded-xl shadow-sm inline-block max-w-lg break-words whitespace-pre-wrap">
                        "{attendance.feedback_text}"
                      </p>
                    )}
                    <div className="text-emerald-600 font-bold flex items-center justify-center gap-2 mt-4">
                      <CheckCircle2 className="w-5 h-5 shrink-0" /> Terima kasih atas feedback-mu!
                    </div>
                  </div>
                ) : (
                  // Action button to go to rating page
                  <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-red-50 rounded-3xl border border-yellow-100">
                    <div className="flex justify-center gap-2 mb-6">
                      <Star className="w-10 h-10 fill-yellow-400 text-yellow-400" />
                      <Star className="w-10 h-10 fill-yellow-400 text-yellow-400 -translate-y-2 transform" />
                      <Star className="w-10 h-10 fill-yellow-400 text-yellow-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2">Belum ada penilaian</h4>
                    <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Ayo bagikan bagaimana perasaanmu belajar di sesi ini agar Master Teacher bisa memberikan yang lebih baik lagi!</p>
                    <Button 
                      onClick={() => router.push(`/student/jadwal-les/${schedule.id}/rating`)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-2xl h-14 px-8 font-black shadow-lg shadow-yellow-200"
                    >
                      Beri Nilai Sekarang
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {isAttended && isIzin && (
              <div className="bg-amber-50 rounded-[32px] p-8 shadow-sm border border-amber-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-amber-900 mb-1">Status: Izin</h3>
                  <p className="text-amber-800 font-medium">Kamu tidak dapat memberi rating karena berstatus izin.</p>
                </div>
              </div>
            )}
            
            {/* Live Interactions & Notes */}
            {(isCompleted || (isAttended && !isIzin)) && (
              <>
                <StudentLiveInteractions 
                  scheduleId={resolvedParams.id} 
                  studentId={profile?.id || ""} 
                  isCompleted={isCompleted}
                  isHadir={isAttended && !isIzin}
                />
                
                <div className="mt-8">
                  <SessionLeaderboard 
                    scheduleId={resolvedParams.id}
                    studentId={profile?.id || ""}
                  />
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Attendance Sidebar Widget */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 sticky top-24">
              <h3 className="text-xl font-black text-slate-800 mb-6">Status Kehadiran</h3>
              
              {!isAttended ? (
                <div className="space-y-6">
                  {schedule.is_attendance_closed ? (
                    attendance?.status === 'absen' ? (
                      <div className="bg-rose-50 text-rose-700 p-5 rounded-2xl border border-rose-100 text-center">
                        <div className="w-16 h-16 bg-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle className="w-8 h-8 text-rose-700" />
                        </div>
                        <h4 className="font-black text-rose-900 text-lg mb-1">Status: Tidak Hadir / Absen</h4>
                        <p className="font-medium text-sm">Waktu presensi telah ditutup oleh Tutor.</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 text-center font-bold">
                        Waktu presensi telah ditutup oleh Tutor.
                      </div>
                    )
                  ) : (
                    <>
                      <div className="flex bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => setAttendanceMode('hadir')}
                          className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-colors", attendanceMode === 'hadir' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                          Hadir
                        </button>
                        <button
                          onClick={() => setAttendanceMode('izin')}
                          className={cn("flex-1 py-2 rounded-lg text-sm font-bold transition-colors", attendanceMode === 'izin' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                          Izin
                        </button>
                      </div>

                      {attendanceMode === 'hadir' ? (
                        <div className="space-y-4">
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium">
                            Minta kode presensi 6-digit kepada Tutor di kelas.
                          </div>
                          <input
                            type="text"
                            placeholder="KODE"
                            maxLength={6}
                            value={attendanceCodeInput}
                            onChange={(e) => setAttendanceCodeInput(e.target.value.toUpperCase())}
                            className="w-full text-center tracking-[0.5em] text-2xl font-black uppercase text-slate-800 border-2 border-slate-200 focus:border-amber-500 rounded-2xl py-4 outline-none transition-colors"
                          />
                          <Button 
                            onClick={handleAttend}
                            disabled={isSubmitting || attendanceCodeInput.length < 4}
                            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
                          >
                            {isSubmitting ? <CenterLoader size="sm" /> : "Presensi Sekarang"}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <select
                            value={excuseReason}
                            onChange={(e) => setExcuseReason(e.target.value)}
                            className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-bold outline-none focus:border-amber-500"
                          >
                            <option value="">Pilih Alasan Izin...</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Acara Keluarga">Acara Keluarga</option>
                            <option value="Acara Sekolah">Acara Sekolah</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                          <Button 
                            onClick={handleExcuse}
                            disabled={isSubmitting || !excuseReason}
                            className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl"
                          >
                            {isSubmitting ? <CenterLoader size="sm" /> : "Kirim Izin"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : attendance.status === 'izin' ? (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-center">
                  <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-700" />
                  </div>
                  <h4 className="font-black text-amber-900 text-lg mb-1">Status: Izin</h4>
                  <p className="text-amber-800 font-medium">Alasan: {attendance.excuse_reason}</p>
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-center">
                  <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                  </div>
                  <h4 className="font-black text-emerald-900 text-lg mb-1">Status: Hadir</h4>
                  <p className="text-emerald-800 font-medium text-sm">Tercatat pukul {new Date(attendance.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
