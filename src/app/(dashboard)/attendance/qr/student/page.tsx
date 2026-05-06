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
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isMounted) return;
      if (!document.getElementById("qr-reader")) {
        console.error("QR Reader element not found");
        setErrorMsg("System error: Scanner container not found.");
        setPhase("error");
        return;
      }

      try {
        await stopScanner();
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          async (decodedText: string) => {
            if (!isMounted) return;
            await stopScanner();
            setScannedPayload(decodedText);

            const { data } = await supabase
              .from("attendance_sessions")
              .select("id, subject, class_name, is_active, expires_at")
              .eq("qr_code_payload", decodedText)
              .single();

            if (!data) {
              setErrorMsg("Invalid QR code. This session does not exist.");
              setPhase("error");
              return;
            }

            if (!data.is_active) {
              setErrorMsg("This session has ended.");
              setPhase("error");
              return;
            }

            if (new Date(data.expires_at) < new Date()) {
              setErrorMsg("This session has expired.");
              setPhase("error");
              return;
            }

            if (profile) {
              const { data: existing } = await supabase
                .from("attendance_logs")
                .select("id")
                .eq("session_id", data.id)
                .eq("student_id", profile.id)
                .single();

              if (existing) {
                setErrorMsg("You have already checked in for this session.");
                setPhase("error");
                return;
              }
            }

            setSessionInfo({ id: data.id, subject: data.subject, class_name: data.class_name });
            setPhase("form");
          },
          () => {}
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.error("QR Scanner Error:", err);
        if (err.includes?.("NotAllowedError") || err === "NotAllowedError") {
          setErrorMsg("Camera access denied. Please allow camera permissions and try again.");
        } else {
          setErrorMsg("Could not access camera. Please ensure it's not being used by another app.");
        }
        setPhase("error");
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [phase, profile, stopScanner, supabase]);

  const handleSubmit = async () => {
    if (!profile || !sessionInfo) return;
    setPhase("submitting");

    const { error } = await supabase.from("attendance_logs").insert({
      session_id: sessionInfo.id,
      student_id: profile.id,
      mood_score: mood,
      readiness_score: readiness,
      notes: notes || null,
      method: "qr",
    });

    if (error) {
      setErrorMsg(error.message);
      setPhase("error");
      return;
    }

    setPhase("success");
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">QR Check-in</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Scan your teacher&apos;s QR code to mark attendance.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="text-center py-12">
              <QrCode className="h-16 w-16 text-[var(--accent)] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ready to Check In?</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto mb-6">
                Point your camera at the QR code displayed by your teacher.
              </p>
              <Button size="lg" onClick={startScanning} icon={<Camera className="h-4 w-4" />}>
                Open Scanner
              </Button>
            </Card>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card padding="none" className="overflow-hidden">
              <div id="qr-reader" className="w-full" />
              <div className="p-4 text-center">
                <p className="text-sm text-[var(--text-secondary)]">Point your camera at the QR code</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => { stopScanner(); setPhase("idle"); }}>
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "form" && sessionInfo && (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card className="bg-[var(--success-light)] border-[var(--success)]/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">QR Scanned: {sessionInfo.subject}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Class {sessionInfo.class_name}</p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Check-in</h2>

              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Ready to learn today?</p>
                  <div className="flex gap-2">
                    {EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setReadiness(i + 1)}
                        className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                          readiness === i + 1
                            ? "bg-[var(--accent-light)] border-2 border-[var(--accent)] scale-110"
                            : "bg-[var(--bg-secondary)] border-2 border-transparent hover:border-[var(--border-hover)]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-2">How are you feeling?</p>
                  <div className="flex gap-2">
                    {EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setMood(i + 1)}
                        className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                          mood === i + 1
                            ? "bg-[var(--accent-light)] border-2 border-[var(--accent)] scale-110"
                            : "bg-[var(--bg-secondary)] border-2 border-transparent hover:border-[var(--border-hover)]"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Any notes for teacher? <span className="text-[var(--text-tertiary)]">(optional)</span></p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Forgot my textbook today"
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-none"
                  />
                </div>

                <Button size="lg" className="w-full" onClick={handleSubmit} icon={<Send className="h-4 w-4" />}>
                  Submit Check-in
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "submitting" && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="text-center py-12">
              <div className="h-12 w-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[var(--text-secondary)]">Submitting your check-in...</p>
            </Card>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="text-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                <CheckCircle2 className="h-20 w-20 text-[var(--success)] mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">You&apos;re Checked In! 🎉</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Your attendance has been recorded.</p>
              <p className="text-xs text-[var(--text-tertiary)]">{new Date().toLocaleString()}</p>
              <Button variant="secondary" className="mt-6" onClick={() => setPhase("idle")}>Done</Button>
            </Card>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-[var(--error)] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Check-in Failed</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">{errorMsg}</p>
              <Button onClick={() => setPhase("idle")}>Try Again</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
