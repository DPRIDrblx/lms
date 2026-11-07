"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Edit2, FileText, Clock, HelpCircle, BookOpen, Eye, MonitorCheck, Camera, Key, Zap } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { parseCbtConfig } from "@/lib/cbt-config";

interface Quiz {
  id: string;
  title: string;
  time_limit_minutes: number;
  passing_score: number;
  is_randomized: boolean;
  created_at: string;
  courses: { title: string } | null;
  is_cbt_v2?: boolean;
  description?: string;
  cbt_config?: any;
}

export default function TeacherQuizzesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "cbt_v2">("all");

  useEffect(() => {
    if (!profile) return;
    const fetchQuizzes = async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*, courses(title)")
        .order("created_at", { ascending: false });
      if (data) setQuizzes(data as unknown as Quiz[]);
      setLoading(false);
    };
    fetchQuizzes();
  }, [profile, supabase]);

  const filteredQuizzes = useMemo(() => {
    if (filterType === "cbt_v2") {
      return quizzes.filter((q) => {
        const config = parseCbtConfig(q);
        return config.is_cbt_v2;
      });
    }
    return quizzes;
  }, [quizzes, filterType]);

  const cbtCount = useMemo(() => {
    return quizzes.filter((q) => parseCbtConfig(q).is_cbt_v2).length;
  }, [quizzes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">CBT & Assessment Builder</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Buat dan kelola paket ujian CBT MMIS v2, kuis interaktif, dan evaluasi pembelajaran.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/teacher/quizzes/create?cbt_v2=true">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold" icon={<MonitorCheck className="h-4 w-4" />}>
              Buat CBT MMIS v2
            </Button>
          </Link>
          <Link href="/teacher/quizzes/create">
            <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
              Quiz Biasa
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-fit">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Semua Assessment ({quizzes.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("cbt_v2")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterType === "cbt_v2" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MonitorCheck className="w-3.5 h-3.5" />
          <span>CBT MMIS v2 ({cbtCount})</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--bg-tertiary)] animate-pulse" />
          ))}
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div className="grid gap-4">
          {filteredQuizzes.map((quiz) => {
            const config = parseCbtConfig(quiz);
            const isCbtV2 = config.is_cbt_v2;

            return (
              <motion.div key={quiz.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                <Card className={`hover:shadow-[var(--shadow-md)] transition-shadow ${isCbtV2 ? "border-l-4 border-l-blue-600" : ""}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isCbtV2 ? "bg-blue-100 text-blue-700" : "bg-[var(--accent-light)] text-[var(--accent)]"
                      }`}>
                        {isCbtV2 ? <MonitorCheck className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[var(--text-primary)]">{quiz.title}</h3>
                          {isCbtV2 && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                              CBT MMIS v2
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {quiz.courses?.title || "No Course"}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {quiz.time_limit_minutes}m
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" /> {quiz.passing_score}% Pass
                          </span>

                          {isCbtV2 && (
                            <>
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <Zap className="h-3 w-3" /> +{config.points_correct} / -{config.penalty_wrong}
                              </span>
                              {config.require_webcam && (
                                <span className="text-xs text-purple-700 font-bold flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md">
                                  <Camera className="h-3 w-3" /> Webcam
                                </span>
                              )}
                              {config.token_enabled && (
                                <span className="text-xs text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                                  <Key className="h-3 w-3" /> Token: {config.token_code}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link href={`/teacher/quizzes/${quiz.id}/live`}>
                        <Button variant="ghost" size="sm" icon={<Award className="h-3.5 w-3.5 text-indigo-500" />}>
                          <span className="text-indigo-600 font-bold">Live</span>
                        </Button>
                      </Link>
                      <Link href={`/teacher/quizzes/${quiz.id}/proctor`}>
                        <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>Monitor</Button>
                      </Link>
                      <Link href={`/teacher/quizzes/${quiz.id}/review`}>
                        <Button variant="ghost" size="sm" icon={<FileText className="h-3.5 w-3.5" />}>Review</Button>
                      </Link>
                      <Link href={`/teacher/quizzes/${quiz.id}/builder`}>
                        <Button variant="secondary" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />}>Builder</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Award className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Belum ada assessment</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
            Mulai buat paket ujian CBT MMIS v2 atau kuis evaluasi untuk siswa Anda.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/teacher/quizzes/create?cbt_v2=true">
              <Button>Buat CBT MMIS v2</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
