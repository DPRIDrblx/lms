"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ThumbsUp, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TUTORING_TOPICS } from "@/lib/tutoring-topics";

export default function StudentVotingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();

  const [schedule, setSchedule] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  
  const [selectedTopic, setSelectedTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        // Find the topics based on voting_level and voting_subject
        if (schedData.voting_level && schedData.voting_subject) {
          const levelData = TUTORING_TOPICS.find(l => l.level === schedData.voting_level);
          if (levelData) {
            const subjectData = levelData.subjects.find(s => s.name === schedData.voting_subject);
            if (subjectData) {
              setAvailableTopics(subjectData.topics.map(t => t.name));
            }
          }
        }
        
        // Check if student has already voted
        const { data: voteData } = await supabase
          .from("center_schedule_votes")
          .select("id")
          .eq("schedule_id", schedData.id)
          .eq("student_id", profile.id)
          .single();
          
        if (voteData) {
          setHasVoted(true);
        }
      }
      setLoading(false);
    }
    
    fetchData();
  }, [profile?.id, resolvedParams.id, supabase]);

  const handleSubmitVote = async () => {
    if (!profile || !schedule) return;
    if (!selectedTopic) {
      toast.error("Pilih topik terlebih dahulu");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase
      .from("center_schedule_votes")
      .insert({ 
        schedule_id: schedule.id,
        student_id: profile.id,
        topic: selectedTopic
      });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') { // Unique violation
        toast.error("Kamu sudah melakukan voting sebelumnya.");
        setHasVoted(true);
      } else {
        toast.error("Gagal mengirim vote: " + error.message);
      }
    } else {
      toast.success("Vote berhasil dikirim!");
      setHasVoted(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <CenterLoader size="lg" />
      </div>
    );
  }

  if (!schedule || !schedule.is_voting_active || schedule.topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 mb-2">Voting Tidak Tersedia</h2>
        <p className="text-slate-500 mb-6">Sesi voting untuk kelas ini sedang tidak aktif atau sudah ditutup.</p>
        <Button onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} variant="secondary">
          Kembali ke Detail
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header Banner - Blue dominant aesthetic */}
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 pt-8 pb-16 px-6 md:px-12 relative overflow-hidden shadow-xl rounded-b-[40px] md:rounded-b-[60px]">
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-400/30 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-400/40 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center flex flex-col items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors bg-black/10 hover:bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 self-start"
          >
            <ChevronLeft className="w-5 h-5" /> Kembali
          </button>
          
          <div className="pt-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md text-white">
              Voting Topik Pembelajaran
            </h1>
            <p className="text-blue-100 font-medium text-lg md:text-xl drop-shadow-sm opacity-90 max-w-2xl mx-auto">
              Bantu {schedule.tutor?.full_name || "Tutor"} menentukan topik apa yang paling ingin dibahas hari ini!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          
          {hasVoted ? (
            <div className="text-center space-y-6 py-12 flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-800">Suara Berhasil Masuk!</h3>
              <p className="text-slate-500 text-lg max-w-md mx-auto">Terima kasih telah berpartisipasi. Hasil akhir akan ditentukan oleh Tutor berdasarkan perolehan suara terbanyak.</p>
              <Button onClick={() => router.push(`/student/jadwal-les/${schedule.id}`)} variant="secondary" className="mt-8 border-slate-200">
                Kembali ke Detail Jadwal
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-indigo-400 tracking-wider">Mata Pelajaran</p>
                  <p className="font-bold text-indigo-900 text-lg">{schedule.voting_subject} - {schedule.voting_level}</p>
                </div>
              </div>

              {availableTopics.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  Tidak ada topik yang ditemukan untuk mata pelajaran ini. Hubungi tutor.
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg mb-4">Pilih Topik (Pilih 1):</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableTopics.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTopic(topic)}
                        className={cn(
                          "p-4 rounded-2xl border-2 text-left transition-all duration-200",
                          selectedTopic === topic
                            ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        )}
                      >
                        <p className={cn("font-bold text-lg leading-snug break-words", selectedTopic === topic ? "text-blue-900" : "text-slate-700")}>
                          {topic}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSubmitVote}
                disabled={isSubmitting || !selectedTopic}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-200 hover:scale-[1.02] transition-transform mt-8"
              >
                {isSubmitting ? <CenterLoader size="sm" /> : <><ThumbsUp className="w-6 h-6 mr-3" /> Kirim Vote</>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
