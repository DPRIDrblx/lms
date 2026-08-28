"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, Star, Send, CheckCircle2 } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Button } from "@/components/ui/button";
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

export default function StudentRatingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();

  const [schedule, setSchedule] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        .select("*, tutor:tutor_id(full_name)")
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
      // Wait a moment then go back
      setTimeout(() => {
        router.push(`/student/jadwal-les/${schedule.id}`);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <CenterLoader size="lg" />
      </div>
    );
  }

  if (!schedule || !attendance || attendance.status !== 'hadir') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <Star className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Penilaian Tidak Tersedia</h2>
        <p className="text-slate-500 mb-6">Kamu harus berstatus Hadir untuk bisa memberikan penilaian.</p>
        <Button onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} variant="secondary">
          Kembali ke Detail
        </Button>
      </div>
    );
  }

  const tagsList = selectedRating >= 4 ? FEEDBACK_TAGS_GOOD : FEEDBACK_TAGS_BAD;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header Banner - Colorful aesthetic */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-yellow-500 pt-8 pb-16 px-6 md:px-12 relative overflow-hidden shadow-xl rounded-b-[40px] md:rounded-b-[60px]">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-yellow-300/30 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/40 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors bg-black/10 hover:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 self-start"
          >
            <ChevronLeft className="w-5 h-5" /> Kembali
          </button>
          
          <div className="pt-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md text-white">
              Beri Nilai Kelas
            </h1>
            <p className="text-red-100 font-medium text-lg md:text-xl drop-shadow-sm opacity-90 max-w-2xl mx-auto">
              Bagaimana pengalaman belajarmu dengan {schedule.tutor?.full_name || "Tutor"} hari ini?
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          
          {attendance?.rating ? (
            // Submitted State
            <div className="text-center space-y-6 py-8 flex flex-col items-center">
              <div className="flex justify-center gap-2 mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className={`w-16 h-16 md:w-20 md:h-20 ${star <= attendance.rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'fill-transparent text-slate-200'}`} />
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
                <p className="text-slate-600 italic mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-block max-w-lg break-words whitespace-pre-wrap">
                  "{attendance.feedback_text}"
                </p>
              )}
              <div className="text-emerald-600 font-bold flex items-center justify-center gap-2 mt-4 text-xl">
                <CheckCircle2 className="w-6 h-6 shrink-0" /> Terima kasih atas penilaianmu!
              </div>
              <Button onClick={() => router.push(`/student/jadwal-les/${schedule.id}`)} variant="secondary" className="mt-8">
                Kembali ke Detail
              </Button>
            </div>
          ) : (
            // Form State
            <div className="space-y-10 py-6">
              <div className="text-center">
                <p className="text-slate-500 font-bold mb-6 text-lg uppercase tracking-widest">Pilih Bintang</p>
                <div className="flex justify-center gap-3 md:gap-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (ratingHover || selectedRating);
                    return (
                      <button
                        key={star}
                        className="p-2 transition-transform hover:scale-110"
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        onClick={() => {
                          setSelectedRating(star);
                          setSelectedTags([]);
                        }}
                      >
                        <Star 
                          className={`w-16 h-16 md:w-24 md:h-24 transition-colors ${isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-xl' : 'fill-slate-50 text-slate-200 hover:text-slate-300'}`} 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedRating > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-8 border border-blue-100 shadow-sm">
                    <p className="font-black text-blue-900 mb-6 text-center text-xl">
                      {selectedRating >= 4 ? "Apa yang paling kamu suka dari sesi ini?" : "Apa yang perlu kami tingkatkan?"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {tagsList.map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleToggleTag(tag)}
                          className={cn(
                            "px-5 py-3 rounded-2xl text-sm font-bold transition-all border",
                            selectedTags.includes(tag) 
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105" 
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-black text-slate-700 block mb-3 text-lg">Ada pesan tambahan? (Opsional)</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tulis kesan, saran, atau ucapan terima kasihmu di sini..."
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 min-h-[160px] outline-none focus:border-blue-500 focus:bg-white transition-colors resize-y font-medium text-slate-800 text-lg shadow-inner"
                    ></textarea>
                  </div>

                  <Button 
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform"
                  >
                    {isSubmittingFeedback ? <CenterLoader size="sm" /> : <><Send className="w-6 h-6 mr-3" /> Kirim Penilaian</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
