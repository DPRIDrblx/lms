"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

const dummyQuestions = [
  {
    id: 1,
    question: "Ketika diberikan tugas kelompok, peran apa yang paling kamu sukai?",
    options: [
      { id: 'A', text: "Menjadi pemimpin dan mengatur tugas teman-teman.", color: "bg-red-50 text-red-600 border-red-200 hover:border-red-400" },
      { id: 'B', text: "Mencari ide-ide baru dan kreatif untuk proyek tersebut.", color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400" },
      { id: 'C', text: "Memastikan semua detail tugas dikerjakan dengan rapi dan teliti.", color: "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400" },
      { id: 'D', text: "Membantu teman yang kesulitan dan menjaga kekompakan.", color: "bg-amber-50 text-amber-600 border-amber-400 shadow-sm", selected: true } // Simulated selected state style
    ]
  }
];

export default function AssessmentTest() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string; // 'minat-bakat' or 'mbti'

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>('D'); // mock initial state

  const q = dummyQuestions[currentQ];
  const totalQ = 20;
  const progress = ((currentQ + 1) / totalQ) * 100;

  let title = "Skill Test";
  if (type === 'minat-bakat') title = "Tes Minat Bakat";
  if (type === 'mbti') title = "Tes MBTI";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      
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
              <span className="text-amber-500">⭐ {currentQ + 1}</span>
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
              disabled={!selectedOpt}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                selectedOpt 
                  ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-[0_8px_20px_rgba(251,191,36,0.3)]' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
