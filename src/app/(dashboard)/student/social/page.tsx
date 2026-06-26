"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Search, Heart, MessageCircle, UserPlus, Image as ImageIcon, Users } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SocialPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadFeed();
    }
  }, [profile?.id]);

  const loadFeed = async () => {
    setLoading(true);
    // Get posts from people I follow + my own posts
    const { data: following } = await supabase.from("friendships").select("following_id").eq("follower_id", profile?.id);
    const followingIds = following?.map((f: any) => f.following_id) || [];
    followingIds.push(profile?.id);

    const { data: posts } = await supabase
      .from("posts")
      .select("*, profiles!inner(id, full_name, avatar_url, role)")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(20);

    setFeed(posts || []);
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .ilike("full_name", `%${searchQuery}%`)
      .neq("id", profile?.id)
      .limit(5);

    setSearchResults(data || []);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
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
            <div key={post.id} className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_rgb(226,232,240)] overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3 border-b-2 border-slate-100">
                <Link href={`/student/profile/${post.user_id}`}>
                  {post.profiles?.avatar_url && post.profiles.avatar_url.includes('/avatars/') ? (
                    <img src={post.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover object-top border-2 border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                      {post.profiles?.full_name?.charAt(0)}
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/student/profile/${post.user_id}`}>
                    <p className="font-bold text-slate-800 hover:text-indigo-600 transition-colors">{post.profiles?.full_name}</p>
                  </Link>
                  <p className="text-xs font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Post Image */}
              {post.media_url && (
                <div className="w-full bg-slate-50 border-b-2 border-slate-100">
                  <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-contain" />
                </div>
              )}

              {/* Post Content */}
              {post.content && (
                <div className="p-4 pb-2">
                  <p className="text-slate-700 font-medium leading-relaxed">{post.content}</p>
                </div>
              )}

              {/* Post Actions (Cosmetic for now) */}
              <div className="p-4 pt-2 flex gap-4">
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 font-bold transition-colors group">
                  <Heart className="w-5 h-5 group-hover:fill-rose-500" /> <span className="text-sm">Suka</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
