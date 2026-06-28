"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { UserCircle2, ClipboardCheck, ArrowRight, Save, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function HoDSupervisi() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [performances, setPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeObservation, setActiveObservation] = useState<string | null>(null);
  const [scores, setScores] = useState({ aspect1: 0, aspect2: 0, aspect3: 0, aspect4: 0 });
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch performances that are ready for observation (phase: pelaksanaan) or we just fetch all that don't have hod_score yet
    const { data } = await supabase
      .from('ace_performances')
      .select('*, profiles(full_name)')
      .is('hod_score', null);
      
    if (data) setPerformances(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleStartObservation = (perfId: string) => {
    setActiveObservation(perfId);
    setScores({ aspect1: 0, aspect2: 0, aspect3: 0, aspect4: 0 });
    setNotes("");
  };

  const handleSubmitAppraisal = async (id: string) => {
    if (Object.values(scores).some(v => v === 0)) {
      alert("Mohon lengkapi semua aspek penilaian (1-5).");
      return;
    }
    if (!notes) {
      alert("Catatan Rekomendasi Klinis wajib diisi.");
      return;
    }

    setSaving(true);
    // Calculate final score scaled to 100
    const totalRaw = scores.aspect1 + scores.aspect2 + scores.aspect3 + scores.aspect4; // Max 20
    const finalScore = (totalRaw / 20) * 100;

    try {
      await supabase.from('ace_performances').update({ 
        hod_score: finalScore,
        hod_notes: notes,
        phase: 'penilaian' // Move to next phase for Principal to see
      }).eq('id', id);
      
      setPerformances(prev => prev.filter(p => p.id !== id));
      setActiveObservation(null);
      alert("Appraisal berhasil disubmit! Tidak dapat diubah lagi.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (aspectKey: keyof typeof scores) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            onClick={() => setScores(prev => ({ ...prev, [aspectKey]: num }))}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              scores[aspectKey] >= num ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    );
  };

  if (!profile || !profile.is_hod) return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Instrumen Supervisi Klinis</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Clinical Supervision & Observation Tool</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Jadwal Observasi (Menunggu)</h2>
          
          {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : performances.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-slate-500 text-sm">
              Tidak ada jadwal supervisi.
            </div>
          ) : performances.map(perf => (
            <Card 
              key={perf.id} 
              className={`p-4 rounded-lg cursor-pointer transition-colors ${activeObservation === perf.id ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300 shadow-sm'}`}
              onClick={() => handleStartObservation(perf.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <UserCircle2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{perf.profiles?.full_name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{perf.phase}</p>
                </div>
              </div>
              <div className="flex items-center text-xs text-indigo-600 font-bold mt-3 group">
                Mulai Observasi Klinis <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}

          <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
            <h3 className="text-xs font-bold text-indigo-800 uppercase mb-2">Peer-Observation Scheduler</h3>
            <p className="text-xs text-indigo-600 mb-3">Jadwalkan guru untuk saling mengobservasi kelas (*Cross-visit*).</p>
            <button className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-xs font-bold shadow-sm hover:bg-indigo-700">Buat Pasangan Peer-Review</button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeObservation ? (
            <Card className="p-6 rounded-lg border border-indigo-200 shadow-lg bg-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <ClipboardCheck className="w-48 h-48 text-indigo-600" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-black text-slate-800 mb-1">Live Rubric Scoring</h2>
                <p className="text-sm text-slate-500 mb-8 border-b border-slate-100 pb-4">Silakan nilai performa guru berdasarkan 4 aspek baku (1 - Sangat Kurang, 5 - Sangat Baik).</p>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">1. Penguasaan Materi</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">Guru mendemonstrasikan pemahaman mendalam tentang topik dan menjawab pertanyaan dengan akurat.</p>
                    </div>
                    {renderStars('aspect1')}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">2. Manajemen Kelas</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">Guru mengendalikan suasana kelas, menjaga disiplin, dan transisi antar aktivitas berjalan mulus.</p>
                    </div>
                    {renderStars('aspect2')}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">3. Keterlibatan Siswa</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">Metode pembelajaran interaktif dan mendorong partisipasi aktif dari seluruh siswa (HOTS).</p>
                    </div>
                    {renderStars('aspect3')}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">4. Penggunaan Teknologi</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">Media ajar (LMS, presentasi interaktif) digunakan secara efektif, bukan sekadar pajangan.</p>
                    </div>
                    {renderStars('aspect4')}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-2">Catatan Rekomendasi Klinis (Post-Observation Note)</h3>
                  <p className="text-xs text-rose-500 mb-3 font-medium">*Wajib diisi dengan Poin Kekuatan (Strengths) dan Area Pengembangan (Areas for Growth).</p>
                  <textarea 
                    className="w-full p-4 border border-slate-200 rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tuliskan catatan evaluasi komprehensif di sini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button 
                    onClick={() => setActiveObservation(null)}
                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded shadow-sm hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={saving}
                    onClick={() => handleSubmitAppraisal(activeObservation)}
                    className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Submit Appraisal
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-slate-400">
              <ClipboardCheck className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Pilih jadwal observasi di samping untuk memulai penilaian.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
