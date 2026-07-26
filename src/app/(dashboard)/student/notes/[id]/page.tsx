"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useRef, use } from "react";
import { ArrowLeft, Loader2, Save, Folder } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { SmartEditor } from "@/components/ui/smart-editor";

export default function SmartNoteEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadNote();
  }, [profile?.id, id]);

  const loadNote = async () => {
    const { data } = await supabase.from('student_notes').select('*').eq('id', id).single();
    if (data) {
      if (data.student_id !== profile?.id) {
        toast.error("Akses ditolak");
        router.push("/student/notes");
        return;
      }
      setNote(data);
    } else {
      toast.error("Catatan tidak ditemukan");
      router.push("/student/notes");
    }
    setLoading(false);
  };

  const saveNoteContent = (content: string) => {
    if (!note) return;
    setSaving(true);
    setNote((prev: any) => ({ ...prev, content }));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('student_notes').update({ content }).eq('id', note.id);
      setSaving(false);
    }, 1000);
  };

  const saveNoteTitle = async (title: string) => {
    if (!note) return;
    setNote((prev: any) => ({ ...prev, title }));
    await supabase.from('student_notes').update({ title }).eq('id', note.id);
  };

  const saveNoteFolder = async (folder: string) => {
    if (!note) return;
    setNote((prev: any) => ({ ...prev, folder }));
    await supabase.from('student_notes').update({ folder }).eq('id', note.id);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><CenterLoader size="md" /></div>;
  }

  if (!note) return null;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b-2 border-slate-100 bg-slate-50/50 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => router.push("/student/notes")}
            className="p-2 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 w-full">
            <input
              type="text"
              value={note.title}
              onChange={(e) => saveNoteTitle(e.target.value)}
              className="text-2xl sm:text-3xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-full p-0"
              placeholder="Judul Catatan..."
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full px-2 sm:px-0">
          <div className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Folder className="w-4 h-4 text-emerald-500" />
            <input 
              type="text"
              value={note.folder}
              onChange={(e) => saveNoteFolder(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 w-24 text-sm font-bold text-slate-600 p-0"
              placeholder="Folder"
            />
          </div>
          
          <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold shrink-0">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> <span className="hidden sm:inline">Menyimpan...</span></>
            ) : (
              <><Save className="w-4 h-4 text-emerald-500" /> <span className="hidden sm:inline">Tersimpan</span></>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white custom-scrollbar">
        <SmartEditor
          content={note.content || ""}
          onChange={saveNoteContent}
        />
      </div>
    </div>
  );
}
