"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Loader2, ArrowLeft, Gamepad2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function GameViewerPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = use(params);
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showWinScreen, setShowWinScreen] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      const [lessonRes, courseRes, progressRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("courses").select("id, title").eq("id", id).single(),
        supabase.from("course_progress").select("completed").eq("lesson_id", lessonId).eq("student_id", profile?.id).maybeSingle()
      ]);
      
      if (lessonRes.data) setLesson(lessonRes.data);
      if (courseRes.data) setCourse(courseRes.data);
      if (progressRes.data?.completed) setIsCompleted(true);
      
      setLoading(false);
    };

    if (profile) {
      fetchLesson();
    }
  }, [lessonId, id, supabase, profile]);

  const handleComplete = async () => {
    if (!profile || isCompleted || !lesson || !course) return;
    setCompleting(true);
    setShowWinScreen(true);
    
    try {
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
      toast.success(`Selamat! Kamu mendapatkan +${lesson.xp_reward} XP`);
      
      // Redirect back to lesson page after showing the win screen for a bit
      setTimeout(() => {
        router.push(`/courses/${id}/lessons/${lessonId}`);
      }, 3000);
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan progres.");
      setCompleting(false);
      setShowWinScreen(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GAME_COMPLETED') {
        if (!isCompleted && !completing) {
           handleComplete();
        } else if (isCompleted) {
           toast.success("Misi sudah diselesaikan sebelumnya!");
           setShowWinScreen(true);
           setTimeout(() => {
             router.push(`/courses/${id}/lessons/${lessonId}`);
           }, 2000);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isCompleted, completing, lesson, course, profile]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!lesson || lesson.content_type !== "game" || !lesson.body_text) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-[var(--warning)] mb-4" />
        <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2">Game Tidak Ditemukan</h1>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md">
          Materi game belum dibuat oleh guru atau terjadi kesalahan saat memuat game.
        </p>
        <Link href={`/courses/${id}/lessons/${lessonId}`}>
          <button className="px-6 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" /> Kembali ke Materi
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <AnimatePresence>
        {showWinScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center shadow-2xl"
            >
              <div className="h-20 w-20 bg-[var(--success-light)] text-[var(--success)] rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Misi Selesai!</h2>
              <p className="text-[var(--text-secondary)] mb-6">Kamu berhasil menyelesaikan game ini.</p>
              <div className="bg-[var(--warning)]/10 text-[var(--warning-dark)] font-black text-lg px-6 py-3 rounded-xl border border-[var(--warning)]/20 w-full mb-4">
                +{lesson.xp_reward} XP
              </div>
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-[#1e1e2e] text-white p-3 sm:p-4 flex items-center justify-between border-b border-white/10 shadow-lg relative z-10"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/courses/${id}/lessons/${lessonId}`} className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/15 rounded-xl transition-all group">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight">{lesson.title}</h1>
            <p className="text-[10px] sm:text-xs text-purple-300 font-medium flex items-center gap-1 mt-0.5">
              <Gamepad2 className="h-3 w-3" /> AI Gamification Quest
            </p>
          </div>
        </div>
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-inner">
          +{lesson.xp_reward} XP
        </div>
      </motion.div>
      
      {/* Game Container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 w-full bg-black relative"
      >
        <iframe 
          srcDoc={lesson.body_text}
          className="w-full h-full border-none absolute inset-0 bg-white"
          title={lesson.title}
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-modals"
        />
      </motion.div>
    </div>
  );
}
