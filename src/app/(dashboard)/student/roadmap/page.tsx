"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Target, Trophy, TrendingUp, Compass, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const CAMPUS_DATA = [
  { id: "ui-fk", name: "Universitas Indonesia", major: "Pendidikan Dokter", passingGrade: 85, color: "from-yellow-400 to-yellow-600" },
  { id: "itb-stei", name: "Institut Teknologi Bandung", major: "Teknik Informatika", passingGrade: 83, color: "from-blue-500 to-blue-700" },
  { id: "ugm-psikologi", name: "Universitas Gadjah Mada", major: "Psikologi", passingGrade: 78, color: "from-emerald-500 to-emerald-700" },
  { id: "undip-hukum", name: "Universitas Diponegoro", major: "Ilmu Hukum", passingGrade: 75, color: "from-blue-400 to-blue-600" },
];

export default function RoadmapPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [mbti, setMbti] = useState<string>("INTJ"); // Fallback
  const [targetCampus, setTargetCampus] = useState(CAMPUS_DATA[0]);
  const [totalXp, setTotalXp] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      // Get MBTI from profile
      const { data: pData } = await supabase.from('profiles').select('assessment_result').eq('id', profile.id).single();
      if (pData?.assessment_result) setMbti(pData.assessment_result);

      // Get Total XP from ai_drill_leaderboard
      const { data: xpData } = await supabase.from('ai_drill_leaderboard').select('total_xp').eq('student_id', profile.id).single();
      if (xpData) setTotalXp(xpData.total_xp || 0);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate SNBT Probability based on XP (Just a fun metric for gamification)
  // Let's say 5000 XP = 100% readiness for a 70 passing grade.
  // Formula: (XP / 5000) * 100
  // Capped at 99%
  const calculateProbability = () => {
    const baseReadiness = (totalXp / 5000) * 100;
    // Penalty if passing grade is high
    const adjusted = baseReadiness - (targetCampus.passingGrade - 70); 
    const finalProb = Math.max(5, Math.min(99, adjusted + 15)); // baseline 15% 
    return Math.round(finalProb);
  };

  const prob = calculateProbability();
  let probColor = "text-red-500";
  let probBg = "bg-red-500";
  if (prob > 40) { probColor = "text-yellow-500"; probBg = "bg-yellow-500"; }
  if (prob > 70) { probColor = "text-green-500"; probBg = "bg-green-500"; }

  const missions = [
    { id: 1, title: "Tingkatkan Logika Matematika", desc: "Selesaikan 3 sesi Latihan Mandiri (Penalaran Kuantitatif)", status: "progress", progress: 1, total: 3 },
    { id: 2, title: "Fokus Biologi", desc: `Materi Genetika sangat penting untuk ${targetCampus.major}`, status: "pending", progress: 0, total: 1 },
    { id: 3, title: "Ikuti Try Out SNBT", desc: "Jadwal Try Out Akbar bulan depan", status: "locked", progress: 0, total: 1 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard" className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Dynamic Roadmap AI</h1>
              <p className="text-xs text-slate-500 font-medium">Jalan Menuju Kampus Impian</p>
            </div>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold">
            <Compass className="w-4 h-4" />
            Tracker
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* University Tracker Widget */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              University Tracker
            </h2>
            <div className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
              Profil: {mbti}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Target Selector */}
              <div>
                <label className="text-sm font-bold text-slate-500 mb-2 block">Pilih Target Kampus & Jurusan</label>
                <div className="space-y-3">
                  {CAMPUS_DATA.map(campus => (
                    <button
                      key={campus.id}
                      onClick={() => setTargetCampus(campus)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                        targetCampus.id === campus.id 
                          ? 'border-purple-500 bg-purple-50 shadow-md' 
                          : 'border-slate-100 hover:border-purple-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 bg-clip-text text-transparent bg-gradient-to-r ${campus.color}`}>
                          {campus.name}
                        </div>
                        <div className="font-bold text-slate-800">{campus.major}</div>
                      </div>
                      {targetCampus.id === campus.id && (
                        <CheckCircle2 className="w-6 h-6 text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-center">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                
                <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Peluang Lolos SNBT</h3>
                <div className="flex items-end gap-3 mb-6">
                  <span className={`text-6xl font-black ${probColor}`}>{prob}%</span>
                  <span className="text-slate-400 font-medium pb-2">/ 100%</span>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    className={`h-full ${probBg}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${prob}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Total XP saat ini: <span className="font-bold text-white">{totalXp} XP</span>
                </div>
                
                <div className="mt-4 text-xs text-slate-500 bg-slate-800/50 p-3 rounded-xl border border-white/5">
                  Simulasi didasarkan pada XP Latihan Mandiri. Tingkatkan XP untuk menaikkan persentase peluangmu!
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Dynamic Roadmap Missions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Misi Belajar Bulan Ini
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-600 mb-6 font-medium">
              Berdasarkan targetmu ke <strong className="text-purple-600">{targetCampus.major} {targetCampus.name}</strong>, AI merekomendasikan misi berikut:
            </p>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {missions.map((mission, idx) => (
                <div key={mission.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon Node */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {mission.status === 'progress' ? (
                      <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" />
                    ) : mission.status === 'locked' ? (
                      <div className="w-4 h-4 bg-slate-300 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />
                    )}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{mission.title}</h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-lg">Misi {idx+1}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">{mission.desc}</p>
                    
                    {mission.status !== 'locked' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>Progres</span>
                          <span>{mission.progress} / {mission.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${(mission.progress / mission.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {mission.status === 'locked' && (
                      <div className="text-xs font-bold text-slate-400 bg-slate-200 inline-block px-3 py-1.5 rounded-lg">
                        Terkunci (Selesaikan misi sebelumnya)
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/student/drills" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Mulai Kerjakan Misi <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
