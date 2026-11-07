"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CameraOff, Minimize2, Maximize2, AlertCircle, RefreshCw } from "lucide-react";

interface CbtWebcamMonitorProps {
  isRequired: boolean;
  onStatusChange?: (isActive: boolean) => void;
  floating?: boolean; // True when inside exam room as PiP
  className?: string;
}

export function CbtWebcamMonitor({
  isRequired,
  onStatusChange,
  floating = false,
  className = "",
}: CbtWebcamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);

  const startWebcam = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Browser Anda tidak mendukung akses kamera/webcam.");
      }

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setIsActive(true);
      setError(null);
      onStatusChange?.(true);
    } catch (err: any) {
      console.warn("Webcam access error:", err);
      let errMsg = "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "Kamera tidak ditemukan pada perangkat ini.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errMsg = "Kamera sedang digunakan oleh aplikasi lain.";
      }
      setError(errMsg);
      setIsActive(false);
      onStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    onStatusChange?.(false);
  }, [onStatusChange]);

  useEffect(() => {
    if (isRequired) {
      startWebcam();
    }
    return () => {
      stopWebcam();
    };
  }, [isRequired, startWebcam, stopWebcam]);

  // If floating PiP widget inside the exam room
  if (floating) {
    if (!isRequired) return null;

    return (
      <div
        className={`fixed z-40 transition-all duration-200 select-none ${
          isMinimized
            ? "bottom-4 right-4"
            : "bottom-5 right-5 w-44 md:w-56 shadow-2xl rounded-2xl overflow-hidden border-2 border-indigo-500/80 bg-slate-950"
        } ${className}`}
      >
        {isMinimized ? (
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white px-3 py-2 rounded-full border border-indigo-500/50 shadow-xl backdrop-blur-md"
            title="Buka Kamera Proctor"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <Camera className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold">Proctor Aktif</span>
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="relative">
            {/* Header pill */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white tracking-wider uppercase">REC</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors pointer-events-auto shadow-md"
                title="Kecilkan"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-2 text-center">
                  <CameraOff className="w-6 h-6 text-red-400 mb-1" />
                  <p className="text-[10px] text-red-300 line-clamp-2">{error}</p>
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="mt-1 text-[10px] bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded font-bold"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>

            <div className="p-1.5 bg-slate-900/90 text-center border-t border-slate-800">
              <p className="text-[10px] font-medium text-slate-300">Pengawasan Kamera Aktif</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pre-exam modal preview card
  return (
    <div className={`p-4 rounded-2xl border ${isActive ? "border-emerald-500/50 bg-emerald-950/20" : "border-slate-800 bg-slate-900/60"} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? "bg-emerald-950 text-emerald-400 border border-emerald-700/60" : "bg-slate-800 text-slate-400"}`}>
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">Pemeriksaan Kamera Pengawas</h4>
            <p className="text-[11px] text-slate-400">
              {isRequired ? "Wajib aktif untuk mengikuti ujian ini" : "Opsional (Tidak diwajibkan guru)"}
            </p>
          </div>
        </div>

        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Terhubung & Siap
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            Belum Aktif
          </span>
        )}
      </div>

      <div className="relative aspect-video max-w-sm mx-auto rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${!isActive ? "hidden" : "block"}`}
        />

        {!isActive && !loading && !error && (
          <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center">
            <Camera className="w-10 h-10 mb-2 opacity-40 text-blue-400" />
            <p className="text-xs font-medium text-slate-400">Klik tombol di bawah untuk menyalakan kamera</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center text-white p-4">
            <RefreshCw className="w-7 h-7 text-blue-400 animate-spin mb-2" />
            <p className="text-xs font-medium text-slate-300">Menghubungkan ke kamera...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-4 text-center text-rose-300">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-3.5 flex justify-center">
        {!isActive ? (
          <button
            type="button"
            onClick={startWebcam}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-amber-300" />}
            <span>Izinkan & Nyalakan Kamera</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopWebcam}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            Matikan Kamera
          </button>
        )}
      </div>
    </div>
  );
}

