"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Camera, Loader2, User, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { removeBackground } from "@imgly/background-removal";

export function TutorProfileWidget() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>, useAI: boolean) => {
    try {
      if (!profile) return;
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);
      const toastId = toast.loading(useAI ? "Memproses AI Remove Background (Mungkin butuh waktu agak lama)..." : "Mengunggah foto profil...");

      let processedFile: File = file;
      if (useAI) {
        try {
          const blob = await removeBackground(file);
          processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".png"), { type: "image/png" });
        } catch (bgError) {
          console.error("Background removal failed:", bgError);
          toast.error("Gagal menghapus background otomatis. Mengunggah versi asli...", { id: toastId });
        }
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to avatars bucket and update profile via API to bypass RLS
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('filePath', filePath);
      formData.append('profileId', profile.id);

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload avatar');
      }

      toast.success("Foto profil berhasil diperbarui!", { id: toastId });
      // Force reload to update auth context
      window.location.reload();

    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between mb-8 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || "Profile"} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2>
          <p className="text-slate-500 font-medium mb-3">Tutor / Pengajar</p>
          
          <div className="flex flex-wrap gap-2">
            <label className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
               {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
               Upload Normal (Cepat)
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadPhoto(e, false)} disabled={uploading} />
            </label>
            <label className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm">
               {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               Upload + AI Hapus BG
               <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUploadPhoto(e, true)} disabled={uploading} />
            </label>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium max-w-sm">Pastikan foto tanpa background (PNG) agar menyatu dengan sempurna di jadwal siswa.</p>
        </div>
      </div>
    </div>
  );
}
