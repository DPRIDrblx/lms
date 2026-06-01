"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Pin, Megaphone, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author: { full_name: string; role: string };
}

export function AnnouncementBoard() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    // Since we don't have a direct join setup for author yet, we'll fetch manually or try a simple join if FK exists.
    // Assuming FK author_id -> profiles(id) is set up in Supabase:
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        id, title, content, is_pinned, created_at,
        profiles (full_name, role)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setAnnouncements(data.map((a: any) => ({
        ...a,
        author: a.profiles || { full_name: "Admin", role: "tu" }
      })));
    }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newTitle || !newContent || !profile) return;
    await supabase.from("announcements").insert({
      title: newTitle,
      content: newContent,
      is_pinned: isPinned,
      author_id: profile.id
    });
    setNewTitle("");
    setNewContent("");
    setIsPinned(false);
    setIsFormOpen(false);
    fetchAnnouncements();
  };

  const canPost = profile?.role === "principal" || profile?.role === "tu";

  return (
    <Card className="p-6 bg-white border border-[var(--border)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent)]"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--accent-light)] rounded-xl text-[var(--accent)]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Mading Sekolah</h2>
            <p className="text-xs text-[var(--text-secondary)]">Pengumuman & Informasi Terbaru</p>
          </div>
        </div>

        {canPost && (
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-sm font-bold rounded-lg transition-all"
          >
            {isFormOpen ? "Batal" : "Buat Pengumuman"}
          </button>
        )}
      </div>

      {isFormOpen && canPost && (
        <div className="mb-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl space-y-3">
          <input 
            type="text" 
            placeholder="Judul Pengumuman" 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-[var(--border)] outline-none text-sm"
          />
          <textarea 
            rows={3} 
            placeholder="Isi pengumuman..." 
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            className="w-full p-3 rounded-lg border border-[var(--border)] outline-none text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="rounded" />
              Sematkan (Pin)
            </label>
            <button onClick={handlePost} className="px-5 py-2 bg-[var(--accent)] text-white text-sm font-bold rounded-lg hover:bg-[var(--accent-hover)] transition-all">
              Posting
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--text-tertiary)]" /></div>
      ) : announcements.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-tertiary)]">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p className="font-medium">Belum ada pengumuman sekolah.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.id} className={`p-4 rounded-xl border transition-all ${ann.is_pinned ? "bg-amber-50/50 border-amber-200" : "bg-white border-[var(--border)] hover:border-[var(--accent)]/30"}`}>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-lg">
                  {ann.is_pinned && <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  {ann.title}
                </h3>
                <div className="text-[10px] flex items-center gap-1 text-[var(--text-tertiary)] whitespace-nowrap bg-white px-2 py-1 rounded-md border border-[var(--border)]">
                  <Clock className="h-3 w-3" />
                  {new Date(ann.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </p>
              <div className="mt-3 pt-3 border-t border-[var(--border)]/50 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[8px] font-bold text-[var(--text-secondary)] uppercase">
                  {ann.author?.full_name?.charAt(0) || "A"}
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{ann.author?.full_name || "Admin Sekolah"}</span>
                <span className="text-[10px] px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent)] rounded uppercase font-bold tracking-wider">{ann.author?.role}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
