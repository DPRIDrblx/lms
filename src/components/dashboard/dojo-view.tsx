"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { playSound } from "@/lib/audio";
import toast from "react-hot-toast";

const POSITIVE_ACTIONS = [
  { id: 'p1', label: "Aktif Bertanya", xp: 5, icon: "🙋‍♂️" },
  { id: 'p2', label: "Bantu Teman", xp: 5, icon: "🤝" },
  { id: 'p3', label: "Kerja Keras", xp: 10, icon: "💪" },
  { id: 'p4', label: "Tugas Sempurna", xp: 15, icon: "⭐" },
];

const NEEDS_WORK_ACTIONS = [
  { id: 'n1', label: "Berisik", xp: -5, icon: "🤫" },
  { id: 'n2', label: "Tidak Fokus", xp: -5, icon: "😴" },
  { id: 'n3', label: "Tugas Telat", xp: -10, icon: "⏰" },
];

export function DojoView({ students, refresh }: { students: any[], refresh: () => void }) {
  const supabase = createClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const awardPoints = async (xpDiff: number, reason: string) => {
    if (!selectedStudent || loading) return;
    setLoading(true);

    try {
      const newXp = (selectedStudent.xp || 0) + xpDiff;
      const { error } = await supabase
        .from('profiles')
        .update({ xp: Math.max(0, newXp) })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      if (xpDiff > 0) {
        playSound('success');
        toast.success(`+${xpDiff} XP untuk ${selectedStudent.full_name} (${reason})`);
      } else {
        playSound('error');
        toast.error(`${xpDiff} XP untuk ${selectedStudent.full_name} (${reason})`);
      }

      refresh();
      setSelectedStudent(null);
    } catch (err) {
      toast.error("Gagal memberikan poin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-800">Dojo Kelas</h3>
          <p className="text-slate-500 font-medium text-sm">Beri penghargaan secara real-time kepada siswa.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {students.map((student, i) => (
          <motion.div
            key={student.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedStudent(student)}
            className="bg-white rounded-3xl border-2 border-slate-100 p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all group"
          >
            <div className="relative">
              {student.avatar_url ? (
                <img src={student.avatar_url} alt={student.full_name} className="w-16 h-16 rounded-full object-cover border-4 border-slate-100 group-hover:border-emerald-200 transition-colors" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-2xl font-black border-4 border-slate-100 group-hover:border-emerald-200 transition-colors">
                  {student.full_name?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white text-xs font-black px-2 py-1 rounded-lg border-2 border-white shadow-sm">
                {student.xp || 0}
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-sm line-clamp-1">{student.full_name?.split(' ')[0]}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Point Award Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-slate-800">Beri Feedback</h2>
                <p className="text-slate-500 font-medium mt-1">ke {selectedStudent.full_name}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3">Sikap Positif (Tambah XP)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {POSITIVE_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        onClick={() => awardPoints(action.xp, action.label)}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl transition-all active:scale-95"
                      >
                        <span className="text-3xl mb-2">{action.icon}</span>
                        <span className="font-bold text-emerald-800 text-sm">{action.label}</span>
                        <span className="text-xs font-black text-emerald-600 mt-1">+{action.xp} XP</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3">Perlu Perbaikan (Kurangi XP)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {NEEDS_WORK_ACTIONS.map(action => (
                      <button
                        key={action.id}
                        onClick={() => awardPoints(action.xp, action.label)}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-3 bg-red-50 hover:bg-red-100 border-2 border-red-100 hover:border-red-300 rounded-2xl transition-all active:scale-95"
                      >
                        <span className="text-2xl mb-1">{action.icon}</span>
                        <span className="font-bold text-red-800 text-[10px] text-center leading-tight">{action.label}</span>
                        <span className="text-xs font-black text-red-600 mt-1">{action.xp} XP</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
