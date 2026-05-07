"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Users, 
  Hash, 
  MessageSquare, 
  MoreVertical,
  Paperclip,
  Smile,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    full_name: string;
    role: string;
    avatar_url: string | null;
  };
}

interface ChatGroup {
  id: string;
  name: string;
  type: string;
  class_id?: string;
}

export default function ChatPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchGroups = useCallback(async () => {
    if (!profile) return;
    
    // Find groups related to user's class or parent-teacher links
    let query = supabase.from("chat_groups").select("*");
    
    // Logic: If student/teacher, get class group. If parent, get child's class group.
    // For now, let's get all groups and filter by role later or simplified.
    const { data } = await query;
    if (data) {
      setGroups(data);
      if (data.length > 0) setActiveGroup(data[0]);
    }
    setLoading(false);
  }, [profile, supabase]);

  const fetchMessages = useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:profiles(full_name, role, avatar_url)
      `)
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });
    
    if (data) setMessages(data as any);
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (activeGroup) {
      fetchMessages(activeGroup.id);
      
      const channel = supabase
        .channel(`group-${activeGroup.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages', 
          filter: `group_id=eq.${activeGroup.id}` 
        }, (payload: any) => {
          // Fetch sender info and add to list
          supabase.from("profiles").select("full_name, role, avatar_url").eq("id", payload.new.sender_id).single().then(({data}: any) => {
             setMessages(prev => [...prev, { ...payload.new, sender: data } as Message]);
          });
        })
        .subscribe();
      
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeGroup, fetchMessages, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup || !profile) return;
    
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      group_id: activeGroup.id,
      sender_id: profile.id,
      content: newMessage.trim()
    });

    if (error) toast.error(error.message);
    else setNewMessage("");
    setSending(false);
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Sidebar */}
      <Card className="w-80 hidden lg:flex flex-col p-0 overflow-hidden bg-[var(--bg-secondary)] border-none">
        <div className="p-6 border-b border-[var(--border)]">
           <h2 className="text-xl font-black text-[var(--text-primary)]">Channels</h2>
           <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Nusantara Academy Communications</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                activeGroup?.id === group.id 
                  ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" 
                  : "hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeGroup?.id === group.id ? "bg-white/20" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"}`}>
                 <Hash className="h-5 w-5" />
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold truncate">{group.name}</p>
                <p className={`text-[10px] uppercase font-black opacity-60`}>{group.type}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Main Chat */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-2xl border-[var(--border)]">
        {activeGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Button variant="ghost" size="sm" className="lg:hidden p-0 h-8 w-8 rounded-full"><ChevronLeft /></Button>
                 <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] shadow-inner">
                    <Users className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight">{activeGroup.name}</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                       <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Synchronized Live</p>
                    </div>
                 </div>
              </div>
              <Button variant="ghost" size="sm" icon={<MoreVertical className="h-5 w-5" />} />
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[var(--bg-primary)]"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === profile?.id;
                  const showHeader = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;

                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                         {!isMe && showHeader && (
                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 mt-1 flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
                               {msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} className="w-full h-full rounded-lg object-cover" /> : msg.sender?.full_name[0]}
                            </div>
                         )}
                         <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && showHeader && (
                               <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">{msg.sender?.full_name} • {msg.sender?.role}</span>
                            )}
                            <div className={`p-4 rounded-3xl text-sm shadow-sm ${
                               isMe 
                               ? "bg-[var(--accent)] text-white rounded-tr-none" 
                               : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-none border border-[var(--border)]"
                            }`}>
                               {msg.content}
                            </div>
                            <span className="text-[9px] text-[var(--text-tertiary)] mt-1 px-1">
                               {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 sm:p-6 bg-[var(--bg-secondary)]/50 border-t border-[var(--border)]">
              <div className="relative flex items-center gap-3">
                 <Button variant="ghost" size="sm" type="button" className="text-[var(--text-tertiary)] hover:text-[var(--accent)]" icon={<Paperclip className="h-5 w-5" />} />
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message to the class..."
                      className="w-full h-14 pl-5 pr-12 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] outline-none transition-all"
                    />
                    <Button variant="ghost" size="sm" type="button" className="absolute right-3 top-3 text-[var(--text-tertiary)]" icon={<Smile className="h-5 w-5" />} />
                 </div>
                 <Button 
                   type="submit" 
                   disabled={!newMessage.trim() || sending} 
                   className="h-14 w-14 rounded-2xl flex items-center justify-center p-0 shadow-xl shadow-[var(--accent)]/20"
                 >
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                 </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
             <MessageSquare className="h-20 w-20 mb-6" />
             <h3 className="text-xl font-black text-[var(--text-primary)]">Class Connect</h3>
             <p className="text-sm text-[var(--text-secondary)] mt-2">Select a channel from the left to start collaborating with teachers and students.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
