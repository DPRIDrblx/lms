"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, CheckCircle2, AlertTriangle, Camera, Send } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Phase = "idle" | "scanning" | "form" | "submitting" | "success" | "error";

const EMOJIS = ["😫", "😕", "😐", "🙂", "🤩"];

export default function QRStudentPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [scannedPayload, setScannedPayload] = useState("");
  const [sessionInfo, setSessionInfo] = useState<{ id: string; subject: string; class_name: string } | null>(null);
  const [readiness, setReadiness] = useState(4);
  const [mood, setMood] = useState(4);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formType, setFormType] = useState<"checkin" | "feedback">("checkin");
  const [rating, setRating] = useState(5);
  const [reflection, setReflection] = useState("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanning = async () => {
    setPhase("scanning");
    setErrorMsg("");
  };

  useEffect(() => {
    if (phase !== "scanning") return;

    let isMounted = true;
    const initScanner = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted) return;
      if (!document.getElementById("qr-reader")) {
        setPhase("error");
        setErrorMsg("Scanner container not found.");
        return;
      }

      try {
        await stopScanner();
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            if (!isMounted) return;
            setScannedPayload(decodedText);

            let sessionId = "";
            let courseId = "";

            try {
              const parsed = JSON.parse(decodedText);
              sessionId = parsed.s;
              courseId = parsed.c;
            } catch (e) {
              // Fallback for old simple payloads if any
              sessionId = decodedText;
            }

            const { data: session } = await supabase
              .from("attendance_sessions")
              .select("*")
              .eq("id", sessionId)
              .single();

            if (!session) {
              setErrorMsg("Invalid or Expired Session.");
              setPhase("error");
              return;
            }

            // Determine if Pre or Post lesson
            const createdAt = new Date(session.created_at).getTime();
            const now = new Date().getTime();
            const durationMs = now - createdAt;
            
            // If more than 30 minutes have passed, show feedback form
            if (durationMs > 30 * 60 * 1000) {
              setFormType("feedback");
            } else {
              setFormType("checkin");
            }

            setSessionInfo({ 
              id: session.id, 
              subject: session.subject, 
              class_name: session.class_name,
              course_id: session.course_id 
            } as any);
            
            await stopScanner();
            setPhase("form");
          },
          () => {}
        );
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg("Could not access camera.");
        setPhase("error");
      }
    };

    initScanner();
    return () => { isMounted = false; stopScanner(); };
  }, [phase, stopScanner, supabase]);

  const handleSubmit = async () => {
    if (!profile || !sessionInfo) return;
    setPhase("submitting");

    try {
      if (formType === "checkin") {
        const { error } = await supabase.from("attendance_logs").upsert({
          session_id: sessionInfo.id,
          student_id: profile.id,
          mood_score: mood,
          readiness_score: readiness,
          notes: notes || null,
          method: "qr",
        }, { onConflict: "session_id,student_id" });

        if (error) throw error;
      } else {
        // Post-lesson Feedback
        // 1. Ensure log exists
        let { data: log } = await supabase
          .from("attendance_logs")
          .select("id")
          .eq("session_id", sessionInfo.id)
          .eq("student_id", profile.id)
          .single();

        if (!log) {
          // Create log if it doesn't exist (e.g. missed check-in)
          const { data: newLog, error: logErr } = await supabase.from("attendance_logs").insert({
            session_id: sessionInfo.id,
            student_id: profile.id,
            method: "qr",
            mood_score: 5,
            readiness_score: 5
          }).select().single();
          if (logErr) throw logErr;
          log = newLog;
        }

        // 2. Save feedback
        const { error: feedErr } = await supabase.from("lesson_feedback").insert({
          log_id: log.id,
          student_id: profile.id,
          course_id: sessionInfo.id, // Assuming course_id is linked or session_id is enough
          rating: rating,
          student_reflection: reflection,
        });

        if (feedErr) throw feedErr;
      }

      setPhase("success");
    } catch (err: any) {
      setErrorMsg(err.message);
      setPhase("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">QR Check-in</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {phase === "form" && formType === "feedback" 
            ? "Great job today! Please leave some feedback." 
            : "Scan your teacher's QR code to mark attendance."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="text-center py-12 border-2 border-dashed border-[var(--border)] bg-transparent">
              <div className="h-20 w-20 rounded-full bg-[var(--accent-light)] flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-10 w-10 text-[var(--accent)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Presence & Feedback</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto mb-8">
                Scan once at start of lesson for attendance, and once at the end for feedback.
              </p>
              <Button size="lg" onClick={startScanning} icon={<Camera className="h-4 w-4" />} className="px-8 h-12 rounded-full">
                Open Scanner
              </Button>
            </Card>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card padding="none" className="overflow-hidden border-2 border-[var(--accent)] shadow-2xl shadow-[var(--accent)]/10">
              <div id="qr-reader" className="w-full bg-black" />
              <div className="p-6 text-center bg-[var(--card-bg)]">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <p className="text-sm font-medium text-[var(--text-primary)]">Searching for QR code...</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { stopScanner(); setPhase("idle"); }} className="text-[var(--error)] hover:bg-[var(--error-light)]">
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "form" && sessionInfo && (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card className="bg-[var(--accent-light)] border-[var(--accent)]/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
                    {formType === "checkin" ? "Pre-Lesson Check-in" : "Post-Lesson Feedback"}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{sessionInfo.subject}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Class: {sessionInfo.class_name}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-[var(--accent)] opacity-20" />
              </div>
            </Card>

            <Card className="space-y-6">
              {formType === "checkin" ? (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 text-center">Ready to learn today?</p>
                    <div className="flex justify-between gap-2">
                      {EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setReadiness(i + 1)}
                          className={`flex-1 py-4 rounded-2xl text-2xl transition-all duration-300 ${
                            readiness === i + 1
                              ? "bg-[var(--accent)] text-white scale-110 shadow-lg"
                              : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 text-center">How are you feeling?</p>
                    <div className="flex justify-between gap-2">
                      {EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setMood(i + 1)}
                          className={`flex-1 py-4 rounded-2xl text-2xl transition-all duration-300 ${
                            mood === i + 1
                              ? "bg-[var(--accent)] text-white scale-110 shadow-lg"
                              : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Notes for teacher</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional: Forgot my book, feeling tired, etc."
                      className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-4 text-center">Rate this lesson</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                            rating >= star ? "bg-yellow-400 text-white shadow-lg" : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Lesson Reflection</p>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="What did you learn today? What was difficult?"
                      className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all"
                      rows={4}
                    />
                  </div>
                </>
              )}

              <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg" onClick={handleSubmit}>
                {formType === "checkin" ? "Complete Check-in" : "Submit Feedback"}
              </Button>
            </Card>
          </motion.div>
        )}

        {phase === "submitting" && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <div className="h-16 w-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-lg font-medium text-[var(--text-secondary)]">Syncing with Academy Servers...</p>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
            <div className="h-24 w-24 bg-[var(--success-light)] rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="h-12 w-12 text-[var(--success)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
              {formType === "checkin" ? "Presence Recorded! ✅" : "Feedback Received! 🌟"}
            </h2>
            <p className="text-[var(--text-secondary)] mb-10">
              {formType === "checkin" 
                ? "Your attendance is secured. Happy learning!" 
                : "Thank you for helping us improve our lessons."}
            </p>
            <Button variant="secondary" size="lg" className="px-12 rounded-full" onClick={() => setPhase("idle")}>
              Return to Dashboard
            </Button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="h-20 w-20 bg-[var(--error-light)] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-[var(--error)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Scan Failed</h2>
            <p className="text-[var(--text-secondary)] mb-8 px-8">{errorMsg}</p>
            <Button onClick={() => setPhase("idle")} className="rounded-full px-8">Try Again</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
