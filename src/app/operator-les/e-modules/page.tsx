"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2, Plus, Users, ExternalLink, Link2 } from "lucide-react";
import toast from "react-hot-toast";

export default function CenterEModulesManager() {
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [classId, setClassId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    // Fetch classes (filter for center classes only)
    const { data: clsData } = await supabase.from("classes").select("*").order("name");
    const regularClasses = ["7A", "7B", "7C", "7D", "8A", "8B", "8C", "8D", "9A", "9B", "9C", "9D"];
    if (clsData) setClasses(clsData.filter((c: any) => !regularClasses.includes(c.name)));

    // Fetch E-Modules
    const { data: modData } = await supabase
      .from("e_modules")
      .select("*, classes(name)")
      .order("created_at", { ascending: false });
    if (modData) setModules(modData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !driveLink || !classId) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }

    const { error } = await supabase.from("e_modules").insert({
      title,
      drive_link: driveLink,
      class_id: classId
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-Modul berhasil ditambahkan");
      setTitle("");
      setDriveLink("");
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus E-Modul ini?")) return;
    
    const { error } = await supabase.from("e_modules").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-Modul berhasil dihapus");
      fetchData();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen E-Modul</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola tautan materi dan bank soal untuk kelas Center</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm rounded-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Tambah E-Modul
            </h2>
            
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Kelas</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Modul</label>
                <input 
                  type="text"
                  placeholder="Contoh: Modul IPA Bab 3"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Link Google Drive / Tautan File</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="url"
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-500/20">
                Simpan E-Modul
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT PANEL: Module List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada e-modul yang diunggah.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((m) => (
                <Card key={m.id} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl relative group overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-3 ml-2">
                      <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {m.classes?.name || "Semua Kelas"}
                      </div>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus E-Modul"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-black text-lg text-slate-800 ml-2 mb-2 leading-tight line-clamp-2">{m.title}</h3>
                  </div>

                  <a 
                    href={m.drive_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors self-start"
                  >
                    Buka File <ExternalLink className="w-4 h-4" />
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
