"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
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

  const startVerification = useCallback(async () => {
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

      // Double assignment strategy
      const assignStream = () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.warn("Auto-play failed:", e));
          };
        }
      };

      assignStream();
      setTimeout(assignStream, 1000); // 1s fallback assignment

      const newChallenges = getRandomChallenges(4);
      setChallenges(newChallenges);
      setPhase("verifying");
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg("Could not access camera. Please check permissions.");
      setPhase("error");
    }
  }, [profile, supabase]);

  // Detection loop
  useEffect(() => {
    if (phase !== "verifying" || !videoRef.current) return;

    let localHold = 0;
    let localIdx = currentIdx;

    const detect = async () => {
      if (!videoRef.current || phase !== "verifying") return;
      
      // Wait for video to be ready for AI
      if (videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

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
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">AI Liveness Attendance</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">Verify your identity with face detection to mark attendance.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm text-center py-16 px-6">
              <div className="h-24 w-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <ScanFace className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Face Verification</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                You&apos;ll be asked to look in different directions to verify you&apos;re a real person. Make sure your face is well-lit and visible.
              </p>
              <Button size="lg" onClick={startVerification} icon={<Camera className="h-5 w-5" />} className="px-10 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                Start Verification
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm text-center py-20 px-6">
              <Loader2 className="h-16 w-16 animate-spin text-indigo-500 dark:text-indigo-400 mx-auto mb-6" />
              <p className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Loading Models...</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Initializing AI face detection</p>
            </div>
          </motion.div>
        )}

        {(phase === "verifying") && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Challenge progress */}
            <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl p-4 border border-white/40 dark:border-slate-700/50 shadow-sm">
              {challenges.map((dir, i) => (
                <div key={i} className="flex-1">
                  <div className={`h-2 rounded-full transition-all ${
                    i < currentIdx ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : i === currentIdx ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-slate-200 dark:bg-slate-700"
                  }`} />
                  <p className={`text-[10px] mt-2 text-center font-bold uppercase tracking-wider ${
                    i < currentIdx ? "text-emerald-600 dark:text-emerald-400" : i === currentIdx ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                  }`}>
                    {getDirectionLabel(dir)}
                  </p>
                </div>
              ))}
            </div>

            {/* Camera */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-xl p-2">
              <div className="relative flex items-center justify-center bg-black/90 aspect-[4/3] rounded-2xl overflow-hidden">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  onCanPlay={(e) => (e.target as HTMLVideoElement).play()}
                  className="w-full h-full scale-x-[-1] z-10" 
                  style={{ objectFit: 'cover', width: '100%', height: '100%', filter: 'none' }}
                />
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full z-20 pointer-events-none bg-transparent" 
                />

                {/* Circular frame overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                  <div className={`w-64 h-64 rounded-full border-4 transition-colors duration-300 ${
                    holdTimer > 0 ? "border-emerald-500" : "border-white/20"
                  }`}>
                    {holdTimer > 0 && (
                      <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(16,185,129,0.9)" strokeWidth="4"
                          strokeDasharray={`${(holdTimer / holdRequired) * 301} 301`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Current challenge */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                     <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                       {challenges[currentIdx] ? getDirectionLabel(challenges[currentIdx]) : "Complete!"}
                     </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "success" && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm text-center py-16 px-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="h-24 w-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Attendance Marked! ✅</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">You&apos;ve been marked as <strong className="text-emerald-600 dark:text-emerald-400">Present</strong>.</p>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-10">{new Date().toLocaleString()}</p>
              <Button size="lg" className="px-12 h-14 rounded-2xl font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md" onClick={() => setPhase("idle")}>
                Done
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-sm text-center py-16 px-6">
              <div className="h-24 w-24 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                 <AlertTriangle className="h-12 w-12 text-rose-500 dark:text-rose-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Verification Failed</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-12 px-8">{errorMsg}</p>
              <Button onClick={startVerification} className="px-12 h-14 rounded-2xl font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md">
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
