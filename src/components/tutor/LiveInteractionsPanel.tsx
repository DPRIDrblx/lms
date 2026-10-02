"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, HelpCircle, Sparkles, Send, Loader2, PlayCircle, CheckCircle2, ListChecks, ArrowRight, CheckSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';
import SessionCbtManager from './SessionCbtManager';

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

  // Q&A states
  const [qaList, setQaList] = useState<any[]>([]);

  useEffect(() => {
    const fetchInteractions = async () => {
      const { data: qas } = await supabase.from('class_qa_board').select('*, profiles(full_name)').eq('schedule_id', scheduleId).order('created_at', { ascending: false });
      if (qas) setQaList(qas);

      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);
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
    }, 5000);

    return () => clearInterval(interval);
  }, [scheduleId, supabase, isSavingNotes, notes]);

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
          <Sparkles className="w-4 h-4" /> Paket Soal (CBT)
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
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <SessionCbtManager 
              scheduleId={scheduleId}
              tutorId={tutorId}
              topic={topic}
              subtopics={subtopics}
              subject={subject}
              level={level}
            />
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
