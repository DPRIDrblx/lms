"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Play, FileText, Trophy, Loader2, Gamepad2, Presentation, ExternalLink, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const Player = dynamic(() => import("react-player"), { ssr: false }) as any;

export default function SobatNiaLessonViewerPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = use(params);
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Interactive Video States
  const [playing, setPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<any>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  
  useEffect(() => {
    if (!profile) return;
    const fetchData = async () => {
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
  }, [id, lessonId, profile]);

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
    toast.success("Materi Selesai! Kamu mendapat " + lesson.xp_reward + " XP");
    
    setTimeout(() => {
      router.push(`/sobat-nia/courses/${id}`);
    }, 1500);
  };

  const handleVideoProgress = (state: any) => {
    setPlayedSeconds(state.playedSeconds);
    if (!lesson?.interactive_quiz_data) return;

    for (let i = 0; i < lesson.interactive_quiz_data.length; i++) {
      const q = lesson.interactive_quiz_data[i];
      let targetSeconds = parseFloat(q.timestamp);
      if (typeof q.timestamp === 'string' && q.timestamp.includes(':')) {
        const parts = q.timestamp.split(':');
        targetSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }

      if (!answeredQuestions.has(i) && Math.abs(state.playedSeconds - targetSeconds) < 1.0) {
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!lesson) return <div className="p-20 text-center text-slate-500 font-bold">Materi tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/sobat-nia/courses/${id}`} className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">{course?.title}</h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{lesson.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-black">{lesson.xp_reward} XP</span>
            </div>
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm px-4 py-2 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5" /> Selesai
              </div>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={completing}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Tandai Selesai
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* CONTENT: TEXT */}
          {lesson.content_type === "text" && (
            <div className="p-8 md:p-12">
              <h1 className="text-3xl font-black text-slate-900 mb-6">{lesson.title}</h1>
              <div className="prose prose-slate max-w-none">
                {lesson.body_text?.split('\n').map((para: string, i: number) => (
                  <p key={i} className="mb-4 text-slate-700 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          )}

          {/* CONTENT: VIDEO & INTERACTIVE VIDEO */}
          {(lesson.content_type === "video" || lesson.content_type === "interactive_video") && (
            <div className="relative">
              <div className="aspect-video bg-black relative">
                <Player
                  ref={playerRef}
                  url={lesson.video_url}
                  width="100%"
                  height="100%"
                  controls={lesson.content_type === "video"}
                  playing={lesson.content_type === "interactive_video" ? playing : undefined}
                  onProgress={lesson.content_type === "interactive_video" ? handleVideoProgress : undefined}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => {
                     if (!isCompleted) handleComplete();
                  }}
                  config={{ youtube: { playerVars: { showinfo: 1, rel: 0 } } }}
                />

                {/* Interactive Question Overlay */}
                <AnimatePresence>
                  {activeQuestion && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center p-6"
                    >
                      <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
                        <div className="flex items-center gap-2 mb-6 text-orange-500 font-bold">
                          <HelpCircle className="w-6 h-6" /> Pertanyaan Interaktif
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-6">{activeQuestion.question}</h3>
                        
                        <div className="space-y-3 mb-6">
                          {activeQuestion.options.map((opt: string, i: number) => (
                            <button
                              key={i}
                              onClick={() => setSelectedAnswer(i)}
                              className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all ${
                                selectedAnswer === i 
                                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                                  : 'border-slate-200 text-slate-700 hover:border-orange-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>

                        {feedback && (
                          <div className={`p-4 rounded-xl mb-6 font-bold flex items-center gap-2 ${feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {feedback === 'correct' ? <><CheckCircle2 className="w-5 h-5"/> Jawaban Benar!</> : "Jawaban kurang tepat. Coba lagi!"}
                          </div>
                        )}

                        <button
                          onClick={handleAnswerSubmit}
                          disabled={selectedAnswer === null || feedback === 'correct'}
                          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                        >
                          Cek Jawaban
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="p-6 md:p-8 bg-white">
                <h1 className="text-2xl font-black text-slate-900 mb-2">{lesson.title}</h1>
                <p className="text-slate-600 font-medium leading-relaxed">{lesson.body_text}</p>
              </div>
            </div>
          )}

          {/* CONTENT: CANVA */}
          {lesson.content_type === "canva" && (
            <div className="relative">
              <div className="aspect-[16/9] w-full bg-slate-100 relative">
                <iframe
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-none"
                  src={lesson.video_url?.replace('/view', '/view?embed')}
                  allowFullScreen
                  allow="fullscreen"
                />
              </div>
              <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{lesson.title}</h1>
                </div>
                <a href={lesson.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100">
                  <ExternalLink className="w-5 h-5" /> Buka di Tab Baru
                </a>
              </div>
            </div>
          )}

          {/* CONTENT: PDF */}
          {lesson.content_type === "pdf" && (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-black text-slate-900 mb-2">{lesson.title}</h1>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">{lesson.body_text}</p>
              <a href={lesson.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20">
                <FileText className="w-5 h-5" /> Baca Dokumen PDF
              </a>
            </div>
          )}

          {/* CONTENT: GAME */}
          {lesson.content_type === "game" && (
            <div className="relative bg-slate-900">
               <div className="aspect-[4/3] md:aspect-[16/9] w-full relative">
                 <iframe 
                   src={`/play?topic=${encodeURIComponent(lesson.body_text || lesson.title)}`} 
                   className="absolute inset-0 w-full h-full border-none rounded-t-3xl"
                 />
               </div>
               <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-t border-slate-800">
                 <div>
                   <h1 className="text-xl font-black mb-1">{lesson.title}</h1>
                   <p className="text-slate-400 text-sm font-medium">Mainkan gamifikasi untuk mendapatkan XP.</p>
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
