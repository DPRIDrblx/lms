"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const renderModal = (content: React.ReactNode) => {
    if (mounted && typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }
    return null;
  };
  
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
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      // Notes
      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);

      // Quiz (Active or Discussing)
      const { data: activeQ } = await supabase.from('class_live_quizzes').select('*').eq('schedule_id', scheduleId).in('status', ['active', 'discussing']).order('created_at', { ascending: false }).limit(1).single();
      if (activeQ) {
        setActiveQuiz(activeQ);
        // Check if already answered
        const { data: ans } = await supabase.from('class_live_quiz_answers').select('*').eq('quiz_id', activeQ.id).eq('student_id', studentId).single();
        if (ans) {
          setHasAnswered(true);
          setSelectedAnswers(ans.answer);
          setIsCorrect(ans.is_correct);
        }
      }
    };
    fetchInitial();

    // Polling for Quizzes (every 3 seconds for better real-time feel)
    const interval = setInterval(async () => {
      const { data: activeQ } = await supabase.from('class_live_quizzes').select('*').eq('schedule_id', scheduleId).in('status', ['active', 'discussing']).order('created_at', { ascending: false }).limit(1).single();
      
      if (activeQ) {
        if (!activeQuiz || activeQuiz.id !== activeQ.id || activeQuiz.status !== activeQ.status) {
          setActiveQuiz(activeQ);
          
          if (!activeQuiz || activeQuiz.id !== activeQ.id) {
            // New quiz entirely
            setHasAnswered(false);
            setSelectedAnswers([]);
            setIsCorrect(null);
            
            // Check if already answered just in case
            const { data: ans } = await supabase.from('class_live_quiz_answers').select('*').eq('quiz_id', activeQ.id).eq('student_id', studentId).single();
            if (ans) {
              setHasAnswered(true);
              setSelectedAnswers(ans.answer);
              setIsCorrect(ans.is_correct);
            }
          }
        }
      } else {
        if (activeQuiz) {
          setActiveQuiz(null); // quiz ended
          setHasAnswered(false);
          setSelectedAnswers([]);
          setIsCorrect(null);
        }
      }
      
      // Poll notes
      if (!isSavingNotes) {
        const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
        if (noteData && noteData.shared_notes !== notes) {
          setNotes(noteData.shared_notes || '');
        }
      }
    }, 3000);

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
    
    // Evaluate answer
    const checkCorrect = JSON.stringify(selectedAnswers.sort()) === JSON.stringify(activeQuiz.correct_answer.sort());
    
    const toastId = toast.loading("Mengumpulkan jawaban...");
    const { error } = await supabase.from('class_live_quiz_answers').insert({
      quiz_id: activeQuiz.id,
      student_id: studentId,
      answer: selectedAnswers,
      is_correct: checkCorrect
    });

    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success("Jawaban tersimpan! Menunggu pembahasan tutor...", { id: toastId });
      setHasAnswered(true);
      setIsCorrect(checkCorrect);
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
          {showQA && renderModal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
              <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                  <h3 className="font-bold text-lg">Tanya Tutor</h3>
                  <button onClick={() => setShowQA(false)} className="hover:bg-indigo-700 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-5 bg-slate-50/50">
                  <textarea 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl resize-none min-h-[140px] focus:outline-indigo-500 shadow-sm transition-all text-slate-700"
                    placeholder="Tulis pertanyaanmu di sini..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                  ></textarea>
                  <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                    Kirim sebagai Anonim
                  </label>
                  <Button onClick={handleAskQuestion} disabled={!question.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-base font-bold shadow-md shadow-indigo-200">
                    Kirim Pertanyaan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Live Quiz Modal */}
          {activeQuiz && renderModal(
            <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto w-full h-full animate-in fade-in duration-300">
              <div className="min-h-full w-full max-w-3xl mx-auto p-4 md:p-8 pt-8 pb-24">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                  <div className="p-6 md:p-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-black px-4 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-sm animate-pulse">
                      <Sparkles className="w-3 h-3" /> {activeQuiz.status === 'discussing' ? 'PEMBAHASAN KUIS' : 'KUIS KILAT LIVE'}
                    </div>
                      {hasAnswered && activeQuiz.status === 'active' && <span className="bg-amber-100 text-amber-700 text-sm font-bold px-4 py-2 rounded-full">⏳ Menunggu Tutor...</span>}
                      {hasAnswered && activeQuiz.status === 'discussing' && (
                        <span className={`text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-sm ${isCorrect ? 'bg-green-100 text-green-700 ring-1 ring-green-400' : 'bg-red-100 text-red-700 ring-1 ring-red-400'}`}>
                          {isCorrect ? '✅ Jawaban Benar!' : '❌ Kurang Tepat'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 leading-relaxed whitespace-pre-wrap">{activeQuiz.question}</h2>
                    
                    <div className="space-y-4">
                      {activeQuiz.options.map((opt: string, i: number) => {
                        const isSelected = selectedAnswers.includes(opt);
                        const isCorrectOption = activeQuiz.correct_answer.includes(opt);
                        const isDiscussing = activeQuiz.status === 'discussing';

                        let buttonClass = 'border-slate-200 bg-white text-slate-700'; // default

                        if (isDiscussing) {
                          if (isCorrectOption) {
                            buttonClass = 'border-green-500 bg-green-50 text-green-700 font-bold shadow-md shadow-green-100';
                          } else if (isSelected && !isCorrectOption) {
                            buttonClass = 'border-red-500 bg-red-50 text-red-700';
                          } else {
                            buttonClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                          }
                        } else {
                          // Active status
                          if (isSelected) {
                            buttonClass = 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-md shadow-indigo-100';
                          } else if (!hasAnswered) {
                            buttonClass = 'border-slate-200 hover:border-indigo-300 bg-white text-slate-700';
                          } else {
                            buttonClass = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={i}
                            disabled={hasAnswered}
                            onClick={() => toggleQuizAnswer(opt)}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all group hover:scale-[1.01] ${buttonClass}`}
                          >
                            <span className="inline-block w-8 text-lg font-black opacity-50">{String.fromCharCode(65+i)}.</span> 
                            <span className="text-lg">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {!hasAnswered && (
                      <Button onClick={handleQuizSubmit} disabled={selectedAnswers.length === 0} className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-7 text-xl font-black shadow-lg shadow-indigo-200 transition-transform hover:scale-[1.02]">
                        Kunci Jawaban! 🚀
                      </Button>
                    )}

                    {hasAnswered && activeQuiz.status === 'active' && (
                      <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center animate-pulse">
                        <p className="text-lg font-black text-amber-800">✅ Jawaban Berhasil Disimpan!</p>
                        <p className="text-sm font-bold text-amber-600 mt-2">Duduk manis dan tunggu tutor membahas soal ini ya...</p>
                      </div>
                    )}

                    {activeQuiz.status === 'discussing' && activeQuiz.explanation && (
                      <div className="mt-10 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                        <p className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" /> Penjelasan Tutor / AI
                        </p>
                        <p className="text-base text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{activeQuiz.explanation}</p>
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
