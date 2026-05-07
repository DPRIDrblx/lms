"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Video, 
  File, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Award,
  CheckCircle2,
  Clock,
  PlayCircle
} from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonDetailPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [lessonRes, courseRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("courses").select("*").eq("id", id).single()
      ]);
      
      if (lessonRes.data) setLesson(lessonRes.data);
      if (courseRes.data) setCourse(courseRes.data);
      setLoading(false);
    };
    fetchData();
  }, [id, lessonId, supabase]);

  const handleMarkComplete = async () => {
    if (!profile || completed) return;
    setCompleted(true);
    // Logic to award XP and mark progress
    const { error } = await supabase.from("student_scores").insert({
      student_id: profile.id,
      target_id: lessonId,
      target_type: "lesson",
      score: lesson.xp_reward || 10,
      is_graded: true,
      graded_at: new Date().toISOString()
    });
    
    if (!error) {
      // Update student XP in profile
      await supabase.rpc('increment_xp', { amount: lesson.xp_reward || 10 });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse">Loading content...</div>;
  if (!lesson) return <div className="text-center py-20">Material not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24">
      {/* Navigation */}
      <div className="flex items-center justify-between">
         <Link href={`/courses/${id}`}>
            <Button variant="ghost" className="rounded-xl" icon={<ChevronLeft className="h-4 w-4" />}>
               Back to Curriculum
            </Button>
         </Link>
         <Badge variant="info" className="px-4 py-1.5 font-bold">{course?.title}</Badge>
      </div>

      <header className="space-y-4">
        <div className="flex items-center gap-2">
           <Badge variant="info" className="bg-[var(--accent-light)] text-[var(--accent)] border-none">Lesson {lesson.order_index}</Badge>
           <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1"><Clock className="h-3 w-3" /> Estimated 15 mins</span>
        </div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{lesson.title}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
           {/* Primary Content Container */}
           <Card className="p-0 overflow-hidden border-none shadow-2xl bg-[var(--bg-secondary)]">
              {/* Media Section */}
              {lesson.video_url && (
                 <div className="aspect-video bg-black relative">
                    <iframe 
                      src={lesson.video_url.replace("watch?v=", "embed/")} 
                      className="w-full h-full border-none"
                      allowFullScreen
                    />
                 </div>
              )}
              {lesson.pdf_url && (
                 <div className="p-4 bg-[var(--bg-tertiary)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <File className="h-6 w-6 text-[var(--accent)]" />
                       <span className="text-sm font-bold text-[var(--text-primary)]">Course Material.pdf</span>
                    </div>
                    <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">
                       <Button size="sm" icon={<Download className="h-4 w-4" />}>Download PDF</Button>
                    </a>
                 </div>
              )}

              {/* Textual Content */}
              <div className="p-8 sm:p-12 prose prose-invert max-w-none">
                 <div 
                   className="text-[var(--text-primary)] leading-relaxed space-y-4"
                   dangerouslySetInnerHTML={{ __html: lesson.body_rich_text || lesson.body_text }}
                 />
              </div>
           </Card>

           {/* Feedback/Navigation Footer */}
           <div className="flex items-center justify-between pt-8">
              <Button variant="secondary" className="rounded-2xl h-12 px-6">Previous Lesson</Button>
              <Button 
                onClick={handleMarkComplete} 
                disabled={completed}
                className={`rounded-2xl h-12 px-8 font-black ${completed ? "bg-green-500 hover:bg-green-600 border-none" : ""}`}
                icon={completed ? <CheckCircle2 className="h-5 w-5" /> : <Award className="h-5 w-5" />}
              >
                 {completed ? "Lesson Completed" : `Finish & Earn ${lesson.xp_reward} XP`}
              </Button>
           </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="p-6 bg-[var(--bg-secondary)] border-none">
              <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                 <FileText className="h-4 w-4 text-[var(--accent)]" /> Attachments
              </h4>
              <div className="space-y-2">
                 {lesson.external_links?.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] transition-all group">
                       <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent)]">{link.label}</span>
                       <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)]" />
                    </a>
                 ))}
                 {!lesson.external_links?.length && <p className="text-[10px] text-[var(--text-tertiary)] italic">No additional links provided.</p>}
              </div>
           </Card>

           <Card className="p-6 bg-[var(--accent)] text-white border-none shadow-xl shadow-[var(--accent)]/30">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                 <PlayCircle className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold">Interactive Learning</h4>
              <p className="text-xs opacity-80 mt-2 leading-relaxed">
                 Complete all lessons in this module to unlock the end-of-course Quiz and earn a Certification badge.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
