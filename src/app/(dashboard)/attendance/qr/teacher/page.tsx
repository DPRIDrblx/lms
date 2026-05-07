"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { generateQRPayload, getInitials, formatTime } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Plus, Users, Clock, StopCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface Session {
  id: string;
  subject: string;
  class_name: string;
  qr_code_payload: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

interface LogEntry {
  id: string;
  student_id: string;
  check_in_time: string;
  mood_score: number;
  readiness_score: number;
  notes: string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
}

export default function QRTeacherPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [allStudents, setAllStudents] = useState<{ id: string; full_name: string; avatar_url: string | null }[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const fetchSessions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      setSessions(data as Session[]);
      const active = data.find((s: Session) => s.is_active);
      if (active) setActiveSession(active as Session);
    }
  }, [profile, supabase]);

  const fetchTeacherCourses = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("courses")
      .select("*, classes(name)")
      .eq("teacher_id", profile.id);
    setCourses(data || []);
  }, [profile, supabase]);

  const fetchLogs = useCallback(async (sessionId: string) => {
    const { data } = await supabase
      .from("attendance_logs")
      .select("*, profiles(full_name, avatar_url)")
      .eq("session_id", sessionId)
      .order("check_in_time", { ascending: true });
    if (data) setLogs(data as unknown as LogEntry[]);
  }, [supabase]);

  useEffect(() => {
    fetchSessions();
    fetchTeacherCourses();
    supabase.from("profiles").select("id, full_name, avatar_url").eq("role", "student").then(({ data }) => {
      if (data) setAllStudents(data as any);
    });
  }, [fetchSessions, fetchTeacherCourses, supabase]);

  useEffect(() => {
    if (!activeSession) return;
    fetchLogs(activeSession.id);

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`attendance-${activeSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance_logs",
          filter: `session_id=eq.${activeSession.id}`,
        },
        async () => {
          await fetchLogs(activeSession.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSession, supabase, fetchLogs]);

  const createSession = async () => {
    if (!profile || !selectedCourse) return;
    setCreating(true);
    
    const sessionId = crypto.randomUUID();
    const payload = JSON.stringify({
      s: sessionId,
      c: selectedCourse.id,
      t: Date.now()
    });
    
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from("attendance_sessions")
      .insert({
        id: sessionId,
        teacher_id: profile.id,
        course_id: selectedCourse.id,
        subject: selectedCourse.title,
        class_name: selectedCourse.classes?.name || "Unknown",
        qr_code_payload: payload,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (data) {
      setActiveSession(data as Session);
      setSessions((prev) => [data as Session, ...prev]);
    }
    setCreating(false);
    setShowCreate(false);
    setSelectedCourse(null);
  };

  const endSession = async () => {
    if (!activeSession) return;
    await supabase
      .from("attendance_sessions")
      .update({ is_active: false })
      .eq("id", activeSession.id);
    setActiveSession(null);
    fetchSessions();
  };

  const checkedInIds = new Set(logs.map((l) => l.student_id));

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">QR Attendance Sessions</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Generate QR codes and track live check-ins.</p>
          </div>
          {!activeSession && (
            <Button onClick={() => setShowCreate(true)} icon={<Plus className="h-4 w-4" />}>
              New Session
            </Button>
          )}
        </div>
      </motion.div>

      {/* Active session */}
      {activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code */}
          <Card className="text-center lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="success">● Live</Badge>
              <Button size="sm" variant="danger" onClick={endSession} icon={<StopCircle className="h-3.5 w-3.5" />}>
                End
              </Button>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{activeSession.subject}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{activeSession.class_name}</p>
            <div className="inline-block p-4 bg-white rounded-2xl shadow-[var(--shadow-md)]">
              <QRCodeSVG value={activeSession.qr_code_payload} size={200} level="H" />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-3 font-mono">{activeSession.qr_code_payload}</p>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {logs.length}/{allStudents.length}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {formatTime(activeSession.created_at)}
              </span>
            </div>
          </Card>

          {/* Student list */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Students ({logs.length}/{allStudents.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence>
                {allStudents.map((student) => {
                  const checkedIn = checkedInIds.has(student.id);
                  const log = logs.find((l) => l.student_id === student.id);
                  return (
                    <motion.div
                      key={student.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-xl border transition-all duration-500 ${
                        checkedIn
                          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                          : "bg-[var(--bg-primary)] border-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {student.avatar_url ? (
                          <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            checkedIn ? "bg-emerald-200 text-emerald-700" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                          }`}>
                            {getInitials(student.full_name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            checkedIn ? "text-emerald-700 dark:text-emerald-300" : "text-[var(--text-primary)]"
                          }`}>
                            {student.full_name}
                          </p>
                          {checkedIn && log ? (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              ✓ {formatTime(log.check_in_time)}
                            </p>
                          ) : (
                            <p className="text-xs text-[var(--text-tertiary)]">Waiting...</p>
                          )}
                        </div>
                        {checkedIn && <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {allStudents.length === 0 && (
                <p className="col-span-full text-center py-8 text-[var(--text-tertiary)]">No students registered.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Past sessions */}
      {!activeSession && sessions.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{s.subject}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{s.class_name} · {formatTime(s.created_at)}</p>
                  </div>
                </div>
                <Badge variant={s.is_active ? "success" : "default"}>
                  {s.is_active ? "Active" : "Ended"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!activeSession && sessions.length === 0 && (
        <Card className="text-center py-12">
          <QrCode className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">No sessions yet. Create one to get started.</p>
        </Card>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Attendance Session">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Select Course</label>
            <select
              required
              value={selectedCourse?.id || ""}
              onChange={(e) => {
                const course = courses.find(c => c.id === e.target.value);
                setSelectedCourse(course);
              }}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            >
              <option value="">Choose your course...</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title} (Class {c.classes?.name})</option>
              ))}
            </select>
          </div>
          {selectedCourse && (
            <div className="p-4 rounded-xl bg-[var(--accent-light)] border border-[var(--accent)]/10 space-y-2">
              <p className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Session Preview</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text-primary)]">{selectedCourse.title}</span>
                <Badge variant="info">Class {selectedCourse.classes?.name}</Badge>
              </div>
            </div>
          )}
          <Button className="w-full h-12 shadow-lg" onClick={createSession} loading={creating} disabled={!selectedCourse}>
            Generate QR Code
          </Button>
        </div>
      </Modal>
    </div>
  );
}
