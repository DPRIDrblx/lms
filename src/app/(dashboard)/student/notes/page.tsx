"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Folder, Search, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { SmartEditor } from "@/components/ui/smart-editor";

export default function SmartNotesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadNotes();
  }, [profile?.id]);

  const loadNotes = async () => {
    const { data } = await supabase.from('student_notes').select('*').eq('student_id', profile?.id).order('updated_at', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  };

  const createNote = async () => {
    if (!profile?.id) return;
    const newNote = {
      student_id: profile.id,
      title: 'Catatan Baru',
      content: '<h2>Mulai menulis...</h2>',
      folder: 'General'
    };
    const { data, error } = await supabase.from('student_notes').insert(newNote).select().single();
    if (error) {
      toast.error('Gagal membuat catatan');
    } else {
      setNotes([data, ...notes]);
      setSelectedNote(data);
    }
  };

  const saveNoteContent = (content: string) => {
    if (!selectedNote) return;
    setSaving(true);
    // Optimistic UI
    setSelectedNote((prev: any) => ({ ...prev, content }));
    setNotes((prev: any[]) => prev.map(n => n.id === selectedNote.id ? { ...n, content } : n));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from('student_notes').update({ content }).eq('id', selectedNote.id);
      setSaving(false);
    }, 1000);
  };

  const saveNoteTitle = async (title: string) => {
    if (!selectedNote) return;
    setSelectedNote({ ...selectedNote, title });
    setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, title } : n));
    await supabase.from('student_notes').update({ title }).eq('id', selectedNote.id);
  };

  const deleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Hapus catatan ini?')) return;
    setNotes(notes.filter(n => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);
    await supabase.from('student_notes').delete().eq('id', id);
    toast.success('Dihapus');
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.folder.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Smart Notes</h1>
          <p className="text-slate-500 font-medium mt-1">Buku catatan pintar layaknya Notion, khusus untukmu.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* Sidebar Notes List */}
        <div className="w-full md:w-80 flex flex-col bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm shrink-0">
          <div className="p-4 border-b-2 border-slate-100 flex flex-col gap-3">
            <button
              onClick={createNote}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" /> Catatan Baru
            </button>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {filteredNotes.length === 0 ? (
                <div className="text-center text-slate-400 font-medium py-10">Belum ada catatan.</div>
              ) : (
                filteredNotes.map(note => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => setSelectedNote(note)}
                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex flex-col gap-2 ${selectedNote?.id === note.id ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{note.title}</h3>
                      <button onClick={(e) => deleteNote(e, note.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-lg">
                      <Folder className="w-3 h-3" /> {note.folder}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          {selectedNote ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => saveNoteTitle(e.target.value)}
                  className="text-2xl font-black text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-full"
                  placeholder="Judul Catatan..."
                />
                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold shrink-0">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Tersimpan</>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <SmartEditor
                  content={selectedNote.content || ""}
                  onChange={saveNoteContent}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Pilih Catatan</h2>
              <p className="font-medium max-w-sm">Pilih catatan dari daftar di samping atau buat catatan baru untuk mulai mengetik.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
