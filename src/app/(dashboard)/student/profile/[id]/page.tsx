"use client";

import { useAuth } from "@/lib/auth-context";
import { Flame, Diamond, MessageCircle, UserPlus, UserCheck, Loader2, X, Lock } from "lucide-react";
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (id && currentUser?.id) {
      if (id === currentUser.id) {
        router.push("/student/profile");
        return;
      }
      loadAllData();
    }
  }, [id, currentUser?.id]);

  const loadAllData = async () => {
    // 1. Check Blocks First
    const { data: blocks } = await supabase.from("student_blocks").select("*")
       .or(`and(student_id.eq.${currentUser?.id},blocked_user_id.eq.${id}),and(student_id.eq.${id},blocked_user_id.eq.${currentUser?.id})`);
       
    if (blocks && blocks.length > 0) {
       setIsBlocked(true);
       return;
    }

    // 2. Fetch Profile
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (!prof) return;
    setProfile(prof);

    // 3. Check Friendship
    let iFollow = false;
    let theyFollow = false;

    const { data: myFollow } = await supabase.from("friendships").select("*").eq("follower_id", currentUser?.id).eq("following_id", id).maybeSingle();
    const { data: theirFollow } = await supabase.from("friendships").select("*").eq("follower_id", id).eq("following_id", currentUser?.id).maybeSingle();

    if (myFollow) {
       setIsFollowing(true);
       iFollow = true;
    }
    if (myFollow && theirFollow) {
       setIsMutual(true);
       theyFollow = true;
    }

    // 4. Enforce Privacy Rules
    const visibility = prof.social_visibility || 'public';
    if (visibility === 'private') {
       setIsPrivate(true);
    } else if (visibility === 'friends_only' && !iFollow && !theyFollow) {
       // Using isMutual or just following as friends? If 'friends_only', typically requires mutual, but let's just say if not mutual and not following it's restricted.
       // Actually 'friends_only' means mutual or following. We will just say if not following or followed.
       setIsPrivate(!isMutual);
    }

    // 5. Fetch posts and stats if not fully private
    if (visibility === 'public' || (visibility === 'friends_only' && (iFollow || theyFollow))) {
       const { data: pst } = await supabase.from("posts").select("*").eq("user_id", id).order("created_at", { ascending: false });
       if (pst) setPosts(pst);
    }

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

  if (isBlocked) return (
    <div className="max-w-2xl mx-auto py-20 px-4 text-center">
      <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
         <X className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Profil Tidak Ditemukan</h2>
      <p className="text-slate-500 font-bold max-w-sm mx-auto">Pengguna ini mungkin telah menghapus akunnya atau Anda tidak memiliki akses.</p>
    </div>
  );

  if (!profile) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

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

          {/* Social Stats */}
          <div className="flex items-center gap-6 mb-6">
            <div className="text-center bg-indigo-600/30 px-6 py-2 rounded-2xl">
              <p className="text-2xl font-black">{followers}</p>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Pengikut</p>
            </div>
            <div className="text-center bg-indigo-600/30 px-6 py-2 rounded-2xl">
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
      
      {isPrivate ? (
         <div className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm text-center mt-6">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
               <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Akun Privat</h3>
            <p className="text-slate-500 font-bold max-w-sm mx-auto">Hanya teman yang disetujui atau mutual yang dapat melihat postingan dan pencapaian pengguna ini.</p>
         </div>
      ) : (
      <>
        {/* Achievements */}
        <div className="mt-8">
          <AchievementShowcase userId={id} isOwner={false} />
        </div>

        {/* Posts Section */}
        <h2 className="text-2xl font-black text-slate-800 mb-6 mt-12">Postingan {profile.full_name.split(' ')[0]}</h2>
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
              <p className="font-bold text-slate-400">Belum ada postingan.</p>
            </div>
          ) : (
            posts.map(post => {
              const postWithProfile = { ...post, profiles: { full_name: profile.full_name, avatar_url: profile.avatar_url, id: profile.id } };
              return <PostCard key={post.id} post={postWithProfile} currentUserProfile={currentUser} />;
            })
          )}
        </div>
      </>
      )}

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
