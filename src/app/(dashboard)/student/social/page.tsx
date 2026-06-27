"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Search, Heart, MessageCircle, UserPlus, Image as ImageIcon, Users, ShieldAlert } from "lucide-react";
import { PostCard } from "@/components/social/post-card";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SocialPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedTab, setFeedTab] = useState<"saran" | "mengikuti">("saran");
  const [recentWars, setRecentWars] = useState<any[]>([]);
  const [socialAccessBlocked, setSocialAccessBlocked] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadFeed();
    }
  }, [profile?.id, feedTab]);

  const loadFeed = async () => {
    setLoading(true);
    
    // Check parental controls
    const { data: myProfile } = await supabase.from("profiles").select("social_access_blocked").eq("id", profile?.id).single();
    if (myProfile?.social_access_blocked) {
      setSocialAccessBlocked(true);
      setLoading(false);
      return;
    } else {
      setSocialAccessBlocked(false);
    }

    // Get blocked users
    const { data: blocks } = await supabase.from("student_blocks").select("blocked_user_id").eq("student_id", profile?.id);
    const blockedIds = blocks?.map((b: any) => b.blocked_user_id) || [];
    setBlockedUserIds(blockedIds);

    let query = supabase
      .from("posts")
      .select("*, profiles!inner(id, full_name, avatar_url, role)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (feedTab === "mengikuti") {
      const { data: following } = await supabase.from("friendships").select("following_id").eq("follower_id", profile?.id);
      const followingIds = following?.map((f: any) => f.following_id) || [];
      followingIds.push(profile?.id);
      query = query.in("user_id", followingIds);
    }

    const { data: posts } = await query;
    let filteredPosts = posts || [];
    if (blockedIds.length > 0) {
       filteredPosts = filteredPosts.filter((p: any) => !blockedIds.includes(p.user_id));
    }
    setFeed(filteredPosts);
    
    // Fetch recent finished wars for announcements
    const { data: wars } = await supabase.from("faction_wars")
       .select("*, challenger:classes!faction_wars_challenger_class_id_fkey(name), defender:classes!faction_wars_defender_class_id_fkey(name), zone:territory_zones!faction_wars_zone_id_fkey(name)")
       .eq("status", "finished")
       .order("created_at", { ascending: false })
       .limit(3);
    setRecentWars(wars || []);
    
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .ilike("full_name", `%${searchQuery}%`)
      .neq("id", profile?.id)
      .limit(5);

    if (data && blockedUserIds.length > 0) {
      data = data.filter((u: any) => !blockedUserIds.includes(u.id));
    }
    setSearchResults(data || []);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
      {socialAccessBlocked ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-slate-200 shadow-sm mt-8">
           <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-12 h-12" />
           </div>
           <h2 className="text-2xl font-black text-slate-800 mb-2">Akses Sosial Dikunci</h2>
           <p className="text-slate-500 font-bold max-w-sm">
              Orang tua Anda telah membatasi akses ke fitur sosial. Anda tidak dapat melihat Feed, memposting, atau mencari pengguna.
           </p>
        </div>
      ) : (
      <>
        <h1 className="text-3xl font-black text-slate-800 mb-6">Connect & Share</h1>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] mb-8 relative">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari teman..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 pl-12 pr-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </form>

        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-2 z-50">
            {searchResults.map(user => (
              <Link key={user.id} href={`/student/profile/${user.id}`}>
                <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                  {user.avatar_url && user.avatar_url.includes('/avatars/') ? (
                    <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover object-top border-2 border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                      {user.full_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800">{user.full_name}</p>
                    <p className="text-xs font-bold text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Feed Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
        <button 
          onClick={() => setFeedTab("saran")}
          className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${feedTab === 'saran' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Saran (Untukmu)
        </button>
        <button 
          onClick={() => setFeedTab("mengikuti")}
          className={`flex-1 py-3 font-black text-sm rounded-xl transition-all ${feedTab === 'mengikuti' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Mengikuti
        </button>
        <Link href="/student/social/bounty" className="flex-1">
          <button className="w-full py-3 font-black text-sm rounded-xl transition-all text-pink-500 hover:bg-pink-50">
            Misi Bounty 💎
          </button>
        </Link>
      </div>
      
      {/* War Announcements */}
      {recentWars.length > 0 && (
         <div className="mb-8 space-y-4">
            {recentWars.map(war => {
                const challengerWon = war.challenger_ap > war.defender_ap;
                const winnerName = challengerWon ? war.challenger?.name : war.defender?.name || 'Netral';
                const loserName = challengerWon ? war.defender?.name || 'Netral' : war.challenger?.name;
                
                return (
                   <div key={war.id} className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(99,102,241,0.2)] border-2 border-indigo-500/30 relative overflow-hidden flex items-center gap-6">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shrink-0 border border-white/20 z-10">
                         <span className="text-3xl">🔥</span>
                      </div>
                      <div className="z-10 text-white">
                         <h3 className="font-black text-xl mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                            GLOBAL ANNOUNCEMENT
                         </h3>
                         <p className="font-medium text-indigo-100">
                            <span className="font-bold text-white">{winnerName}</span> berhasil merebut <span className="font-bold text-emerald-400">{war.zone?.name || 'Zona Tersembunyi'}</span> dari <span className="text-rose-300">{loserName}</span>!
                         </p>
                      </div>
                   </div>
                );
            })}
         </div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 font-bold text-slate-400 animate-pulse">Loading Feed...</div>
        ) : feed.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-600 mb-2">Feed Kosong</h3>
            <p className="text-sm font-medium text-slate-400">Follow temanmu untuk melihat update mereka!</p>
          </div>
        ) : (
          feed.map(post => (
            <PostCard key={post.id} post={post} currentUserProfile={profile} />
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
}
