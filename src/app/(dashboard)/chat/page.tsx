"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Users, 
  Search, 
  MessageSquare, 
  Hash, 
  UserPlus,
  Loader2,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Briefcase
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function AdvancedChatPortal() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"chats" | "directory">("chats");
  
  // Directory State
  const [directory, setDirectory] = useState<{ students: any[], teachers: any[], parents: any[] }>({
    students: [],
    teachers: [],
    parents: []
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchGroups = useCallback(async () => {
    // If student/parent, get class groups
    let classId = profile?.class_id;
    if (profile?.role === 'parent') {
       const { data: link } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", profile.id).single();
       if (link) {
          const { data: std } = await supabase.from("profiles").select("class_id").eq("id", link.student_id).single();
          classId = std?.class_id;
       }
    }

    const { data } = await supabase.from("chat_groups").select("*");
    if (data) setGroups(data);
    setLoading(false);
  }, [profile, supabase]);

  const fetchDirectory = useCallback(async () => {
    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, role, avatar_url");
    if (allProfiles) {
      setDirectory({
        students: allProfiles.filter((p: any) => p.role === 'student'),
        teachers: allProfiles.filter((p: any) => p.role === 'teacher'),
        parents: allProfiles.filter((p: any) => p.role === 'parent')
      });
    }
  }, [supabase]);

  useEffect(() => {
    fetchGroups();
    fetchDirectory();
  }, [fetchGroups, fetchDirectory]);

  useEffect(() => {
    if (!selectedGroup) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*, profiles:sender_id(full_name, role, avatar_url)")
        .eq("group_id", selectedGroup.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase.channel(`group-${selectedGroup.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages', 
        filter: `group_id=eq.${selectedGroup.id}` 
      }, (payload: any) => {
        supabase.from("profiles").select("full_name, role, avatar_url").eq("id", payload.new.sender_id).single()
          .then(({ data }: any) => {
            setMessages(prev => [...prev, { ...payload.new, profiles: data }]);
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedGroup, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || !profile) return;

    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      group_id: selectedGroup.id,
      sender_id: profile.id,
      content: newMessage
    });

    if (error) alert(error.message);
    else setNewMessage("");
    setSending(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
      {/* Sidebar: Navigation & Directory */}
      <Card padding="none" className="w-80 flex flex-col shrink-0 border-none shadow-xl overflow-hidden">
         <div className="p-4 border-b border-[var(--border)] space-y-4">
            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl">
               <button 
                 onClick={() => setTab("chats")}
                 className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'chats' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
               >
                  <MessageSquare className="h-3.5 w-3.5" /> Chats
               </button>
               <button 
                 onClick={() => setTab("directory")}
                 className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'directory' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
               >
                  <Users className="h-3.5 w-3.5" /> Directory
               </button>
            </div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
               <input placeholder="Search..." className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--bg-secondary)] border-none text-xs outline-none focus:ring-2 focus:ring-[var(--accent)]/20" />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-2">
            {tab === 'chats' ? (
               <div className="space-y-1">
                  <p className="px-3 py-2 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest">Active Channels</p>
                  {groups.map(group => (
                     <button
                       key={group.id}
                       onClick={() => setSelectedGroup(group)}
                       className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedGroup?.id === group.id ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
                     >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedGroup?.id === group.id ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"}`}>
                           <Hash className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                           <p className="text-sm font-bold truncate">{group.name}</p>
                           <p className="text-[10px] opacity-60 uppercase font-black">{group.type}</p>
                        </div>
                     </button>
                  ))}
               </div>
            ) : (
               <div className="space-y-6 p-2">
                  <DirectorySection title="Academic Faculty" items={directory.teachers} icon={Briefcase} color="text-indigo-500" />
                  <DirectorySection title="Student Body" items={directory.students} icon={GraduationCap} color="text-emerald-500" />
                  <DirectorySection title="Parent Association" items={directory.parents} icon={Users} color="text-amber-500" />
               </div>
            )}
         </div>
      </Card>

      {/* Main Chat Area */}
      <Card padding="none" className="flex-1 flex flex-col border-none shadow-xl overflow-hidden relative">
         {selectedGroup ? (
            <>
               <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20">
                        <Hash className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-base font-black text-[var(--text-primary)]">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{selectedGroup.type} channel active</p>
                        </div>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" icon={<UserPlus className="h-4 w-4" />}>Add Member</Button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-secondary)]/30">
                  {messages.map((msg, i) => {
                     const isOwn = msg.sender_id === profile?.id;
                     return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                           {!isOwn && (
                              <p className="text-[10px] font-black text-[var(--text-tertiary)] mb-1 uppercase tracking-widest ml-2">
                                 {msg.profiles?.full_name} • <span className="text-[var(--accent)]">{msg.profiles?.role}</span>
                              </p>
                           )}
                           <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isOwn 
                                ? "bg-[var(--accent)] text-white rounded-tr-none" 
                                : "bg-white text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none"
                           }`}>
                              {msg.content}
                           </div>
                           <p className="text-[9px] font-bold text-[var(--text-tertiary)] mt-1.5 px-2">
                              {format(new Date(msg.created_at), "HH:mm")}
                           </p>
                        </div>
                     );
                  })}
                  <div ref={scrollRef} />
               </div>

               <div className="p-4 bg-white border-t border-[var(--border)]">
                  <form onSubmit={handleSend} className="flex gap-3">
                     <input 
                       value={newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       placeholder="Message into channel..."
                       className="flex-1 h-12 px-6 rounded-xl bg-[var(--bg-secondary)] border-none text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                     />
                     <Button type="submit" className="h-12 w-12 rounded-xl shrink-0 p-0" loading={sending}>
                        <Send className="h-5 w-5" />
                     </Button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               <div className="w-24 h-24 rounded-3xl bg-[var(--bg-secondary)] flex items-center justify-center mb-6">
                  <MessageSquare className="h-12 w-12 text-[var(--text-tertiary)] opacity-20" />
               </div>
               <h3 className="text-xl font-black text-[var(--text-primary)]">Academy Secure Communications</h3>
               <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
                  Select a class channel or search the directory to begin professional collaboration with teachers, students, and parents.
               </p>
            </div>
         )}
      </Card>
    </div>
  );
}

function DirectorySection({ title, items, icon: Icon, color }: any) {
   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest flex items-center gap-2">
               <Icon className={`h-3 w-3 ${color}`} /> {title}
            </h4>
            <span className="text-[9px] font-bold bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]">{items.length}</span>
         </div>
         <div className="space-y-1">
            {items.map((item: any) => (
               <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
                     {item.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.full_name}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-all" />
               </div>
            ))}
         </div>
      </div>
   );
}
