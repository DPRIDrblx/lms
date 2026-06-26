"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, MoreHorizontal, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface PostCardProps {
  post: any;
  currentUserProfile: any;
}

export function PostCard({ post, currentUserProfile }: PostCardProps) {
  const supabase = createClient();
  const [isLiked, setIsLiked] = useState(false); // Placeholder for likes
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*, profiles!inner(id, full_name, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
      
    if (data) setComments(data);
    setLoadingComments(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserProfile?.id) return;
    
    setSending(true);
    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: post.id,
        user_id: currentUserProfile.id,
        content: newComment.trim(),
        parent_id: replyingTo?.id || null
      })
      .select("*, profiles!inner(id, full_name, avatar_url)")
      .single();
      
    if (error) {
      toast.error("Gagal mengirim komentar!");
    } else if (data) {
      setComments(prev => [...prev, data]);
      setNewComment("");
      setReplyingTo(null);
    }
    setSending(false);
  };

  // Group comments into threads (parent comments with their replies)
  const threads = comments.filter(c => !c.parent_id).map(parent => ({
    ...parent,
    replies: comments.filter(c => c.parent_id === parent.id)
  }));

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_rgb(226,232,240)] overflow-hidden transition-all hover:shadow-[0_8px_0_rgb(226,232,240)]">
      {/* Post Header */}
      <div className="p-4 flex items-center gap-3 border-b-2 border-slate-100">
        <Link href={`/student/profile/${post.user_id}`}>
          {post.profiles?.avatar_url && post.profiles.avatar_url.includes('/avatars/') ? (
            <img src={post.profiles.avatar_url} className="w-12 h-12 rounded-full object-cover object-top border-2 border-slate-200 hover:border-indigo-400 transition-colors" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 border-2 border-slate-200 hover:border-indigo-400 transition-colors">
              {post.profiles?.full_name?.charAt(0)}
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link href={`/student/profile/${post.user_id}`}>
            <p className="font-black text-lg text-slate-800 hover:text-indigo-600 transition-colors leading-tight">{post.profiles?.full_name}</p>
          </Link>
          <p className="text-xs font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-50">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      {/* Post Content */}
      {post.content && (
        <div className="p-5 pb-3">
          <p className="text-slate-700 font-bold leading-relaxed text-[15px]">{post.content}</p>
        </div>
      )}

      {/* Post Image */}
      {post.media_url && (
        <div className="w-full bg-slate-50 border-y-2 border-slate-100 p-2">
          <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-contain rounded-xl border border-slate-200 shadow-sm" />
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4 pt-3 flex gap-6 border-b-2 border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={`flex items-center gap-2 font-black transition-all group ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
        >
          <Heart className={`w-6 h-6 transition-transform group-active:scale-75 ${isLiked ? 'fill-rose-500' : 'group-hover:fill-rose-100'}`} /> 
          <span>Suka</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 font-black transition-all group ${showComments ? 'text-indigo-500' : 'text-slate-400 hover:text-indigo-500'}`}
        >
          <MessageCircle className={`w-6 h-6 transition-transform group-active:scale-75 ${showComments ? 'fill-indigo-100' : 'group-hover:fill-indigo-50'}`} /> 
          <span>Komentar</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-50 p-4 border-t-2 border-slate-100 animate-in slide-in-from-top-2">
          {/* Comments List */}
          <div className="space-y-4 mb-4">
            {loadingComments ? (
              <div className="text-center py-4 font-bold text-slate-400">Memuat komentar...</div>
            ) : threads.length === 0 ? (
              <div className="text-center py-6 font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">Belum ada komentar. Jadilah yang pertama!</div>
            ) : (
              threads.map(thread => (
                <div key={thread.id} className="space-y-2">
                  {/* Parent Comment */}
                  <div className="flex gap-3">
                    <img src={thread.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${thread.profiles?.full_name}&background=random`} className="w-8 h-8 rounded-full border-2 border-slate-200 object-cover object-top" />
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-2xl rounded-tl-sm border-2 border-slate-200 shadow-sm">
                        <p className="font-black text-sm text-slate-800">{thread.profiles?.full_name}</p>
                        <p className="text-slate-600 font-medium text-sm mt-0.5">{thread.content}</p>
                      </div>
                      <div className="flex gap-4 mt-1 ml-2">
                        <span className="text-[10px] font-bold text-slate-400">{new Date(thread.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <button 
                          onClick={() => setReplyingTo({ id: thread.id, name: thread.profiles?.full_name })}
                          className="text-[10px] font-black text-slate-400 hover:text-indigo-500"
                        >
                          Balas
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {thread.replies?.map((reply: any) => (
                    <div key={reply.id} className="flex gap-3 ml-10">
                      <img src={reply.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${reply.profiles?.full_name}&background=random`} className="w-6 h-6 rounded-full border-2 border-slate-200 object-cover object-top mt-1" />
                      <div className="flex-1">
                        <div className="bg-white p-2.5 rounded-2xl rounded-tl-sm border-2 border-slate-200 shadow-sm">
                          <p className="font-black text-xs text-slate-800">{reply.profiles?.full_name}</p>
                          <p className="text-slate-600 font-medium text-sm mt-0.5">{reply.content}</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 ml-2 mt-1 block">{new Date(reply.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSendComment} className="mt-4">
            {replyingTo && (
              <div className="flex items-center justify-between bg-indigo-50 text-indigo-700 px-4 py-2 rounded-t-xl text-xs font-bold border-2 border-b-0 border-indigo-200">
                <span className="flex items-center gap-1"><CornerDownRight className="w-3 h-3" /> Membalas {replyingTo.name}</span>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-indigo-400 hover:text-indigo-600">Batal</button>
              </div>
            )}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Tulis balasanmu..." : "Tulis komentarmu..."} 
                className={`flex-1 bg-white border-2 border-slate-200 px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-400 focus:shadow-[0_3px_0_rgb(129,140,248)] transition-all ${replyingTo ? 'rounded-b-xl rounded-tr-none' : 'rounded-xl'}`}
              />
              <button 
                type="submit" 
                disabled={sending || !newComment.trim()}
                className={`bg-indigo-500 text-white px-5 rounded-xl border-b-4 border-indigo-700 shadow-sm hover:bg-indigo-400 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:border-b-4 disabled:active:translate-y-0 ${replyingTo ? 'rounded-tr-none' : ''}`}
              >
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
