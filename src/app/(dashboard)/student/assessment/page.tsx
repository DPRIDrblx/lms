"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, ChevronRight, CheckCircle2, Sparkles, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";

type Question = {
  id: string;
  text: string;
  options: { text: string; trait: string; value: number }[];
};

// Simplified MBTI-like questions for demo
const QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Saat ada masalah sulit di sekolah, kamu biasanya...",
    options: [
      { text: "Berdiskusi dengan teman-teman untuk mencari solusi bersama", trait: "E", value: 1 },
      { text: "Menyendiri dan memikirkannya baik-baik sebelum bertindak", trait: "I", value: 1 }
    ]
  },
  {
    id: "q2",
    text: "Kamu lebih suka belajar dengan cara...",
    options: [
      { text: "Melihat fakta, data, dan contoh nyata yang sudah terbukti", trait: "S", value: 1 },
      { text: "Membayangkan konsep, ide baru, dan kemungkinan di masa depan", trait: "N", value: 1 }
    ]
  },
  {
    id: "q3",
    text: "Saat mengambil keputusan penting, kamu cenderung...",
    options: [
      { text: "Menggunakan logika dan objektivitas, apa yang paling rasional", trait: "T", value: 1 },
      { text: "Mempertimbangkan perasaan orang lain dan apa yang terasa benar di hati", trait: "F", value: 1 }
    ]
  },
  {
    id: "q4",
    text: "Dalam mengerjakan tugas proyek, gaya kerjamu adalah...",
    options: [
      { text: "Membuat jadwal yang ketat dan menyelesaikannya jauh sebelum tenggat", trait: "J", value: 1 },
      { text: "Fleksibel, bisa berubah-ubah, dan sering mendapat ide brilian saat mepet tenggat", trait: "P", value: 1 }
    ]
  },
  {
    id: "q5",
    text: "Setelah seharian belajar intensif di sekolah, kamu mengembalikan energimu dengan...",
    options: [
      { text: "Nongkrong atau main *game* bareng teman-teman", trait: "E", value: 1 },
      { text: "Mendengarkan musik, membaca buku, atau rebahan sendirian", trait: "I", value: 1 }
    ]
  }
];

export default function AssessmentPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
  });
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mbtiResult, setMbtiResult] = useState("");

  const handleOptionSelect = (trait: string, value: number) => {
    const newScores = { ...scores, [trait]: scores[trait] + value };
    setScores(newScores);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(q => q + 1), 300);
    } else {
      calculateResult(newScores);
    }
  };

  const calculateResult = async (finalScores: Record<string, number>) => {
    const eOrI = finalScores.E >= finalScores.I ? "E" : "I";
    const sOrN = finalScores.S >= finalScores.N ? "S" : "N";
    const tOrF = finalScores.T >= finalScores.F ? "T" : "F";
    const jOrP = finalScores.J >= finalScores.P ? "J" : "P";
    const result = `${eOrI}${sOrN}${tOrF}${jOrP}`;
    
    setMbtiResult(result);
    setIsFinished(true);
    
    // Save to profile if logged in
    if (profile?.id) {
      setIsSaving(true);
      await supabase.from('profiles').update({
        assessment_result: result, // We'll need to make sure this column exists or use metadata
      }).eq('id', profile.id);
      setIsSaving(false);
    }
  };

  const getResultDescription = (mbti: string) => {
    const data: Record<string, { title: string, desc: string, careers: string[] }> = {
      "INTJ": { title: "Sang Arsitek", desc: "Pemikir imajinatif dan strategis, dengan rencana untuk segalanya.", careers: ["Programmer", "Arsitek", "Ilmuwan"] },
      "INTP": { title: "Sang Logikawan", desc: "Penemu inovatif dengan kehausan yang tak pernah terpuaskan akan pengetahuan.", careers: ["Data Analyst", "Peneliti", "Teknisi"] },
      "ENTJ": { title: "Sang Komandan", desc: "Pemimpin yang berani, imajinatif, dan berkemauan kuat, selalu menemukan atau membuat jalan.", careers: ["CEO", "Pengacara", "Manajer Proyek"] },
      "ENTP": { title: "Sang Pendebat", desc: "Pemikir cerdas dan penasaran yang tidak bisa menolak tantangan intelektual.", careers: ["Pengusaha", "Konsultan", "Jurnalis"] },
      "INFJ": { title: "Sang Advokat", desc: "Idealis yang tenang dan misterius, namun sangat menginspirasi dan tak kenal lelah.", careers: ["Psikolog", "Penulis", "Pendidik"] },
      "INFP": { title: "Sang Mediator", desc: "Orang yang puitis, baik hati, dan altruistik, selalu ingin membantu tujuan baik.", careers: ["Seniman", "Desainer", "Aktivis"] },
      "ENFJ": { title: "Sang Protagonis", desc: "Pemimpin karismatik dan menginspirasi, mampu memikat pendengarnya.", careers: ["Guru", "Politisi", "Public Relations"] },
      "ENFP": { title: "Sang Juru Kampanye", desc: "Jiwa bebas yang antusias, kreatif, dan ramah, selalu dapat menemukan alasan untuk tersenyum.", careers: ["Content Creator", "Marketing", "Event Organizer"] },
      "ISTJ": { title: "Sang Ahli Logistik", desc: "Individu yang praktis dan berorientasi pada fakta, yang keandalannya tidak dapat diragukan.", careers: ["Akuntan", "Polisi", "Dokter"] },
      "ISFJ": { title: "Sang Pembela", desc: "Pelindung yang sangat berdedikasi dan hangat, selalu siap membela orang yang dicintainya.", careers: ["Perawat", "Guru SD", "Pekerja Sosial"] },
      "ESTJ": { title: "Sang Eksekutif", desc: "Administrator yang sangat baik, tak tertandingi dalam mengelola banyak hal - atau orang.", careers: ["Manajer Keuangan", "Hakim", "Administrator"] },
      "ESFJ": { title: "Sang Konsul", desc: "Orang yang sangat peduli, sosial, dan populer, selalu ingin membantu.", careers: ["HRD", "Event Coordinator", "Guru"] },
      "ISTP": { title: "Sang Pengrajin", desc: "Eksperimenter yang berani dan praktis, ahli dalam menggunakan semua jenis alat.", careers: ["Mekanik", "Pilot", "Desainer Grafis"] },
      "ISFP": { title: "Sang Petualang", desc: "Seniman yang fleksibel dan menawan, selalu siap menjelajahi dan mengalami hal baru.", careers: ["Desainer Interior", "Musisi", "Chef"] },
      "ESTP": { title: "Sang Pengusaha", desc: "Orang yang cerdas, energik, dan sangat tanggap, yang benar-benar menikmati hidup di ujung tanduk.", careers: ["Entrepreneur", "Atlet", "Detektif"] },
      "ESFP": { title: "Sang Penghibur", desc: "Orang yang spontan, energik, dan antusias - kehidupan tidak pernah membosankan di sekitar mereka.", careers: ["Aktor", "Event Planner", "Sales"] },
    };
    
    return data[mbti] || { title: "Sang Penjelajah", desc: "Karakter unik dengan perpaduan minat yang beragam.", careers: ["Generalist", "Penasihat"] };
  };

  const resetTest = () => {
    setCurrentQuestion(0);
    setScores({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
    setIsFinished(false);
    setMbtiResult("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Asesmen Cerdas AI</h1>
              <p className="text-xs text-slate-500 font-medium">Kenali Potensi & Minat Bakatmu</p>
            </div>
          </div>
          <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold">
            <Brain className="w-4 h-4" />
            Super App
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        {!isFinished ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between text-sm font-bold text-slate-400 mb-2">
              <span>Pertanyaan {currentQuestion + 1} dari {QUESTIONS.length}</span>
              <span>{Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)}%</span>
            </div>
            
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-purple-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion) / QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mt-8"
              >
                <h2 className="text-2xl font-bold text-slate-800 mb-8 leading-relaxed">
                  {QUESTIONS[currentQuestion].text}
                </h2>

                <div className="space-y-4">
                  {QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option.trait, option.value)}
                      className="w-full text-left p-5 rounded-2xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-between group"
                    >
                      <span className="font-medium text-slate-700 group-hover:text-purple-700">{option.text}</span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden"
          >
            {/* Background effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-sm font-bold text-purple-600 tracking-widest uppercase mb-2">Hasil Asesmen AI</h3>
              
              {isSaving ? (
                <div className="py-12">
                  <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-500 font-medium">Menyimpan hasil ke profilmu...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <span className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 tracking-tight">
                      {mbtiResult}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">
                      {getResultDescription(mbtiResult).title}
                    </h2>
                    <p className="text-slate-500 mt-4 max-w-md mx-auto leading-relaxed">
                      {getResultDescription(mbtiResult).desc}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8 border border-slate-100">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Rekomendasi Jurusan / Karir:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getResultDescription(mbtiResult).careers.map((career, idx) => (
                        <span key={idx} className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm border border-slate-200">
                          {career}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-center">
                    <button 
                      onClick={resetTest}
                      className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" /> Ulangi Tes
                    </button>
                    <Link 
                      href="/student/roadmap" 
                      className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-200 transition-all transform hover:scale-105"
                    >
                      Lihat Roadmap AI-mu
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
