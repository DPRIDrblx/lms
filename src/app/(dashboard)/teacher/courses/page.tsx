"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, BookOpen, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  category: string;
  is_published: boolean;
  created_at: string;
}

export default function TeacherCoursesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });
      if (data) setCourses(data as Course[]);
      setLoading(false);
    };
    fetchCourses();
  }, [profile, supabase]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Content Suite</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your course modules and learning materials.</p>
        </div>
        <Link href="/teacher/courses/create">
          <Button icon={<Plus className="h-4 w-4" />}>Create Course</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card padding="none" className="group overflow-hidden flex flex-col h-full">
                <div className="relative aspect-video bg-[var(--bg-tertiary)] overflow-hidden">
                  {course.cover_image ? (
                    <img src={course.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                      <BookOpen className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant={course.is_published ? "success" : "default"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">{course.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--text-tertiary)]">
                      Created {new Date(course.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/teacher/courses/${course.id}/edit`}>
                        <Button variant="secondary" size="sm" icon={<Edit className="h-3.5 w-3.5" />}>Edit</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <BookOpen className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">No courses yet</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto mb-6">
            Start by creating your first course module to share with your students.
          </p>
          <Link href="/teacher/courses/create">
            <Button variant="secondary">Get Started</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
