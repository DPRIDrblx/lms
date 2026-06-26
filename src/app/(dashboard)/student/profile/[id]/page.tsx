"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, MessageCircle, UserPlus, UserCheck, Loader2 } from "lucide-react";
import { PostCard } from "@/components/social/post-card";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PublicProfilePage() {
  const { id } = useParams() as { id: string };
  const { profile: currentUser } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false); // Can chat if mutual
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (id) {
      if (id === currentUser?.id) {
        router.push("/student/profile");
        return;
      }
      loadProfileAndPosts();
      checkFollowStatus();
    }
  }, [id, currentUser?.id]);

  const loadProfileAndPosts = async () => {
    // Get profile
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (prof) setProfile(prof);

    // Get posts
    const { data: pst } = await supabase.from("posts").select("*").eq("user_id", id).order("created_at", { ascending: false });
    if (pst) setPosts(pst);
  };

  const checkFollowStatus = async () => {
    if (!currentUser?.id) return;
    
    // Check if I follow them
    const { data: iFollow } = await supabase
      .from("friendships")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", id)
      .single();
      
    // Check if they follow me
    const { data: theyFollow } = await supabase
      .from("friendships")
      .select("*")
      .eq("follower_id", id)
      .eq("following_id", currentUser.id)
      .single();

    if (iFollow) setIsFollowing(true);
    if (iFollow && theyFollow) setIsMutual(true);
  };

  const handleFollowToggle = async () => {
    setLoadingAction(true);
    if (isFollowing) {
      await supabase.from("friendships").delete().eq("follower_id", currentUser?.id).eq("following_id", id);
      setIsFollowing(false);
      setIsMutual(false);
    } else {
      await supabase.from("friendships").insert({ follower_id: currentUser?.id, following_id: id });
      setIsFollowing(true);
      // Re-check mutual
      const { data: theyFollow } = await supabase.from("friendships").select("*").eq("follower_id", id).eq("following_id", currentUser?.id).single();
      if (theyFollow) setIsMutual(true);
    }
    setLoadingAction(false);
  };

  const handleChat = () => {
    router.push(`/student/messages?userId=${id}`);
  };

  if (!profile) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 pb-24">
      {/* Profile Card */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden mb-8">
        <div className="bg-indigo-500 p-8 pt-12 flex flex-col items-center justify-center text-white relative">
          <div className="relative mt-6">
            <div className="w-48 h-48 rounded-full bg-white border-4 border-indigo-300 flex flex-col items-center justify-end overflow-hidden mb-4 shadow-xl">
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
          </div>
          <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile?.full_name}</h1>
          <p className="text-indigo-200 font-bold capitalize bg-indigo-600/50 px-4 py-1 rounded-full mb-6">{profile?.role}</p>

          <div className="flex gap-4">
            <button 
              onClick={handleFollowToggle}
              disabled={loadingAction}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-lg transition-all border-2 shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none ${
                isFollowing 
                ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                : 'bg-amber-400 text-amber-900 border-amber-500 hover:bg-amber-300'
              }`}
            >
              {loadingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : isFollowing ? <><UserCheck className="w-5 h-5" /> Diikuti</> : <><UserPlus className="w-5 h-5" /> Ikuti</>}
            </button>

            {isMutual && (
              <button 
                onClick={handleChat}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-black text-lg bg-emerald-400 text-emerald-900 border-2 border-emerald-500 shadow-[0_4px_0_rgb(5,150,105)] hover:bg-emerald-300 active:translate-y-1 active:shadow-none transition-all"
              >
                <MessageCircle className="w-5 h-5" /> Chat
              </button>
            )}
          </div>
          
          {!isMutual && isFollowing && (
            <p className="text-indigo-200 text-sm font-bold mt-4">Menunggu {profile.full_name.split(' ')[0]} mengikuti balik untuk bisa Chat.</p>
          )}
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-800 mb-6">Statistik Belajar</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-[0_6px_0_rgb(226,232,240)]">
              <div className="p-4 bg-orange-100 rounded-2xl">
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
              </div>
              <p className="text-4xl font-black text-slate-700 mt-2">{profile?.current_streak || 0}</p>
              <p className="text-base font-bold text-slate-400">Day Streak</p>
            </div>
            <div className="border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-2 shadow-[0_6px_0_rgb(226,232,240)]">
              <div className="p-4 bg-blue-100 rounded-2xl">
                <Diamond className="w-10 h-10 text-blue-500 fill-blue-500" />
              </div>
              <p className="text-4xl font-black text-slate-700 mt-2">{profile?.xp || 0}</p>
              <p className="text-base font-bold text-slate-400">Total XP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <h2 className="text-2xl font-black text-slate-800 mb-6">Postingan {profile.full_name.split(' ')[0]}</h2>
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
            <p className="font-bold text-slate-400">Belum ada postingan.</p>
          </div>
        ) : (
          posts.map(post => {
            // Need to mock the post.profiles data because the profile page query didn't fetch it
            const postWithProfile = { ...post, profiles: { full_name: profile.full_name, avatar_url: profile.avatar_url, id: profile.id } };
            return <PostCard key={post.id} post={postWithProfile} currentUserProfile={currentUser} />;
          })
        )}
      </div>
    </div>
  );
}
