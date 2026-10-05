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

  // Quiz Packages
  const [cbtPackages, setCbtPackages] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      // Notes
      const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
      if (noteData && noteData.shared_notes) setNotes(noteData.shared_notes);

      // CBT Packages (Active or Ended)
      const { data: pkgs } = await supabase
        .from('session_cbt_packages')
        .select('*')
        .eq('schedule_id', scheduleId)
        .in('status', ['active', 'ended'])
        .order('created_at', { ascending: false });
      if (pkgs) setCbtPackages(pkgs);
    };
    fetchInitial();

    // Polling for Packages and Notes
    const interval = setInterval(async () => {
      const { data: pkgs } = await supabase
        .from('session_cbt_packages')
        .select('*')
        .eq('schedule_id', scheduleId)
        .in('status', ['active', 'ended'])
        .order('created_at', { ascending: false });
      if (pkgs) setCbtPackages(pkgs);
      
      // Poll notes
      if (!isSavingNotes) {
        const { data: noteData } = await supabase.from('center_schedules').select('shared_notes').eq('id', scheduleId).single();
        if (noteData && noteData.shared_notes !== notes) {
          setNotes(noteData.shared_notes || '');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [scheduleId, supabase]);

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

          {/* CBT Packages List */}
          {cbtPackages.length > 0 && (
            <div className="mb-6 space-y-3 mt-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Aktivitas Kelas
              </h3>
              {cbtPackages.map(pkg => {
                const isCbt = ['cbt', 'assignment', 'material', 'form'].includes(pkg.activity_type) || !pkg.activity_type;
                const isPdf = pkg.activity_type === 'pdf';
                const isLink = pkg.activity_type === 'link';

                return (
                  <Card key={pkg.id} className={`p-4 border-l-4 ${pkg.status === 'active' ? 'border-l-indigo-500 hover:border-indigo-200' : 'border-l-slate-300'} transition-all`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-black text-slate-800 text-lg flex items-center gap-2">
                          {pkg.title}
                          {pkg.status === 'active' && <span className="text-[10px] uppercase font-black tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">Berlangsung</span>}
                          {pkg.status === 'ended' && <span className="text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Selesai</span>}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          {isCbt ? "Selesaikan paket soal ini untuk mengumpulkan bintang tambahan!" : `Buka ${isPdf ? 'PDF' : 'Tautan'} ini untuk mendapatkan 2 bintang.`}
                        </p>
                      </div>
                      
                      {isCbt ? (
                        pkg.status === 'active' ? (
                          <Button onClick={() => window.location.href = `/student/jadwal-les/${scheduleId}/cbt/${pkg.id}`} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg shadow-indigo-200">
                            Kerjakan Sekarang
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={() => window.location.href = `/student/jadwal-les/${scheduleId}/cbt/${pkg.id}`} className="w-full sm:w-auto font-bold rounded-xl">
                            Lihat Hasil
                          </Button>
                        )
                      ) : (
                        <Button 
                          onClick={async () => {
                            window.open(isPdf ? pkg.file_url : pkg.link_url, '_blank');
                            
                            // Award 2 stars if not already awarded
                            const { data: existingSub } = await supabase
                              .from('session_cbt_submissions')
                              .select('*')
                              .eq('package_id', pkg.id)
                              .eq('student_id', studentId)
                              .single();
                              
                            if (!existingSub) {
                              await supabase.from('session_cbt_submissions').insert({
                                package_id: pkg.id,
                                student_id: studentId,
                                score: 100,
                                stars_earned: 2
                              });
                              
                              const { data: existingStars } = await supabase
                                .from("student_stars")
                                .select("id, stars")
                                .eq("schedule_id", scheduleId)
                                .eq("student_id", studentId)
                                .single();
                                
                              if (existingStars) {
                                await supabase.from("student_stars").update({ stars: existingStars.stars + 2 }).eq("id", existingStars.id);
                              } else {
                                await supabase.from("student_stars").insert({
                                  student_id: studentId,
                                  schedule_id: scheduleId,
                                  stars: 2
                                });
                              }
                              toast.success("Horee! +2 Bintang ditambahkan!");
                            }
                          }} 
                          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-lg shadow-indigo-200"
                        >
                          Buka {isPdf ? 'PDF' : 'Tautan'}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
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
