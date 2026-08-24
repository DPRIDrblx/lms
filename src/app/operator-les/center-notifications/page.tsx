"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users, Upload, Loader2, Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function CenterNotificationsManager() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [targetClassIds, setTargetClassIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    // Fetch classes (filter for center classes only)
    const { data: clsData } = await supabase.from("classes").select("*").order("name");
    const regularClasses = ["7A", "7B", "7C", "7D", "8A", "8B", "8C", "8D", "9A", "9B", "9C", "9D"];
    if (clsData) setClasses(clsData.filter((c: any) => !regularClasses.includes(c.name)));

    // Fetch Notifications
    const { data: notifData } = await supabase
      .from("center_notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (notifData) setNotifications(notifData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || targetClassIds.length === 0) {
      toast.error("Mohon lengkapi semua field wajib (Judul, Isi, Target Kelas)");
      return;
    }
    
    setIsUploading(true);

    try {
      let publicUrl = null;
      if (imageFile) {
        // Upload Image
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('center_banners')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('center_banners')
          .getPublicUrl(filePath);
          
        publicUrl = publicUrlData.publicUrl;
      }

      // Insert to database
      const { error } = await supabase.from("center_notifications").insert({
        title,
        content,
        banner_url: publicUrl,
        target_class_ids: targetClassIds,
      });

      if (error) throw error;

      toast.success("Notifikasi berhasil ditambahkan");
      setTitle("");
      setContent("");
      setImageFile(null);
      setTargetClassIds([]);
      
      // Reset file input manually
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat notifikasi");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus notifikasi ini?")) return;
    
    const { error } = await supabase.from("center_notifications").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notifikasi berhasil dihapus");
      fetchData();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Notifikasi Center</h1>
        <p className="text-slate-500 font-medium mt-1">Kelola pengumuman & notifikasi untuk siswa Center</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm rounded-2xl sticky top-24">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Buat Notifikasi Baru
            </h2>
            
            <form onSubmit={handleAddNotification} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Kelas <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Notifikasi <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  placeholder="Contoh: Try Out Akhir Semester"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Isi Pesan <span className="text-red-500">*</span></label>
                <textarea 
                  placeholder="Detail pengumuman..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[100px]"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banner (Opsional)</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <Button disabled={isUploading} type="submit" className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-lg shadow-indigo-500/20">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Notifikasi"}
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT PANEL: Notification List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada notifikasi yang dibuat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {notifications.map((n) => (
                <Card key={n.id} className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl relative group overflow-hidden flex flex-col md:flex-row gap-5">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                  
                  {n.banner_url && (
                    <div className="w-full md:w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-100">
                      <img src={n.banner_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5">
                          <Users className="w-3 h-3" />
                          {n.target_class_ids && n.target_class_ids.length > 0 
                            ? n.target_class_ids.map((id: string) => classes.find(c => c.id === id)?.name).filter(Boolean).join(", ")
                            : "Semua Kelas"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDelete(n.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Hapus Notifikasi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-black text-lg text-slate-800 mb-1 leading-tight">{n.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3">{n.content}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
