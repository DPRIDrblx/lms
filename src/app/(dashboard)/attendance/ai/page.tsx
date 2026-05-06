"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  loadModels,
  detectFace,
  estimateHeadPose,
  checkDirection,
  getDirectionLabel,
  getRandomChallenges,
  type Direction,
} from "@/lib/face-detection";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, CheckCircle2, AlertTriangle, Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

type Phase = "idle" | "loading" | "verifying" | "success" | "error";

export default function AIAttendancePage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("idle");
  const [challenges, setChallenges] = useState<Direction[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [holdTimer, setHoldTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const holdRequired = 12; // frames

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const startVerification = async () => {
    setPhase("loading");
    setCurrentIdx(0);
    setHoldTimer(0);
    setErrorMsg("");

    try {
      await loadModels();
      
      const constraints = { 
        video: { 
          facingMode: "user", 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            console.error("Video play error:", e);
            setErrorMsg("Failed to start video playback. Please try again.");
            setPhase("error");
          });
        };
      }

      const newChallenges = getRandomChallenges(4);
      setChallenges(newChallenges);
      setPhase("verifying");
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError") {
        setErrorMsg("Camera access denied. Please allow camera permissions in your browser settings and try again.");
      } else if (err.name === "NotFoundError") {
        setErrorMsg("No camera found on this device.");
      } else {
        setErrorMsg("Could not access camera. Please ensure it's not being used by another app.");
      }
      setPhase("error");
    }
  };

  // Detection loop
  useEffect(() => {
    if (phase !== "verifying" || !videoRef.current) return;

    let localHold = 0;
    let localIdx = currentIdx;

    const detect = async () => {
      if (!videoRef.current || phase !== "verifying") return;

      const result = await detectFace(videoRef.current);

      if (result) {
        const pose = estimateHeadPose(result.landmarks);
        const target = challenges[localIdx];

        if (target && checkDirection(pose, target)) {
          localHold++;
          setHoldTimer(localHold);
          if (localHold >= holdRequired) {
            localHold = 0;
            localIdx++;
            setCurrentIdx(localIdx);
            setHoldTimer(0);

            if (localIdx >= challenges.length) {
              // All challenges passed
              setPhase("success");
              stopCamera();

              // Record attendance
              if (profile) {
                // Find active session or create a general AI attendance log
                const { data: sessions } = await supabase
                  .from("attendance_sessions")
                  .select("id")
                  .eq("is_active", true)
                  .limit(1);

                if (sessions && sessions.length > 0) {
                  await supabase.from("attendance_logs").upsert({
                    session_id: sessions[0].id,
                    student_id: profile.id,
                    method: "ai",
                    mood_score: 5,
                    readiness_score: 5,
                  }, { onConflict: "session_id,student_id" });
                }
              }
              return;
            }
          }
        } else {
          localHold = Math.max(0, localHold - 1);
          setHoldTimer(localHold);
        }
      }

      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, challenges, currentIdx, holdRequired, stopCamera, profile, supabase]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Liveness Attendance</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Verify your identity with face detection to mark attendance.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="text-center py-12">
              <ScanFace className="h-16 w-16 text-[var(--accent)] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Face Verification</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
                You&apos;ll be asked to look in different directions to verify you&apos;re a real person. Make sure your face is well-lit and visible.
              </p>
              <Button size="lg" onClick={startVerification} icon={<Camera className="h-4 w-4" />}>
                Start Verification
              </Button>
            </Card>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[var(--accent)] mx-auto mb-4" />
              <p className="text-sm text-[var(--text-secondary)]">Loading face detection models...</p>
            </Card>
          </motion.div>
        )}

        {(phase === "verifying") && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Challenge progress */}
            <div className="flex items-center gap-2">
              {challenges.map((dir, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-all ${
                    i < currentIdx ? "bg-[var(--success)]" : i === currentIdx ? "bg-[var(--accent)]" : "bg-[var(--bg-tertiary)]"
                  }`} />
                  <p className={`text-[10px] mt-1 text-center font-medium ${
                    i < currentIdx ? "text-[var(--success)]" : i === currentIdx ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
                  }`}>
                    {getDirectionLabel(dir)}
                  </p>
                </div>
              ))}
            </div>

            {/* Camera */}
            <Card padding="none" className="overflow-hidden">
              <div className="relative flex items-center justify-center bg-black aspect-[4/3]">
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                {/* Circular frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`w-64 h-64 rounded-full border-4 transition-colors duration-300 ${
                    holdTimer > 0 ? "border-[var(--success)]" : "border-white/40"
                  }`}>
                    {holdTimer > 0 && (
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(5,150,105,0.5)" strokeWidth="3"
                          strokeDasharray={`${(holdTimer / holdRequired) * 301} 301`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Current challenge */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <Badge variant="info" className="text-base px-4 py-1.5">
                    {challenges[currentIdx] ? getDirectionLabel(challenges[currentIdx]) : "Complete!"}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <Card className="text-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                <CheckCircle2 className="h-20 w-20 text-[var(--success)] mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Attendance Marked! ✅</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-1">You&apos;ve been marked as <strong>Present</strong>.</p>
              <p className="text-xs text-[var(--text-tertiary)]">{new Date().toLocaleString()}</p>
              <Button variant="secondary" className="mt-6" onClick={() => setPhase("idle")}>Done</Button>
            </Card>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-[var(--error)] mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Verification Failed</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">{errorMsg}</p>
              <Button onClick={startVerification}>Try Again</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
