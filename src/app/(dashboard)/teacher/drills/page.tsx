"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Plus, Trash2, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function TeacherDrillsPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [drills, setDrills] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [xpReward, setXpReward] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    setLoading(true);
    
    // Load Homeroom classes for this teacher
    const { data: cls } = await supabase
      .from("classes")
      .select("*")
      .or(`wali_kelas_id.eq.${profile?.id},co_homeroom_id.eq.${profile?.id}`);
      
    if (cls) {
      setClasses(cls);
      if (cls.length > 0) setClassId(cls[0].id);
    }
      
    // Load existing drills
    const { data: dls } = await supabase
      .from("drills")
      .select("*, classes(name)")
      .eq("teacher_id", profile?.id)
      .order("created_at", { ascending: false });
      
    if (dls) setDrills(dls);
    
    setLoading(false);
  };

  const handleCreateDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !classId || !dueDate) return toast.error("Judul, Kelas, dan Tenggat Waktu wajib diisi");
    
    setSubmitting(true);
    const { error } = await supabase.from("drills").insert({
      title,
      description,
      class_id: classId,
      teacher_id: profile?.id,
      due_date: new Date(dueDate).toISOString(),
      xp_reward: parseInt(xpReward) || 100
    });
    
    if (error) {
      toast.error("Gagal membuat drill");
    } else {
      toast.success("Drill berhasil dibuat!");
      setShowForm(false);
      setTitle("");
      setDescription("");
      loadData();
    }
    setSubmitting(false);
  };

  const handleDeleteDrill = async (id: string) => {
    if (!confirm("Hapus drill ini? Semua pertanyaan dan jawaban siswa akan hilang.")) return;
    await supabase.from("drills").delete().eq("id", id);
    loadData();
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Drills...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-teal-900 mb-2">Weekly Drills</h1>
          <p className="text-teal-600 font-medium">Buat dan kelola tugas mingguan untuk kelas binaan Anda.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
        >
          {showForm ? "Batal" : <><Plus className="w-5 h-5" /> Buat Drill Baru</>}
        </button>
      </div>
      
      {classes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl mb-8">
          <strong>Perhatian:</strong> Anda belum ditugaskan sebagai Wali Kelas (Homeroom Teacher) di kelas mana pun. Anda tidak bisa menugaskan Drill Soal. Hubungi TU.
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Buat Drill Baru</h2>
          <form onSubmit={handleCreateDrill} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Judul Drill</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Drill Matematika Minggu 1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Target Kelas</label>
                <select 
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium focus:border-teal-500 outline-none"
                >
                  <option value="" disabled>Pilih Kelas</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Tenggat Waktu</label>
                <input 
                  type="datetime-local" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1">Reward XP</label>
                <input 
                  type="number" 
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium focus:border-teal-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Deskripsi (Opsional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-medium focus:border-teal-500 outline-none h-20"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting || classes.length === 0}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Drill"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drills.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-bold">Belum ada Drill yang dibuat.</p>
          </div>
        ) : (
          drills.map(drill => (
            <div key={drill.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col relative group">
              <button 
                onClick={() => handleDeleteDrill(drill.id)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-800 mb-1 pr-8">{drill.title}</h3>
              <p className="text-sm font-bold text-teal-600 mb-4">Kelas: {drill.classes?.name}</p>
              
              <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">{drill.description || "Tidak ada deskripsi."}</p>
              
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <div className="text-xs font-bold text-slate-400">
                  <p>XP: +{drill.xp_reward}</p>
                  <p>Due: {new Date(drill.due_date).toLocaleDateString()}</p>
                </div>
                <Link href={`/teacher/drills/${drill.id}`}>
                  <button className="text-sm font-bold text-teal-600 bg-teal-50 px-4 py-2 rounded-lg hover:bg-teal-100 transition-colors">
                    Kelola Soal & Nilai
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
