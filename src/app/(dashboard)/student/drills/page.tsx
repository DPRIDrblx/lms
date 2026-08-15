"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookA, Languages, Dna, Atom, FlaskConical, Telescope, 
  Globe, Landmark, Scale, BrainCircuit, Play, CheckCircle2, 
  XCircle, ChevronRight, ChevronLeft, RefreshCcw, Sparkles, AlertCircle, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

const SUBJECTS = [
  { id: "Bahasa Indonesia", name: "Bahasa Indonesia", icon: BookA, color: "text-red-500", bg: "bg-red-50" },
  { id: "Bahasa Inggris", name: "Bahasa Inggris", icon: Languages, color: "text-blue-500", bg: "bg-blue-50" },
  { id: "IPA Biologi", name: "IPA Biologi", icon: Dna, color: "text-green-500", bg: "bg-green-50" },
  { id: "IPA Fisika", name: "IPA Fisika", icon: Atom, color: "text-purple-500", bg: "bg-purple-50" },
  { id: "IPA Kimia", name: "IPA Kimia", icon: FlaskConical, color: "text-pink-500", bg: "bg-pink-50" },
  { id: "IPA Astronomi", name: "IPA Astronomi", icon: Telescope, color: "text-indigo-500", bg: "bg-indigo-50" },
  { id: "IPA Bumi dan Antariksa", name: "Bumi & Antariksa", icon: Globe, color: "text-cyan-500", bg: "bg-cyan-50" },
  { id: "IPS", name: "IPS", icon: Landmark, color: "text-amber-500", bg: "bg-amber-50" },
  { id: "Pendidikan Pancasila", name: "Pendidikan Pancasila", icon: Scale, color: "text-rose-500", bg: "bg-rose-50" }
];

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  subtopic: string;
};

export default function DrillsPage() {
  const { profile } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  
  // State: 'config' | 'loading' | 'play' | 'result'
  const [phase, setPhase] = useState<'config' | 'loading' | 'play' | 'result'>('config');
  
  // Config States
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopics, setSubtopics] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  
  // Drill States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Result States
  const [score, setScore] = useState(0);
  const [weakSubtopics, setWeakSubtopics] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const isClean = uiMode === 'clean';

  const handleGenerate = async () => {
    if (!subject || !topic.trim()) {
      toast.error("Pilih mata pelajaran dan isi topik utama terlebih dahulu!");
      return;
    }
    
    setPhase('loading');
    try {
      const response = await fetch('/api/ai/generate-drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          subtopics: subtopics ? subtopics.split(',').map(s => s.trim()).filter(s => s) : [],
          questionCount
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal membuat soal");
      
      setQuestions(data.questions);
      setPhase('play');
      setCurrentIndex(0);
      setAnswers({});
    } catch (error: any) {
      toast.error(error.message);
      setPhase('config');
    }
  };

  const handleFinish = async () => {
    let correct = 0;
    const weakTracker: Record<string, number> = {};
    
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      } else {
        weakTracker[q.subtopic] = (weakTracker[q.subtopic] || 0) + 1;
      }
    });
    
    const finalScore = Math.round((correct / questions.length) * 100);
    const weakList = Object.keys(weakTracker).sort((a, b) => weakTracker[b] - weakTracker[a]);
    
    setScore(finalScore);
    setWeakSubtopics(weakList);
    setPhase('result');
    
    // Save to DB
    if (profile?.id) {
      setIsSaving(true);
      try {
        await supabase.from('ai_drill_results').insert({
          student_id: profile.id,
          subject,
          topic,
          total_questions: questions.length,
          correct_answers: correct,
          score: finalScore,
          weak_subtopics: weakList
        });
      } catch (err) {
        console.error("Gagal menyimpan riwayat drill:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetDrill = () => {
    setSubject("");
    setTopic("");
    setSubtopics("");
    setQuestionCount(5);
    setPhase('config');
  };

  return (
    <div className={`min-h-[80vh] flex flex-col ${isClean ? 'max-w-4xl mx-auto' : ''}`}>
      <AnimatePresence mode="wait">
        {phase === 'config' && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`w-full ${isClean ? 'bg-white rounded-3xl p-8 shadow-sm border border-slate-200' : 'bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100'}`}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isClean ? 'bg-teal-50 text-[#108B96]' : 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg'}`}>
                <BrainCircuit className="w-8 h-8" />
              </div>
              <div>
                <h1 className={`text-2xl font-black ${isClean ? 'text-[#0C1E5B]' : 'text-slate-800'}`}>Drill Soal AI</h1>
                <p className="text-slate-500 text-sm font-medium">Buat latihan soal kustom, digenerate instan oleh AI.</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Mata Pelajaran <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SUBJECTS.map((sub) => {
                    const isSelected = subject === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSubject(sub.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2
                          ${isSelected 
                            ? (isClean ? 'border-[#108B96] bg-[#108B96]/5' : 'border-emerald-500 bg-emerald-50') 
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className={`p-2 rounded-xl ${isSelected ? (isClean ? 'bg-[#108B96] text-white' : 'bg-emerald-500 text-white') : sub.bg + ' ' + sub.color}`}>
                          <sub.icon className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-bold text-center ${isSelected ? (isClean ? 'text-[#108B96]' : 'text-emerald-700') : 'text-slate-600'}`}>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Input */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Topik Utama <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Aljabar, Sel Hewan, Tenses..."
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-xl outline-none font-medium transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fokus Subtopik <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input 
                    type="text" 
                    value={subtopics}
                    onChange={(e) => setSubtopics(e.target.value)}
                    placeholder="Contoh: Matriks, Vektor (pisahkan dengan koma)"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-xl outline-none font-medium transition-colors"
                  />
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Jumlah Soal</label>
                <div className="flex gap-3">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors
                        ${questionCount === num 
                          ? (isClean ? 'border-[#108B96] bg-[#108B96] text-white' : 'border-emerald-500 bg-emerald-500 text-white') 
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleGenerate}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg
                    ${isClean ? 'bg-[#0C1E5B] hover:bg-[#1E40AF] shadow-blue-900/20' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'}`}
                >
                  <Sparkles className="w-5 h-5" />
                  Mulai Drill Sekarang
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'loading' && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center py-20"
          >
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
              <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${isClean ? 'border-[#108B96]' : 'border-emerald-500'}`}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className={`w-8 h-8 animate-pulse ${isClean ? 'text-[#108B96]' : 'text-emerald-500'}`} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">AI Sedang Meracik Soal...</h2>
            <p className="text-slate-500 font-medium text-center max-w-md">
              Menyesuaikan tingkat kesulitan untuk materi <span className="font-bold text-slate-700">{subject}: {topic}</span>
            </p>
          </motion.div>
        )}

        {phase === 'play' && questions.length > 0 && (
          <motion.div 
            key="play"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`w-full flex-1 flex flex-col ${isClean ? 'bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm' : 'bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden'}`}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isClean ? 'bg-[#108B96]/10 text-[#108B96]' : 'bg-emerald-100 text-emerald-600'}`}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Drill: {subject}</h3>
                  <p className="text-xs font-medium text-slate-500">{topic}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-400">Soal</span>
                <div className={`px-3 py-1 rounded-full text-sm font-black ${isClean ? 'bg-[#0C1E5B] text-white' : 'bg-slate-800 text-white'}`}>
                  {currentIndex + 1} / {questions.length}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100">
              <div 
                className={`h-full transition-all duration-300 ${isClean ? 'bg-[#108B96]' : 'bg-emerald-500'}`}
                style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              ></div>
            </div>

            {/* Question Body */}
            <div className="flex-1 p-6 md:p-10 flex flex-col">
              <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold mb-4 uppercase tracking-wider">
                  Subtopik: {questions[currentIndex].subtopic}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                  {questions[currentIndex].question}
                </h2>
              </div>

              <div className="space-y-3 mt-auto">
                {questions[currentIndex].options.map((opt, idx) => {
                  const isSelected = answers[currentIndex] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentIndex]: idx }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group
                        ${isSelected 
                          ? (isClean ? 'border-[#108B96] bg-[#108B96]/5' : 'border-emerald-500 bg-emerald-50') 
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 transition-colors
                        ${isSelected 
                          ? (isClean ? 'bg-[#108B96] text-white' : 'bg-emerald-500 text-white') 
                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`font-semibold ${isSelected ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 font-bold text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Sebelumnya
              </button>
              
              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleFinish}
                  disabled={answers[currentIndex] === undefined}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                    ${isClean ? 'bg-[#0C1E5B] hover:bg-[#1E40AF]' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  Selesai <CheckCircle2 className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={answers[currentIndex] === undefined}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                    ${isClean ? 'bg-[#108B96] hover:bg-[#0D7A84]' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Selanjutnya <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full flex-col ${isClean ? 'bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm' : 'bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden'}`}
          >
            {/* Result Header */}
            <div className={`p-8 md:p-12 text-center text-white ${isClean ? 'bg-[#0C1E5B]' : 'bg-slate-900'}`}>
              <h2 className="text-2xl font-black mb-2 opacity-90">Hasil Drill AI</h2>
              <p className="font-medium opacity-80 mb-8">{subject} - {topic}</p>
              
              <div className="flex justify-center">
                {/* CSS Donut Chart */}
                <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-white/10 p-2">
                  <div 
                    className="w-full h-full rounded-full"
                    style={{
                      background: `conic-gradient(
                        ${score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'} ${score}%, 
                        rgba(255,255,255,0.1) ${score}%
                      )`
                    }}
                  >
                    <div className={`absolute inset-3 rounded-full flex flex-col items-center justify-center ${isClean ? 'bg-[#0C1E5B]' : 'bg-slate-900'}`}>
                      <span className="text-4xl font-black">{score}</span>
                      <span className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1">Skor</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-400">{Object.values(answers).filter((a, i) => a === questions[i].correctAnswer).length}</p>
                  <p className="text-xs font-bold opacity-70 uppercase">Benar</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-rose-400">{questions.length - Object.values(answers).filter((a, i) => a === questions[i].correctAnswer).length}</p>
                  <p className="text-xs font-bold opacity-70 uppercase">Salah</p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="p-6 md:p-10 bg-slate-50">
              <div className="mb-8">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Area yang Perlu Ditingkatkan
                </h3>
                
                {weakSubtopics.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {weakSubtopics.map((sub, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-start gap-3">
                        <div className="p-1.5 bg-red-50 text-red-500 rounded-lg shrink-0">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700">{sub}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">Sering dijawab salah</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-bold">Luar biasa! Kamu memahami semua subtopik dengan baik.</p>
                  </div>
                )}
              </div>

              {/* Review */}
              <h3 className="text-lg font-black text-slate-800 mb-4">Pembahasan AI</h3>
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isCorrect = answers[idx] === q.correctAnswer;
                  return (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex gap-3 mb-3">
                        <div className={`mt-0.5 shrink-0 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                        <p className="font-bold text-slate-800 text-sm">{q.question}</p>
                      </div>
                      <div className="pl-8">
                        <p className="text-sm font-medium text-slate-500 mb-3">
                          Jawabanmu: <span className={`font-bold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>{q.options[answers[idx]]}</span>
                          {!isCorrect && <><br/>Jawaban Benar: <span className="font-bold text-emerald-600">{q.options[q.correctAnswer]}</span></>}
                        </p>
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                          <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">Penjelasan</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{q.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-center">
                <button
                  onClick={resetDrill}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-colors
                    ${isClean ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <RefreshCcw className="w-4 h-4" />
                  Mulai Drill Baru
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
