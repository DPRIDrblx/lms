"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Pin, Megaphone, Clock, AlertCircle, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author: { full_name: string; role: string };
}

// ----------------------------------------------------------------------
// STORY VIEWER COMPONENT
// ----------------------------------------------------------------------
function StoryViewer({ 
  announcements, 
  initialIndex, 
  onClose 
}: { 
  announcements: Announcement[], 
  initialIndex: number, 
  onClose: () => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);
    
    const startTime = Date.now();
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress < 100) {
        requestAnimationFrame(animateProgress);
      } else {
        handleNext();
      }
    };
    
    const animationFrameId = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // Close if it's the last story
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setProgress(0); // Restart current story if it's the first
    }
  };

  const currentAnn = announcements[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 md:p-8">
      {/* Container */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
        className="w-full max-w-md h-full max-h-[800px] bg-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-4">
          {announcements.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Info */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white border-2 border-white shadow-sm">
              {currentAnn.author?.full_name?.charAt(0) || "A"}
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">{currentAnn.author?.full_name || "Admin Sekolah"}</p>
              <div className="flex items-center gap-2 text-xs opacity-80">
                <span>{currentAnn.author?.role.replace("_", " ")}</span>
                <span className="w-1 h-1 bg-white rounded-full" />
                <span>{new Date(currentAnn.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Story Content */}
        <div className="flex-1 relative bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 flex flex-col items-center justify-center p-8 text-white text-center">
          {currentAnn.is_pinned && (
            <div className="absolute top-24 bg-white/20 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
              <Pin className="w-3 h-3 fill-white" /> Penting
            </div>
          )}
          <h2 className="text-3xl font-black mb-6 leading-tight drop-shadow-md">{currentAnn.title}</h2>
          <p className="text-lg font-medium opacity-90 leading-relaxed max-w-sm drop-shadow-sm whitespace-pre-wrap">
            {currentAnn.content}
          </p>
        </div>

        {/* Tap Areas for navigation (Invisible) */}
        <div className="absolute inset-0 z-10 flex">
          <div className="flex-1" onClick={handlePrev} />
          <div className="flex-1" onClick={handleNext} />
        </div>
        
        {/* Desktop Navigation Hints */}
        <div className="absolute inset-y-0 left-4 z-20 hidden md:flex items-center pointer-events-none opacity-50">
          <ChevronLeft className="w-10 h-10 text-white drop-shadow-md" />
        </div>
        <div className="absolute inset-y-0 right-4 z-20 hidden md:flex items-center pointer-events-none opacity-50">
          <ChevronRight className="w-10 h-10 text-white drop-shadow-md" />
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN BOARD COMPONENT
// ----------------------------------------------------------------------
export function AnnouncementBoard() {
  const supabase = createClient();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
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
    <>
      <Card className="p-6 bg-white border-2 border-slate-200 border-b-4 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-500 border-b-4 border-indigo-200">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Mading Sekolah</h2>
              <p className="text-xs font-bold text-slate-500">Ketuk cerita untuk melihat pengumuman</p>
            </div>
          </div>

          {canPost && (
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl border-b-2 border-slate-300 transition-all active:translate-y-0.5 active:border-b-0"
            >
              {isFormOpen ? "Batal" : "Buat Baru"}
            </button>
          )}
        </div>

        {isFormOpen && canPost && (
          <div className="mb-6 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
            <input 
              type="text" 
              placeholder="Judul Pengumuman" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 border-b-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:border-b-4 transition-all"
            />
            <textarea 
              rows={3} 
              placeholder="Isi pengumuman..." 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-200 border-b-4 text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:border-b-4 transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                Sematkan (Pin)
              </label>
              <button 
                onClick={handlePost} 
                className="px-6 py-3 bg-indigo-500 text-white text-sm font-black rounded-xl hover:bg-indigo-400 active:translate-y-1 border-b-4 border-indigo-700 active:border-b-0 transition-all"
              >
                Posting Story
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-300 w-8 h-8" /></div>
        ) : announcements.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">Belum ada story pengumuman.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2 px-2 snap-x scrollbar-hide">
            {announcements.map((ann, i) => (
              <div 
                key={ann.id} 
                onClick={() => setActiveStoryIndex(i)}
                className="flex flex-col items-center gap-2 cursor-pointer shrink-0 snap-start group"
              >
                {/* Story Ring */}
                <div className={`w-[72px] h-[72px] rounded-full p-1 transition-transform group-hover:scale-105 group-active:scale-95 ${ann.is_pinned ? 'bg-gradient-to-tr from-amber-400 via-orange-500 to-red-500' : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'}`}>
                  <div className="w-full h-full bg-white rounded-full border-2 border-white flex items-center justify-center shadow-inner relative overflow-hidden">
                    <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-tr from-slate-700 to-slate-900">
                      {ann.author?.full_name?.charAt(0) || "A"}
                    </span>
                    {ann.is_pinned && (
                      <div className="absolute -bottom-1 bg-amber-500 w-full text-center py-0.5">
                        <Pin className="w-3 h-3 mx-auto text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 w-20 truncate text-center group-hover:text-slate-900 transition-colors">
                  {ann.author?.full_name?.split(' ')[0] || "Admin"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* RENDER STORY VIEWER MODAL */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer 
            announcements={announcements} 
            initialIndex={activeStoryIndex} 
            onClose={() => setActiveStoryIndex(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
