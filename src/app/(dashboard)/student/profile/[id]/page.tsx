"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, MessageCircle, UserPlus, UserCheck, Loader2, X } from "lucide-react";
import { AchievementShowcase } from "@/components/profile/achievement-showcase";
import { PostCard } from "@/components/social/post-card";
import Link from "next/link";
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
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [followModal, setFollowModal] = useState<{ type: "followers" | "following", title: string, users: any[] } | null>(null);
  
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

    // Fetch stats
    const { count: f1 } = await supabase.from("friendships").select("*", { count: "exact", head: true }).eq("following_id", id);
    const { count: f2 } = await supabase.from("friendships").select("*", { count: "exact", head: true }).eq("follower_id", id);
    
    setFollowers(f1 || 0);
    setFollowing(f2 || 0);
  };

  const openFollowModal = async (type: "followers" | "following") => {
    let users: any[] = [];
    if (type === "followers") {
      const { data } = await supabase.from("friendships").select("follower_id, profiles!friendships_follower_id_fkey(id, full_name, avatar_url, role)").eq("following_id", id);
      users = data?.map((d: any) => d.profiles) || [];
    } else {
      const { data } = await supabase.from("friendships").select("following_id, profiles!friendships_following_id_fkey(id, full_name, avatar_url, role)").eq("follower_id", id);
      users = data?.map((d: any) => d.profiles) || [];
    }
    setFollowModal({ type, title: type === "followers" ? "Pengikut" : "Diikuti", users });
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
          <p className="text-indigo-200 font-bold capitalize bg-indigo-600/50 px-4 py-1 rounded-full mb-2">{profile?.role}</p>
          <p className="text-indigo-100 font-semibold text-sm mb-6 text-center max-w-sm">
            Warga <span className="font-bold text-white">IGNITE</span>
          </p>

          {/* ACHIEVEMENT SHOWCASE */}
          {profile?.id && <AchievementShowcase userId={profile.id} isOwner={false} />}

          {/* Social Stats */}
          <div className="flex items-center gap-6 mb-6">
            <div onClick={() => openFollowModal("followers")} className="text-center cursor-pointer hover:scale-105 transition-transform bg-indigo-600/30 px-6 py-2 rounded-2xl">
              <p className="text-2xl font-black">{followers}</p>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Pengikut</p>
            </div>
            <div onClick={() => openFollowModal("following")} className="text-center cursor-pointer hover:scale-105 transition-transform bg-indigo-600/30 px-6 py-2 rounded-2xl">
              <p className="text-2xl font-black">{following}</p>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Diikuti</p>
            </div>
          </div>

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

      {/* Follow Modal */}
      {followModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full border-2 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-slate-800">{followModal.title}</h2>
              <button onClick={() => setFollowModal(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto space-y-2 flex-1 pr-2">
              {followModal.users.length === 0 ? (
                <div className="text-center py-10 font-bold text-slate-400">Belum ada data.</div>
              ) : (
                followModal.users.map((user: any) => (
                  <Link key={user.id} href={`/student/profile/${user.id}`} onClick={() => setFollowModal(null)}>
                    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border-2 border-transparent hover:border-slate-100">
                      {user.avatar_url && user.avatar_url.includes('/avatars/') ? (
                        <img src={user.avatar_url} className="w-12 h-12 rounded-full object-cover object-top border-2 border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border-2 border-slate-200">
                          {user.full_name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{user.full_name}</p>
                        <p className="text-xs font-bold text-slate-400 capitalize mt-0.5">{user.role}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
