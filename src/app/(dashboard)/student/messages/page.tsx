"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect, useRef, Suspense } from "react";
import { Send, ArrowLeft, Loader2, MessageCircle, Sparkles, Smile } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import EmojiPicker, { Theme } from "emoji-picker-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

function MessagesContent() {
  const { profile } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { uiMode } = useTheme();
  const initialUserId = searchParams.get("userId");

  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      loadMutualFriends();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedFriend) {
      loadMessages();
      
      const channel = supabase
        .channel(`dms:${profile?.id}:${selectedFriend.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload: any) => {
          const msg = payload.new;
          if (
            (msg.sender_id === profile?.id && msg.receiver_id === selectedFriend.id) ||
            (msg.sender_id === selectedFriend.id && msg.receiver_id === profile?.id)
          ) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
            
            // Mark as read if receiving
            if (msg.receiver_id === profile?.id) {
              supabase.from("direct_messages").update({ read: true }).eq("id", msg.id).then();
            }
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedFriend]);

  const loadMutualFriends = async () => {
    // I follow them
    const { data: iFollow } = await supabase.from("friendships").select("following_id").eq("follower_id", profile?.id);
    const followingIds = iFollow?.map((f: any) => f.following_id) || [];
    
    // They follow me
    const { data: theyFollow } = await supabase.from("friendships").select("follower_id").eq("following_id", profile?.id);
    const followerIds = theyFollow?.map((f: any) => f.follower_id) || [];

    // Mutuals
    const mutualIds = followingIds.filter((id: any) => followerIds.includes(id));
    
    if (mutualIds.length > 0) {
      const { data: friends } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role")
        .in("id", mutualIds);
        
      setMutualFriends(friends || []);
      
      if (initialUserId && mutualIds.includes(initialUserId)) {
        const friend = friends?.find((f: any) => f.id === initialUserId);
        if (friend) setSelectedFriend(friend);
      }
    }
  };

  const loadMessages = async () => {
    if (!profile?.id || !selectedFriend?.id) return;
    
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending: true });
      
    setMessages(data || []);
    scrollToBottom();
    
    // Mark unread as read
    const unreadIds = data?.filter((m: any) => m.receiver_id === profile.id && !m.read).map((m: any) => m.id) || [];
    if (unreadIds.length > 0) {
      await supabase.from("direct_messages").update({ read: true }).in("id", unreadIds);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !profile?.id || !selectedFriend?.id) return;
    
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");
    setShowEmojiPicker(false);
    
    await supabase.from("direct_messages").insert({
      sender_id: profile?.id,
      receiver_id: selectedFriend.id,
      content: content
    });
    
    setSending(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-80px)] flex gap-6 pb-24 lg:pb-8">
      {/* Sidebar: Friends List */}
      <div className={cn("bg-white overflow-hidden flex flex-col w-full lg:w-1/3 transition-all", uiMode === 'clean' ? "rounded-xl border border-slate-200 shadow-sm" : "border-2 border-slate-200 rounded-[2.5rem] shadow-[0_8px_0_rgb(226,232,240)]", selectedFriend ? 'hidden lg:flex' : 'flex')}>
        <div className={cn("p-8 flex items-center gap-3 relative overflow-hidden transition-all", uiMode === 'clean' ? "bg-slate-50 border-b border-slate-200 text-slate-800" : "border-b-4 border-indigo-600 bg-indigo-500 text-white")}>
          <Sparkles className={cn("absolute right-4 top-4 w-12 h-12 rotate-12 transition-all", uiMode === 'clean' ? "text-slate-300 opacity-10" : "text-indigo-400 opacity-30")} />
          <div className={cn("w-12 h-12 rounded-full flex justify-center items-center", uiMode === 'clean' ? "bg-slate-100 border border-slate-200" : "bg-white")}>
            <MessageCircle className={cn("w-6 h-6", uiMode === 'clean' ? "text-[#108B96]" : "text-indigo-500 fill-indigo-500")} />
          </div>
          <div>
            <h2 className="text-2xl font-black">Kotak Masuk</h2>
            <p className={cn("text-sm", uiMode === 'clean' ? "font-medium text-slate-500" : "font-bold text-indigo-200")}>Teman Mutual</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {mutualFriends.length === 0 ? (
            <div className="text-center p-8 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl m-4">
              Belum ada teman mutual. Mulai saling follow dengan temanmu untuk bisa chatting!
            </div>
          ) : (
            mutualFriends.map(friend => (
              <div 
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={cn("flex items-center gap-4 p-4 cursor-pointer transition-all", uiMode === 'clean' ? (selectedFriend?.id === friend.id ? "bg-slate-50 border border-[#108B96] rounded-xl shadow-sm" : "bg-white border border-transparent hover:bg-slate-50 hover:border-slate-100 rounded-xl") : (selectedFriend?.id === friend.id ? "bg-indigo-100 border-2 border-indigo-300 shadow-[0_4px_0_rgb(165,180,252)] scale-[1.02] rounded-[1.5rem]" : "bg-white border-2 border-slate-200 hover:border-slate-300 shadow-[0_4px_0_rgb(226,232,240)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none rounded-[1.5rem]"))}
              >
                {friend.avatar_url && friend.avatar_url.includes('/avatars/') ? (
                  <img src={friend.avatar_url} className="w-14 h-14 rounded-full object-cover object-top border-4 border-white shadow-sm" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-200 border-4 border-white shadow-sm flex items-center justify-center font-black text-xl text-indigo-600">
                    {friend.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className={cn("text-lg", uiMode === 'clean' ? "font-bold" : "font-black", uiMode === 'clean' ? (selectedFriend?.id === friend.id ? "text-[#108B96]" : "text-slate-700") : (selectedFriend?.id === friend.id ? "text-indigo-800" : "text-slate-700"))}>{friend.full_name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn("bg-white overflow-hidden flex-col w-full lg:w-2/3 relative transition-all", uiMode === 'clean' ? "rounded-xl border border-slate-200 shadow-sm" : "border-2 border-slate-200 rounded-[2.5rem] shadow-[0_8px_0_rgb(226,232,240)]", !selectedFriend ? 'hidden lg:flex items-center justify-center' : 'flex')}>
        {!selectedFriend ? (
          <div className="text-slate-400 font-bold flex flex-col items-center bg-slate-50/50 w-full h-full justify-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-[0_8px_0_rgb(226,232,240)] border-2 border-slate-200 flex justify-center items-center mb-6">
              <MessageCircle className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-xl">Pilih obrolan untuk mulai.</p>
          </div>
        ) : (
          <>
            <div className={cn("p-4 sm:p-6 bg-white flex items-center gap-4 z-10 relative transition-all", uiMode === 'clean' ? "border-b border-slate-100" : "border-b-2 border-slate-200 shadow-sm")}>
              <button className="lg:hidden p-2 bg-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 font-bold border-2 border-slate-200 shadow-sm active:translate-y-1 active:shadow-none transition-all" onClick={() => setSelectedFriend(null)}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <Link href={`/student/profile/${selectedFriend.id}`} className="flex items-center gap-4 group">
                {selectedFriend.avatar_url && selectedFriend.avatar_url.includes('/avatars/') ? (
                  <img src={selectedFriend.avatar_url} className="w-12 h-12 rounded-full object-cover object-top border-2 border-slate-200 group-hover:border-indigo-400 transition-colors" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600 border-2 border-slate-200">
                    {selectedFriend.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">{selectedFriend.full_name}</h3>
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Berteman</p>
                </div>
              </Link>
            </div>
            
            <div className={cn("flex-1 overflow-y-auto p-6 space-y-6 relative", uiMode === 'clean' ? "bg-white" : "bg-slate-50")}>
              {/* Add subtle background overlay if needed */}
              <div className={cn("absolute inset-0 -z-10", uiMode === 'clean' ? "bg-white" : "bg-slate-50/80")}></div>
              
              <div className="text-center mb-8">
                <span className="bg-slate-200 text-slate-500 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">Mulai Obrolan</span>
              </div>
              
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === profile?.id;
                
                // Grouping messages logic (if previous message was from same sender, don't show tail)
                const isFirstInGroup = i === 0 || messages[i-1].sender_id !== msg.sender_id;
                
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-6' : 'mt-2'}`}>
                    <div className={cn("max-w-[75%] px-6 py-4 relative transition-all", uiMode === 'clean' ? "text-base font-normal rounded-2xl" : "text-lg font-bold rounded-3xl", isMe ? (uiMode === 'clean' ? "bg-[#108B96] text-white rounded-br-sm" : "bg-indigo-500 text-white rounded-br-sm shadow-[0_4px_0_rgb(79,70,229)]") : (uiMode === 'clean' ? "bg-slate-100 text-slate-800 rounded-bl-sm" : "bg-white text-slate-700 border-2 border-slate-200 rounded-bl-sm shadow-[0_4px_0_rgb(226,232,240)]"))}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className={cn("p-4 sm:p-6 bg-white z-10 transition-all", uiMode === 'clean' ? "border-t border-slate-100" : "border-t-2 border-slate-200")}>
              <div className="flex gap-3 relative items-end">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan yang seru..." 
                  className={cn("flex-1 px-6 py-4 outline-none transition-all resize-none overflow-hidden", uiMode === 'clean' ? "bg-white border border-slate-200 rounded-lg text-slate-700 focus:border-[#108B96] focus:ring-1 focus:ring-[#108B96]" : "bg-slate-100 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:border-indigo-400 focus:bg-white focus:shadow-[0_4px_0_rgb(129,140,248)]")}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
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
                      onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                      theme={Theme.LIGHT}
                    />
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className={cn("h-[56px] w-[56px] shrink-0 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed", uiMode === 'clean' ? "bg-[#108B96] hover:bg-[#0d737d] text-white rounded-lg" : "bg-indigo-500 text-white rounded-2xl border-b-4 border-indigo-700 shadow-[0_4px_0_rgb(67,56,202)] hover:bg-indigo-400 active:border-b-0 active:translate-y-[4px] disabled:active:border-b-4 disabled:active:translate-y-0")}
                >
                  <Send className="w-6 h-6 ml-1" />
                </button>
              </div>
              <p className="text-center text-xs font-bold text-slate-400 mt-3">Tekan Enter untuk mengirim</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><CenterLoader size="md" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
