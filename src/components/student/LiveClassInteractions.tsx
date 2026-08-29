"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, HelpCircle, AlertCircle, X, Send, Sparkles, SendHorizontal } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function StudentLiveInteractions({ 
  scheduleId, 
  studentId, 
  isCompleted, 
  isHadir 
}: { 
  scheduleId: string, 
  studentId: string, 
  isCompleted?: boolean,
  isHadir?: boolean
}) {
  const supabase = createClient();
  const [mood, setMood] = useState<string | null>(null);
  
  // Q&A
  const [showQA, setShowQA] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Quiz
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      // Notes
      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);

      // Quiz
      const { data: activeQ } = await supabase.from('class_live_quizzes').select('*').eq('schedule_id', scheduleId).eq('status', 'active').limit(1).single();
      if (activeQ) {
        setActiveQuiz(activeQ);
        // Check if already answered
        const { data: ans } = await supabase.from('class_live_quiz_answers').select('*').eq('quiz_id', activeQ.id).eq('student_id', studentId).single();
        if (ans) {
          setHasAnswered(true);
          setSelectedAnswers(ans.answer);
        }
      }
    };
    fetchInitial();

    // Polling for Quizzes (every 5 seconds)
    const interval = setInterval(async () => {
      const { data: activeQ } = await supabase.from('class_live_quizzes').select('*').eq('schedule_id', scheduleId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
      
      if (activeQ) {
        if (!activeQuiz || activeQuiz.id !== activeQ.id) {
          setActiveQuiz(activeQ);
          setHasAnswered(false);
          setSelectedAnswers([]);
          
          // Check if already answered just in case
          const { data: ans } = await supabase.from('class_live_quiz_answers').select('*').eq('quiz_id', activeQ.id).eq('student_id', studentId).single();
          if (ans) {
            setHasAnswered(true);
            setSelectedAnswers(ans.answer);
          }
        }
      } else {
        if (activeQuiz) setActiveQuiz(null); // quiz ended
      }
      
      // Poll notes
      if (!isSavingNotes) {
        const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
        if (noteData && noteData.shared_notes !== notes) {
          setNotes(noteData.shared_notes || '');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scheduleId, studentId, supabase, activeQuiz]);

  const handleMood = async (m: string) => {
    setMood(m);
    await supabase.from('class_mood_meter').insert({ schedule_id: scheduleId, student_id: studentId, mood: m });
    toast.success(`Kamu bereaksi: ${m === 'paham' ? '💡 Paham' : m === 'bingung' ? '🤔 Bingung' : '🐢 Terlalu Cepat'}`, { icon: '✨' });
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    const toastId = toast.loading("Mengirim pertanyaan...");
    const { error } = await supabase.from('class_qa_board').insert({
      schedule_id: scheduleId,
      student_id: isAnonymous ? null : studentId,
      question: question
    });
    
    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success("Pertanyaan terkirim ke Tutor!", { id: toastId });
      setQuestion('');
      setShowQA(false);
    }
  };

  // Auto-save notes every 3 seconds of typing stop
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!notes) return;
      setIsSavingNotes(true);
      
      await supabase.from('center_schedules').update({ shared_notes: notes }).eq('id', scheduleId);
      
      setLastSaved(new Date());
      setIsSavingNotes(false);
    }, 3000);

    return () => clearTimeout(delayDebounceFn);
  }, [notes, scheduleId, studentId, supabase]);

  const handleQuizSubmit = async () => {
    if (selectedAnswers.length === 0) return;
    
    // Evaluate answer (simple strict check for arrays)
    const isCorrect = JSON.stringify(selectedAnswers.sort()) === JSON.stringify(activeQuiz.correct_answer.sort());
    
    const toastId = toast.loading("Mengumpulkan jawaban...");
    const { error } = await supabase.from('class_live_quiz_answers').insert({
      quiz_id: activeQuiz.id,
      student_id: studentId,
      answer: selectedAnswers,
      is_correct: isCorrect
    });

    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success(isCorrect ? "Jawabanmu Benar! +5 Bintang 🌟" : "Jawabanmu Kurang Tepat!", { id: toastId });
      setHasAnswered(true);
    }
  };

  const toggleQuizAnswer = (opt: string) => {
    if (activeQuiz.quiz_type.toLowerCase().includes('kompleks')) {
      setSelectedAnswers(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
    } else {
      setSelectedAnswers([opt]);
    }
  };

  return (
    <>
      {/* Floating Mood Bar & Ask Button */}
      {!isCompleted && isHadir && (
        <>
          <div className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-40 bg-white shadow-xl shadow-slate-200/50 rounded-full border border-slate-100 flex items-center p-2 gap-2">
            <button onClick={() => handleMood('paham')} className={`p-3 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${mood === 'paham' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-slate-50 hover:bg-slate-100'}`} title="Paham">
              <Lightbulb className={`w-5 h-5 ${mood === 'paham' ? 'text-green-600' : 'text-slate-500'}`} />
            </button>
            <button onClick={() => handleMood('bingung')} className={`p-3 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${mood === 'bingung' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-slate-50 hover:bg-slate-100'}`} title="Masih Bingung">
              <HelpCircle className={`w-5 h-5 ${mood === 'bingung' ? 'text-amber-600' : 'text-slate-500'}`} />
            </button>
            <button onClick={() => handleMood('kecepatan')} className={`p-3 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${mood === 'kecepatan' ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-slate-50 hover:bg-slate-100'}`} title="Tutor Terlalu Cepat">
              <AlertCircle className={`w-5 h-5 ${mood === 'kecepatan' ? 'text-blue-600' : 'text-slate-500'}`} />
            </button>
            
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            
            <Button onClick={() => setShowQA(true)} className="rounded-full pl-4 pr-6 bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <SendHorizontal className="w-4 h-4 mr-2" /> Tanya Tutor
            </Button>
          </div>

          {/* Q&A Modal */}
          {showQA && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                  <h3 className="font-bold">Kirim Pertanyaan</h3>
                  <button onClick={() => setShowQA(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                  <textarea 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none min-h-[120px] focus:outline-indigo-500"
                    placeholder="Tulis pertanyaanmu di sini..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                  ></textarea>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    Kirim sebagai Anonim (Tutor tidak tahu namamu)
                  </label>
                  <Button onClick={handleAskQuestion} disabled={!question.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Kirim Pertanyaan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Live Quiz Modal */}
          {activeQuiz && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/80 backdrop-blur-md">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-90 duration-300">
                <div className="bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500 p-1">
                  <div className="bg-white p-6 rounded-[22px]">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-xs flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3" /> KUIS KILAT DARI TUTOR
                      </div>
                      {hasAnswered && <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Selesai Menjawab</span>}
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-900 mb-6">{activeQuiz.question}</h2>
                    
                    <div className="space-y-3">
                      {activeQuiz.options.map((opt: string, i: number) => (
                        <button
                          key={i}
                          disabled={hasAnswered}
                          onClick={() => toggleQuizAnswer(opt)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            selectedAnswers.includes(opt) 
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md shadow-indigo-100' 
                              : 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700'
                          } ${hasAnswered && activeQuiz.correct_answer.includes(opt) ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
                        >
                          <span className="inline-block w-6 font-bold opacity-50">{String.fromCharCode(65+i)}.</span> {opt}
                        </button>
                      ))}
                    </div>

                    {!hasAnswered && (
                      <Button onClick={handleQuizSubmit} disabled={selectedAnswers.length === 0} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-lg font-bold">
                        Kunci Jawaban!
                      </Button>
                    )}

                    {hasAnswered && (
                      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center">
                        <p className="text-sm font-medium text-slate-500">Menunggu tutor menutup kuis...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Shared Notes Card */}
      <Card className="p-6 border-amber-100 bg-gradient-to-b from-white to-amber-50/30">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            📝 Catatan Kelas
          </h2>
          <span className="text-xs text-slate-400">
            {isSavingNotes ? 'Menyimpan...' : lastSaved ? `Tersimpan ${lastSaved.toLocaleTimeString()}` : ''}
          </span>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Catatan kelas bersama. Apa yang diketik tutor akan muncul di sini secara real-time!"
          className="w-full min-h-[200px] p-4 bg-yellow-50/50 border border-amber-200/50 rounded-xl outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 resize-y text-slate-700 leading-relaxed font-medium custom-scrollbar"
        />
      </Card>
    </>
  );
}
