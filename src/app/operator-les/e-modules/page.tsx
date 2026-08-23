"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Trash2, Plus, Users, Upload, PenTool, LayoutList, Loader2, Edit3 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import toast from "react-hot-toast";
import Link from "next/link";

export default function CenterEModulesManager() {
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [migratingId, setMigratingId] = useState<string | null>(null);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTargetClassIds, setEditTargetClassIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!title || targetClassIds.length === 0) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }
    
    if (!pdfFile) {
      toast.error("Mohon pilih file PDF");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload PDF
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `emodules/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('e_modules_pdfs')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('e_modules_pdfs')
        .getPublicUrl(filePath);

      // 2. Insert to database
      const { error } = await supabase.from("e_modules").insert({
        title,
        pdf_url: publicUrlData.publicUrl,
        target_class_ids: targetClassIds,
        class_id: targetClassIds[0] || null
      });

      if (error) throw error;

      toast.success("E-Modul berhasil ditambahkan");
      setTitle("");
      setPdfFile(null);
      setTargetClassIds([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah E-Modul");
    } finally {
      setIsUploading(false);
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

  const handleEditClick = (m: any) => {
    setEditingModule(m);
    setEditTitle(m.title);
    setEditTargetClassIds(m.target_class_ids || (m.class_id ? [m.class_id] : []));
    setIsEditModalOpen(true);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || editTargetClassIds.length === 0) {
      toast.error("Mohon lengkapi semua field wajib");
      return;
    }
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("e_modules").update({
        title: editTitle,
        target_class_ids: editTargetClassIds,
        class_id: editTargetClassIds[0] || null
      }).eq("id", editingModule.id);
      
      if (error) throw error;
      
      toast.success("E-Modul berhasil diperbarui");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui E-Modul");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMigratePDF = async (id: string, file: File) => {
    setMigratingId(id);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `emodules/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('e_modules_pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('e_modules_pdfs')
        .getPublicUrl(filePath);

      const { error } = await supabase.from("e_modules").update({
        pdf_url: publicUrlData.publicUrl
      }).eq("id", id);

      if (error) throw error;

      toast.success("Berhasil mengubah ke modul interaktif!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah PDF");
    } finally {
      setMigratingId(null);
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
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Kelas</label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={targetClassIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setTargetClassIds([...targetClassIds, c.id]);
                          else setTargetClassIds(targetClassIds.filter(id => id !== c.id));
                        }}
                      />
                      <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                    </label>
                  ))}
                </div>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">File PDF E-Modul</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="file"
                    accept="application/pdf"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>

              <Button disabled={isUploading} type="submit" className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-500/20">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload E-Modul"}
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
                        {m.target_class_ids && m.target_class_ids.length > 0 
                          ? m.target_class_ids.map((id: string) => classes.find(c => c.id === id)?.name).filter(Boolean).join(", ")
                          : (m.classes?.name || "Semua Kelas")}
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditClick(m)}
                          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Konfigurasi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus E-Modul"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-lg text-slate-800 ml-2 mb-2 leading-tight line-clamp-2">{m.title}</h3>
                  </div>

                  <div className="ml-2 mt-4 flex flex-wrap gap-2 self-start">
                    {m.pdf_url ? (
                      <>
                        <Link href={`/operator-les/e-modules/${m.id}/builder`}>
                          <Button size="sm" className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700" variant="secondary">
                            <PenTool className="w-3.5 h-3.5 mr-1.5" /> Interactive Builder
                          </Button>
                        </Link>
                        <Link href={`/operator-les/e-modules/${m.id}/responses`}>
                          <Button size="sm" variant="ghost" className="border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                            <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Responses & Grading
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <a 
                          href={m.drive_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
                        >
                          Buka Link Lama
                        </a>
                        
                        <label className={`inline-flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors cursor-pointer ${migratingId === m.id ? 'opacity-50 pointer-events-none' : ''}`}>
                          {migratingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                          Ubah ke PDF
                          <input 
                            type="file" 
                            accept="application/pdf" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleMigratePDF(m.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Konfigurasi E-Modul"
      >
        <form onSubmit={handleUpdateModule} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Kelas</label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map(c => (
                <label key={c.id} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    checked={editTargetClassIds.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked) setEditTargetClassIds([...editTargetClassIds, c.id]);
                      else setEditTargetClassIds(editTargetClassIds.filter(id => id !== c.id));
                    }}
                  />
                  <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Judul Modul</label>
            <input 
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
            <Button disabled={isUpdating} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
