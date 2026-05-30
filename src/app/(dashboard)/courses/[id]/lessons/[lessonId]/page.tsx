"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Play, 
  FileText, 
  Trophy, 
  Loader2,
  ExternalLink,
  Presentation
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LessonViewerPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = use(params);
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [lessonRes, courseRes, progressRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("courses").select("id, title").eq("id", id).single(),
        supabase.from("course_progress").select("completed").eq("lesson_id", lessonId).eq("student_id", profile.id).single()
      ]);

      if (lessonRes.data) setLesson(lessonRes.data);
      if (courseRes.data) setCourse(courseRes.data);
      if (progressRes.data?.completed) setIsCompleted(true);
      setLoading(false);
    };

    fetchData();
  }, [id, lessonId, profile, supabase]);

  const handleComplete = async () => {
    if (!profile || isCompleted || !lesson || !course) return;
    setCompleting(true);

    await supabase.from("course_progress").upsert({
      student_id: profile.id,
      course_id: course.id,
      lesson_id: lesson.id,
      completed: true,
      completed_at: new Date().toISOString(),
      xp_earned: lesson.xp_reward,
    });

    await supabase
      .from("profiles")
      .update({ xp: (profile.xp || 0) + lesson.xp_reward })
      .eq("id", profile.id);

    setIsCompleted(true);
    refreshProfile();
    setCompleting(false);
    
    // Redirect back to course page after short delay
    setTimeout(() => {
      router.push(`/courses/${id}`);
    }, 1000);
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!lesson) return <div className="py-20 text-center text-[var(--text-tertiary)] font-bold">Materi tidak ditemukan.</div>;

  const TypeIcon = lesson.content_type === "video" ? Play : lesson.content_type === "pdf" ? FileText : lesson.content_type === "canva" ? Presentation : BookOpen;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <header className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Bab
        </Link>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <TypeIcon className="h-3.5 w-3.5" /> {lesson.content_type}
        </div>
      </header>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2">{lesson.title}</h1>
          <div className="flex items-center gap-2 text-[var(--warning)] font-bold bg-[var(--warning)]/10 px-3 py-1.5 rounded-lg w-max">
            <Trophy className="h-4 w-4" /> Hadiah: +{lesson.xp_reward} XP
          </div>
        </div>

        {/* CONTENT RENDERER */}
        <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
          
          {lesson.content_type === "video" && (
            <div className="aspect-video w-full bg-black">
              {lesson.video_url ? (
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${lesson.video_url.includes('v=') ? lesson.video_url.split('v=')[1].split('&')[0] : lesson.video_url.split('/').pop()}`} 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                  <Play className="h-12 w-12 opacity-20 mb-2" />
                  <p className="font-bold">Video tidak tersedia</p>
                </div>
              )}
            </div>
          )}

          {lesson.content_type === "text" && (
            <div className="p-8 prose prose-slate max-w-none text-[var(--text-primary)] leading-relaxed">
              {lesson.body_text ? (
                <div dangerouslySetInnerHTML={{ __html: lesson.body_text.replace(/\n/g, '<br />') }} />
              ) : (
                <p className="text-center text-[var(--text-tertiary)] italic">Isi materi kosong.</p>
              )}
            </div>
          )}

          {lesson.content_type === "canva" && (
            <div className="aspect-video w-full bg-black/5">
              {lesson.video_url ? (
                <iframe 
                  className="w-full h-full"
                  src={lesson.video_url} 
                  title="Canva Embed" 
                  frameBorder="0" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                  <Presentation className="h-12 w-12 opacity-20 mb-2" />
                  <p className="font-bold">Desain Canva tidak tersedia</p>
                </div>
              )}
            </div>
          )}

          {lesson.content_type === "pdf" && (
            <div className="p-12 flex flex-col items-center justify-center text-center bg-[var(--bg-secondary)]/50">
               <FileText className="h-20 w-20 text-[var(--text-tertiary)] opacity-30 mb-6" />
               <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Dokumen PDF Tersedia</h3>
               <p className="text-[var(--text-secondary)] mb-8 max-w-md">
                 Dokumen ini perlu dibuka di tab baru. Silakan klik tombol di bawah untuk membaca materinya.
               </p>
               <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent)]/30">
                 Buka Dokumen PDF <ExternalLink className="h-5 w-5" />
               </a>
            </div>
          )}

        </div>
      </div>

      {/* FLOATING ACTION BAR */}
      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-[var(--border)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex justify-center"
      >
        <div className="max-w-4xl w-full flex items-center justify-between gap-4">
           <div>
             {isCompleted ? (
               <div className="flex items-center gap-2 text-[var(--success)] font-black">
                 <CheckCircle2 className="h-6 w-6" /> Selesai Dipelajari!
               </div>
             ) : (
               <div className="text-sm font-bold text-[var(--text-secondary)]">
                 Pelajari materi di atas sampai habis, lalu tandai selesai.
               </div>
             )}
           </div>
           
           <Button 
             size="lg" 
             className={`px-8 font-black ${isCompleted ? 'bg-[var(--success)] hover:bg-[var(--success)] text-white' : ''}`}
             disabled={isCompleted || completing}
             loading={completing}
             onClick={handleComplete}
             icon={isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
           >
             {isCompleted ? "Sudah Selesai" : `Tandai Selesai & Dapatkan ${lesson.xp_reward} XP`}
           </Button>
        </div>
      </motion.div>
    </div>
  );
}
