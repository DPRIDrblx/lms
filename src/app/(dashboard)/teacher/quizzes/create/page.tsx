"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CreateQuizPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    course_id: "",
    time_limit_minutes: 30,
    passing_score: 60,
    is_randomized: false,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from("courses").select("id, title");
      if (data) setCourses(data);
    };
    fetchCourses();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !formData.course_id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        course_id: formData.course_id,
        title: formData.title,
        time_limit_minutes: formData.time_limit_minutes,
        passing_score: formData.passing_score,
        is_randomized: formData.is_randomized,
      })
      .select()
      .single();

    if (data) {
      router.push(`/teacher/quizzes/${data.id}/builder`);
    } else {
      setLoading(false);
      alert(error?.message || "Failed to create quiz");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/teacher/quizzes" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Quizzes
      </Link>

      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Setup New Quiz</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Quiz Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Mid-term Physics Assessment"
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Link to Course</label>
              <select
                required
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
              >
                <option value="">Select a course...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Time Limit (mins)</label>
                <input
                  type="number"
                  value={formData.time_limit_minutes}
                  onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Passing Score (%)</label>
                <input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <input
                type="checkbox"
                id="random"
                checked={formData.is_randomized}
                onChange={(e) => setFormData({ ...formData, is_randomized: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <label htmlFor="random" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
                Randomize question order for students
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full h-12" loading={loading} icon={<Save className="h-4 w-4" />}>
            Create & Add Questions
          </Button>
        </form>
      </Card>
    </div>
  );
}
