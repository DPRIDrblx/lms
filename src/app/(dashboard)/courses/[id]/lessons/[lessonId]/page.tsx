"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Play, 
  FileText, 
  Trophy, 
  Loader2,
  ExternalLink,
  Presentation,
  Gamepad2,
  Film
} from "lucide-react";
import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactPlayer from 'react-player';

const Player: any = ReactPlayer;

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

  // Interactive Video States
  const [playing, setPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      const [lessonRes, courseRes, progressRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("courses").select("id, title").eq("id", id).single(),
        supabase.from("course_progress").select("completed").eq("lesson_id", lessonId).eq("student_id", profile.id).single()
      ]);

      if (lessonRes.data) {
        const l = { ...lessonRes.data };
        if (l.content_type === 'video' && l.video_url?.toLowerCase().includes('canva')) {
          l.content_type = 'canva';
        }
        setLesson(l);
      }
      if (courseRes.data) setCourse(courseRes.data);
      if (progressRes.data?.completed) setIsCompleted(true);
      setLoading(false);
    };

    fetchData();
  }, [id, lessonId, profile, supabase]);

  // Listener for AI Game completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GAME_COMPLETED') {
        if (!isCompleted && !completing) {
           handleComplete();
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isCompleted, completing, lesson, course, profile]);

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

  const handleVideoProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (!lesson?.interactive_quiz_data) return;

    // Check if there is a question at the current timestamp
    for (let i = 0; i < lesson.interactive_quiz_data.length; i++) {
      const q = lesson.interactive_quiz_data[i];
      // Trigger if within 1 second window
      if (!answeredQuestions.has(i) && Math.abs(state.playedSeconds - q.timestamp) < 1.0) {
        setPlaying(false);
        setActiveQuestion({ ...q, index: i });
        break;
      }
    }
  };

  const handleAnswerSubmit = () => {
    if (!activeQuestion || selectedAnswer === null) return;
    if (selectedAnswer === activeQuestion.correct_index) {
      setFeedback("correct");
      setTimeout(() => {
        setAnsweredQuestions(prev => new Set(prev).add(activeQuestion.index));
        setActiveQuestion(null);
        setSelectedAnswer(null);
        setFeedback(null);
        setPlaying(true);
      }, 1500);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!lesson) return <div className="py-20 text-center text-[var(--text-tertiary)] font-bold">Materi tidak ditemukan.</div>;

  const TypeIcon = lesson.content_type === "video" ? Play : lesson.content_type === "pdf" ? FileText : lesson.content_type === "canva" ? Presentation : lesson.content_type === "game" ? Gamepad2 : lesson.content_type === "interactive_video" ? Film : BookOpen;

  const getCanvaEmbedUrl = (url: string) => {
    if (!url) return "";
    const srcMatch = url.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1].replace(/&#x2F;/g, '/');
    }
    if (url.includes('canva.link')) return url;
    if (url.includes('view?embed')) return url;
    if (url.includes('/edit')) return url.split('/edit')[0] + '/view?embed';
    if (url.includes('/view')) return url.split('/view')[0] + '/view?embed';
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    return cleanUrl + (cleanUrl.includes('canva.com/design') ? '/view?embed' : '');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      <header className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Bab
        </Link>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <TypeIcon className="h-3.5 w-3.5" /> {lesson.content_type === 'canva' ? 'presentasi' : lesson.content_type === 'game' ? 'AI Game' : lesson.content_type === "interactive_video" ? 'Int. Video' : lesson.content_type}
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
          
          {lesson.content_type === "interactive_video" && (
            <div className="aspect-video w-full bg-black relative">
              {lesson.video_url ? (
                <>
                  <Player 
                    ref={playerRef}
                    url={lesson.video_url}
                    playing={playing}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onProgress={handleVideoProgress}
                    controls={!activeQuestion}
                    width="100%"
                    height="100%"
                    progressInterval={500}
                  />

                  <AnimatePresence>
                    {activeQuestion && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-10"
                      >
                        <motion.div 
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full text-center"
                        >
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-[var(--text-primary)]">{activeQuestion.question}</h3>
                          </div>
                          
                          <div className="space-y-3">
                            {activeQuestion.options.map((opt: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedAnswer(idx)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                  selectedAnswer === idx 
                                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" 
                                    : "border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-primary)]"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>

                          <div className="mt-6 flex flex-col items-center gap-3">
                            <Button 
                              onClick={handleAnswerSubmit} 
                              disabled={selectedAnswer === null}
                              className="w-full h-12"
                            >
                              Jawab
                            </Button>

                            <AnimatePresence>
                              {feedback === "correct" && (
                                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[var(--success)] font-bold flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5" /> Jawaban Benar! Melanjutkan video...
                                </motion.p>
                              )}
                              {feedback === "wrong" && (
                                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[var(--error)] font-bold">
                                  Jawaban Salah. Coba lagi!
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                  <Film className="h-12 w-12 opacity-20 mb-2" />
                  <p className="font-bold">Video URL tidak tersedia</p>
                </div>
              )}
            </div>
          )}

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
            <div className="aspect-video w-full bg-black/5 rounded-2xl overflow-hidden relative">
              {lesson.video_url ? (
                lesson.video_url.includes('canva.link') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-secondary)]/50">
                    <Presentation className="h-16 w-16 text-[var(--accent)] mb-4" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Materi Presentasi</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
                      Klik tombol di bawah ini untuk melihat presentasi materi.
                    </p>
                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent)]/30">
                      Lihat
                    </a>
                  </div>
                ) : (
                  <iframe 
                    className="w-full h-full"
                    src={getCanvaEmbedUrl(lesson.video_url)} 
                    title="Canva Embed" 
                    frameBorder="0" 
                    allowFullScreen
                  ></iframe>
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                  <Presentation className="h-12 w-12 opacity-20 mb-2" />
                  <p className="font-bold">Presentasi tidak tersedia</p>
                </div>
              )}
            </div>
          )}

          {lesson.content_type === "game" && (
            <div className="p-8">
              <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 text-center border border-[var(--border)] max-w-2xl mx-auto">
                <Gamepad2 className="h-16 w-16 text-[var(--accent)] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">AI Gamification Quest</h3>
                <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                  Selesaikan misi interaktif ini menggunakan AI untuk mendapatkan <span className="font-bold text-[var(--warning)]">{lesson.xp_reward} XP</span>.
                </p>
                
                {isCompleted ? (
                  <div className="bg-[var(--success-light)] text-[var(--success)] p-4 rounded-xl border border-[var(--success)]/20 font-bold flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8" />
                    Misi Selesai! Kamu hebat!
                  </div>
                ) : (
                  <a href={`/courses/${id}/lessons/${lesson.id}/game`} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group">
                    <Play className="h-5 w-5 fill-white group-hover:scale-110 transition-transform" />
                    Mulai Misi Sekarang
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-between pt-8 border-t border-[var(--border)]">
          <Link href={`/courses/${id}`}>
            <Button variant="secondary" className="h-12 px-6">
              Kembali ke Daftar
            </Button>
          </Link>

          {!isCompleted && lesson.content_type !== 'game' ? (
            <Button 
              className="h-12 px-8 font-bold shadow-lg" 
              onClick={handleComplete}
              loading={completing}
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Tandai Selesai (+{lesson.xp_reward} XP)
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-3 bg-[var(--success-light)] text-[var(--success)] rounded-xl font-bold border border-[var(--success)]/20">
              <CheckCircle2 className="h-5 w-5" /> Selesai
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
