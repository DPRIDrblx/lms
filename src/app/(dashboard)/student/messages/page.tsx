"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useState, useEffect, useRef, Suspense } from "react";
import { Send, ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function MessagesContent() {
  const { profile } = useAuth();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    
    setSending(true);
    const text = newMessage;
    setNewMessage(""); // Optimistic clear
    
    await supabase.from("direct_messages").insert({
      sender_id: profile?.id,
      receiver_id: selectedFriend.id,
      content: text
    });
    
    setSending(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-80px)] flex gap-6 pb-24 lg:pb-8">
      {/* Sidebar: Friends List */}
      <div className={`bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden flex flex-col w-full lg:w-1/3 ${selectedFriend ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b-2 border-slate-100 bg-indigo-500 text-white">
          <h2 className="text-2xl font-black">Pesan Teman</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mutualFriends.length === 0 ? (
            <div className="text-center p-8 text-slate-400 font-bold">
              Belum ada teman mutual. Mulai saling follow dengan temanmu untuk bisa chatting!
            </div>
          ) : (
            mutualFriends.map(friend => (
              <div 
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  selectedFriend?.id === friend.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                  : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                {friend.avatar_url && friend.avatar_url.includes('/avatars/') ? (
                  <img src={friend.avatar_url} className="w-12 h-12 rounded-full object-cover object-top border-2 border-slate-200" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                    {friend.full_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-800">{friend.full_name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`bg-white border-2 border-slate-200 rounded-[2rem] shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden flex-col w-full lg:w-2/3 relative ${!selectedFriend ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
        {!selectedFriend ? (
          <div className="text-slate-400 font-bold flex flex-col items-center">
            <MessageCircle className="w-16 h-16 mb-4 text-slate-200" />
            <p>Pilih obrolan untuk mulai mengirim pesan.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b-2 border-slate-100 bg-slate-50 flex items-center gap-4">
              <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setSelectedFriend(null)}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              {selectedFriend.avatar_url && selectedFriend.avatar_url.includes('/avatars/') ? (
                <img src={selectedFriend.avatar_url} className="w-10 h-10 rounded-full object-cover object-top border-2 border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                  {selectedFriend.full_name?.charAt(0)}
                </div>
              )}
              <h3 className="font-black text-slate-800">{selectedFriend.full_name}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === profile?.id;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-5 py-3 rounded-2xl font-bold ${
                      isMe 
                      ? 'bg-indigo-500 text-white rounded-br-sm shadow-[0_4px_0_rgb(79,70,229)]' 
                      : 'bg-white text-slate-700 border-2 border-slate-200 rounded-bl-sm shadow-[0_4px_0_rgb(226,232,240)]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-slate-100 bg-white">
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Kirim pesan..." 
                  className="flex-1 bg-slate-100 border-2 border-slate-200 rounded-xl px-6 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-4 bg-indigo-500 text-white font-black rounded-xl border-2 border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
