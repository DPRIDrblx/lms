"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, User, Clock } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AssignmentGradingPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id: courseId, lessonId } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();

  const [lesson, setLesson] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [lessonRes, subsRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("assignment_submissions").select(`
          *,
          profiles (full_name, avatar_url)
        `).eq("lesson_id", lessonId).order("submitted_at", { ascending: true })
      ]);

      if (lessonRes.data) setLesson(lessonRes.data);
      if (subsRes.data) setSubmissions(subsRes.data);
      setLoading(false);
    };

    fetchData();
  }, [lessonId, supabase]);

  const handleGrade = async () => {
    if (!selectedSubmission) return;
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) return toast.error("Nilai harus berupa angka 0-100");

    setSaving(true);
    const toastId = toast.loading("Menyimpan nilai...");

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        score: numScore,
        feedback,
        graded_at: new Date().toISOString()
      })
      .eq("id", selectedSubmission.id);

    // Sync to student_scores for Gradebook auto-sync
    if (!error) {
      await supabase.from("student_scores").upsert({
        student_id: selectedSubmission.student_id,
        target_id: lessonId,
        score: numScore,
        target_type: "assignment"
      }, { onConflict: 'student_id,target_id' });
    }

    if (error) {
      toast.error(`Gagal: ${error.message}`, { id: toastId });
    } else {
      toast.success("Nilai berhasil disimpan!", { id: toastId });
      setSubmissions(subs => subs.map(s => s.id === selectedSubmission.id ? { ...s, score: numScore, feedback, graded_at: new Date().toISOString() } : s));
      setSelectedSubmission(null);
      setScore("");
      setFeedback("");
    }
    setSaving(false);
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  if (!lesson) return <div className="py-20 text-center text-[var(--text-tertiary)] font-bold">Tugas tidak ditemukan.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={`/teacher/courses/${courseId}/edit`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Edit Kursus
          </Link>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Penilaian: {lesson.title}</h1>
          <p className="text-[var(--text-secondary)] mt-1">Berikan nilai dan ulasan untuk tugas yang telah dikumpulkan.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kiri: Daftar Pengumpulan */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--bg-secondary)] px-4 py-2 rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--text-tertiary)]">Total Mengumpulkan</span>
            <span className="text-lg font-black text-[var(--text-primary)]">{submissions.length}</span>
          </div>

          <div className="space-y-3">
            {submissions.map(sub => (
              <Card 
                key={sub.id} 
                className={`p-4 cursor-pointer transition-all border-2 ${selectedSubmission?.id === sub.id ? "border-[var(--accent)] bg-[var(--accent-light)]" : "border-transparent hover:border-[var(--border)]"}`}
                onClick={() => {
                  setSelectedSubmission(sub);
                  setScore(sub.score?.toString() || "");
                  setFeedback(sub.feedback || "");
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-bold">
                      <User className="h-4 w-4 text-[var(--text-tertiary)]" />
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{sub.profiles?.full_name}</span>
                  </div>
                  {sub.score !== null ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="text-[10px] font-bold text-[var(--text-tertiary)] flex justify-between">
                  <span>{new Date(sub.submitted_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {sub.score !== null && <span className="text-green-600">Nilai: {sub.score}</span>}
                </div>
              </Card>
            ))}

            {submissions.length === 0 && (
              <div className="text-center py-10 text-[var(--text-tertiary)] text-sm italic">
                Belum ada siswa yang mengumpulkan tugas ini.
              </div>
            )}
          </div>
        </div>

        {/* Kanan: Detail & Grading */}
        <div className="lg:col-span-2">
          {selectedSubmission ? (
            <Card className="p-6 md:p-8 space-y-6 bg-white shadow-xl shadow-black/5 border-[var(--border)]">
              <div className="border-b border-[var(--border)] pb-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Tugas milik {selectedSubmission.profiles?.full_name}</h2>
                <p className="text-sm text-[var(--text-secondary)]">Dikumpulkan pada {new Date(selectedSubmission.submitted_at).toLocaleString('id-ID')}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Jawaban / Link:</h3>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl whitespace-pre-wrap text-sm text-[var(--text-primary)] font-medium border border-[var(--border)]">
                  {selectedSubmission.text_content || <span className="italic text-[var(--text-tertiary)]">Tidak ada teks</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border)]">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Nilai (0 - 100)</label>
                  <input 
                    type="number"
                    min="0" max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none font-bold text-lg"
                    placeholder="Contoh: 85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Ulasan / Feedback</label>
                  <textarea 
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none font-medium resize-none"
                    placeholder="Kerja bagus! Perhatikan bagian..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleGrade} disabled={saving} className="px-8 shadow-lg shadow-[var(--accent)]/20">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Simpan Nilai
                </Button>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border)] rounded-3xl">
              <CheckCircle2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold text-lg">Pilih tugas di samping</p>
              <p className="text-sm">Klik salah satu nama siswa untuk mulai memeriksa tugasnya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
