"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
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
    <div className="max-w-lg mx-auto space-y-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">QR Check-in</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
          {phase === "form" && formType === "feedback" 
            ? "Great job today! Please leave some feedback." 
            : "Scan your teacher's QR code to mark attendance."}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center py-16 px-6 shadow-sm">
              <div className="h-24 w-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <QrCode className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Presence & Feedback</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-10 leading-relaxed">
                Scan once at the start of the lesson for attendance, and once at the end for feedback.
              </p>
              <Button size="lg" onClick={startScanning} icon={<Camera className="h-5 w-5" />} className="px-10 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                Open Scanner
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl overflow-hidden border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20">
              <div id="qr-reader" className="w-full bg-black/90 aspect-square" />
              <div className="p-6 text-center border-t border-indigo-500/30 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide">Searching for QR code...</p>
                </div>
                <Button variant="ghost" onClick={() => { stopScanner(); setPhase("idle"); }} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold rounded-xl px-8">
                  Cancel Scan
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "form" && sessionInfo && (
          <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-800/50 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1.5">
                    {formType === "checkin" ? "Pre-Lesson Check-in" : "Post-Lesson Feedback"}
                  </p>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{sessionInfo.subject}</h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Class: <span className="font-semibold text-slate-700 dark:text-slate-300">{sessionInfo.class_name}</span></p>
                </div>
                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-indigo-500 dark:text-indigo-300" />
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border border-white/40 dark:border-slate-700/50 rounded-3xl p-8 shadow-sm space-y-8">
              {formType === "checkin" ? (
                <>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-4 text-center uppercase tracking-wide">Ready to learn today?</p>
                    <div className="flex justify-between gap-2">
                      {EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setReadiness(i + 1)}
                          className={`flex-1 py-4 rounded-2xl text-2xl transition-all duration-300 ${
                            readiness === i + 1
                              ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30"
                              : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-4 text-center uppercase tracking-wide mt-4">How are you feeling?</p>
                    <div className="flex justify-between gap-2">
                      {EMOJIS.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => setMood(i + 1)}
                          className={`flex-1 py-4 rounded-2xl text-2xl transition-all duration-300 ${
                            mood === i + 1
                              ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30"
                              : "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Notes for teacher</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional: Forgot my book, feeling tired, etc."
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-4 text-center uppercase tracking-wide">Rate this lesson</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                            rating >= star ? "bg-amber-400 text-white shadow-lg shadow-amber-400/30 scale-110" : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">Lesson Reflection</p>
                    <textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="What did you learn today? What was difficult?"
                      className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all text-slate-800 dark:text-white placeholder:text-slate-400"
                      rows={4}
                    />
                  </div>
                </>
              )}

              <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30" onClick={handleSubmit}>
                {formType === "checkin" ? "Complete Check-in" : "Submit Feedback"}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "submitting" && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
            <div className="relative h-20 w-20 mx-auto mb-8">
               <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-2">Syncing with Academy Servers...</p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Please wait a moment</p>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm">
            <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
              {formType === "checkin" ? "Presence Recorded! ✅" : "Feedback Received! 🌟"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 px-6">
              {formType === "checkin" 
                ? "Your attendance is secured. Ready to start learning?" 
                : "Thank you for helping us improve our lessons."}
            </p>
            <Button size="lg" className="px-12 h-14 rounded-2xl font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md" onClick={() => setPhase("idle")}>
              Return to Dashboard
            </Button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm">
            <div className="h-24 w-24 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AlertTriangle className="h-12 w-12 text-rose-500 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Scan Failed</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 px-8">{errorMsg}</p>
            <Button onClick={() => setPhase("idle")} className="px-12 h-14 rounded-2xl font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md">
               Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
