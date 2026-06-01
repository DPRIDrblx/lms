"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
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
       const { data: link } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", profile.id).limit(1).maybeSingle();
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
    // Determine class context
    let classId = profile?.class_id;
    if (profile?.role === 'parent') {
       const { data: link } = await supabase.from("parent_student_links").select("student_id").eq("parent_id", profile.id).limit(1).maybeSingle();
       if (link) {
          const { data: std } = await supabase.from("profiles").select("class_id").eq("id", link.student_id).single();
          classId = std?.class_id;
       }
    }

    const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, role, avatar_url, class_id");
    if (allProfiles) {
      setDirectory({
        students: allProfiles.filter((p: any) => p.role === 'student' && (profile?.role === 'teacher' || p.class_id === classId)),
        teachers: allProfiles.filter((p: any) => p.role === 'teacher'), // Teachers are always visible
        parents: allProfiles.filter((p: any) => p.role === 'parent' && (profile?.role === 'teacher' || p.class_id === classId))
      });
    }
  }, [supabase, profile]);

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

  const startDirectMessage = async (otherUser: any) => {
    if (!profile) return;
    const dmName = `DM-${[profile.id, otherUser.id].sort().join("-")}`;
    
    let { data: existing } = await supabase.from("chat_groups").select("*").eq("name", dmName).maybeSingle();
    
    if (!existing) {
      const { data: newGroup, error } = await supabase.from("chat_groups").insert({
        name: dmName,
        type: 'dm'
      }).select().single();
      
      if (newGroup) {
         existing = newGroup;
         setGroups(prev => [...prev, newGroup]);
      }
    }
    
    if (existing) {
      setSelectedGroup(existing);
      setTab("chats");
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden font-sans">
      {/* Sidebar: Navigation & Directory */}
      <div className="w-80 flex flex-col shrink-0 bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
         <div className="p-5 border-b border-[var(--border)] space-y-5 bg-[var(--bg-primary)]">
            <div className="flex bg-[var(--bg-tertiary)] p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
               <button 
                 onClick={() => setTab("chats")}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${tab === 'chats' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-[var(--text-secondary)] hover:bg-white/50 dark:hover:bg-slate-700/50"}`}
               >
                  <MessageSquare className="h-4 w-4" /> Chats
               </button>
               <button 
                 onClick={() => setTab("directory")}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${tab === 'directory' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-[var(--text-secondary)] hover:bg-white/50 dark:hover:bg-slate-700/50"}`}
               >
                  <Users className="h-4 w-4" /> Directory
               </button>
            </div>
            <div className="relative">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
               <input placeholder="Search directory..." className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 text-[var(--text-primary)] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all" />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {tab === 'chats' ? (
               <div className="space-y-1.5">
                  <p className="px-3 py-2 text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest mt-2 mb-1">Active Channels</p>
                  {groups.map(group => (
                     <button
                       key={group.id}
                       onClick={() => setSelectedGroup(group)}
                       className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${selectedGroup?.id === group.id ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "hover:bg-[var(--bg-secondary)]"}`}
                     >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${selectedGroup?.id === group.id ? "bg-indigo-500 text-white shadow-indigo-500/20" : "bg-white dark:bg-slate-800 text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                           <Hash className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                           <p className={`text-sm font-bold truncate ${selectedGroup?.id === group.id ? "text-indigo-700 dark:text-indigo-300" : "text-[var(--text-primary)]"}`}>{group.name}</p>
                           <p className={`text-[10px] uppercase font-black tracking-wider mt-0.5 ${selectedGroup?.id === group.id ? "text-indigo-500/70 dark:text-indigo-400/70" : "text-[var(--text-tertiary)]"}`}>{group.type}</p>
                        </div>
                     </button>
                  ))}
               </div>
            ) : (
               <div className="space-y-6 p-2">
                  <DirectorySection title="Academic Faculty" items={directory.teachers} icon={Briefcase} color="text-indigo-500" onSelect={startDirectMessage} />
                  <DirectorySection title="Student Body" items={directory.students} icon={GraduationCap} color="text-emerald-500" onSelect={startDirectMessage} />
                  <DirectorySection title="Parent Association" items={directory.parents} icon={Users} color="text-amber-500" onSelect={startDirectMessage} />
               </div>
            )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] backdrop-blur-lg rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden relative">
         {selectedGroup ? (
            <>
               <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)] sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Hash className="h-6 w-6" />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">{selectedGroup.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                           <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{selectedGroup.type} channel active</p>
                        </div>
                     </div>
                  </div>
                  <Button variant="secondary" size="sm" className="bg-[var(--bg-primary)] border-[var(--border)] shadow-sm rounded-xl">
                     <UserPlus className="h-4 w-4 mr-2" /> Add Member
                  </Button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((msg, i) => {
                     const isOwn = msg.sender_id === profile?.id;
                     return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                           {!isOwn && (
                              <div className="flex items-center gap-2 mb-1.5 ml-1">
                                 <p className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                    {msg.profiles?.full_name}
                                 </p>
                                 <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded font-bold uppercase tracking-widest">{msg.profiles?.role}</span>
                              </div>
                           )}
                           <div className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              isOwn 
                                ? "bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/20" 
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-[var(--border)] rounded-tl-sm"
                           }`}>
                              {msg.content}
                           </div>
                           <p className="text-[10px] font-bold text-[var(--text-tertiary)] mt-2 px-2">
                              {format(new Date(msg.created_at), "HH:mm")}
                           </p>
                        </div>
                     );
                  })}
                  <div ref={scrollRef} />
               </div>

               <div className="p-5 bg-[var(--bg-primary)] backdrop-blur-md border-t border-[var(--border)]">
                  <form onSubmit={handleSend} className="flex gap-3">
                     <input 
                       value={newMessage}
                       onChange={e => setNewMessage(e.target.value)}
                       placeholder="Message into channel..."
                       className="flex-1 h-14 px-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm text-[var(--text-primary)] placeholder:text-slate-400 transition-all"
                     />
                     <Button type="submit" className="h-14 w-14 rounded-2xl shrink-0 p-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30" loading={sending}>
                        <Send className="h-5 w-5" />
                     </Button>
                  </form>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
               <div className="w-32 h-32 rounded-3xl bg-[var(--bg-primary)] border border-[var(--border)] flex items-center justify-center mb-8 shadow-sm">
                  <MessageSquare className="h-14 w-14 text-indigo-500 dark:text-indigo-400 opacity-60" />
               </div>
               <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Secure Communications</h3>
               <p className="text-sm font-medium text-[var(--text-secondary)] mt-3 max-w-sm leading-relaxed">
                  Select a class channel or search the directory to begin professional collaboration with teachers, students, and parents.
               </p>
            </div>
         )}
      </div>
    </div>
  );
}

function DirectorySection({ title, items, icon: Icon, color, onSelect }: any) {
   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between px-3">
            <h4 className="text-[10px] font-black uppercase text-[var(--text-tertiary)] tracking-widest flex items-center gap-2">
               <Icon className={`h-3.5 w-3.5 ${color}`} /> {title}
            </h4>
            <span className="text-[9px] font-bold bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full text-[var(--text-secondary)]">{items.length}</span>
         </div>
         <div className="space-y-1.5">
            {items.map((item: any) => (
               <button onClick={() => onSelect?.(item)} key={item.id} className="w-full flex items-center text-left gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-hover)] transition-all group shadow-sm hover:shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-[var(--border)] flex items-center justify-center text-xs font-black text-[var(--text-secondary)] shrink-0">
                     {item.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.full_name}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 -translate-x-2 group-hover:translate-x-0" />
               </button>
            ))}
         </div>
      </div>
   );
}
