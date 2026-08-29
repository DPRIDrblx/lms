"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, HelpCircle, Sparkles, Send, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react';
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
  const [quizType, setQuizType] = useState('Cek Konsep');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<any[]>([]);

  // Q&A states
  const [qaList, setQaList] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch for Q&A and active quizzes
    const fetchInteractions = async () => {
      const { data: qas } = await supabase.from('class_qa_board').select('*, profiles(full_name)').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
      if (qas) setQaList(qas);

      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);

      const { data: activeQ } = await supabase.from('class_live_quizzes').select('*').eq('schedule_id', scheduleId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single();
      if (activeQ) {
        setActiveQuizId(activeQ.id);
        setGeneratedQuiz(activeQ);
        fetchAnswers(activeQ.id);
      }
    };
    fetchInteractions();

    // Polling for Q&A and Answers
    const interval = setInterval(async () => {
      const { data: qas } = await supabase.from('class_qa_board').select('*, profiles(full_name)').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
      if (qas) setQaList(qas);

      // Poll notes
      if (!isSavingNotes) {
        const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
        if (noteData && noteData.shared_notes !== notes) {
          setNotes(noteData.shared_notes || '');
        }
      }

      if (activeQuizId) {
        fetchAnswers(activeQuizId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scheduleId, activeQuizId, supabase]);

  const fetchAnswers = async (qId: string) => {
    const { data } = await supabase.from('class_live_quiz_answers').select('*, profiles(full_name)').eq('quiz_id', qId);
    if (data) setQuizAnswers(data);
  };

  const handleGenerateQuiz = async () => {
    if (!topic) {
      toast.error("Rencana Pembelajaran (Topik) harus diisi dulu!");
      return;
    }
    
    setIsGenerating(true);
    setGeneratedQuiz(null);
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

      setGeneratedQuiz(data);
      toast.success("Kuis berhasil dibuat!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsGenerating(false);
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
  }, [notes, scheduleId, supabase]);

  const handleBroadcastQuiz = async () => {
    if (!generatedQuiz) return;
    const toastId = toast.loading("Mempersiapkan Kuis untuk Siswa...");
    try {
      // End previous active quizzes
      await supabase.from('class_live_quizzes').update({ status: 'ended' }).eq('schedule_id', scheduleId).eq('status', 'active');

      const { data, error } = await supabase.from('class_live_quizzes').insert({
        schedule_id: scheduleId,
        tutor_id: tutorId,
        question: generatedQuiz.question,
        options: generatedQuiz.options,
        correct_answer: generatedQuiz.correctAnswer,
        explanation: generatedQuiz.explanation,
        quiz_type: quizType,
        status: 'active'
      }).select().single();

      if (error) throw error;
      
      setActiveQuizId(data.id);
      setGeneratedQuiz(data);
      setQuizAnswers([]);
      toast.success("Kuis berhasil disebarkan! Menunggu jawaban siswa...", { id: toastId });
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
  };

  const handleEndQuiz = async () => {
    if (!activeQuizId) return;
    await supabase.from('class_live_quizzes').update({ status: 'ended' }).eq('id', activeQuizId);
    setActiveQuizId(null);
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
          <Sparkles className="w-4 h-4" /> Kuis Kilat AI
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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {!activeQuizId ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Subtopik Spesifik (Opsional)</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={selectedSubtopic} onChange={e => setSelectedSubtopic(e.target.value)}>
                      <option value="">Semua Subtopik</option>
                      {subtopics.filter(s => s).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Tipe Kuis</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" value={quizType} onChange={e => setQuizType(e.target.value)}>
                      <option value="Cek Konsep">Cek Konsep (Mudah)</option>
                      <option value="Latihan Soal">Latihan Soal (Sedang)</option>
                      <option value="HOTS">HOTS (Sulit)</option>
                      <option value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</option>
                    </select>
                  </div>
                </div>

                {!generatedQuiz ? (
                  <Button onClick={handleGenerateQuiz} disabled={isGenerating || !topic} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Buat Soal Kuis dengan AI
                  </Button>
                ) : (
                  <div className="p-4 border border-indigo-200 bg-indigo-50/50 rounded-xl space-y-4 relative">
                    <button onClick={() => setGeneratedQuiz(null)} className="absolute top-2 right-2 text-xs text-slate-400 hover:text-slate-600">Tutup</button>
                    <p className="font-bold text-slate-900 text-sm pr-6">{generatedQuiz.question}</p>
                    <div className="space-y-2">
                      {generatedQuiz.options.map((opt: string, i: number) => (
                        <div key={i} className={`p-2 rounded-lg text-sm border ${generatedQuiz.correctAnswer.includes(opt) ? 'bg-green-100 border-green-300 font-bold text-green-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleGenerateQuiz} variant="secondary" className="flex-1 border border-slate-200">Buat Ulang</Button>
                      <Button onClick={handleBroadcastQuiz} className="flex-1 bg-green-600 hover:bg-green-700 gap-2 text-white">
                        <Send className="w-4 h-4" /> Broadcast ke Siswa
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-bold animate-pulse">LIVE QUIZ</span>
                  <Button size="sm" variant="danger" onClick={handleEndQuiz}>Tutup Kuis</Button>
                </div>
                <p className="font-bold text-slate-900 text-sm">{generatedQuiz?.question}</p>
                <div className="pt-2 border-t border-green-200">
                  <h4 className="text-xs font-bold text-green-800 mb-2">Jawaban Masuk ({quizAnswers.length}):</h4>
                  {quizAnswers.length === 0 ? (
                    <p className="text-sm text-green-700 italic">Belum ada siswa yang menjawab...</p>
                  ) : (
                    <div className="space-y-1">
                      {quizAnswers.map((ans, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-green-100 text-sm">
                          <span className="font-bold">{ans.profiles?.full_name || 'Anonim'}</span>
                          {ans.is_correct ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <span className="text-red-500 font-bold">X</span>}
                        </div>
                      ))}
                    </div>
                  )}
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
