"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, HelpCircle, Sparkles, Send, Loader2, PlayCircle, CheckCircle2, ListChecks, ArrowRight, CheckSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LiveInteractionsPanel({
  scheduleId,
  tutorId,
  topic,
  subtopics,
  subject,
  level
}: {
  scheduleId: string,
  tutorId: string,
  topic: string,
  subtopics: string[],
  subject: string,
  level: string
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'quiz' | 'qa' | 'notes'>('quiz');

  // Notes states
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Quiz states
  const [quizMode, setQuizMode] = useState<'ai' | 'manual'>('ai');
  const [quizType, setQuizType] = useState('Cek Konsep');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual Quiz states
  const [manualQuestion, setManualQuestion] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectIndex, setManualCorrectIndex] = useState(0);

  // Bank Soal states
  const [draftQuizzes, setDraftQuizzes] = useState<any[]>([]);
  
  // Active Quiz states
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<any>(null); // The quiz currently active or discussing
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);

  // Q&A states
  const [qaList, setQaList] = useState<any[]>([]);

  const fetchQuizzes = async () => {
    // Fetch draft
    const { data: drafts } = await supabase.from('class_live_quizzes')
      .select('*').eq('schedule_id', scheduleId).eq('status', 'draft').order('created_at', { ascending: false });
    if (drafts) setDraftQuizzes(drafts);

    // Fetch active or discussing
    const { data: activeQ } = await supabase.from('class_live_quizzes')
      .select('*').eq('schedule_id', scheduleId).in('status', ['active', 'discussing']).order('created_at', { ascending: false }).limit(1).single();
    
    if (activeQ) {
      setActiveQuizId(activeQ.id);
      setActiveQuiz(activeQ);
      fetchAnswers(activeQ.id);
    } else {
      setActiveQuizId(null);
      setActiveQuiz(null);
    }
  };

  useEffect(() => {
    const fetchInteractions = async () => {
      const { data: qas } = await supabase.from('class_qa_board').select('*, profiles(full_name)').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
      if (qas) setQaList(qas);

      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);

      await fetchQuizzes();
    };
    fetchInteractions();

    const interval = setInterval(async () => {
      const { data: qas } = await supabase.from('class_qa_board').select('*, profiles(full_name)').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
      if (qas) setQaList(qas);

      if (!isSavingNotes) {
        const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
        if (noteData && noteData.shared_notes !== notes) {
          setNotes(noteData.shared_notes || '');
        }
      }

      await fetchQuizzes();
    }, 5000);

    return () => clearInterval(interval);
  }, [scheduleId, supabase]);

  const fetchAnswers = async (qId: string) => {
    const { data } = await supabase.from('class_live_quiz_answers').select('*, profiles(full_name)').eq('quiz_id', qId);
    if (data) setQuizAnswers(data);
  };

  const handleGenerateQuizAI = async () => {
    if (!topic) {
      toast.error("Rencana Pembelajaran (Topik) harus diisi dulu!");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI sedang menyusun kuis...");

    try {
      const res = await fetch("/api/ai/generate-live-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang: level,
          mapel: subject,
          topik: topic,
          subtopik: selectedSubtopic || subtopics.join(", "),
          tipeKuis: quizType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save to Draft
      const { error } = await supabase.from('class_live_quizzes').insert({
        schedule_id: scheduleId,
        tutor_id: tutorId,
        question: data.question,
        options: data.options,
        correct_answer: data.correctAnswer,
        explanation: data.explanation,
        quiz_type: quizType,
        status: 'draft'
      });

      if (error) throw error;
      await fetchQuizzes();
      toast.success("Kuis AI berhasil ditambahkan ke Bank Soal!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManualQuiz = async () => {
    if (!manualQuestion.trim()) return toast.error("Pertanyaan tidak boleh kosong");
    if (manualOptions.some(opt => !opt.trim())) return toast.error("Semua pilihan ganda harus diisi");

    const toastId = toast.loading("Menyimpan kuis manual...");
    try {
      const { error } = await supabase.from('class_live_quizzes').insert({
        schedule_id: scheduleId,
        tutor_id: tutorId,
        question: manualQuestion,
        options: manualOptions,
        correct_answer: [manualOptions[manualCorrectIndex]],
        explanation: "Penjelasan akan dibahas langsung oleh Tutor.",
        quiz_type: 'Manual',
        status: 'draft'
      });

      if (error) throw error;

      // Reset form
      setManualQuestion('');
      setManualOptions(['', '', '', '']);
      setManualCorrectIndex(0);
      
      await fetchQuizzes();
      toast.success("Kuis manual berhasil ditambahkan ke Bank Soal!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handlePushQuiz = async (quizId: string) => {
    const toastId = toast.loading("Mempersiapkan Kuis untuk Siswa...");
    try {
      // End any active/discussing quizzes first
      await supabase.from('class_live_quizzes').update({ status: 'ended' }).eq('schedule_id', scheduleId).in('status', ['active', 'discussing']);

      // Push the selected quiz
      const { error } = await supabase.from('class_live_quizzes').update({ status: 'active' }).eq('id', quizId);
      if (error) throw error;

      await fetchQuizzes();
      toast.success("Kuis berhasil disebarkan! Menunggu jawaban siswa...", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleDiscussQuiz = async () => {
    if (!activeQuizId) return;
    await supabase.from('class_live_quizzes').update({ status: 'discussing' }).eq('id', activeQuizId);
    await fetchQuizzes();
    toast.success("Membahas kuis bersama siswa.");
  };

  const handleEndQuiz = async () => {
    if (!activeQuizId) return;
    await supabase.from('class_live_quizzes').update({ status: 'ended' }).eq('id', activeQuizId);
    await fetchQuizzes();
    toast.success("Kuis ditutup.");
  };

  const handleMarkAnswered = async (id: string, currentStatus: boolean) => {
    await supabase.from('class_qa_board').update({ is_answered: !currentStatus }).eq('id', id);
    setQaList(prev => prev.map(q => q.id === id ? { ...q, is_answered: !currentStatus } : q));
  };

  return (
    <Card className="p-0 overflow-hidden border-indigo-100 shadow-sm mt-6 transition-all duration-300">
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Sparkles className="w-4 h-4" /> Kuis Kilat
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'qa' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <HelpCircle className="w-4 h-4" /> Q&A Siswa
          {qaList.filter(q => !q.is_answered).length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{qaList.filter(q => !q.is_answered).length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'notes' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MessageSquare className="w-4 h-4" /> Catatan Kelas
        </button>
      </div>

      <div className="p-5 bg-white">
        {activeTab === 'quiz' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {!activeQuizId ? (
              <>
                <div className="border border-indigo-100 p-4 rounded-xl shadow-sm bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-500" />
                    Buat Soal Kuis Baru
                  </h3>
                  
                  {/* Mode Selector */}
                  <div className="flex bg-slate-200/50 p-1 rounded-xl mb-4">
                    <button 
                      onClick={() => setQuizMode('ai')} 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${quizMode === 'ai' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      AI Generate
                    </button>
                    <button 
                      onClick={() => setQuizMode('manual')} 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${quizMode === 'manual' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Ketik Manual
                    </button>
                  </div>

                  {quizMode === 'ai' ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Subtopik Spesifik (Opsional)</label>
                          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={selectedSubtopic} onChange={e => setSelectedSubtopic(e.target.value)}>
                            <option value="">Semua Subtopik</option>
                            {subtopics.filter(s => s).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Tipe Kuis</label>
                          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm" value={quizType} onChange={e => setQuizType(e.target.value)}>
                            <option value="Cek Konsep">Cek Konsep (Mudah)</option>
                            <option value="Latihan Soal">Latihan Soal (Sedang)</option>
                            <option value="HOTS">HOTS (Sulit)</option>
                            <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
                          </select>
                        </div>
                      </div>

                      <Button onClick={handleGenerateQuizAI} disabled={isGenerating || !topic} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Generate & Simpan ke Bank Soal
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Pertanyaan</label>
                        <textarea 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm h-20 resize-none"
                          placeholder="Ketik pertanyaan kuis di sini..."
                          value={manualQuestion}
                          onChange={(e) => setManualQuestion(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 block">Pilihan Jawaban (A-D)</label>
                        {manualOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              type="text" 
                              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                              placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...manualOptions];
                                newOpts[i] = e.target.value;
                                setManualOptions(newOpts);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Jawaban Benar</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          value={manualCorrectIndex}
                          onChange={(e) => setManualCorrectIndex(Number(e.target.value))}
                        >
                          {manualOptions.map((_, i) => (
                            <option key={i} value={i}>Pilihan {String.fromCharCode(65 + i)}</option>
                          ))}
                        </select>
                      </div>

                      <Button onClick={handleSaveManualQuiz} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 text-white">
                        <CheckSquare className="w-4 h-4" /> Simpan ke Bank Soal
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bank Soal List */}
                <div className="pt-2">
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Bank Soal Sesi Ini ({draftQuizzes.length})</h3>
                  {draftQuizzes.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                      Belum ada soal di Bank Soal. Buat soal di atas!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {draftQuizzes.map((quiz, i) => (
                        <div key={quiz.id} className="p-4 border border-slate-200 rounded-xl bg-white hover:border-indigo-300 transition-colors">
                          <p className="font-bold text-slate-900 text-sm mb-3 line-clamp-2">{quiz.question}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                              Tipe: {quiz.quiz_type}
                            </span>
                            <Button size="sm" onClick={() => handlePushQuiz(quiz.id)} className="bg-green-600 hover:bg-green-700 gap-1 text-white">
                              <PlayCircle className="w-4 h-4" /> Push ke Siswa
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 border-2 border-indigo-200 bg-indigo-50/30 rounded-xl space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <span className={`text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse ${activeQuiz.status === 'active' ? 'bg-red-500' : 'bg-blue-500'}`}>
                      {activeQuiz.status === 'active' ? 'LIVE: Mengerjakan' : 'Membahas Soal'}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">Tipe: {activeQuiz.quiz_type}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleEndQuiz}>
                    Tutup Kuis Ini
                  </Button>
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">{activeQuiz.question}</h2>
                  
                  {activeQuiz.status === 'discussing' && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs font-bold text-green-700 uppercase mb-1">Kunci Jawaban</p>
                      <p className="text-sm font-bold text-slate-800">{activeQuiz.correct_answer.join(', ')}</p>
                      
                      {activeQuiz.explanation && (
                        <div className="mt-3 pt-3 border-t border-green-200/50">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Penjelasan AI</p>
                          <p className="text-sm text-slate-700">{activeQuiz.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center justify-between">
                      Statistik Jawaban Siswa ({quizAnswers.length})
                      {activeQuiz.status === 'active' && quizAnswers.length > 0 && (
                        <Button size="sm" onClick={handleDiscussQuiz} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-8">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Bahas Sekarang
                        </Button>
                      )}
                    </h4>
                    
                    {quizAnswers.length === 0 ? (
                      <div className="text-center p-6 border border-dashed border-indigo-200 rounded-xl bg-white">
                        <p className="text-sm text-slate-500 italic">Belum ada siswa yang merespons...</p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {activeQuiz.options.map((opt: string, i: number) => {
                          const count = quizAnswers.filter(a => Array.isArray(a.student_answer) ? a.student_answer.includes(opt) : a.student_answer === opt).length;
                          const percentage = Math.round((count / quizAnswers.length) * 100);
                          const isCorrectOption = activeQuiz.correct_answer.includes(opt);
                          
                          return (
                            <div key={i} className="relative bg-white border border-slate-200 rounded-lg overflow-hidden">
                              <div 
                                className={`absolute inset-y-0 left-0 opacity-20 ${activeQuiz.status === 'discussing' ? (isCorrectOption ? 'bg-green-500' : 'bg-red-500') : 'bg-indigo-500'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                              <div className="relative p-3 flex justify-between items-center text-sm">
                                <div className="flex gap-2 items-center">
                                  <span className="font-bold text-slate-400 w-5">{String.fromCharCode(65 + i)}.</span>
                                  <span className="font-medium text-slate-700">{opt}</span>
                                </div>
                                <span className="font-bold text-slate-900">{count} orang ({percentage}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'qa' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Daftar Pertanyaan Siswa</h3>
            {qaList.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-sm">Belum ada pertanyaan dari siswa.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {qaList.map(q => (
                  <div key={q.id} className={`p-4 rounded-xl border ${q.is_answered ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-500">{q.profiles?.full_name || 'Anonim'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(q.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className={`text-sm mb-4 ${q.is_answered ? 'text-slate-500' : 'text-slate-800 font-medium'}`}>{q.question}</p>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant={q.is_answered ? "secondary" : "primary"}
                        onClick={() => handleMarkAnswered(q.id, q.is_answered)}
                        className={q.is_answered ? 'text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                      >
                        {q.is_answered ? 'Tandai Belum Terjawab' : 'Tandai Sudah Terjawab'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-800">Catatan Kelas Kolaboratif</h3>
              <span className="text-xs text-slate-400">
                {isSavingNotes ? 'Menyimpan...' : lastSaved ? `Tersimpan ${lastSaved.toLocaleTimeString()}` : ''}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ketik catatan penting di sini. Apa yang Anda ketik akan langsung terlihat oleh semua siswa secara real-time..."
              className="w-full min-h-[300px] p-4 bg-yellow-50/50 border border-amber-200/50 rounded-xl outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 resize-y text-slate-700 leading-relaxed font-medium custom-scrollbar"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
