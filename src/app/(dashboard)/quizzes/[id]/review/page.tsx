"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft,
  Trophy,
  BarChart3,
  BookOpen,
  BrainCircuit,
  MinusCircle,
  MessageSquare,
  Send,
  Star,
  Sparkles,
  Loader2,
  X
} from "lucide-react";
import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "@/components/ui/mascot";

export default function QuizReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [score, setScore] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [isPractice, setIsPractice] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async (prompt?: string) => {
    const textToSend = prompt || aiChatInput;
    if (!textToSend.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages(newMessages);
    if (!prompt) setAiChatInput("");
    setAiChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: `Mata Pelajaran/Ujian: ${quiz?.title}\nSkor Siswa: ${score?.score}%. Analisis AI: ${score?.metadata?.ai_analysis || 'Belum ada'}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([...newMessages, { role: 'model', content: data.message }]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiChatLoading(false);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      const [scoreRes, quizRes, questionsRes, responsesRes, sessionRes] = await Promise.all([
        supabase.from("student_scores").select("*").eq("student_id", profile?.id).eq("target_id", id).order("created_at", { ascending: false }).limit(1),
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true }),
        supabase.from("quiz_responses").select("*").eq("student_id", profile?.id).eq("quiz_id", id),
        supabase.from("exam_sessions").select("*").eq("student_id", profile?.id).eq("quiz_id", id).order("created_at", { ascending: false }).limit(1)
      ]);
      
      let practiceFlag = false;
      if (scoreRes.data?.target_type === 'quiz_practice') {
        practiceFlag = true;
      } else if (sessionRes.data && sessionRes.data.length > 0) {
        if (sessionRes.data[0].metadata?.is_practice) {
          practiceFlag = true;
        }
      }
      setIsPractice(practiceFlag);

      if (scoreRes.data && scoreRes.data.length > 0) setScore(scoreRes.data[0]);
      if (quizRes.data) setQuiz(quizRes.data);
      
      if (questionsRes.data) {
        let qs = questionsRes.data;
        if (practiceFlag) {
          qs = qs.filter((q: any) => q.question_type !== 'essay');
        }
        setQuestions(qs);
      }
      if (responsesRes.data) setResponses(responsesRes.data);
      
      setLoading(false);
    };
    if (profile) fetchData();
  }, [id, profile, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse">Calculating Final Results...</div>;
  if (!score && responses.length === 0) return <div className="text-center py-20">Score record not found. Please complete the quiz first.</div>;

  // Calculate stats and synthetic score
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let syntheticScore = 0;

  questions.forEach(q => {
    let studentAnswer = null;
    const resp = responses.find(r => r.question_id === q.id);
    if (resp?.metadata?.answer !== undefined) {
      studentAnswer = resp.metadata.answer;
    } else if (score?.metadata?.responses?.[q.id] !== undefined) {
      const metaResp = score.metadata.responses[q.id];
      studentAnswer = (metaResp && typeof metaResp === 'object' && metaResp.answer !== undefined) ? metaResp.answer : metaResp;
    }

    if (!studentAnswer || (Array.isArray(studentAnswer) && studentAnswer.length === 0) || (typeof studentAnswer === 'object' && Object.keys(studentAnswer).length === 0)) {
      unansweredCount++;
      return;
    }

    if (q.question_type === 'mcq') {
       const correctOpt = q.options?.find((o: any) => o.is_correct);
       if (studentAnswer === correctOpt?.text) {
         correctCount++;
         syntheticScore += (q.points || 0);
       } else incorrectCount++;
    } else if (q.question_type === 'complex_mcq') {
       const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
       const isCorrect = Array.isArray(studentAnswer) && studentAnswer.length === correctOpts.length && studentAnswer.every((a: any) => correctOpts.includes(a));
       if (isCorrect) {
         correctCount++;
         syntheticScore += (q.points || 0);
       } else incorrectCount++;
    } else if (q.question_type === 'matching') {
       let matches = 0;
       let totalPairs = q.options?.length || 1;
       q.options?.forEach((opt: any) => {
         if (studentAnswer[opt.text] === opt.match_pair) matches++;
       });
       if (matches === totalPairs) {
         correctCount++;
       } else if (matches > 0 && matches < totalPairs) {
         // partial
       } else {
         incorrectCount++;
       }
       syntheticScore += (matches / totalPairs) * (q.points || 0);
    } else if (q.question_type === 'essay') {
       // Essay is counted separately or just as "answered" since correctness is subjective
       correctCount++; 
    }
  });

  const finalScoreData = score || { score: Math.round(syntheticScore), is_graded: true, metadata: {} };
  const actualMaxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0) || quiz?.max_score || 100;
  const percentage = Math.round((finalScoreData.score / actualMaxScore) * 100);
  const aiAnalysis = finalScoreData?.metadata?.ai_analysis;
  const aiSuggestions = finalScoreData?.metadata?.ai_suggestions || [];

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-8 pb-20 p-6">
      <header className="flex items-center justify-between">
         <Link href={quiz?.course_id ? `/courses/${quiz.course_id}` : "/courses"}>
            <Button variant="ghost" className="flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Kembali</Button>
         </Link>
         <Badge variant="info" className="px-4 py-1.5 font-bold">{quiz?.title}</Badge>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <Card className="md:col-span-2 p-12 flex flex-col items-center justify-center text-center bg-[var(--bg-secondary)] border-none shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy className="h-40 w-40" /></div>
           
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
              <div className="w-48 h-48 rounded-full border-8 border-[var(--accent)] flex flex-col items-center justify-center mb-8 bg-white shadow-xl">
                 {quiz?.show_score === false ? (
                   <span className="text-4xl font-black text-slate-400">???</span>
                 ) : (
                   <span className="text-6xl font-black text-[var(--accent)]">{percentage}%</span>
                 )}
                 <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Final Mastery</span>
              </div>
           </motion.div>

           <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
              {quiz?.show_score === false ? "Ujian Selesai!" : percentage >= 75 ? "Luar Biasa!" : percentage >= 50 ? "Kerja Bagus!" : "Terus Semangat!"}
           </h2>
           <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8">
              {quiz?.show_score === false 
                ? "Nilai akhir Anda disembunyikan oleh pengajar." 
                : "Ujian Anda telah disubmit. Nilai essay (jika ada) telah dievaluasi oleh AI dan dapat disesuaikan kembali oleh guru."}
           </p>

           {quiz?.show_score !== false && (
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                   <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Total Poin</p>
                   <p className="text-xl font-bold text-[var(--text-primary)]">{finalScoreData.score} / {actualMaxScore}</p>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)]">
                   <p className="text-[10px] font-black uppercase text-[var(--text-tertiary)] mb-1">Status</p>
                   <Badge variant={finalScoreData.is_graded ? "success" : "warning"} className="font-bold bg-blue-100 text-blue-700">
                      {!score ? "Latihan (Tidak Disimpan)" : finalScoreData.is_graded ? "Selesai" : "Menunggu Review"}
                   </Badge>
                </div>
             </div>
           )}
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <Card className="p-6 bg-white border border-[var(--border)] shadow-sm">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--accent)]" /> Statistik Ujian
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Benar
                  </div>
                  <span className="font-bold">{correctCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-500 font-medium">
                    <XCircle className="w-4 h-4" /> Salah
                  </div>
                  <span className="font-bold">{incorrectCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MinusCircle className="w-4 h-4" /> Kosong
                  </div>
                  <span className="font-bold">{unansweredCount}</span>
                </div>
              </div>
           </Card>

           <Card className="p-6 bg-[var(--accent)] text-white border-none shadow-xl shadow-[var(--accent)]/30">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Award /></div>
                 <h3 className="font-bold">Sertifikasi</h3>
              </div>
              <p className="text-xs opacity-80 leading-relaxed mb-6">
                 Selesaikan modul dan dapatkan nilai di atas batas lulus untuk mendapatkan lencana kelulusan.
              </p>
           </Card>
        </div>
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-8 border-none bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative shadow-md">
            <div className="absolute -top-10 -right-10 opacity-10">
              <BrainCircuit className="w-64 h-64 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-indigo-900">Analisis Performa AI</h3>
              </div>
              <p className="text-indigo-900/80 leading-relaxed whitespace-pre-wrap font-medium">
                {aiAnalysis}
              </p>
              
              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="mt-6 border-t border-indigo-200/50 pt-6">
                  <p className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Saran Pertanyaan untuk Tutor AI:
                  </p>
                  <div className="flex flex-col gap-2">
                    {aiSuggestions.map((suggestion: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsChatOpen(true);
                          handleSendChat(suggestion);
                        }}
                        className="text-left bg-white/50 hover:bg-white text-indigo-700 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm border border-indigo-100 hover:border-indigo-300 flex items-center justify-between group"
                      >
                        <span>&quot;{suggestion}&quot;</span>
                        <MessageSquare className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Review Section */}
      {(quiz?.show_answers || quiz?.show_explanation) && (
        <div className="mt-12 space-y-8">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--accent)]" /> Pembahasan Soal
          </h3>

          <div className="space-y-6">
            {questions.map((q, idx) => {
              let studentAnswer = null;
              const resp = responses.find(r => r.question_id === q.id);
              if (resp?.metadata?.answer !== undefined) {
                studentAnswer = resp.metadata.answer;
              }
              
              // Handle AI feedback and reliable fallback to score's metadata
              const scoreMetaResp = finalScoreData?.metadata?.responses?.[q.id];
              let aiFeedback = null;
              
              if (scoreMetaResp !== undefined) {
                if (scoreMetaResp && typeof scoreMetaResp === 'object' && scoreMetaResp.ai_feedback !== undefined) {
                  aiFeedback = scoreMetaResp.ai_feedback;
                  if (studentAnswer === null) studentAnswer = scoreMetaResp.answer;
                } else if (studentAnswer === null) {
                  studentAnswer = scoreMetaResp;
                }
              }

              return (
                <Card key={q.id} className="p-6 border-[var(--border)] shadow-sm">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 font-bold text-slate-500">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                      
                      <div className="mt-4 space-y-3">
                        {q.question_type === 'mcq' || q.question_type === 'complex_mcq' ? (
                          q.options?.map((opt: any, oIdx: number) => {
                            let isStudentChoice = false;
                            if (q.question_type === 'mcq') isStudentChoice = studentAnswer === opt.text;
                            if (q.question_type === 'complex_mcq') isStudentChoice = Array.isArray(studentAnswer) && studentAnswer.includes(opt.text);

                            let bgColor = "bg-white dark:bg-[var(--bg-secondary)] border-[var(--border)]";
                            if (quiz.show_answers) {
                              if (opt.is_correct && isStudentChoice) bgColor = "bg-green-50 border-green-200 text-green-800";
                              else if (opt.is_correct) bgColor = "bg-green-50 border-green-200 text-green-800 opacity-70";
                              else if (isStudentChoice) bgColor = "bg-red-50 border-red-200 text-red-800";
                            } else {
                              if (isStudentChoice) bgColor = "bg-blue-50 border-blue-200 text-blue-800";
                            }

                            return (
                              <div key={oIdx} className={`p-3 rounded-xl border ${bgColor} flex items-center gap-3 transition-all`}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isStudentChoice ? 'border-current bg-current' : 'border-slate-300'}`}>
                                  {isStudentChoice && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                                <span className="flex-1 font-medium">{opt.text}</span>
                                {quiz.show_answers && opt.is_correct && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                                {quiz.show_answers && !opt.is_correct && isStudentChoice && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                              </div>
                            );
                          })
                        ) : q.question_type === 'matching' ? (
                          <div className="space-y-2">
                            {q.options?.map((opt: any, oIdx: number) => {
                              const studentMatch = studentAnswer ? studentAnswer[opt.text] : null;
                              return (
                                <div key={oIdx} className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                                    {opt.text}
                                  </div>
                                  <div className={`p-3 border rounded-xl font-medium ${quiz.show_answers ? (studentMatch === opt.match_pair ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800') : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                    Jawaban Anda: {studentMatch || <span className="text-slate-400 italic">Kosong</span>}
                                    {quiz.show_answers && studentMatch !== opt.match_pair && (
                                      <div className="text-xs text-slate-500 mt-1 border-t pt-1 border-current/20">
                                        Seharusnya: {opt.match_pair}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jawaban Anda (Essay)</p>
                            <p className="text-slate-700">{studentAnswer || <span className="italic text-slate-400">Tidak ada jawaban</span>}</p>
                          </div>
                        )}
                      </div>

                      {/* AI Feedback for Essay */}
                      {aiFeedback && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                          <p className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                            <BrainCircuit className="h-4 w-4" /> Evaluasi AI
                          </p>
                          <p className="text-indigo-900 text-sm leading-relaxed">{aiFeedback}</p>
                        </div>
                      )}

                      {/* Teacher's Explanation */}
                      {quiz?.show_explanation && q.explanation && (
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                          <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Pembahasan
                          </p>
                          <div className="prose prose-sm max-w-none text-blue-900" dangerouslySetInnerHTML={{ __html: q.explanation }} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
    
      {/* AI CHAT MODAL */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border-4 border-indigo-100"
            >
              {/* Header */}
              <div className="bg-indigo-500 p-4 md:p-6 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Star className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl">Tutor AI</h3>
                    <p className="text-indigo-100 text-sm font-medium">Bahas soal ini bersama AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="bg-indigo-600/50 hover:bg-indigo-600 p-2 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                    <Mascot state="idle" className="w-24 h-24" />
                    <div>
                      <p className="font-bold text-slate-500">Ada yang bingung dari penjelasan tadi?</p>
                      <p className="text-sm text-slate-400">Tanyakan saja padaku!</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-indigo-500 text-white rounded-br-sm'
                        : 'bg-white border-2 border-slate-200 text-slate-700 rounded-bl-sm'
                    }`}>
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                ))}
                {aiChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium">Tutor sedang mengetik...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={aiChatInput}
                    onChange={(e) => setAiChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Tanya soal ini ke AI..."
                    className="w-full bg-slate-100 rounded-2xl py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  />
                  <button
                    onClick={() => handleSendChat()}
                    disabled={!aiChatInput.trim() || aiChatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
