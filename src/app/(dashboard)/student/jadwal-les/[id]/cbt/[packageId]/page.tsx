"use client";

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Star, Brain, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { awardCbtStars } from '@/app/actions/cbt';
export default function StudentCbtPage({ 
  params 
}: { 
  params: Promise<{ id: string, packageId: string }> 
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [pkg, setPkg] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // Check if already submitted
      const { data: existingSub } = await supabase
        .from('session_cbt_submissions')
        .select('*')
        .eq('package_id', resolvedParams.packageId)
        .eq('student_id', prof.id)
        .single();

      if (existingSub) {
        setHasSubmitted(true);
        setSubmissionData(existingSub);
      }

      // Fetch package and questions
      const { data: pData } = await supabase
        .from('session_cbt_packages')
        .select('*')
        .eq('id', resolvedParams.packageId)
        .single();
        
      if (pData) setPkg(pData);

      const { data: qData } = await supabase
        .from('session_cbt_questions')
        .select('*')
        .eq('package_id', resolvedParams.packageId)
        .order('order_index', { ascending: true });
        
      if (qData) {
        setQuestions(qData);
        // Initialize answers state if needed or load from existingSub
        if (existingSub && existingSub.answers) {
          setAnswers(existingSub.answers);
        }
      }
      
      setLoading(false);
    }
    init();
  }, [resolvedParams.packageId, supabase, router]);

  const toggleOption = (qId: string, optText: string, type: string) => {
    if (hasSubmitted) return;
    
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (type === 'complex_mcq' || type === 'Pilihan Ganda Kompleks') {
        if (current.includes(optText)) return { ...prev, [qId]: current.filter(o => o !== optText) };
        return { ...prev, [qId]: [...current, optText] };
      } else {
        return { ...prev, [qId]: [optText] }; // single answer
      }
    });
  };

  const calculateScoreAndStars = () => {
    let totalScore = 0;
    let starsEarned = 0;
    
    questions.forEach(q => {
      const userAns = answers[q.id] || [];
      const correctOpts = q.options.filter((o:any) => o.is_correct).map((o:any) => o.text);
      
      const isCorrect = JSON.stringify(userAns.sort()) === JSON.stringify(correctOpts.sort());
      if (isCorrect) {
        totalScore += 100 / questions.length;
        // Bintang rules:
        // Cek Konsep (Mudah) = 2
        // Latihan Soal (Sedang) = 3
        // HOTS (Sulit) = 4
        // PG Kompleks = 2
        if (q.question_type === 'Pilihan Ganda Kompleks' || q.question_type === 'complex_mcq') {
          starsEarned += 2;
        } else if (q.difficulty.toLowerCase() === 'mudah' || q.question_type === 'Cek Konsep') {
          starsEarned += 2;
        } else if (q.difficulty.toLowerCase() === 'sedang' || q.question_type === 'Latihan Soal') {
          starsEarned += 3;
        } else if (q.difficulty.toLowerCase() === 'sulit' || q.question_type === 'HOTS') {
          starsEarned += 4;
        } else {
          starsEarned += 2; // default
        }
      }
    });

    return { score: Math.round(totalScore), starsEarned };
  };

  const handleSubmit = async () => {
    if (!confirm("Apakah kamu yakin ingin mengumpulkan jawaban?")) return;
    setSubmitting(true);
    
    const { score, starsEarned } = calculateScoreAndStars();
    
    const { data, error } = await supabase
      .from('session_cbt_submissions')
      .insert({
        package_id: pkg.id,
        student_id: profile.id,
        answers: answers,
        score: score,
        stars_earned: starsEarned
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Award stars using Server Action to bypass RLS
    if (starsEarned > 0) {
      const res = await awardCbtStars(profile.id, resolvedParams.id, starsEarned);
      if (!res.success) {
        console.error("Failed to award stars:", res.error);
        // We don't block the user, just log it. They still submitted the quiz.
      }
    }

    toast.success("Berhasil mengumpulkan jawaban!");
    setHasSubmitted(true);
    setSubmissionData(data);
    setSubmitting(false);
  };

  if (loading) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;
  if (!pkg || questions.length === 0) return <div className="p-8">Paket soal tidak ditemukan atau kosong.</div>;

  const currentQ = questions[currentIndex];
  const isLastQ = currentIndex === questions.length - 1;
  const isFirstQ = currentIndex === 0;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-white/80 backdrop-blur-lg border-b border-slate-200/50 p-4 flex justify-between items-center z-20 sticky top-0 shadow-sm">
        <Button variant="ghost" className="w-10 h-10 p-0 rounded-full hover:bg-slate-100" onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)}>
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
        <span className="font-black text-slate-800 text-sm truncate px-3 bg-slate-100 rounded-full py-1.5">{pkg.title}</span>
        <div className="w-10"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200/50 h-2 md:h-2.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)] relative" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 blur-[2px]"></div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar relative">
          
          <div className="max-w-4xl mx-auto w-full">
            {hasSubmitted ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-14 shadow-2xl border border-white/50 text-center animate-in zoom-in-95 duration-700 mt-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-200 border-4 border-white">
                    <CheckCircle2 className="w-14 h-14 text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">Kuis Selesai!</h2>
                  <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">Luar biasa! Kamu telah menyelesaikan misi ini dengan sangat baik.</p>
                  
                  <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-lg mx-auto mb-10">
                    <div className="bg-indigo-50/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-indigo-100/50 shadow-sm hover:scale-[1.02] transition-transform">
                      <p className="text-sm font-black text-indigo-400 mb-2 uppercase tracking-widest">Skor Akhir</p>
                      <p className="text-5xl md:text-6xl font-black text-indigo-600 drop-shadow-sm">{submissionData?.score}</p>
                    </div>
                    <div className="bg-amber-50/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-amber-100/50 shadow-sm hover:scale-[1.02] transition-transform">
                      <p className="text-sm font-black text-amber-500 mb-2 uppercase tracking-widest">Bintang</p>
                      <p className="text-5xl md:text-6xl font-black text-amber-500 flex items-center justify-center gap-2 drop-shadow-sm">
                        +{submissionData?.stars_earned} <Star className="w-8 h-8 md:w-10 md:h-10 fill-amber-400" />
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl h-14 px-10 font-bold text-lg w-full max-w-xs shadow-xl shadow-slate-200 transition-all hover:-translate-y-1">
                    Kembali ke Kelas
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100/50 p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Brain className="w-64 h-64 text-indigo-900" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-wrap justify-between items-center mb-10 gap-4">
                    <div className="flex gap-2">
                      <span className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">
                        Soal {currentIndex + 1} dari {questions.length}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1 border ${
                        currentQ.difficulty === 'Mudah' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        currentQ.difficulty === 'Sedang' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-rose-50 text-rose-600 border-rose-200'
                      }`}>
                        <Brain className="w-3 h-3" /> {currentQ.difficulty}
                      </span>
                    </div>
                    <span className="bg-amber-50 border border-amber-200 text-amber-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                      <Star className="w-3 h-3 fill-amber-500" /> Bintang
                    </span>
                  </div>
                
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 leading-snug whitespace-pre-wrap">
                    {currentQ.question_text}
                  </h2>
                  
                  {/* Options */}
                  <div className="space-y-4">
                    {currentQ.options.map((opt: any, i: number) => {
                      const isSelected = (answers[currentQ.id] || []).includes(opt.text);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleOption(currentQ.id, opt.text, currentQ.question_type)}
                          className={`w-full text-left p-5 rounded-2xl border-2 transition-all group hover:scale-[1.01] flex items-start gap-4 ${
                            isSelected 
                            ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100/50' 
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-black transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className={`text-lg pt-1.5 leading-relaxed ${isSelected ? 'text-indigo-900 font-bold' : 'text-slate-600 font-medium'}`}>
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        {!hasSubmitted && (
          <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/60 p-4 md:p-6 flex justify-between items-center z-10 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <Button 
              variant="secondary" 
              className="rounded-2xl h-14 px-6 md:px-8 font-black border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={isFirstQ}
            >
              <ChevronLeft className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Sebelumnya</span>
            </Button>
            
            {!isLastQ ? (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-6 md:px-8 font-black shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                <span className="hidden md:inline">Selanjutnya</span> <ChevronRight className="w-5 h-5 md:ml-1" />
              </Button>
            ) : (
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl h-14 px-8 md:px-10 font-black shadow-lg shadow-emerald-200 transition-transform hover:-translate-y-0.5"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2 text-emerald-100" />}
                Kumpulkan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sidebar / Question Map (Desktop only) */}
      <div className="hidden md:flex w-80 lg:w-96 bg-white/60 backdrop-blur-3xl border-l border-slate-200/50 flex-col h-full z-10 shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative">
        <div className="p-8 border-b border-slate-200/50 relative z-10">
          <Button variant="ghost" onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} className="-ml-4 mb-6 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full h-10 px-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Kelas
          </Button>
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-black text-slate-800 text-2xl leading-tight">{pkg.title}</h3>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-3">
            <Clock className="w-4 h-4" /> Evaluasi Kompetensi
          </p>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Peta Soal</h4>
            <span className="text-xs font-bold text-slate-500">{Object.keys(answers).length}/{questions.length} Dijawab</span>
          </div>
          
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-3">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] && answers[q.id].length > 0;
              const isCurrent = i === currentIndex;
              
              let btnClass = "w-12 h-12 rounded-2xl font-black transition-all border-2 flex items-center justify-center ";
              if (isCurrent) btnClass += "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_4px_rgba(99,102,241,0.15)] scale-110 z-10";
              else if (isAnswered) btnClass += "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200/50";
              else btnClass += "border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50";
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={btnClass}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
