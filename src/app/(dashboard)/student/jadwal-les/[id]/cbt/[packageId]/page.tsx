"use client";

import React, { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Star, Brain, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

    // Award stars
    if (starsEarned > 0) {
      const { data: existingStars } = await supabase
        .from("student_stars")
        .select("id, stars")
        .eq("schedule_id", resolvedParams.id)
        .eq("student_id", profile.id)
        .single();
        
      if (existingStars) {
        await supabase.from("student_stars").update({ stars: existingStars.stars + starsEarned }).eq("id", existingStars.id);
      } else {
        await supabase.from("student_stars").insert({
          student_id: profile.id,
          schedule_id: resolvedParams.id,
          stars: starsEarned
        });
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
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in">
      {/* Mobile header / Top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
        <Button variant="ghost" className="w-10 h-10 p-0" onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-bold text-slate-800 text-sm truncate px-2">{pkg.title}</span>
        <div className="w-8"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 md:h-2">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {hasSubmitted ? (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-2">Kuis Selesai!</h2>
                <p className="text-slate-500 mb-8">Kerja bagus! Kamu telah menyelesaikan paket soal ini.</p>
                
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-800 mb-1">Skor Akhir</p>
                    <p className="text-4xl font-black text-indigo-600">{submissionData?.score}</p>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <p className="text-sm font-bold text-amber-800 mb-1">Bintang</p>
                    <p className="text-4xl font-black text-amber-500 flex items-center justify-center gap-2">+{submissionData?.stars_earned} <Star className="w-6 h-6 fill-amber-500" /></p>
                  </div>
                </div>

                <Button onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-14 px-8 font-bold text-lg w-full max-w-md">
                  Kembali ke Kelas
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex gap-2">
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Soal {currentIndex + 1}/{questions.length}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Brain className="w-3 h-3" /> {currentQ.difficulty}
                    </span>
                  </div>
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-700" /> Bintang
                  </span>
                </div>
                
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 leading-relaxed whitespace-pre-wrap">
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
                          ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' 
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className={`text-base md:text-lg pt-0.5 ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        {!hasSubmitted && (
          <div className="bg-white border-t border-slate-200 p-4 md:p-6 flex justify-between items-center z-10 shrink-0">
            <Button 
              variant="outline" 
              className="rounded-xl h-12 px-6 font-bold"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={isFirstQ}
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Sebelum
            </Button>
            
            {!isLastQ ? (
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 font-bold"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Selanjut <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-8 font-black shadow-lg shadow-emerald-200"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Kumpulkan
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Sidebar / Question Map (Desktop only) */}
      <div className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col h-full z-10 shrink-0">
        <div className="p-6 border-b border-slate-100">
          <Button variant="ghost" onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)} className="-ml-4 mb-4 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Kelas
          </Button>
          <h3 className="font-black text-slate-900 text-xl">{pkg.title}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-2">
            <Clock className="w-4 h-4" /> Kerjakan sekarang
          </p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Peta Soal</h4>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] && answers[q.id].length > 0;
              const isCurrent = i === currentIndex;
              
              let btnClass = "w-10 h-10 rounded-xl font-bold transition-all border-2 ";
              if (isCurrent) btnClass += "border-indigo-600 bg-indigo-50 text-indigo-700 ring-4 ring-indigo-100";
              else if (isAnswered) btnClass += "border-indigo-600 bg-indigo-600 text-white shadow-md";
              else btnClass += "border-slate-200 bg-white text-slate-500 hover:border-indigo-300";
              
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
