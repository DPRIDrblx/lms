"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, Lock, Edit2, Loader2, Image as ImageIcon, Send, Trash2 } from "lucide-react";
import { PostCard } from "@/components/social/post-card";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

const AVATARS = [
  "/avatars/boy-blue.png",
  "/avatars/girl-red.png",
  "/avatars/boy-green.png",
  "/avatars/girl-yellow.png"
];

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  
  const [activeTab, setActiveTab] = useState<"stats" | "posts">("stats");
  
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Post states
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [uploadingPost, setUploadingPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.id && activeTab === "posts") {
      loadMyPosts();
    }
  }, [profile?.id, activeTab]);

  const loadMyPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !fileInputRef.current?.files?.[0]) return toast.error("Pesan atau foto tidak boleh kosong");
    
    setUploadingPost(true);
    let mediaUrl = null;
    
    if (fileInputRef.current?.files?.[0]) {
      const file = fileInputRef.current.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("social_media").upload(fileName, file);
      
      if (uploadError) {
        toast.error("Gagal mengunggah gambar");
        setUploadingPost(false);
        return;
      }
      
      const { data } = supabase.storage.from("social_media").getPublicUrl(fileName);
      mediaUrl = data.publicUrl;
    }
    
    const { error } = await supabase.from("posts").insert({
      user_id: profile?.id,
      content: newPostContent,
      media_url: mediaUrl
    });
    
    if (error) {
      toast.error("Gagal membuat postingan");
    } else {
      toast.success("Berhasil memposting!");
      setNewPostContent("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadMyPosts();
    }
    setUploadingPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Hapus postingan ini?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    loadMyPosts();
  };
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden mb-8">
        <div className="bg-indigo-500 p-8 pt-12 flex flex-col items-center justify-center text-white relative">
          <div className="relative group mt-6">
            <div className="w-48 h-48 rounded-full bg-white border-4 border-indigo-300 flex flex-col items-center justify-end overflow-hidden mb-4 shadow-xl cursor-pointer" onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
              {profile?.avatar_url && profile.avatar_url.includes('/avatars/') ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover object-top" />
              ) : profile?.avatar_url && profile.avatar_url.startsWith('http') ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-indigo-500 font-black text-6xl">
                  {profile?.avatar_url || profile?.full_name?.charAt(0) || "U"}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              className="absolute bottom-4 right-0 bg-amber-400 p-3 rounded-full text-amber-900 border-2 border-amber-500 shadow-[0_4px_0_rgb(217,119,6)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(217,119,6)] active:translate-y-1 active:shadow-none transition-all"
            >
              <Edit2 className="w-5 h-5 fill-amber-900" />
            </button>
          </div>
          <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile?.full_name}</h1>
          <p className="text-indigo-200 font-bold capitalize bg-indigo-600/50 px-4 py-1 rounded-full mb-4">{profile?.role}</p>
          
          <div className="flex bg-indigo-600/30 rounded-xl p-1 gap-1">
            <button 
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
            >
              Statistik
            </button>
            <button 
              onClick={() => setActiveTab("posts")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'posts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}
            >
              Postingan
            </button>
          </div>
        </div>
        
        {activeTab === "stats" && (
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
        )}
      </div>

      {/* Posts Section */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          <form onSubmit={handleCreatePost} className="bg-white p-6 rounded-[2rem] border-2 border-slate-200 shadow-[0_6px_0_rgb(226,232,240)]">
            <textarea 
              placeholder="Apa yang sedang kamu pikirkan?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="w-full bg-slate-50 rounded-xl p-4 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white outline-none resize-none font-medium mb-4"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors">
                <ImageIcon className="w-5 h-5" />
                <span>Foto/Video</span>
                <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" />
              </label>
              <button 
                type="submit" 
                disabled={uploadingPost}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-500 text-white font-bold rounded-xl border-2 border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all"
              >
                {uploadingPost ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Kirim</>}
              </button>
            </div>
          </form>

          {posts.map(post => {
            const postWithProfile = { ...post, profiles: { full_name: profile?.full_name, avatar_url: profile?.avatar_url, id: profile?.id } };
            return (
              <div key={post.id} className="relative group">
                <PostCard post={postWithProfile} currentUserProfile={profile} />
                <button 
                  onClick={() => handleDeletePost(post.id)} 
                  className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors z-10 bg-white/80 p-2 rounded-full"
                  title="Hapus postingan"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Avatar Selection Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full border-2 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Pilih Avatar Kerenmu!</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {AVATARS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => handleAvatarSelect(avatar)}
                  disabled={loading}
                  className={`p-2 rounded-3xl hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all border-4 border-transparent hover:border-indigo-200 ${profile?.avatar_url === avatar ? 'bg-indigo-100 border-indigo-400 shadow-inner' : ''} flex flex-col items-center overflow-hidden h-32`}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover object-top" />
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
