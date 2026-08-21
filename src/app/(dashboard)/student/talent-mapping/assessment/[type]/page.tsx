"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

import mbtiQuestions from "@/data/mbti-questions.json";
import riasecQuestions from "@/data/riasec-questions.json";

export default function AssessmentTest() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string; // 'minat-bakat' or 'mbti'
  const { profile } = useAuth();
  const supabase = createClient();

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = type === 'mbti' ? mbtiQuestions : riasecQuestions;
  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ) / totalQ) * 100;

  let title = "Skill Test";
  if (type === 'minat-bakat') title = "Tes Minat Bakat (RIASEC)";
  if (type === 'mbti') title = "Tes Kepribadian (MBTI)";

  const calculateResult = async (finalAnswers: any[]) => {
    setIsSubmitting(true);
    let resultStr = "";
    let details = {};

    if (type === 'mbti') {
      const scores: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      finalAnswers.forEach(ans => {
        scores[ans.dimension] += ans.value;
      });
      const EorI = scores.E > scores.I ? 'E' : 'I';
      const SorN = scores.S > scores.N ? 'S' : 'N';
      const TorF = scores.T > scores.F ? 'T' : 'F';
      const JorP = scores.J > scores.P ? 'J' : 'P';
      resultStr = `${EorI}${SorN}${TorF}${JorP}`;
      details = scores;
    } else {
      const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      finalAnswers.forEach(ans => {
        scores[ans.dimension] += ans.value;
      });
      // Sort by score
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      // Top 3 for RIASEC
      resultStr = sorted.slice(0, 3).map(i => i[0]).join("");
      details = scores;
    }

    if (profile?.id) {
      try {
        // Upsert progress
        await supabase.from('tm_progress').upsert({
          student_id: profile.id,
          assessment_type: type,
          progress_percentage: 100,
          is_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id, assessment_type' });

        // Upsert results
        const { data: existingResult } = await supabase
          .from('tm_results')
          .select('id')
          .eq('student_id', profile.id)
          .single();

        if (existingResult) {
          const updateData: any = { updated_at: new Date().toISOString() };
          if (type === 'mbti') {
            updateData.mbti_result = resultStr;
            updateData.mbti_details = details;
          } else {
            updateData.riasec_result = resultStr;
            updateData.riasec_details = details;
          }
          await supabase.from('tm_results').update(updateData).eq('id', existingResult.id);
        } else {
          const insertData: any = { student_id: profile.id };
          if (type === 'mbti') {
            insertData.mbti_result = resultStr;
            insertData.mbti_details = details;
          } else {
            insertData.riasec_result = resultStr;
            insertData.riasec_details = details;
          }
          await supabase.from('tm_results').insert(insertData);
        }
      } catch (err) {
        console.error("Error saving assessment result", err);
      }
    }

    router.replace('/student/talent-mapping/assessment');
  };

  const handleNext = () => {
    if (!selectedOpt) return;
    const optObj = q.options.find(o => o.id === selectedOpt);
    
    const newAnswers = [...answers, { qId: q.id, ...optObj }];
    setAnswers(newAnswers);

    if (currentQ < totalQ - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedOpt(null);
    } else {
      // Finished
      calculateResult(newAnswers);
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-white text-center p-6">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Menghitung Hasil...</h2>
        <p className="text-slate-500">Menganalisis jawabanmu untuk menemukan rekomendasi terbaik.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-120px)] overflow-hidden bg-white max-w-3xl mx-auto w-full lg:rounded-3xl lg:border lg:border-slate-200 lg:shadow-sm">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 z-10 relative">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <span className="text-amber-500 text-xs">✨</span> IGNITE {title}
        </h1>
        <div className="w-9 h-9" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col flex-1">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="text-amber-500">⭐ Soal {currentQ + 1}</span>
              <span>{currentQ + 1}/{totalQ}</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-amber-400 rounded-full"
              />
            </div>
          </div>

          {/* Question */}
          <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 mb-8 relative">
            <div className="absolute -top-4 -left-2 text-4xl">💡</div>
            <h2 className="text-lg font-bold text-slate-800 text-center leading-relaxed">
              {q.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 flex-1">
            {q.options.map((opt) => {
              const isSelected = selectedOpt === opt.id;
              
              // Dynamic styling based on selection
              let baseStyle = "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 relative overflow-hidden ";
              if (isSelected) {
                baseStyle += opt.color; // The selected color style
              } else {
                baseStyle += "bg-white border-slate-100 hover:border-slate-200 text-slate-600";
              }

              return (
                <button 
                  key={opt.id}
                  onClick={() => setSelectedOpt(opt.id)}
                  className={baseStyle}
                >
                  {/* Letter Indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isSelected ? 'bg-white/80' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {opt.id}
                  </div>
                  
                  <span className="font-medium text-sm pr-6 leading-relaxed">
                    {opt.text}
                  </span>

                  {/* Checkbox */}
                  {isSelected && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Next Button */}
          <div className="pt-6 pb-4">
            <button 
              onClick={handleNext}
              disabled={!selectedOpt}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                selectedOpt 
                  ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_8px_20px_rgba(251,191,36,0.3)]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {currentQ === totalQ - 1 ? 'Selesai & Lihat Hasil' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
