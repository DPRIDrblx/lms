"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, MonitorUp, X, UserCircle2, MicOff, VideoOff, Settings, Users, Video, Mic, MonitorPlay } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function TutorOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AV State
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data: schedData } = await supabase
        .from("center_schedules")
        .select("*, tutor:tutor_id(full_name, avatar_url)")
        .eq("id", resolvedParams.id)
        .single();
      
      setSchedule(schedData);
      setLoading(false);
    };
    fetchSchedule();

    return () => {
      // Cleanup streams on unmount
      stopAllStreams();
    };
  }, [resolvedParams.id]);

  useEffect(() => {
    // Attach stream to video element when it changes
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn]);

  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  const stopAllStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setIsCameraOn(false);
    setIsMicOn(false);
    setIsScreenSharing(false);
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn off camera
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
        // If mic is also off, we can kill the whole stream. Otherwise just remove video track.
        if (!isMicOn) setLocalStream(null);
      }
      setIsCameraOn(false);
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isMicOn });
        if (localStream && isMicOn) {
           // We already had audio, need to replace it with the new combined stream or add video track
           setLocalStream(stream);
        } else {
           setLocalStream(stream);
        }
        setIsCameraOn(true);
      } catch (err) {
        toast.error("Gagal mengakses kamera. Pastikan Anda telah memberikan izin.");
        console.error(err);
      }
    }
  };

  const toggleMic = async () => {
    if (isMicOn) {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = false;
            track.stop();
        });
        if (!isCameraOn) setLocalStream(null);
      }
      setIsMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isCameraOn });
        setLocalStream(stream);
        setIsMicOn(true);
      } catch (err) {
        toast.error("Gagal mengakses mikrofon.");
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        // Listen for user clicking "Stop sharing" in Chrome UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };

        setScreenStream(stream);
        setIsScreenSharing(true);
      } catch (err) {
        toast.error("Gagal membagikan layar.");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <CenterLoader size="lg" />
        <p className="text-slate-500 mt-4 animate-pulse font-medium">Menyiapkan Ruangan Kelas...</p>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-800 flex flex-col overflow-hidden font-sans">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-base md:text-lg text-slate-900 leading-tight flex items-center gap-2">
              {schedule.title}
              <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">Live</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">Panggung Virtual • Tuan Rumah (Host)</p>
          </div>
        </div>
        <Button 
          onClick={() => { stopAllStreams(); router.back(); }}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 rounded-xl"
        >
          Akhiri Kelas
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10 p-4 gap-4">
        
        {/* Stage / Podium Area (Center) */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
          
          {/* Main Video Display */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
            
            {/* 1. Screen Share Takes Priority */}
            {isScreenSharing && (
              <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-300">
                <video 
                  ref={screenRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm">
                  <MonitorUp className="w-4 h-4" />
                  <span className="text-xs font-bold">Membagikan Layar</span>
                </div>
              </div>
            )}

            {/* 2. Camera Display (If no screen share, camera is big. If screen share, camera is small in corner) */}
            {isCameraOn && (
              <div className={cn(
                "relative bg-black overflow-hidden shadow-lg border border-slate-300 transition-all duration-300",
                isScreenSharing 
                  ? "absolute bottom-6 right-6 w-48 aspect-video rounded-xl z-20 shadow-2xl ring-4 ring-white/50" 
                  : "w-full h-full rounded-xl"
              )}>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted // Mute local video to prevent feedback
                  className={cn("w-full h-full", isScreenSharing ? "object-cover" : "object-contain")}
                />
                {!isScreenSharing && (
                  <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm">
                    <Video className="w-4 h-4" />
                    <span className="text-xs font-bold">Kamera Anda</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-2">
                  {!isMicOn && <MicOff className="w-3 h-3 text-red-400" />}
                  {schedule.tutor?.full_name?.split(' ')[0]}
                </div>
              </div>
            )}

            {/* 3. Placeholder (If both are off) */}
            {!isScreenSharing && !isCameraOn && (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="w-28 h-28 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center shadow-md mb-6 relative">
                  {schedule.tutor?.avatar_url ? (
                    <img src={schedule.tutor.avatar_url} className="w-full h-full rounded-full object-cover" alt="Tutor" />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-slate-300" />
                  )}
                  {!isMicOn && (
                    <div className="absolute -bottom-2 -right-2 bg-white border border-slate-200 p-2 rounded-full shadow-sm">
                      <MicOff className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Panggung Virtual Anda</h2>
                <p className="text-slate-500 font-medium max-w-sm">
                  Aktifkan Kamera atau Share Screen di panel bawah untuk mulai membagikan materi ke siswa.
                </p>
                
                <div className="mt-8 flex gap-3">
                  <Button onClick={toggleCamera} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl gap-2 shadow-md">
                    <Video className="w-5 h-5" /> Buka Kamera
                  </Button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Control Bar */}
          <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-between px-6 shrink-0 relative z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            
            {/* Left: Info */}
            <div className="flex items-center gap-2 hidden md:flex">
               <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                 <MonitorPlay className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-800">Sesi Aktif</p>
                 <p className="text-xs text-slate-500">Rekaman Otomatis</p>
               </div>
            </div>

            {/* Center: AV Controls */}
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <button 
                onClick={toggleMic}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border",
                  isMicOn 
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
                    : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                )}
                title={isMicOn ? "Matikan Mic" : "Nyalakan Mic"}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={toggleCamera}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border",
                  isCameraOn 
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
                    : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                )}
                title={isCameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <div className="w-px h-8 bg-slate-200 mx-1"></div>

              <button 
                onClick={toggleScreenShare}
                className={cn(
                  "h-12 px-4 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm border",
                  isScreenSharing 
                    ? "bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-blue-500/20" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <MonitorUp className="w-5 h-5" />
                <span className="hidden sm:inline">{isScreenSharing ? "Berhenti Share" : "Share Screen"}</span>
              </button>
            </div>

            {/* Right: Tools */}
            <div className="flex gap-2">
              <button className="h-10 px-3 rounded-lg font-bold flex items-center gap-2 transition-all bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm text-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="hidden lg:inline">Kelola Siswa</span>
              </button>
              <button className="w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                <Settings className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </main>

        {/* Right Sidebar (Chat & Activities) */}
        <aside className="w-80 bg-white border border-slate-200 rounded-2xl shadow-sm hidden lg:flex flex-col relative z-20 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
               <MessageSquare className="w-4 h-4 text-blue-500" /> Diskusi & Aktivitas
             </h3>
          </div>
          
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
               <MonitorPlay className="w-8 h-8 text-blue-400" />
             </div>
             <p className="text-sm font-medium text-slate-500">Sistem Polling & CBT Interaktif akan muncul di sini.</p>
             <p className="text-xs text-slate-400 mt-2">Siswa belum mengirimkan pesan.</p>
          </div>

          {/* Dummy Chat Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Kirim pesan ke kelas..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
