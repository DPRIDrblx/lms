"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Camera, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import { removeBackground } from "@imgly/background-removal";

export function TutorProfileWidget() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);
      const toastId = toast.loading("Memproses AI Remove Background (Mungkin butuh waktu agak lama)...");

      let processedFile: File = file;
      try {
        const blob = await removeBackground(file);
        processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".png"), { type: "image/png" });
      } catch (bgError) {
        console.error("Background removal failed:", bgError);
        toast.error("Gagal menghapus background otomatis. Mengunggah versi asli...", { id: toastId });
      }

      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

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
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-slate-800 transition-colors shadow-sm ring-2 ring-white">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUploadPhoto}
              disabled={uploading}
            />
          </label>
        </div>
        
        <div>
          <h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2>
          <p className="text-slate-500 font-medium">Tutor / Pengajar</p>
          <p className="text-xs text-amber-600 mt-1 font-bold">Upload foto tanpa background (PNG) agar tampil keren di jadwal siswa!</p>
        </div>
      </div>
    </div>
  );
}
