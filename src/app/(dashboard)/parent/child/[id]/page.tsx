"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { ChevronLeft, BookOpen, Loader2, TrendingUp, BookCheck, GraduationCap, Medal, Star, Share2, Target, Plus, CheckCircle2, ShieldAlert, Lock, Unlock, Users, Image as ImageIcon, Trash2, Ban, Clock, Award, MessageSquare } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

export default function ChildReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: childId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [child, setChild] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [gradebookScores, setGradebookScores] = useState<any[]>([]);
  const [gradebookColumns, setGradebookColumns] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [newQuestReward, setNewQuestReward] = useState(50);
  const [isSubmittingQuest, setIsSubmittingQuest] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Social Controls State
  const [socialAccessBlocked, setSocialAccessBlocked] = useState(false);
  const [socialVisibility, setSocialVisibility] = useState("public");
  const [childPosts, setChildPosts] = useState<any[]>([]);
  const [childFollowers, setChildFollowers] = useState<any[]>([]);
  const [childFollowing, setChildFollowing] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [searchBlockQuery, setSearchBlockQuery] = useState("");
  const [searchBlockResults, setSearchBlockResults] = useState<any[]>([]);
  
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    const fetchChildData = async () => {
      // Security check: Make sure this parent actually owns this child
      const { data: link } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_id", profile?.id)
        .eq("student_id", childId)
        .limit(1)
        .maybeSingle();
        
      if (!link) {
        setLoading(false);
        return; // Unauthorized or not found
      }

      const { data: c } = await supabase.from("profiles").select("*").eq("id", childId).single();
      
      const { data: s } = await supabase
        .from("student_scores")
        .select("*, courses(*)")
        .eq("student_id", childId)
        .eq("target_type", "course"); // or just get everything and filter
        
      const { data: gsc } = await supabase.from("gradebook_scores").select("*").eq("student_id", childId);
      
      // Get all unique course IDs to fetch columns
      const courseIds = [...new Set(s?.map((x: any) => x.course_id).filter(Boolean))];
      
      let gcols: any[] = [];
      if (courseIds.length > 0) {
        const { data: cols } = await supabase.from("gradebook_columns").select("*").in("course_id", courseIds);
        gcols = cols || [];
      }
      
      const { data: q } = await supabase
        .from("parent_quests")
        .select("*")
        .eq("student_id", childId)
        .order("created_at", { ascending: false });

      if (c) {
        setChild(c);
        setSocialAccessBlocked(c.social_access_blocked || false);
        setSocialVisibility(c.social_visibility || "public");
      }
      if (s) setScores(s.filter((x: any) => x.courses)); // Ensure course relation exists
      if (gsc) setGradebookScores(gsc);
      if (gcols) setGradebookColumns(gcols);
      if (q) setQuests(q);
      
      // Fetch Social Data
      const { data: cp } = await supabase.from("posts").select("*").eq("user_id", childId).order("created_at", { ascending: false });
      if (cp) setChildPosts(cp);

      const { data: f_ing } = await supabase.from("friendships").select("following_id").eq("follower_id", childId);
      const { data: f_ers } = await supabase.from("friendships").select("follower_id").eq("following_id", childId);
      
      // Compile Timeline Events
      let events: any[] = [];
      if (q) {
        q.forEach((quest: any) => {
          if (quest.status === 'completed') {
            events.push({
              id: `q-${quest.id}`, title: "Misi Selesai", description: `Berhasil menyelesaikan misi: ${quest.title}`, time: quest.updated_at, type: "quest"
            });
          }
        });
      }
      if (s) {
        s.forEach((score: any) => {
          events.push({
            id: `s-${score.id}`, title: "Ujian Selesai", description: `Mendapatkan nilai ${score.score} di mapel ${score.courses?.title || 'Unknown'}`, time: score.created_at, type: "exam"
          });
        });
      }
      if (cp) {
        cp.forEach((post: any) => {
          events.push({
            id: `p-${post.id}`, title: "Aktivitas Sosial", description: `Membagikan postingan baru di Mading Kelas.`, time: post.created_at, type: "social"
          });
        });
      }
      
      // Simulate real-time logs to show off the feature (since it's a demo)
      const now = new Date();
      events.push({
        id: 'sim-1', title: "Tiba di Sekolah", description: "Absen masuk gerbang via Kiosk Face ID", time: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(), type: "attendance"
      });
      events.push({
        id: 'sim-2', title: "Poin Kelas Dojo", description: "Mendapat +10 XP dari Guru Kelas (Aktif Bertanya)", time: new Date(now.getTime() - 1000 * 60 * 60 * 1).toISOString(), type: "dojo"
      });
      
      events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setTimelineEvents(events);

      const followingIds = f_ing?.map((f: any) => f.following_id) || [];
      const followerIds = f_ers?.map((f: any) => f.follower_id) || [];
      
      if (followingIds.length > 0) {
        const { data: p_ing } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", followingIds);
        if (p_ing) setChildFollowing(p_ing);
      }
      if (followerIds.length > 0) {
        const { data: p_ers } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", followerIds);
        if (p_ers) setChildFollowers(p_ers);
      }

      const { data: bu } = await supabase.from("student_blocks").select("blocked_user_id").eq("student_id", childId);
      const blockedIds = bu?.map((b: any) => b.blocked_user_id) || [];
      if (blockedIds.length > 0) {
        const { data: p_bu } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", blockedIds);
        if (p_bu) setBlockedUsers(p_bu);
      }

      setLoading(false);
    };

    if (profile?.id) {
      fetchChildData();
    }
  }, [profile, childId, supabase]);

  const searchUsersToBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchBlockQuery.trim()) return;
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").ilike("full_name", `%${searchBlockQuery}%`).neq("id", childId).limit(5);
    setSearchBlockResults(data || []);
  };

  const blockUser = async (userId: string) => {
    const { error } = await supabase.from("student_blocks").insert({ student_id: childId, blocked_user_id: userId });
    if (!error) {
       const user = searchBlockResults.find(u => u.id === userId);
       if (user) setBlockedUsers(prev => [user, ...prev]);
    }
    setSearchBlockResults([]);
    setSearchBlockQuery("");
  };
  
  const unblockUser = async (userId: string) => {
    await supabase.from("student_blocks").delete().eq("student_id", childId).eq("blocked_user_id", userId);
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const toggleSocialAccess = async () => {
    const newValue = !socialAccessBlocked;
    setSocialAccessBlocked(newValue);
    await supabase.from("profiles").update({ social_access_blocked: newValue }).eq("id", childId);
  };

  const updateVisibility = async (val: string) => {
    setSocialVisibility(val);
    await supabase.from("profiles").update({ social_visibility: val }).eq("id", childId);
  };

  const deletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    setChildPosts(prev => prev.filter(p => p.id !== postId));
  };

  const removeFriendship = async (followerId: string, followingId: string) => {
    await supabase.from("friendships").delete().eq("follower_id", followerId).eq("following_id", followingId);
    if (followerId === childId) {
      setChildFollowing(prev => prev.filter(p => p.id !== followingId));
    } else {
      setChildFollowers(prev => prev.filter(p => p.id !== followerId));
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-[var(--accent)]" /></div>;
  if (!child) return <div className="text-center py-20 text-[var(--text-tertiary)]">Student not found or access denied.</div>;

  return (
    <>
    <div className="max-w-5xl mx-auto space-y-8 pb-20 font-sans">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 font-black mb-2 px-4 py-2 bg-white rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] active:translate-y-1 active:shadow-none transition-all">
        <ChevronLeft className="h-5 w-5" strokeWidth={3} />
        Kembali ke Family Hub
      </Link>

      {/* Premium Profile Banner */}
      <div className="relative bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] mt-4">
        <div className="h-32 md:h-40 w-full bg-indigo-500 relative border-b-2 border-slate-200">
          <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
        </div>
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-2 shadow-[0_4px_0_rgb(226,232,240)] border-2 border-slate-200 relative z-10">
               <div className="w-full h-full rounded-2xl bg-indigo-400 flex items-center justify-center text-white font-black text-5xl overflow-hidden">
                  {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover" /> : child.full_name[0]}
               </div>
            </div>
            <div className="text-center md:text-left flex-1 mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-800">{child.full_name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                <div className="bg-indigo-100 text-indigo-600 border-2 border-indigo-200 shadow-[0_2px_0_rgb(199,210,254)] font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" strokeWidth={3} /> Siswa {child.rank || 'Aktif'}
                </div>
                <div className="bg-amber-100 text-amber-600 border-2 border-amber-200 shadow-[0_2px_0_rgb(253,230,138)] font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Star className="h-4 w-4" strokeWidth={3} /> {child.xp || 0} XP
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center">
              <button 
                onClick={() => setShowShareModal(true)}
                className="bg-purple-500 text-white font-black text-sm px-4 py-2.5 rounded-xl border-2 border-purple-600 shadow-[0_4px_0_rgb(147,51,234)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" strokeWidth={3} /> Share Achievement
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Parent-Driven Quests */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl mt-8">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-fuchsia-500 text-white rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgb(192,38,211)] border-2 border-fuchsia-600 rotate-3">
                 <Target className="w-6 h-6" strokeWidth={3} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800">Family Quests</h3>
                  <p className="text-sm font-bold text-slate-500">Berikan misi kepada anak dengan hadiah Gems!</p>
               </div>
            </div>
            <button 
               onClick={() => setShowQuestModal(true)}
               className="bg-fuchsia-500 text-white font-black text-sm px-4 py-2.5 rounded-xl border-2 border-fuchsia-600 shadow-[0_4px_0_rgb(192,38,211)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 w-fit"
            >
               <Plus className="w-4 h-4" strokeWidth={3} /> Buat Misi Baru
            </button>
         </div>

         <div className="space-y-3">
            {quests.length === 0 ? (
               <div className="text-center py-6">
                  <p className="text-slate-400 font-bold">Belum ada misi yang kamu berikan.</p>
               </div>
            ) : (
               quests.map(quest => (
                  <div key={quest.id} className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                        <h4 className="font-black text-slate-800">{quest.title}</h4>
                        <p className="text-sm text-slate-500">{quest.description}</p>
                     </div>
                     <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-fuchsia-500 font-black">
                           <Star className="w-4 h-4 fill-current" /> {quest.reward_gems}
                        </div>
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-2", quest.status === 'completed' ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                           {quest.status}
                        </span>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>

      {/* Milestone Tracker */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] p-6 md:p-8 mt-8">
         <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-48 h-48 shrink-0">
               {/* SVG Circular Progress Chart */}
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-slate-100 stroke-current" strokeWidth="12" cx="50" cy="50" r="40" fill="transparent"></circle>
                  <circle className="text-indigo-200 stroke-current" strokeWidth="12" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="100.48"></circle>
                  <circle className="text-indigo-500 stroke-current" strokeWidth="12" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent" strokeDasharray="251.2" strokeDashoffset="45.216" style={{ filter: "drop-shadow(0px 4px 6px rgba(99, 102, 241, 0.4))" }}></circle>
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800">82%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Selesai</span>
               </div>
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
               <div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Interactive Academic Milestone</h3>
                  <p className="text-slate-500 font-bold leading-relaxed">
                     Kurikulum semester berjalan hingga <strong className="text-indigo-500">Materi Bab 8</strong>. Anak Anda telah menguasai materi lebih cepat dari jadwal standar.
                  </p>
               </div>
               <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-2xl flex items-start md:items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border-2 border-emerald-200 shadow-sm">
                     <TrendingUp className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <p className="text-sm font-black text-emerald-700 leading-snug">
                     Hebat! Putra Anda berada <span className="text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-md">2 bab lebih cepat</span> dari rata-rata perkembangan kelas.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* TIMELINE JEJAK ANAK (REAL-TIME BUKU PENGHUBUNG) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] p-6 md:p-8 mt-8">
         <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-200 shadow-sm">
               <Clock className="w-6 h-6" strokeWidth={3} />
            </div>
            <div>
               <h3 className="text-2xl font-black text-slate-800">Buku Penghubung Real-Time</h3>
               <p className="text-sm font-bold text-slate-500">Pantau jejak aktivitas anak Anda di sekolah menit demi menit.</p>
            </div>
         </div>

         <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.4rem] md:before:ml-[2.9rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-slate-200 before:rounded-full">
            {timelineEvents.map((event, idx) => {
               let Icon = CheckCircle2;
               let color = "bg-slate-100 text-slate-500 border-slate-200";
               
               if (event.type === 'attendance') { Icon = Clock; color = "bg-blue-100 text-blue-600 border-blue-200"; }
               if (event.type === 'dojo') { Icon = Award; color = "bg-yellow-100 text-yellow-600 border-yellow-200"; }
               if (event.type === 'quest') { Icon = Star; color = "bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200"; }
               if (event.type === 'exam') { Icon = BookOpen; color = "bg-indigo-100 text-indigo-600 border-indigo-200"; }
               if (event.type === 'social') { Icon = MessageSquare; color = "bg-pink-100 text-pink-600 border-pink-200"; }

               return (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-sm absolute left-0 md:left-1/2 -translate-x-1/2 shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" strokeWidth={3} />
                     </div>
                     <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl shadow-sm hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="font-black text-slate-800 text-sm">{event.title}</h4>
                           <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border-2 border-slate-100">
                              {new Date(event.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">{event.description}</p>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Parental Controls Section */}
      <div className="flex items-center gap-4 mt-10 mb-6">
        <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgb(225,29,72)] border-2 border-rose-600 rotate-3">
          <ShieldAlert className="h-7 w-7" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Parental Controls (Social)</h2>
          <p className="text-slate-500 font-bold">Kelola aktivitas & privasi sosial anak.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] p-6 md:p-8 space-y-8">
        
        {/* Global Access & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="font-black text-slate-800">Akses Fitur Sosial</h4>
                    <p className="text-sm text-slate-500 font-bold">Kunci akses Feed & Explore</p>
                 </div>
                 <button 
                    onClick={toggleSocialAccess}
                    className={cn("p-3 rounded-xl border-2 shadow-sm font-black transition-all flex items-center gap-2", socialAccessBlocked ? "bg-rose-500 text-white border-rose-600" : "bg-emerald-500 text-white border-emerald-600")}
                 >
                    {socialAccessBlocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                    {socialAccessBlocked ? "Terkunci" : "Terbuka"}
                 </button>
              </div>
           </div>

           <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
              <div className="mb-4">
                 <h4 className="font-black text-slate-800">Visibilitas Profil</h4>
                 <p className="text-sm text-slate-500 font-bold">Siapa yang bisa melihat profil anak</p>
              </div>
              <select 
                 value={socialVisibility} 
                 onChange={(e) => updateVisibility(e.target.value)}
                 className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
              >
                 <option value="public">🌐 Publik (Semua Siswa)</option>
                 <option value="friends_only">👥 Hanya Teman (Following/Followers)</option>
                 <option value="private">🔒 Privat (Sembunyikan)</option>
              </select>
           </div>
        </div>

        {/* Posts & Connections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-200">
           {/* Manage Posts */}
           <div>
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                 <ImageIcon className="w-5 h-5 text-indigo-500" /> Riwayat Postingan
              </h4>
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 h-64 overflow-y-auto space-y-3">
                 {childPosts.length === 0 ? (
                    <p className="text-sm text-slate-400 font-bold text-center py-4">Belum ada postingan.</p>
                 ) : (
                    childPosts.map(post => (
                       <div key={post.id} className="bg-white p-3 rounded-xl border-2 border-slate-200 shadow-sm flex items-start justify-between gap-4">
                          <p className="text-sm text-slate-700 font-bold line-clamp-2 flex-1">{post.content || "(Gambar/Video)"}</p>
                          <button onClick={() => deletePost(post.id)} className="text-rose-500 hover:text-rose-600 p-1">
                             <Trash2 className="w-5 h-5" />
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           {/* Manage Connections (Followers/Following) */}
           <div>
              <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                 <Users className="w-5 h-5 text-indigo-500" /> Daftar Teman
              </h4>
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-4 h-64 overflow-y-auto space-y-3">
                 {childFollowing.length === 0 && childFollowers.length === 0 ? (
                    <p className="text-sm text-slate-400 font-bold text-center py-4">Belum ada koneksi pertemanan.</p>
                 ) : (
                    <>
                       {childFollowing.map(u => (
                          <div key={`ing_${u.id}`} className="bg-white p-2 px-3 rounded-xl border-2 border-slate-200 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded font-black">MENGIKUTI</span>
                                <p className="text-sm font-bold text-slate-700">{u.full_name}</p>
                             </div>
                             <button onClick={() => removeFriendship(childId, u.id)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       ))}
                       {childFollowers.map(u => (
                          <div key={`ers_${u.id}`} className="bg-white p-2 px-3 rounded-xl border-2 border-slate-200 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-fuchsia-100 text-fuchsia-600 px-1 rounded font-black">PENGIKUT</span>
                                <p className="text-sm font-bold text-slate-700">{u.full_name}</p>
                             </div>
                             <button onClick={() => removeFriendship(u.id, childId)} className="text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       ))}
                    </>
                 )}
              </div>
           </div>
        </div>

        {/* Blocked Users */}
        <div className="pt-6 border-t-2 border-slate-200">
           <div className="flex justify-between items-center mb-4">
              <h4 className="font-black text-slate-800 flex items-center gap-2">
                 <Ban className="w-5 h-5 text-rose-500" /> Pengguna Diblokir
              </h4>
              <button onClick={() => setShowBlockModal(true)} className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-sm font-black hover:bg-rose-200 transition-colors">
                 + Blokir Akun
              </button>
           </div>
           
           {blockedUsers.length === 0 ? (
              <p className="text-sm text-slate-400 font-bold">Tidak ada akun yang diblokir.</p>
           ) : (
              <div className="flex flex-wrap gap-2">
                 {blockedUsers.map(u => (
                    <div key={u.id} className="bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm font-bold">
                       {u.full_name}
                       <button onClick={() => unblockUser(u.id)} className="text-rose-400 hover:text-rose-600 font-black ml-1">X</button>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-10 mb-6">
        <div className="w-14 h-14 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgb(147,51,234)] border-2 border-purple-600 rotate-3">
          <Medal className="h-7 w-7" strokeWidth={3} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Rapor Mata Pelajaran</h2>
          <p className="text-slate-500 font-bold">Ringkasan performa di setiap kelas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {scores.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-black">No grades available yet.</p>
          </div>
        ) : (
          scores.map(score => {
            const course = score.courses;
            const courseCols = gradebookColumns.filter(c => c.course_id === course.id);
            
            return (
              <div key={score.id} className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_0_rgb(226,232,240)] border-2 border-slate-200">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 border-2 border-indigo-600 shadow-sm -rotate-3">
                      <BookCheck className="h-7 w-7" strokeWidth={3} />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 font-bold">Diampu oleh pengajar khusus.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-0.5">Nilai Akhir</p>
                      <p className={`text-3xl font-black ${score.score >= 75 ? "text-emerald-500" : score.score >= 60 ? "text-amber-500" : "text-rose-500"}`}>
                        {score.score}
                      </p>
                    </div>
                    <div className={cn(
                      "px-4 py-2 text-sm font-black rounded-xl border-2",
                      score.score >= 75 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : 
                      score.score >= 60 ? "bg-amber-100 text-amber-600 border-amber-200" : 
                      "bg-rose-100 text-rose-600 border-rose-200"
                    )}>
                      {score.score >= 75 ? "Sangat Baik" : score.score >= 60 ? "Cukup" : "Kurang"}
                    </div>
                  </div>
                </div>
                
                {courseCols.length > 0 ? (
                  <div className="p-6 md:p-8">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Komponen Penilaian (Tugas & Ujian)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courseCols.map(col => {
                        const colScore = gradebookScores.find(g => g.column_id === col.id);
                        const isScored = !!colScore;
                        const finalScore = colScore?.score || 0;
                        const statusColor = !isScored ? "slate" : finalScore >= 75 ? "emerald" : finalScore >= 60 ? "amber" : "rose";
                        
                        return (
                          <div key={col.id} className="p-4 rounded-2xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)] flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-black text-slate-800 leading-tight">{col.title}</p>
                                <p className="text-xs font-black text-slate-400 mt-1">Bobot: {col.weight}x</p>
                              </div>
                              {isScored ? (
                                <div className={`text-2xl font-black text-${statusColor}-500`}>{finalScore}</div>
                              ) : (
                                <div className="bg-slate-100 text-slate-500 border-2 border-slate-200 px-2 py-1 rounded-xl text-xs font-black">Pending</div>
                              )}
                            </div>
                            {isScored ? (
                              <ProgressBar value={finalScore} max={100} size="md" color={`var(--${statusColor}-500, #${statusColor === 'emerald' ? '10b981' : statusColor === 'amber' ? 'f59e0b' : 'f43f5e'})`} />
                            ) : (
                              <div className="h-2 w-full bg-slate-100 rounded-full mt-2"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 m-6 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-500 font-black">Belum ada rincian komponen nilai yang diatur oleh guru pengampu.</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
    
      {/* Pride Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-4 border-b-2 border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-black text-slate-800">The Pride Share</h3>
               <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 font-black">Tutup</button>
            </div>
            <div className="p-6 bg-slate-100 flex justify-center">
               {/* Aesthetic Generated Card */}
               <div id="pride-card" className="w-full aspect-[4/5] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white border-4 border-white shadow-[0_12px_24px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
                  
                  <div className="relative z-10 w-24 h-24 rounded-full bg-white p-1 mb-4 shadow-lg border-2 border-indigo-200">
                     <div className="w-full h-full rounded-full overflow-hidden bg-indigo-100">
                        {child.avatar_url ? <img src={child.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl text-indigo-500 font-black">{child.full_name[0]}</div>}
                     </div>
                  </div>

                  <h2 className="text-2xl font-black relative z-10 mb-1">{child.full_name}</h2>
                  <p className="text-indigo-100 font-bold mb-6 relative z-10 text-sm">Sedang berprestasi luar biasa!</p>

                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 w-full border border-white/30 relative z-10 mb-8 shadow-inner">
                     <p className="text-xs uppercase tracking-widest font-black opacity-80 mb-1 text-indigo-100">Current Rank</p>
                     <p className="text-3xl font-black">{child.rank || 'Siswa Teladan'}</p>
                     <div className="mt-2 text-sm font-bold flex justify-center gap-2 items-center">
                       <Star className="w-4 h-4 text-amber-300 fill-current" /> {child.xp || 0} XP
                     </div>
                  </div>

                  <div className="mt-auto relative z-10 flex items-center gap-2">
                     <div className="w-6 h-6 bg-white text-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">I</div>
                     <span className="font-black tracking-widest">IGNITE</span>
                  </div>
               </div>
            </div>
            <div className="p-6">
               <button className="w-full bg-indigo-500 text-white rounded-xl py-3 font-black border-2 border-indigo-600 shadow-[0_4px_0_rgb(79,70,229)] active:translate-y-1 active:shadow-none transition-all">
                  Bagikan ke WhatsApp Status
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Parent Quest Modal */}
      {showQuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-slate-800 text-center">Buat Family Quest</h3>
            
            <div className="space-y-4 mb-8">
               <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Judul Misi</label>
                  <input type="text" value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 outline-none focus:border-indigo-500" placeholder="Contoh: Selesaikan 2 PR Matematika" />
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Deskripsi</label>
                  <textarea value={newQuestDesc} onChange={e => setNewQuestDesc(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 outline-none focus:border-indigo-500" rows={2} placeholder="Pastikan semua soal terjawab dengan benar." />
               </div>
               <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Hadiah (Gems)</label>
                  <input type="number" value={newQuestReward} onChange={e => setNewQuestReward(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-black text-fuchsia-500 outline-none focus:border-indigo-500" />
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Gems akan dipotong dari saldo Parent milikmu.</p>
               </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setShowQuestModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black border-2 border-slate-200 active:translate-y-1 transition-all">
                 Batal
               </button>
               <button 
                  disabled={isSubmittingQuest}
                  onClick={async () => {
                     setIsSubmittingQuest(true);
                     // Note: You must handle parent gems deduction here. 
                     // For UI sake, we assume success or handle in backend trigger/function
                     const { error } = await supabase.from('parent_quests').insert({
                        parent_id: profile?.id,
                        student_id: childId,
                        title: newQuestTitle,
                        description: newQuestDesc,
                        reward_gems: newQuestReward
                     });
                     if (!error) {
                        const { data } = await supabase.from('parent_quests').select('*').eq('student_id', childId).order('created_at', { ascending: false });
                        if (data) setQuests(data);
                        setShowQuestModal(false);
                        setNewQuestTitle("");
                        setNewQuestDesc("");
                     } else {
                        alert("Gagal membuat quest. Pastikan saldo Gems kamu cukup!");
                     }
                     setIsSubmittingQuest(false);
                  }}
                  className="flex-1 py-3 bg-fuchsia-500 text-white rounded-xl font-black border-2 border-fuchsia-600 shadow-[0_4px_0_rgb(192,38,211)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
               >
                 {isSubmittingQuest ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Simpan
               </button>
            </div>
          </div>
        </div>
      )}
      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-slate-800">Blokir Siswa</h3>
            <p className="text-sm text-slate-500 font-bold mb-6">Cari nama siswa yang ingin diblokir agar anak tidak bisa berinteraksi.</p>
            
            <form onSubmit={searchUsersToBlock} className="flex gap-2 mb-4">
               <input 
                  type="text" 
                  value={searchBlockQuery} 
                  onChange={e => setSearchBlockQuery(e.target.value)} 
                  placeholder="Ketik nama siswa..." 
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-800 outline-none focus:border-rose-500" 
               />
               <button type="submit" className="bg-rose-500 text-white px-4 py-2 rounded-xl font-black shadow-sm">Cari</button>
            </form>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
               {searchBlockResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-slate-50 p-2 px-3 border-2 border-slate-200 rounded-xl">
                     <p className="font-bold text-slate-700 text-sm">{user.full_name}</p>
                     <button onClick={() => blockUser(user.id)} className="text-xs bg-rose-100 text-rose-600 font-black px-2 py-1 rounded-lg">Blokir</button>
                  </div>
               ))}
            </div>

            <button onClick={() => setShowBlockModal(false)} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black border-2 border-slate-200 active:translate-y-1 transition-all">
               Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
