"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, MoreHorizontal, CornerDownRight, Smile } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface PostCardProps {
  post: any;
  currentUserProfile: any;
}

export function PostCard({ post, currentUserProfile }: PostCardProps) {
  const supabase = createClient();
  const { uiMode } = useTheme();
  const [isLiked, setIsLiked] = useState(false); // Placeholder for likes
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
      setShowEmojiPicker(false);
    }
    setSending(false);
  };

  // Root comments
  const rootComments = comments.filter(c => !c.parent_id);

  // Recursive Comment Component
  const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => {
    const replies = comments.filter(c => c.parent_id === comment.id);
    
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-6' : ''}`}>
        <div className="flex gap-3">
          <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name}&background=random`} className={`${depth > 0 ? 'w-6 h-6 mt-1' : 'w-8 h-8'} rounded-full border-2 border-slate-200 object-cover object-top`} />
          <div className="flex-1">
            <div className={cn("bg-white p-2.5 shadow-sm", uiMode === 'clean' ? "rounded-lg rounded-tl-sm border border-slate-200" : "rounded-2xl rounded-tl-sm border-2 border-slate-200")}>
              <p className={cn("text-slate-800", depth > 0 ? 'text-xs' : 'text-sm', uiMode === 'clean' ? 'font-bold' : 'font-black')}>{comment.profiles?.full_name}</p>
              <p className={cn("text-slate-600 text-sm mt-0.5", uiMode === 'clean' ? 'font-normal' : 'font-medium')}>{comment.content}</p>
            </div>
            <div className="flex gap-4 mt-1 ml-2">
              <span className="text-[10px] font-bold text-slate-400">{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <button 
                onClick={() => setReplyingTo({ id: comment.id, name: comment.profiles?.full_name })}
                className={cn("text-[10px] text-slate-400", uiMode === 'clean' ? "font-semibold hover:text-[#108B96]" : "font-black hover:text-indigo-500")}
              >
                Balas
              </button>
            </div>
          </div>
        </div>
        {replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("bg-white overflow-hidden transition-all", uiMode === 'clean' ? "rounded-xl border border-slate-200 shadow-sm hover:shadow-md" : "rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_rgb(226,232,240)] hover:shadow-[0_8px_0_rgb(226,232,240)]")}>
      {/* Post Header */}
      <div className={cn("p-4 flex items-center gap-3", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
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
            <p className={cn("text-lg text-slate-800 hover:text-indigo-600 transition-colors leading-tight", uiMode === 'clean' ? "font-bold" : "font-black")}>{post.profiles?.full_name}</p>
          </Link>
          <p className={cn("text-xs text-slate-400", uiMode === 'clean' ? "font-medium" : "font-bold")}>{new Date(post.created_at).toLocaleDateString()}</p>
        </div>
        <button className="text-slate-300 hover:text-slate-500 transition-colors p-2 rounded-full hover:bg-slate-50">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      {/* Post Content */}
      {post.content && (
        <div className="p-5 pb-3">
          <p className={cn("text-slate-700 leading-relaxed text-[15px]", uiMode === 'clean' ? "font-normal" : "font-bold")}>{post.content}</p>
        </div>
      )}

      {/* Post Image */}
      {post.media_url && (
        <div className="w-full bg-slate-50 border-y-2 border-slate-100 p-2">
          <img src={post.media_url} alt="Post" className="w-full h-auto max-h-96 object-contain rounded-xl border border-slate-200 shadow-sm" />
        </div>
      )}

      {/* Post Actions */}
      <div className={cn("p-4 pt-3 flex gap-6 bg-slate-50/50", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-100")}>
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className={cn("flex items-center gap-2 transition-all group", uiMode === 'clean' ? "font-semibold" : "font-black", isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
        >
          <Heart className={`w-6 h-6 transition-transform group-active:scale-75 ${isLiked ? 'fill-rose-500' : 'group-hover:fill-rose-100'}`} /> 
          <span>Suka</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className={cn("flex items-center gap-2 transition-all group", uiMode === 'clean' ? "font-semibold" : "font-black", showComments ? (uiMode === 'clean' ? "text-[#108B96]" : "text-indigo-500") : (uiMode === 'clean' ? "text-slate-400 hover:text-[#108B96]" : "text-slate-400 hover:text-indigo-500"))}
        >
          <MessageCircle className={`w-6 h-6 transition-transform group-active:scale-75 ${showComments ? 'fill-indigo-100' : 'group-hover:fill-indigo-50'}`} /> 
          <span>Komentar</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={cn("bg-slate-50 p-4 animate-in slide-in-from-top-2", uiMode === 'clean' ? "border-t border-slate-100" : "border-t-2 border-slate-100")}>
          {/* Comments List */}
          <div className="space-y-4 mb-4">
            {loadingComments ? (
              <div className="text-center py-4 font-bold text-slate-400">Memuat komentar...</div>
            ) : rootComments.length === 0 ? (
              <div className="text-center py-6 font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">Belum ada komentar. Jadilah yang pertama!</div>
            ) : (
              rootComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
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
                className={cn("flex-1 bg-white px-4 py-3 text-slate-700 outline-none transition-all", uiMode === 'clean' ? "border border-slate-200 font-normal focus:border-[#108B96] focus:ring-1 focus:ring-[#108B96]" : "border-2 border-slate-200 font-bold focus:border-indigo-400 focus:shadow-[0_3px_0_rgb(129,140,248)]", replyingTo ? (uiMode === 'clean' ? 'rounded-b-lg rounded-tr-none' : 'rounded-b-xl rounded-tr-none') : (uiMode === 'clean' ? 'rounded-lg' : 'rounded-xl'))}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
              >
                <Smile className="w-6 h-6" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-full right-16 mb-2 z-50">
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => setNewComment(prev => prev + emojiData.emoji)}
                    theme={Theme.LIGHT}
                  />
                </div>
              )}
              <button 
                type="submit" 
                disabled={sending || !newComment.trim()}
                className={cn("text-white px-5 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed", uiMode === 'clean' ? "bg-[#108B96] hover:bg-[#0d737d] rounded-lg" : "bg-indigo-500 rounded-xl border-b-4 border-indigo-700 hover:bg-indigo-400 active:border-b-0 active:translate-y-1 disabled:active:border-b-4 disabled:active:translate-y-0", replyingTo ? 'rounded-tr-none' : '')}
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
