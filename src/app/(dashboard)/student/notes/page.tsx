"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Folder, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SmartNotesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    const toastId = toast.loading('Membuat catatan baru...');
    const newNote = {
      student_id: profile.id,
      title: 'Catatan Baru',
      content: '<h2>Mulai menulis...</h2>',
      folder: 'General'
    };
    const { data, error } = await supabase.from('student_notes').insert(newNote).select().single();
    if (error) {
      toast.error('Gagal membuat catatan', { id: toastId });
    } else {
      toast.success('Berhasil!', { id: toastId });
      router.push(`/student/notes/${data.id}`);
    }
  };

  const deleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Hapus catatan ini?')) return;
    setNotes(notes.filter(n => n.id !== id));
    await supabase.from('student_notes').delete().eq('id', id);
    toast.success('Dihapus');
  };

  const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.folder.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Smart Notes</h1>
          <p className="text-slate-500 font-medium mt-1">Buku catatan pintar layaknya Notion, khusus untukmu.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <button
          onClick={createNote}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-5 h-5" /> Catatan Baru
        </button>
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-medium focus:border-emerald-500 focus:ring-0 transition-all outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <div className="col-span-full text-center text-slate-400 font-medium py-20 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
              Belum ada catatan. Klik "Catatan Baru" untuk mulai menulis!
            </div>
          ) : (
            filteredNotes.map(note => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => router.push(`/student/notes/${note.id}`)}
                className="bg-white p-5 rounded-3xl border-2 border-slate-200 hover:border-emerald-500 hover:shadow-lg cursor-pointer transition-all flex flex-col group h-48"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-lg text-slate-800 line-clamp-2">{note.title}</h3>
                  <button onClick={(e) => deleteNote(e, note.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 p-1 bg-slate-50 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div 
                  className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1 prose prose-sm prose-slate"
                  dangerouslySetInnerHTML={{ __html: note.content ? note.content.substring(0, 150) + '...' : '' }}
                />

                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-3 py-1.5 rounded-xl mt-auto">
                  <Folder className="w-3.5 h-3.5" /> {note.folder}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
