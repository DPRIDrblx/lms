"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DrillQuestionsPage() {
  const { id } = useParams() as { id: string };
  const { profile } = useAuth();
  const supabase = createClient();

  const [drill, setDrill] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && profile?.id) {
      loadData();
    }
  }, [id, profile?.id]);

  const loadData = async () => {
    setLoading(true);
    
    // Load Drill details
    const { data: dl } = await supabase.from("drills").select("*, classes(name)").eq("id", id).single();
    if (dl) setDrill(dl);
      
    // Load existing questions
    const { data: qs } = await supabase.from("drill_questions").select("*").eq("drill_id", id).order("created_at", { ascending: true });
    if (qs) setQuestions(qs);
    
    setLoading(false);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return toast.error("Soal tidak boleh kosong");
    if (options.some(opt => !opt.trim())) return toast.error("Semua pilihan jawaban wajib diisi");
    
    setSubmitting(true);
    const { error } = await supabase.from("drill_questions").insert({
      drill_id: id,
      question: questionText,
      options: options,
      correct_index: correctIndex
    });
    
    if (error) {
      toast.error("Gagal menambahkan soal");
    } else {
      toast.success("Soal berhasil ditambahkan!");
      setShowForm(false);
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      loadData();
    }
    setSubmitting(false);
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Hapus soal ini?")) return;
    await supabase.from("drill_questions").delete().eq("id", qId);
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;
  if (!drill) return <div className="p-8 text-center text-rose-500 font-bold">Drill tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-24">
      <Link href="/teacher/drills" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-bold mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Drill
      </Link>
      
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">{drill.title}</h1>
        <p className="text-slate-500 font-medium mb-6">{drill.description}</p>
        
        <div className="flex gap-4">
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl font-bold text-sm">
            Kelas: {drill.classes?.name}
          </div>
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm">
            XP: +{drill.xp_reward}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-800">Daftar Soal ({questions.length})</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow flex items-center gap-2"
        >
          {showForm ? "Batal" : <><Plus className="w-4 h-4" /> Tambah Soal</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-50 p-6 rounded-2xl border-2 border-teal-100 mb-8">
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Pertanyaan</label>
              <textarea 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-medium focus:border-teal-500 outline-none h-24 resize-none shadow-inner"
                placeholder="Tuliskan pertanyaan di sini..."
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">Pilihan Jawaban</label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="correct_answer" 
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    className="w-5 h-5 text-teal-600 focus:ring-teal-500"
                  />
                  <input 
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                    className={`flex-1 bg-white border rounded-xl px-4 py-3 font-medium outline-none transition-colors ${correctIndex === i ? 'border-teal-500 bg-teal-50' : 'border-slate-200 focus:border-teal-500'}`}
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500 font-bold mt-2">*Pilih radio button untuk menentukan jawaban yang benar.</p>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Simpan Soal</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {questions.length === 0 && !showForm && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 font-bold">
            Belum ada soal. Klik "Tambah Soal" untuk memulai.
          </div>
        )}
        
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
            <button 
              onClick={() => handleDeleteQuestion(q.id)}
              className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-slate-800 mb-4">{q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt: string, i: number) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-xl border-2 font-medium ${
                        i === q.correct_index 
                        ? 'border-teal-500 bg-teal-50 text-teal-800' 
                        : 'border-slate-100 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
