"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Hand, MessageSquare, MonitorPlay, X, UserCircle2, MicOff, Mic, RotateCcw } from "lucide-react";
import { LiveKitRoom, useTracks, VideoTrack, RoomAudioRenderer, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { CenterLoader } from "@/components/ui/center-loader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

function StudentOnlineClassStageInner({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isOnStage, setIsOnStage] = useState(false);
  
  // AV State
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
  const [messages, setMessages] = useState<{id: string, sender: string, text: string, time: string, isHost?: boolean}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [tutorState, setTutorState] = useState({ isCameraOn: false, isScreenSharing: false });
  const [activePoll, setActivePoll] = useState<any>(null);
  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null);
  
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (resolvedParams.id) {
      const saved = localStorage.getItem(`chat_${resolvedParams.id}`);
      if (saved) setMessages(JSON.parse(saved));
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    if (resolvedParams.id && messages.length > 0) {
      localStorage.setItem(`chat_${resolvedParams.id}`, JSON.stringify(messages));
    }
  }, [messages, resolvedParams.id]);

  useEffect(() => {
    const fetchScheduleAndAttend = async () => {
      // 1. Fetch schedule
      const { data: schedData } = await supabase
        .from("center_schedules")
        .select("*, tutor:tutor_id(full_name, avatar_url)")
        .eq("id", resolvedParams.id)
        .single();
      
      setSchedule(schedData);

      // 2. Auto-record attendance if student joined online stage
      if (user && schedData?.is_online) {
        // We use upsert to avoid duplicate entries and ensure status is 'hadir'
        await supabase
          .from("center_schedule_attendances")
          .upsert({
            schedule_id: resolvedParams.id,
            student_id: user.id,
            status: "hadir",
            attended_at: new Date().toISOString()
          }, { onConflict: "schedule_id,student_id" });
      }

      setLoading(false);
    };
    fetchScheduleAndAttend();

    // Setup Realtime
    if (resolvedParams.id && user) {
      const channel = supabase.channel(`room_${resolvedParams.id}`, {
        config: { presence: { key: user.id } }
      });

      channel
        .on('broadcast', { event: 'chat' }, ({ payload }: { payload: any }) => {
          setMessages(prev => [...prev, payload]);
        })
        .on('broadcast', { event: 'tutor_state' }, ({ payload }: { payload: any }) => {
          setTutorState(payload);
        })
        .on('broadcast', { event: 'poll' }, ({ payload }: { payload: any }) => {
          setActivePoll(payload);
          setSelectedPollOption(null);
        })
        .on('broadcast', { event: 'accept_hand_raise' }, ({ payload }: { payload: any }) => {
          if (payload.id === user.id) {
            toast.success("Tutor memanggil Anda ke panggung! Mic kini dapat diaktifkan.", { icon: "🎙️", duration: 5000 });
            setIsOnStage(true);
            setIsHandRaised(false);
          }
        })
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              name: (user as any)?.user_metadata?.full_name || 'Siswa',
              role: 'student'
            });
          }
        });
        
      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [resolvedParams.id, user]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: (user as any)?.user_metadata?.full_name || 'Siswa',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: false
    };
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg });
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const toggleHandRaise = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    if (newState) {
       channelRef.current?.send({ type: 'broadcast', event: 'raise_hand', payload: { id: user?.id, studentName: (user as any)?.user_metadata?.full_name || 'Siswa' } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <CenterLoader size="lg" />
        <p className="text-slate-500 mt-4 animate-pulse font-medium">Memasuki ruangan panggung...</p>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <>
      <div className="portrait:flex landscape:hidden fixed inset-0 z-[200] bg-slate-900 text-white flex-col items-center justify-center p-6 text-center">
        <RotateCcw className="w-12 h-12 mb-4 animate-bounce text-amber-400" />
        <h2 className="text-xl font-bold mb-2">Mohon Putar Perangkat Anda</h2>
        <p className="text-slate-400">Untuk pengalaman belajar terbaik dan ruang yang optimal, kelas ini hanya dapat diakses dalam mode lanskap (mendatar).</p>
      </div>

      <div className="portrait:hidden landscape:flex fixed inset-0 z-[100] bg-slate-50 text-slate-800 flex flex-col overflow-hidden font-sans">
        
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
            <p className="text-xs text-slate-500 font-medium">{schedule.tutor?.full_name} • Panggung Virtual</p>
          </div>
        </div>
        <Button 
          onClick={() => router.back()}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold border border-red-200 rounded-xl"
        >
          Keluar Kelas
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative z-10 p-4 gap-4">
        
        {/* Stage / Podium Area (Center) */}
        <main className="flex-1 min-w-0 flex flex-col relative bg-slate-200/50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
          
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
            
            {/* Tutor Video Placeholder */}
            <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-300 flex flex-col items-center justify-center">
              <TutorStreamRenderer schedule={schedule} tutorState={tutorState} />
              
              <div className="absolute top-4 left-4 bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm">
                <MonitorPlay className="w-4 h-4" />
                <span className="text-xs font-bold">Layar Utama</span>
              </div>
            </div>

            {/* Student "On Stage" Area Placeholder */}
            {isHandRaised && (
              <div className="absolute bottom-6 right-6 w-48 aspect-video bg-slate-800 rounded-xl border-2 border-amber-500 shadow-2xl flex flex-col items-center justify-center text-center p-2 ring-4 ring-amber-500/20">
                <UserCircle2 className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-white">Menunggu diizinkan...</span>
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="h-20 bg-white border-t border-slate-200 flex items-center justify-center px-6 shrink-0 relative z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            
            {/* Center: Student Controls */}
            <div className="flex items-center gap-4">
              {isOnStage ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200">
                    Anda berada di Panggung
                  </span>
                  <button 
                    onClick={async () => {
                       await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
                    }}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border",
                      isMicrophoneEnabled 
                        ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" 
                        : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                    )}
                    title={isMicrophoneEnabled ? "Matikan Mic" : "Nyalakan Mic"}
                  >
                    {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={async () => {
                       await localParticipant.setMicrophoneEnabled(false);
                       setIsOnStage(false);
                    }}
                    className="h-12 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors border border-slate-200 text-sm"
                  >
                    Turun Panggung
                  </button>
                </div>
              ) : (
                <button 
                  onClick={toggleHandRaise}
                  className={cn(
                    "h-12 px-6 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border",
                    isHandRaised 
                      ? "bg-amber-500 border-amber-600 text-white shadow-amber-500/20" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Hand className={cn("w-5 h-5", isHandRaised && "animate-bounce")} />
                  {isHandRaised ? "Turunkan Tangan" : "Raise Hand (Naik Panggung)"}
                </button>
              )}
            </div>
            
          </div>
        </main>

        {/* Right Sidebar (Chat & Activities) */}
        <aside className="w-64 md:w-80 shrink-0 bg-white border-l border-slate-200 shadow-sm flex flex-col relative z-20 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
               <MessageSquare className="w-4 h-4 text-blue-500" /> Diskusi & Aktivitas
             </h3>
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">

             {/* Chat Messages */}
             <div className="flex-1 p-4 overflow-y-auto flex flex-col">
               {messages.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                     <MessageSquare className="w-8 h-8 text-blue-400" />
                   </div>
                   <p className="text-sm font-medium text-slate-500">Tutor belum mengirimkan instruksi.</p>
                 </div>
               ) : (
                 <div className="w-full flex flex-col gap-3 justify-end items-start text-left mt-auto">
                   {messages.map((msg) => (
                     <div key={msg.id} className={cn("max-w-[85%] p-3 rounded-2xl text-sm", msg.isHost ? "bg-blue-100 text-blue-900 self-start rounded-bl-sm" : "bg-slate-100 text-slate-800 self-end rounded-br-sm")}>
                       <div className="flex justify-between items-end gap-2 mb-1">
                         <span className={cn("font-bold text-xs", msg.isHost && "text-blue-700")}>
                           {msg.sender} {msg.isHost && "👑"}
                         </span>
                         <span className="text-[10px] opacity-60">{msg.time}</span>
                       </div>
                       <p>{msg.text}</p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white shrink-0">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Pesan..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
              <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50 transition-colors">
                Kirim
              </button>
            </div>
          </form>
        </aside>
      </div>
      </div>

      {/* Pop-up Polling/Aktivitas */}
      {activePoll && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 relative">
              <button onClick={() => setActivePoll(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-indigo-500 hover:bg-indigo-400 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h4 className="font-black text-white text-xl flex items-center gap-2">
                <MonitorPlay className="w-6 h-6" /> Aktivitas Langsung (Live CBT)
              </h4>
            </div>
            <div className="p-8">
              <p className="text-lg font-bold text-slate-800 mb-6">{activePoll.question}</p>
              <div className="space-y-3">
                {activePoll.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPollOption(idx);
                      channelRef.current?.send({
                        type: 'broadcast',
                        event: 'student_poll_answer',
                        payload: { studentName: (user as any)?.user_metadata?.full_name || 'Siswa', optionIndex: idx }
                      });
                      toast.success("Jawaban Anda berhasil dikirim ke Tutor!", { icon: "✅" });
                      setTimeout(() => setActivePoll(null), 1500); // Auto close after submit
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border-2 transition-all font-bold group hover:-translate-y-0.5",
                      selectedPollOption === idx 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-500/20" 
                        : "bg-white border-slate-200 hover:border-indigo-300 text-slate-700"
                    )}
                  >
                    <span className="inline-block w-8 h-8 rounded-full bg-slate-100 text-center leading-8 mr-3 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function TutorStreamRenderer({ schedule, tutorState }: { schedule: any, tutorState: any }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  const screenTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const camTrack = tracks.find(t => t.source === Track.Source.Camera);

  if (screenTrack || camTrack) {
    return (
      <>
        {screenTrack && (
          <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain absolute inset-0" />
        )}
        {camTrack && (
          <div className={cn(
            "relative bg-black overflow-hidden shadow-lg border border-slate-700 transition-all duration-300",
            screenTrack 
              ? "absolute bottom-6 left-6 w-48 aspect-video rounded-xl z-20 shadow-2xl ring-2 ring-white/20" 
              : "w-full h-full absolute inset-0"
          )}>
            <VideoTrack trackRef={camTrack} className={cn("w-full h-full", screenTrack ? "object-cover" : "object-contain scale-x-[-1]")} />
          </div>
        )}
        <RoomAudioRenderer />
      </>
    );
  }

  return (
    <>
      <div className="relative mb-6 z-10">
        <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center shadow-2xl">
          {schedule.tutor?.avatar_url ? (
            <img src={schedule.tutor.avatar_url} className="w-full h-full rounded-full object-cover" alt="Tutor" />
          ) : (
            <UserCircle2 className="w-12 h-12 text-slate-500" />
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 p-2 rounded-full shadow-sm">
          <MicOff className="w-4 h-4 text-red-400" />
        </div>
      </div>
      <h2 className="text-2xl font-black text-white drop-shadow-md mb-2 relative z-10">
        Tutor {schedule.tutor?.full_name?.split(' ')[0] || ''}
      </h2>
      {tutorState.isScreenSharing ? (
        <p className="text-blue-400 font-bold bg-blue-900/30 px-4 py-2 rounded-lg relative z-10">Memulai Share Screen...</p>
      ) : tutorState.isCameraOn ? (
        <p className="text-emerald-400 font-bold bg-emerald-900/30 px-4 py-2 rounded-lg relative z-10">Tutor sedang menyalakan kamera...</p>
      ) : (
        <p className="text-slate-400 font-medium relative z-10">Video Tutor akan muncul di sini saat sesi dimulai.</p>
      )}
      <RoomAudioRenderer />
    </>
  );
}

export default function StudentOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");

  useEffect(() => {
    if (!resolvedParams.id || !user) return;
    fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         roomName: `room_${resolvedParams.id}`,
         participantName: (user as any)?.user_metadata?.full_name || 'Siswa',
         participantId: user?.id,
         isTutor: false
      })
    }).then(r => r.json()).then(d => {
       if (d.token && d.wsUrl) {
         setToken(d.token);
         setWsUrl(d.wsUrl);
       } else {
         toast.error(d.error || "Gagal mendapatkan token kelas");
       }
    }).catch(err => {
       toast.error("Terjadi kesalahan sistem saat menghubungi server");
    });
  }, [resolvedParams.id, user]);

  if (!token || !wsUrl) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><CenterLoader size="lg" /></div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={true}
    >
      <StudentOnlineClassStageInner params={params} />
    </LiveKitRoom>
  );
}
