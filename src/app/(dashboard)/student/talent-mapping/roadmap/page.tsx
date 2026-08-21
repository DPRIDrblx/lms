"use client";

import { useState } from "react";
import { ArrowLeft, LayoutGrid, Map, User, Target, ChevronRight, Lock, CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import PilihPTNModal from "@/components/talent-mapping/PilihPTNModal";

const dummyMissions = [
  {
    id: 1,
    title: "Pengenalan UTBK",
    desc: "Pahami struktur dan jenis soal yang diujikan.",
    status: "completed", // completed, active, locked
    type: "Materi"
  },
  {
    id: 2,
    title: "Penalaran Umum Dasar",
    desc: "Latihan logika dan pemahaman bacaan tingkat awal.",
    status: "active",
    type: "Latihan Belajar",
    progress: 40
  },
  {
    id: 3,
    title: "Simulasi TryOut 1",
    desc: "Uji kemampuan awalmu dengan format yang mirip aslinya.",
    status: "locked",
    type: "TryOut"
  },
  {
    id: 4,
    title: "Strategi Lolos PTN",
    desc: "Tips jitu memilih prodi dan manajemen waktu belajar.",
    status: "locked",
    type: "Materi Belajar"
  }
];

export default function RoadmapPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCampus, setTargetCampus] = useState({ ptn: "Universitas Indonesia", major: "Ilmu Komputer (S-1)" });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 z-10 relative">
        <div className="flex items-center gap-2">
          <Link href="/student/talent-mapping" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Link>
          <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <span className="text-amber-500">✨</span> IGNITE Skill Test
          </h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
          <User className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 relative z-10">
        
        {/* Header Section */}
        <div className="bg-slate-50 px-6 py-8 border-b border-slate-100 mb-8 rounded-b-[2.5rem]">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-2">Misi Kampus Impian</h2>
          <p className="text-sm text-slate-500 text-center mb-6">
            Roadmap ke <strong>{targetCampus.ptn}</strong> berdasarkan hasil MBTI dan tes belajarmu.
          </p>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center justify-between group hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-400 tracking-wider">TARGET KAMU</div>
                <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{targetCampus.ptn}</h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">{targetCampus.major}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          </button>
        </div>

        {/* Timeline */}
        <div className="px-6 relative before:absolute before:inset-0 before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-slate-100">
          
          <div className="space-y-8 relative">
            {dummyMissions.map((mission, index) => {
              
              let Icon = Lock;
              let iconColor = "text-slate-400";
              let iconBg = "bg-slate-100 border-4 border-white";
              
              if (mission.status === 'completed') {
                Icon = CheckCircle2;
                iconColor = "text-emerald-500";
                iconBg = "bg-emerald-50 border-4 border-white";
              } else if (mission.status === 'active') {
                Icon = PlayCircle;
                iconColor = "text-amber-500";
                iconBg = "bg-amber-100 border-4 border-white animate-pulse";
              }

              return (
                <div key={mission.id} className="relative flex items-start gap-6">
                  
                  {/* Node */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  
                  {/* Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`flex-1 rounded-3xl p-5 border shadow-sm ${
                      mission.status === 'active' 
                        ? 'bg-white border-amber-200 shadow-amber-100/50' 
                        : mission.status === 'completed' 
                          ? 'bg-emerald-50/30 border-emerald-100'
                          : 'bg-slate-50 border-slate-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        mission.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        mission.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {mission.status === 'completed' ? 'SELESAI' : mission.status === 'active' ? 'MISI SAAT INI' : 'TERKUNCI'}
                      </div>
                    </div>
                    
                    <h3 className={`font-bold mb-1 ${mission.status === 'locked' ? 'text-slate-500' : 'text-slate-800'}`}>
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      {mission.desc}
                    </p>

                    {mission.status === 'active' && mission.progress !== undefined && (
                      <div className="space-y-3">
                        <div className="flex justify-end text-[10px] font-bold text-slate-400">
                          {mission.progress}% Selesai
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${mission.progress}%` }} />
                        </div>
                        <button className="w-full mt-2 bg-amber-950 text-amber-400 font-bold py-2.5 rounded-xl text-sm transition-transform active:scale-95">
                          Mulai Belajar
                        </button>
                      </div>
                    )}
                    
                    {mission.status !== 'active' && (
                      <div className="flex items-center justify-center gap-1.5 pt-2 mt-2 border-t border-slate-200/50">
                        <span className="text-xs font-bold text-slate-400">
                          {mission.type}
                        </span>
                      </div>
                    )}

                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* PTN Selection Modal */}
      <PilihPTNModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(ptn, major) => setTargetCampus({ ptn, major })}
      />

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-2 z-20 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
        <div className="flex justify-around items-center">
          <Link href="/student/talent-mapping" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600">
            <LayoutGrid className="w-6 h-6" />
            <span className="text-[10px] font-bold">Dash</span>
          </Link>
          <Link href="/student/talent-mapping/assessment" className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">Test</span>
          </Link>
          <Link href="/student/talent-mapping/roadmap" className="flex flex-col items-center gap-1 p-2 text-amber-500">
            <Map className="w-6 h-6" />
            <span className="text-[10px] font-bold">Map</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
