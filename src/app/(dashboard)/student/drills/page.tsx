"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookA, Languages, Dna, Atom, FlaskConical, Telescope, 
  Globe, Landmark, Scale, BrainCircuit, Play, CheckCircle2, 
  XCircle, ChevronRight, ChevronLeft, RefreshCcw, Sparkles, AlertCircle, ArrowLeft, Star, Clock, Info, Target, History, Trophy, Plus, Minus
} from "lucide-react";
import toast from "react-hot-toast";

const SUBJECTS = [
  { id: "Bahasa Indonesia", name: "Bahasa Indonesia", icon: BookA, color: "text-rose-500", bg: "bg-rose-100", border: "border-rose-200" },
  { id: "Bahasa Inggris", name: "Bahasa Inggris", icon: Languages, color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200" },
  { id: "IPA Biologi", name: "IPA Biologi", icon: Dna, color: "text-green-500", bg: "bg-green-100", border: "border-green-200" },
  { id: "IPA Fisika", name: "IPA Fisika", icon: Atom, color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-200" },
  { id: "IPA Kimia", name: "IPA Kimia", icon: FlaskConical, color: "text-pink-500", bg: "bg-pink-100", border: "border-pink-200" },
  { id: "IPA Astronomi", name: "IPA Astronomi", icon: Telescope, color: "text-indigo-500", bg: "bg-indigo-100", border: "border-indigo-200" },
  { id: "IPA Bumi dan Antariksa", name: "Bumi & Antariksa", icon: Globe, color: "text-cyan-500", bg: "bg-cyan-100", border: "border-cyan-200" },
  { id: "IPS", name: "IPS", icon: Landmark, color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200" },
  { id: "Pendidikan Pancasila", name: "Pendidikan Pancasila", icon: Scale, color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200" }
];

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subtopic: string;
};

type DrillStats = {
  totalCorrect: number;
  totalQuestions: number;
  totalScore: number;
  subjectStats: Record<string, { correct: number, total: number, xp: number }>;
};

export default function DrillsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [view, setView] = useState<'dashboard' | 'setup' | 'loading' | 'play' | 'result' | 'review'>('dashboard');
  
  // Dashboard Stats
  const [stats, setStats] = useState<DrillStats>({ totalCorrect: 0, totalQuestions: 0, totalScore: 0, subjectStats: {} });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Setup States
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null);
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [useTimer, setUseTimer] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(5);
  
  // Drill States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Result States
  const [score, setScore] = useState(0);
  const [weakSubtopics, setWeakSubtopics] = useState<string[]>([]);
  const [gainedXP, setGainedXP] = useState(0);
  const [duration, setDuration] = useState(0); // in seconds

  useEffect(() => {
    if (profile?.id && view === 'dashboard') {
      fetchStats();
    }
  }, [profile?.id, view]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'play' && isTimerRunning && useTimer && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinish(answers);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, isTimerRunning, timeLeft, useTimer, answers]);

  const fetchStats = async () => {
    if (!profile?.id) return;
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('ai_drill_results')
        .select('*')
        .eq('student_id', profile.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
      
      if (error) throw error;

      let tCorrect = 0;
      let tQuestions = 0;
      let tScore = 0;
      const sStats: Record<string, { correct: number, total: number, xp: number }> = {};

      data?.forEach((row: any) => {
        tCorrect += row.correct_answers || 0;
        tQuestions += row.total_questions || 0;
        tScore += row.score || 0;
        
        if (!sStats[row.subject]) {
          sStats[row.subject] = { correct: 0, total: 0, xp: 0 };
        }
        sStats[row.subject].correct += row.correct_answers || 0;
        sStats[row.subject].total += row.total_questions || 0;
        // XP roughly based on correct answers
        sStats[row.subject].xp += (row.correct_answers || 0) * 10;
      });

      setStats({
        totalCorrect: tCorrect,
        totalQuestions: tQuestions,
        totalScore: tScore,
        subjectStats: sStats
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleStartSetup = (sub: typeof SUBJECTS[0]) => {
    setSelectedSubject(sub);
    setTopic("");
    setSubtopics("");
    setQuestionCount(5);
    setUseTimer(false);
    setTimerMinutes(5);
    setView('setup');
  };

  const handleGenerate = async () => {
    if (!selectedSubject || !topic.trim()) {
      toast.error("Topik utama wajib diisi!");
      return;
    }
    
    setView('loading');
    try {
      const response = await fetch('/api/ai/generate-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject.name,
          topic,
          subtopics: subtopics ? subtopics.split(',').map(s => s.trim()).filter(s => s) : [],
          questionCount
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat soal");
      
      setQuestions(data.questions);
      setAnswers({});
      setCurrentIndex(0);
      if (useTimer) {
        setTimeLeft(timerMinutes * 60);
      } else {
        setTimeLeft(0);
      }
      setDuration(0);
      setView('play');
      setIsTimerRunning(true);
    } catch (error: any) {
      toast.error(error.message);
      setView('setup');
    }
  };

  const handleFinish = async (currentAnswers: Record<number, number>) => {
    setIsTimerRunning(false);
    
    let correct = 0;
    const weakTracker: Record<string, number> = {};
    
    questions.forEach((q, idx) => {
      if (currentAnswers[idx] === q.correctAnswer) {
        correct++;
      } else {
        weakTracker[q.subtopic] = (weakTracker[q.subtopic] || 0) + 1;
      }
    });
    
    const finalScore = Math.round((correct / questions.length) * 100);
    const weakList = Object.keys(weakTracker).sort((a, b) => weakTracker[b] - weakTracker[a]);
    const xpGained = correct * 10;
    const timeSpent = useTimer ? (timerMinutes * 60) - timeLeft : 0; // If no timer, we don't track accurately in this quick implementation
    
    setScore(finalScore);
    setWeakSubtopics(weakList);
    setGainedXP(xpGained);
    setDuration(timeSpent);
    setView('result');
    
    // Save to DB
    if (profile?.id && selectedSubject) {
      try {
        await supabase.from('ai_drill_results').insert({
          student_id: profile.id,
          subject: selectedSubject.id,
          topic,
          total_questions: questions.length,
          correct_answers: correct,
          score: finalScore,
          weak_subtopics: weakList
        });
      } catch (err) {
        console.error("Gagal menyimpan riwayat drill:", err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------
  // Renders
  // ---------------------------------------------------------

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Header Gradient (like Ruangguru) */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 h-64 md:h-72 w-full absolute top-0 left-0 z-0 overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
          <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 flex items-center gap-3 text-white">
            <h1 className="text-2xl font-bold tracking-tight">Drill Soal</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-20">
          {/* Profile & Stats Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-center gap-5">
                <img 
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name || 'Student'}`}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-md object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{profile?.full_name || 'Siswa'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-slate-700">{stats.totalCorrect * 10} XP</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-500 font-medium">Driller Pemula</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 self-start">
                <Target className="w-5 h-5" />
                <span className="text-sm font-bold">Target Harian: Belum Tercapai</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Benar Bulan Ini</span>
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">{stats.totalCorrect} <span className="text-base font-semibold text-slate-500">Soal</span></div>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider">Akurasi Jawaban</span>
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-2xl font-black text-slate-800">
                    {stats.totalQuestions > 0 ? ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <History className="w-5 h-5" /> Riwayat
              </button>
              <button className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard
              </button>
            </div>
          </div>

          {/* Subject Grid */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Mau Drill apa hari ini?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBJECTS.map((sub) => {
                const subStat = stats.subjectStats[sub.id] || { correct: 0, total: 0, xp: 0 };
                const accuracy = subStat.total > 0 ? Math.round((subStat.correct / subStat.total) * 100) : 0;
                
                return (
                  <button 
                    key={sub.id}
                    onClick={() => handleStartSetup(sub)}
                    className={`bg-white rounded-2xl p-5 border-2 ${sub.border} shadow-sm hover:shadow-md transition-all text-left flex flex-col group relative overflow-hidden`}
                  >
                    {/* Background decoration */}
                    <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${sub.bg} opacity-50 transition-transform group-hover:scale-150 duration-500`}></div>
                    
                    <div className="flex items-start justify-between relative z-10 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${sub.bg} ${sub.color}`}>
                          <sub.icon className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-slate-800">{sub.name}</h4>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:border-slate-400 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Jawaban Benar</p>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                          {subStat.correct}/{subStat.total} <span className={accuracy >= 70 ? 'text-emerald-500' : 'text-amber-500'}>({accuracy}%)</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1 tracking-wider">XP</p>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {subStat.xp}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'setup' && selectedSubject) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 h-48 w-full absolute top-0 left-0 z-0">
          <div className="max-w-5xl mx-auto px-6 py-6 relative z-10 flex items-center gap-4 text-white">
            <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Persiapan</h1>
              <p className="text-blue-100 text-sm">Drill Soal {selectedSubject.name}</p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-28">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Topics */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-xl ${selectedSubject.bg} ${selectedSubject.color}`}>
                    <selectedSubject.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Pilih Topik Dulu, Ya!</h2>
                    <p className="text-sm text-slate-500 font-medium">Supaya soal dapat disesuaikan dengan yang kamu inginkan.</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Materi / Topik Utama <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Contoh: Teks Berita, Aljabar, Sel Hewan..."
                      className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      Fokus Subtopik <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-[10px] uppercase">Opsional</span>
                    </label>
                    <textarea 
                      value={subtopics}
                      onChange={(e) => setSubtopics(e.target.value)}
                      placeholder="Contoh: Struktur Teks, Kaidah Kebahasaan (pisahkan dengan koma)"
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Settings */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-6">Atur Drill sesuai kebutuhanmu</h3>
                
                {/* Jumlah Soal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                      <BookA className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Jumlah Soal</p>
                      <p className="text-[10px] text-slate-500 leading-tight">Berapa soal yang ingin kamu kerjakan?</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full p-1">
                    <button 
                      onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-800 w-4 text-center">{questionCount}</span>
                    <button 
                      onClick={() => setQuestionCount(Math.min(30, questionCount + 1))}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 w-full mb-6"></div>

                {/* Timer */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Aktifkan timer pengerjaan</p>
                      {useTimer && <p className="text-[10px] text-slate-500 leading-tight mt-1">Berapa menit yang kamu perlukan?</p>}
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={useTimer}
                    onChange={(e) => setUseTimer(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 mt-1"
                  />
                </div>
                
                {useTimer && (
                  <div className="flex items-center justify-end mb-6">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full p-1">
                      <button 
                        onClick={() => setTimerMinutes(Math.max(1, timerMinutes - 1))}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-slate-800 w-6 text-center">{timerMinutes}</span>
                      <button 
                        onClick={() => setTimerMinutes(Math.min(120, timerMinutes + 1))}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-xl space-y-2 mb-6 border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Soal</span>
                    <span className="font-bold text-slate-800">{questionCount} soal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-medium">Total Waktu</span>
                    <span className="font-bold text-slate-800">{useTimer ? `${timerMinutes} menit` : 'Tanpa batas'}</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                >
                  Mulai Drill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3 text-center">AI Sedang Meracik Soal...</h2>
        <p className="text-slate-500 font-medium text-center max-w-sm">
          Menyusun soal pilihan ganda terbaik untuk materi <br/>
          <span className="font-bold text-blue-600">{selectedSubject?.name}: {topic}</span>
        </p>
      </div>
    );
  }

  if (view === 'play' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const isAnswered = answers[currentIndex] !== undefined;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-4 shadow-md z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Pengerjaan</h1>
              <p className="text-xs text-blue-100">{selectedSubject?.name}</p>
            </div>
          </div>
          <button 
            onClick={() => handleFinish(answers)}
            className="bg-white text-slate-800 px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Akhiri
          </button>
        </div>

        {/* Timer Bar */}
        {useTimer && (
          <div className="bg-blue-600 text-white px-6 py-2.5 flex items-center gap-3">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">Waktu kamu tersisa</span>
            <div className="flex gap-1 ml-auto font-mono font-bold">
              <div className="bg-white/20 px-2 py-1 rounded">{Math.floor(timeLeft / 3600).toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-white/20 px-2 py-1 rounded">{Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}</div>
              <span>:</span>
              <div className="bg-white/20 px-2 py-1 rounded">{(timeLeft % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col relative z-0">
          
          {/* Status Bar */}
          <div className="bg-white rounded-2xl px-6 py-4 mb-4 shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700">Soal {currentIndex + 1}/{questions.length}</span>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-slate-700">0</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 0</div>
              <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-500"/> 0</div>
            </div>
          </div>

          {/* Question Area */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex-1 flex flex-col md:flex-row gap-8 mb-24">
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider border border-blue-100">Soal</span>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded border border-slate-200">{currentQ.subtopic}</span>
              </div>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-800 leading-relaxed font-medium">
                  {currentQ.question}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = answers[currentIndex] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers(prev => ({ ...prev, [currentIndex]: idx }))}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                      ${isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Bottom Floating Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {isAnswered ? (
              <div className="hidden sm:block">
                <p className="font-bold text-slate-800">Yakin dengan jawabannya?</p>
                <p className="text-xs font-medium text-slate-500">Klik selanjutnya untuk menyimpan.</p>
              </div>
            ) : (
              <div className="hidden sm:block">
                <p className="font-bold text-slate-500">Pilih salah satu jawaban...</p>
              </div>
            )}

            <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  className="px-6 py-3.5 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none text-center"
                >
                  Kembali
                </button>
              )}
              
              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => handleFinish(answers)}
                  className={`px-10 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex-1 sm:flex-none
                    ${isAnswered ? 'bg-[#F97316] hover:bg-[#EA580C] shadow-orange-500/25' : 'bg-slate-300 cursor-not-allowed'}`}
                  disabled={!isAnswered}
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className={`px-10 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg flex-1 sm:flex-none
                    ${isAnswered ? 'bg-[#F97316] hover:bg-[#EA580C] shadow-orange-500/25' : 'bg-slate-300 cursor-not-allowed'}`}
                  disabled={!isAnswered}
                >
                  Selanjutnya
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const totalCorrect = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const totalWrong = questions.length - totalCorrect;

    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 text-white px-4 py-4 shadow-md flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">Hasil Pengerjaan</h1>
            <p className="text-xs text-blue-100">{selectedSubject?.name}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 mt-8">
          {/* Main Result Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
            {/* Background elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start relative z-10 mb-8">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-sm border border-white/20">
                <BrainCircuit className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest uppercase">Drill Soal AI</span>
              </div>
              <div className="bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-black text-sm shadow-lg">
                +{gainedXP} <Star className="w-4 h-4 fill-amber-950" />
              </div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start mb-8">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1 opacity-90">{score >= 70 ? 'Luar biasa!' : 'Tetap semangat!'}</h2>
                <div className="text-[5rem] font-black leading-none mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                  {score}
                </div>
                <p className="text-sm font-medium opacity-80 max-w-[200px]">
                  {score >= 70 ? 'Pemahamanmu sangat kuat, pertahankan!' : 'Jangan takut salah, takutlah berhenti belajar.'}
                </p>
              </div>
              <div className="w-48 h-48 bg-white/10 rounded-full border-4 border-white/20 flex flex-col items-center justify-center shrink-0">
                <div className="w-full flex items-center justify-center mb-2">
                  <div className="flex flex-col items-center px-4 border-r border-white/20">
                    <span className="text-2xl font-black text-emerald-300">{totalCorrect}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Benar</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-2xl font-black text-rose-300">{totalWrong}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Salah</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Total waktu pengerjaan</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{duration > 0 ? duration : '< 1'} detik</span>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Rata-rata per soal</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{duration > 0 ? (duration / questions.length).toFixed(1) : '< 1'} dtk/soal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0284C7] text-white rounded-xl p-4 mt-4 flex items-center gap-3 shadow-md">
            <div className="bg-white/20 p-2 rounded-lg"><BookA className="w-5 h-5"/></div>
            <div>
              <p className="font-bold text-sm">Hasil ini tercatat di Rapor Mandirimu!</p>
              <p className="text-xs text-blue-100">Akan dilaporkan ke Parent Dashboard.</p>
            </div>
            <ChevronRight className="w-5 h-5 ml-auto opacity-70" />
          </div>

          {/* Subtopic Analysis */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-6">
            <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Detail Pemahaman
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Ketahui subtopik materi yang perlu dipelajari lebih dalam</p>

            <div className="space-y-3">
              {Object.entries(
                questions.reduce((acc, q, idx) => {
                  if (!acc[q.subtopic]) acc[q.subtopic] = { total: 0, correct: 0 };
                  acc[q.subtopic].total += 1;
                  if (answers[idx] === q.correctAnswer) acc[q.subtopic].correct += 1;
                  return acc;
                }, {} as Record<string, {total: number, correct: number}>)
              ).map(([sub, data]) => {
                const subScore = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={sub} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                        <BookA className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{sub}</h4>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5"/> {data.correct}</span>
                          <span className="flex items-center gap-1 text-rose-600"><XCircle className="w-3.5 h-3.5"/> {data.total - data.correct}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm border
                      ${subScore >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                        subScore >= 40 ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                        'bg-rose-50 border-rose-200 text-rose-700'}
                    `}>
                      Nilai {subScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Floating Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <button
              onClick={() => setView('dashboard')}
              className="flex-1 py-3.5 rounded-full font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Kembali ke Menu
            </button>
            <button
              onClick={() => setView('review')}
              className="flex-1 py-3.5 rounded-full font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-lg shadow-orange-500/25 transition-all"
            >
              Pembahasan
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'review') {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 flex items-center gap-4 shadow-sm">
          <button onClick={() => setView('result')} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-slate-800">Pembahasan AI</h1>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correctAnswer;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`mt-1 shrink-0 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider mb-2">
                      Soal {idx + 1} • {q.subtopic}
                    </span>
                    <p className="font-bold text-slate-800 text-base leading-relaxed">{q.question}</p>
                  </div>
                </div>

                <div className="pl-10 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Jawaban Kamu</p>
                      <p className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{q.options[answers[idx]]}</p>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70 text-emerald-700">Kunci Jawaban</p>
                        <p className="font-semibold text-emerald-700">{q.options[q.correctAnswer]}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <BrainCircuit className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Penjelasan AI</h4>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
