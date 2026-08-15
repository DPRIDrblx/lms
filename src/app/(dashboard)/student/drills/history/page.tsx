"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, ChevronDown, CheckCircle2, XCircle, Star, Filter, Info, BookA, Languages, Scale, Globe, FlaskConical, Landmark, BrainCircuit, Dna, Atom, Users, Sparkles } from "lucide-react";
import Link from "next/link";
const getSubjectStyles = (name: string) => {
  const styles: Record<string, any> = {
    "Matematika": { icon: BookA, color: "text-blue-500", bg: "bg-blue-100", border: "border-blue-200" },
    "Bahasa Indonesia": { icon: Languages, color: "text-rose-500", bg: "bg-rose-100", border: "border-rose-200" },
    "Pendidikan Pancasila (PPKN)": { icon: Scale, color: "text-emerald-500", bg: "bg-emerald-100", border: "border-emerald-200" },
    "IPAS": { icon: Globe, color: "text-amber-500", bg: "bg-amber-100", border: "border-amber-200" },
    "IPA Terpadu": { icon: FlaskConical, color: "text-cyan-500", bg: "bg-cyan-100", border: "border-cyan-200" },
    "IPS Terpadu": { icon: Landmark, color: "text-orange-500", bg: "bg-orange-100", border: "border-orange-200" },
    "Bahasa Inggris": { icon: Languages, color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200" },
    "Informatika": { icon: BrainCircuit, color: "text-indigo-500", bg: "bg-indigo-100", border: "border-indigo-200" },
    "Biologi": { icon: Dna, color: "text-green-500", bg: "bg-green-100", border: "border-green-200" },
    "Fisika": { icon: Atom, color: "text-blue-600", bg: "bg-blue-200", border: "border-blue-300" },
    "Kimia": { icon: FlaskConical, color: "text-pink-500", bg: "bg-pink-100", border: "border-pink-200" },
    "Sejarah": { icon: Landmark, color: "text-amber-600", bg: "bg-amber-200", border: "border-amber-300" },
    "Geografi": { icon: Globe, color: "text-emerald-600", bg: "bg-emerald-200", border: "border-emerald-300" },
    "Sosiologi": { icon: Users, color: "text-purple-600", bg: "bg-purple-200", border: "border-purple-300" },
    "Ekonomi": { icon: Landmark, color: "text-blue-700", bg: "bg-blue-200", border: "border-blue-300" },
    "NIA Skill Up": { icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" },
  };
  return styles[name] || { icon: BookA, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" };
};

type DrillResult = {
  id: string;
  subject: string;
  topic: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  created_at: string;
};

export default function DrillHistoryPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [history, setHistory] = useState<DrillResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");

  useEffect(() => {
    if (profile?.id) {
      fetchHistory();
    }
  }, [profile?.id]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_drill_results')
        .select('*')
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = filter === "Semua" ? history : history.filter(h => h.subject === filter);
  const uniqueSubjects = ["Semua", ...Array.from(new Set(history.map(h => h.subject)))];

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 h-48 w-full absolute top-0 left-0 z-0">
        <div className="max-w-5xl mx-auto px-6 py-6 relative z-10 flex items-center gap-4 text-white">
          <Link href="/student/drills" className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Riwayat Drill Soal</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-28">
        {/* Filter */}
        <div className="flex items-center justify-center mb-8 gap-3 text-white">
          <Filter className="w-5 h-5" />
          <span className="font-bold">Filter</span>
          <div className="relative">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-white text-slate-800 font-bold px-6 py-2.5 pr-12 rounded-full outline-none cursor-pointer shadow-sm min-w-[200px]"
            >
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* History Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-white/80 font-medium">Memuat riwayat...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <p className="text-slate-500 font-bold text-lg">Belum ada riwayat pengerjaan.</p>
            <p className="text-slate-400 mt-2">Ayo mulai Drill pertamamu!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHistory.map((item) => {
              const styles = getSubjectStyles(item.subject);
              const Icon = styles.icon;
              const wrongCount = item.total_questions - item.correct_answers;
              const xpGained = item.correct_answers * 10;
              
              return (
                <div key={item.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col">
                  {/* Decorative background shape */}
                  <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full ${styles.bg} opacity-20`}></div>
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${styles.bg} ${styles.color}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{item.subject}</h3>
                        <p className="text-sm text-slate-500">Kelas Anda</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-500">{formatDate(item.created_at)}</span>
                  </div>

                  {/* Topic Info */}
                  <div className="mb-6 relative z-10">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Materi yang diujikan</p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-700 text-sm">{item.topic}</p>
                      <span className="text-[#F97316]">⚡</span>
                      <button className="text-[#0284C7] font-semibold text-xs flex items-center hover:underline ml-1">
                        Selengkapnya <ChevronDown className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>

                  {/* Alert Box */}
                  <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-xs flex items-start gap-2 mb-6">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                    <p className="font-medium leading-relaxed">
                      Jawaban benar berulang pada soal yang sama hanya dihitung benar satu kali.
                    </p>
                    <button className="ml-auto text-blue-400 hover:text-blue-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                    <div className="border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benar</p>
                      <p className="font-black text-slate-800 text-lg">{item.correct_answers} <span className="text-sm font-semibold">soal</span></p>
                    </div>
                    <div className="border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-1">
                        <XCircle className="w-5 h-5 text-rose-500" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salah</p>
                      <p className="font-black text-slate-800 text-lg">{wrongCount} <span className="text-sm font-semibold">soal</span></p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 font-medium">Kamu mendapatkan</span>
                      <div className="flex items-center gap-1 font-black text-slate-800">
                        +{xpGained} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    <button className="bg-[#F97316] hover:bg-[#EA580C] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-md shadow-orange-500/20">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
