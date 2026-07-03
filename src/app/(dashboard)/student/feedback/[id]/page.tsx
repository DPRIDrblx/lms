"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, CheckCircle2, ArrowLeft, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentFeedbackForm() {
  const params = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [c1, setC1] = useState(0); 
  const [c2, setC2] = useState(0); 
  const [c3, setC3] = useState(0); 
  const [engaging, setEngaging] = useState(0); 
  const [understanding, setUnderstanding] = useState(0); 
  const [c4, setC4] = useState(0); 
  const [c5, setC5] = useState(0); 
  const [c6, setC6] = useState(0); 
  const [c7, setC7] = useState(0); 
  const [c8, setC8] = useState(0); 
  
  const [rating, setRating] = useState(0); 
  const [suggestion, setSuggestion] = useState(""); 

  useEffect(() => {
    async function fetchSession() {
      if (!profile || !params.id) return;
      const { data } = await supabase
        .from("ace_feedback_sessions")
        .select("*, profiles!teacher_id(full_name)")
        .eq("id", params.id)
        .single();
        
      if (data) {
        setSession(data);
      }
      setLoading(false);
    }
    fetchSession();
  }, [params.id, profile, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c1 || !c2 || !c3 || !c4 || !c5 || !c6 || !c7 || !c8 || !engaging || !understanding || !rating) {
      alert("Mohon lengkapi seluruh pertanyaan dan berikan rating bintang sebelum mengirimkan evaluasi.");
      return;
    }
    
    setSubmitting(true);
    try {
      await supabase.from("ace_student_feedbacks").insert({
        session_id: session.id,
        teacher_id: session.teacher_id,
        student_id: profile?.id,
        semester: session.semester,
        criteria_1_score: c1,
        criteria_2_score: c2,
        criteria_3_score: c3,
        criteria_4_score: c4,
        criteria_5_score: c5,
        criteria_6_score: c6,
        criteria_7_score: c7,
        criteria_8_score: c8,
        engaging_score: engaging,
        understanding_score: understanding,
        rating: rating,
        suggestion: suggestion.trim() || null
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } catch (err: any) {
      alert("Terjadi kesalahan sistem: " + err.message);
      setSubmitting(false);
    }
  };

  const renderMinimalLikert = (val: number, setVal: (v: number) => void, labels: string[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
      {labels.map((label, index) => {
        const num = index + 1;
        const isSelected = val === num;
        return (
          <button
            key={num}
            type="button"
            onClick={() => setVal(num)}
            className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
              isSelected 
                ? 'border-slate-800 bg-slate-800 text-white shadow-md' 
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="text-center font-medium text-slate-500">Sesi evaluasi tidak ditemukan atau telah ditutup.</div></div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-slate-200">
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8 pb-32">
        
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dasbor
        </Link>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center mt-10 shadow-sm"
            >
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-slate-800" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Evaluasi Berhasil Disimpan</h1>
              <p className="text-slate-500 text-base max-w-md leading-relaxed">
                Terima kasih atas partisipasi Anda. Evaluasi ini sangat berarti untuk menjaga dan meningkatkan kualitas pembelajaran di sekolah. Mengalihkan...
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              <div className="mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                  Formulir Evaluasi Pembelajaran
                </h1>
                <p className="text-slate-500 text-base sm:text-lg">
                  Penilaian kinerja mengajar untuk <span className="font-semibold text-slate-800">{session.profiles?.full_name}</span>
                </p>
              </div>
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-10 flex gap-4 items-start">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1 text-sm">Identitas Dirahasiakan</h4>
                  <p className="text-sm text-blue-800/80 leading-relaxed">
                    Evaluasi ini bersifat anonim dan tertutup. Identitas Anda tidak akan disertakan dalam laporan hasil akhir yang diterima oleh guru bersangkutan.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                
                {/* SECTION 1: LIKERT QUESTIONS */}
                <div className="space-y-8">
                  
                  {/* Q1 */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah penjelasan materi dari beliau mudah Anda pahami saat belajar di kelas?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi tingkat kejelasan dan penyampaian materi.</p>
                    {renderMinimalLikert(c1, setC1, ["Sangat Membingungkan", "Kurang Jelas", "Cukup Jelas", "Sangat Jelas & Paham"])}
                  </div>
                  
                  {/* Q2 */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah Anda merasa beliau berlaku adil dalam memberikan nilai maupun sanksi?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi objektivitas dan perlakuan setara kepada seluruh siswa.</p>
                    {renderMinimalLikert(c2, setC2, ["Sangat Pilih Kasih", "Kurang Adil", "Cukup Adil", "Sangat Objektif & Adil"])}
                  </div>
                  
                  {/* Q3 */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah tugas dan pekerjaan rumah (PR) yang diberikan relevan dengan materi?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Menilai keterkaitan beban tugas dengan topik pembelajaran utama.</p>
                    {renderMinimalLikert(c3, setC3, ["Sangat Tidak Relevan", "Kurang Sesuai", "Relevan", "Sangat Tepat Sasaran"])}
                  </div>
                  
                  {/* Q4 (engaging) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Bagaimana suasana belajar di dalam kelas saat beliau sedang mengajar?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi interaktivitas dan manajemen suasana kelas.</p>
                    {renderMinimalLikert(engaging, setEngaging, ["Sangat Membosankan", "Kaku / Monoton", "Cukup Asik", "Sangat Interaktif & Seru"])}
                  </div>
                  
                  {/* Q5 (understanding) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Secara keseluruhan, seberapa besar manfaat ilmu dan materi yang beliau sampaikan?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Menilai efektivitas dan kebermanfaatan sesi pembelajaran.</p>
                    {renderMinimalLikert(understanding, setUnderstanding, ["Tidak Bermanfaat", "Kurang Terasa", "Cukup Berguna", "Sangat Bermanfaat"])}
                  </div>

                  {/* Q6 (c4) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Saat Anda mengalami kesulitan belajar, apakah beliau bersedia meluangkan waktu untuk membantu?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi kepedulian dan empati guru terhadap siswa.</p>
                    {renderMinimalLikert(c4, setC4, ["Tidak Pernah Membantu", "Jarang Peduli", "Sering Membantu", "Sangat Peduli & Sabar"])}
                  </div>

                  {/* Q7 (c5) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah beliau sering memberikan apresiasi (pujian/semangat) atas usaha yang Anda lakukan?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi dukungan moral dan motivasi eksternal dari guru.</p>
                    {renderMinimalLikert(c5, setC5, ["Sering Mengkritik Tajam", "Jarang Mengapresiasi", "Sering Memuji", "Selalu Memberi Semangat"])}
                  </div>

                  {/* Q8 (c6) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Bagaimana tingkat kedisiplinan beliau terkait waktu kehadiran di kelas?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi kepatuhan terhadap jadwal yang telah ditetapkan.</p>
                    {renderMinimalLikert(c6, setC6, ["Sering Terlambat Lama", "Kadang Terlambat", "Tepat Waktu", "Sangat Disiplin"])}
                  </div>

                  {/* Q9 (c7) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah Anda merasa nyaman untuk bertanya pendapat secara bebas saat kelas berlangsung?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi ruang aman berekspresi secara akademik.</p>
                    {renderMinimalLikert(c7, setC7, ["Takut untuk Bertanya", "Kurang Nyaman", "Cukup Nyaman", "Sangat Bebas & Dihargai"])}
                  </div>

                  {/* Q10 (c8) */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Apakah cara mengajar beliau mampu memotivasi Anda untuk belajar lebih mandiri dan giat?
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">Mengevaluasi dampak inspirasional pasca pembelajaran.</p>
                    {renderMinimalLikert(c8, setC8, ["Malah Membuat Malas", "Biasa Saja", "Cukup Termotivasi", "Sangat Terinspirasi"])}
                  </div>

                </div>

                <div className="h-px bg-slate-200 w-full" />

                {/* SECTION 2: RATING & SUGGESTION */}
                <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm">
                  
                  <div className="mb-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Penilaian Akhir (Overall Rating)</h3>
                    <p className="text-sm text-slate-500 mb-6">Berdasarkan seluruh pengalaman Anda, berikan evaluasi bintang untuk performa beliau.</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none group p-1"
                        >
                          <Star className={`w-10 h-10 transition-all ${rating >= star ? 'text-slate-800 fill-slate-800' : 'text-slate-200 group-hover:text-slate-400'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Masukan Konstruktif untuk {session.profiles?.full_name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">Tuliskan pesan, saran, atau hal yang menurut Anda perlu dipertahankan maupun diperbaiki.</p>
                    <textarea 
                      value={suggestion}
                      onChange={e => setSuggestion(e.target.value)}
                      placeholder="Contoh: 'Saya sangat menyukai sesi diskusinya, namun sebaiknya contoh soal diperbanyak...'"
                      className="w-full p-4 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-y min-h-[160px] text-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={submitting} 
                    className="h-12 px-8 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 transition-all text-white min-w-[200px]"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Kirim Evaluasi"
                    )}
                  </Button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
