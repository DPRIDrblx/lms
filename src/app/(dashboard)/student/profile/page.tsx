"use client";

import { useAuth } from "@/lib/auth-context";
import { User, Flame, Diamond, Settings, Lock, Edit2, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

const AVATARS = ["🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐙", "🦖", "🦄", "🐶", "🦊", "🦝", "🐲"];

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAvatarSelect = async (avatar: string) => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: avatar }).eq("id", profile?.id);
    if (!error) {
      toast.success("Avatar berhasil diperbarui!");
      refreshProfile();
      setIsEditingAvatar(false);
    } else {
      toast.error("Gagal memperbarui avatar");
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password minimal 6 karakter");
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      toast.success("Password berhasil diubah!");
      setNewPassword("");
      setIsChangingPassword(false);
    } else {
      toast.error("Gagal merubah password: " + error.message);
    }
    setLoading(false);
  };
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
        <div className="bg-indigo-500 p-8 pt-12 flex flex-col items-center justify-center text-white relative">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full bg-white border-4 border-indigo-300 flex items-center justify-center text-indigo-500 font-black text-6xl mb-4 shadow-xl overflow-hidden cursor-pointer" onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
              {profile?.avatar_url || profile?.full_name?.charAt(0) || "U"}
            </div>
            <button 
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              className="absolute bottom-4 right-0 bg-amber-400 p-3 rounded-full text-amber-900 border-2 border-amber-500 shadow-[0_4px_0_rgb(217,119,6)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(217,119,6)] active:translate-y-1 active:shadow-none transition-all"
            >
              <Edit2 className="w-5 h-5 fill-amber-900" />
            </button>
          </div>
          <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile?.full_name}</h1>
          <p className="text-indigo-200 font-bold capitalize bg-indigo-600/50 px-4 py-1 rounded-full">{profile?.role}</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-800 mb-6">Statistik Belajar</h2>
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-[0_6px_0_rgb(226,232,240)]">
              <div className="p-4 bg-orange-100 rounded-2xl">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-4xl font-black text-slate-700 mt-2">{(profile as any)?.current_streak || 0}</p>
              <p className="text-base font-bold text-slate-400">Day Streak</p>
            </div>
            <div className="border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-[0_6px_0_rgb(226,232,240)]">
              <div className="p-4 bg-blue-100 rounded-2xl">
                <Diamond className="w-10 h-10 text-blue-500 fill-blue-500" />
              </div>
              <p className="text-4xl font-black text-slate-700 mt-2">{(profile as any)?.xp || 0}</p>
              <p className="text-base font-bold text-slate-400">Total XP</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-slate-200 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-[0_4px_0_rgb(226,232,240)] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-slate-800 text-lg">Ganti Kata Sandi</h3>
                  <p className="text-sm font-bold text-slate-400">Amankan akun kamu</p>
                </div>
              </div>
              <Edit2 className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border-2 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Pilih Avatar Kerenmu!</h2>
            <div className="grid grid-cols-5 gap-3 mb-8">
              {AVATARS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={loading}
                  className={`text-4xl p-2 rounded-2xl hover:bg-indigo-50 hover:scale-110 active:scale-95 transition-all border-2 border-transparent hover:border-indigo-200 ${profile?.avatar_url === avatar ? 'bg-indigo-100 border-indigo-300 shadow-inner' : ''}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsEditingAvatar(false)}
              className="w-full py-4 bg-slate-100 text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border-2 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">Ganti Kata Sandi</h2>
            <p className="text-center text-slate-500 font-bold mb-6">Pastikan kamu menggunakan kata sandi yang mudah diingat.</p>
            
            <form onSubmit={handleChangePassword}>
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Kata Sandi Baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold text-slate-700"
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-xl border-2 border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-500 text-white font-black rounded-xl border-2 border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all flex justify-center items-center"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
