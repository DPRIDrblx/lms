"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Wallet, 
  Search, 
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherClassroomPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "chat" | "leadership">("students");
  const [chatMessage, setChatMessage] = useState("");
  const [leadership, setLeadership] = useState<any[]>([]);

  useEffect(() => {
    fetchClassData();
  }, [profile]);

  const fetchClassData = async () => {
    if (!profile?.class_id) {
       setLoading(false);
       return;
    }
    // 1. Get students in the teacher's class
    const { data: stds } = await supabase
      .from("profiles")
      .select(`
        *,
        wallets (balance, updated_at)
      `)
      .eq("role", "student")
      .eq("class_id", profile.class_id)
      .limit(50);
    
    // 2. Get leadership
    const { data: lds } = await supabase
      .from("class_leadership")
      .select("*, profiles(full_name, avatar_url, role)")
      .eq("class_id", profile.class_id);

    setStudents(stds || []);
    setLeadership(lds || []);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Classroom Management</h1>
          <p className="text-[var(--text-secondary)] mt-1">
             {profile?.class_id ? "Wali Kelas Dashboard" : "Anda bukan wali kelas aktif."}
          </p>
        </div>
        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto">
          <button 
            onClick={() => setActiveTab("students")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'students' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          >
            Students
          </button>
          <button 
            onClick={() => setActiveTab("leadership")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'leadership' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          >
            Pengurus Kelas
          </button>
          <button 
            onClick={() => setActiveTab("chat")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'chat' ? "bg-white shadow-sm text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
          >
            Group Chat
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === "students" && (
          <motion.div 
            key="students"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Class Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <Card className="p-6">
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Class Attendance</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-2xl font-black text-[var(--text-primary)]">94.2%</h4>
                  <TrendingUp className="h-6 w-6 text-[var(--success)]" />
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Digital Wallet Volume</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-2xl font-black text-[var(--accent)]">
                    Rp {students.reduce((acc, s) => acc + (s.wallets?.balance || 0), 0).toLocaleString()}
                  </h4>
                  <Wallet className="h-6 w-6 text-[var(--accent)]" />
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Pending Invoices</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-2xl font-black text-[var(--error)]">3</h4>
                  <AlertCircle className="h-6 w-6 text-[var(--error)]" />
                </div>
              </Card>
              <Card className="p-6">
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Active Badges</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-2xl font-black text-amber-500">12</h4>
                  <ShieldCheck className="h-6 w-6 text-amber-500" />
                </div>
              </Card>
            </div>

            {/* Student List */}
            <Card className="p-0 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Student Roster</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-tertiary)]" />
                  <input type="text" placeholder="Search students..." className="pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-secondary)] border-none text-sm w-64" />
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {students.map((student) => (
                  <div key={student.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                        {student.full_name?.split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">{student.full_name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">{student.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-0.5">Wallet Balance</p>
                        <p className="text-sm font-bold text-[var(--text-primary)]">Rp {student.wallets?.balance?.toLocaleString() || "0"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-0.5">Attendance</p>
                        <Badge variant="success" className="font-bold">100%</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
        
        {activeTab === "leadership" && (
          <motion.div 
            key="leadership"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="p-6 col-span-1 md:col-span-2 bg-[var(--accent)] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                  <h3 className="text-xl font-bold mb-2">Struktur Kepengurusan Kelas</h3>
                  <p className="text-white/80 text-sm max-w-2xl">
                     Kelola ketua kelas, wakil, sekretaris, dan pendamping wali kelas di sini. 
                     Posisi kepemimpinan ini akan memberi mereka badge khusus di profil masing-masing.
                  </p>
               </Card>
               
               {/* We map predefined roles to UI block */}
               {["Ketua Kelas", "Wakil Ketua", "Sekretaris 1", "Sekretaris 2", "Pendamping Wali Kelas (Teacher)", "Pengawas Kelas (Teacher)"].map((roleTitle) => {
                 const leader = leadership.find(l => l.role_title === roleTitle);
                 return (
                   <Card key={roleTitle} className="p-0 overflow-hidden flex flex-col">
                     <div className="p-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex items-center justify-between">
                       <h4 className="font-bold text-[var(--text-primary)] text-sm">{roleTitle}</h4>
                       <Badge variant="default" className="text-[10px] uppercase">
                          {leader ? "Terisi" : "Kosong"}
                       </Badge>
                     </div>
                     <div className="p-6 flex items-center gap-4">
                        {leader ? (
                           <>
                             <div className="h-12 w-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-[var(--accent)] text-lg border-2 border-[var(--accent)]">
                               {leader.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                             </div>
                             <div>
                               <p className="font-bold text-[var(--text-primary)]">{leader.profiles?.full_name}</p>
                               <p className="text-xs text-[var(--text-tertiary)] uppercase font-medium mt-1">{leader.profiles?.role}</p>
                             </div>
                             <Button variant="ghost" size="sm" className="ml-auto text-[var(--error)] hover:bg-red-50 hover:text-red-600">
                                Copot
                             </Button>
                           </>
                        ) : (
                           <div className="flex flex-col w-full gap-3">
                             <p className="text-sm text-[var(--text-secondary)] italic">Belum ada yang ditugaskan.</p>
                             <Button variant="secondary" size="sm" className="w-fit text-xs h-8">
                               + Tunjuk Seseorang
                             </Button>
                           </div>
                        )}
                     </div>
                   </Card>
                 );
               })}
            </div>
          </motion.div>
        )}

        {activeTab === "chat" && (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-[600px] flex flex-col"
          >
            <Card className="flex-1 p-0 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Classroom Group Chat</h3>
                    <p className="text-[10px] text-[var(--success)] font-medium">Live Server</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-[var(--bg-primary)]">
                <div className="flex justify-center">
                  <Badge variant="default" className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest border-[var(--border)]">Yesterday</Badge>
                </div>
                
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]">Budiman (Parent)</p>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] max-w-sm border border-[var(--border)]">
                      Halo Pak Guru, apakah besok ada kegiatan luar sekolah?
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex-shrink-0" />
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-[var(--accent)]">You (Wali Kelas)</p>
                    <div className="p-3 rounded-2xl rounded-tr-none bg-[var(--accent)] text-sm text-white max-w-sm shadow-lg shadow-[var(--accent)]/10">
                      Besok tetap belajar di kelas seperti biasa ya Pak.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)]">Siti (Parent)</p>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] max-w-sm border border-[var(--border)]">
                      Baik Pak, terima kasih informasinya.
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message to class..." 
                    className="flex-1 px-5 py-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  />
                  <Button className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center shadow-lg">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
