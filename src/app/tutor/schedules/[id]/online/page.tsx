"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquare, MonitorUp, X, UserCircle2, MicOff, VideoOff, Settings, Users, Video, Mic, MonitorPlay, Sparkles } from "lucide-react";
import { LiveKitRoom, useLocalParticipant, VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { CenterLoader } from "@/components/ui/center-loader";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Draggable from 'react-draggable';

function TutorOnlineClassStageInner({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Realtime State
  const [messages, setMessages] = useState<{id: string, sender: string, text: string, time: string, isHost?: boolean}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showManageStudents, setShowManageStudents] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollForm, setPollForm] = useState({ question: "", options: ["", ""] });
  const [pollResults, setPollResults] = useState<{ [key: string]: number }>({});
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [raisedHands, setRaisedHands] = useState<any[]>([]);
  
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

    if (resolvedParams.id && user) {
      const channel = supabase.channel(`room_${resolvedParams.id}`, {
        config: { presence: { key: user.id } }
      });

      channel
        .on('broadcast', { event: 'chat' }, ({ payload }: { payload: any }) => {
          setMessages(prev => [...prev, payload]);
        })
        .on('broadcast', { event: 'student_poll_answer' }, ({ payload }: { payload: any }) => {
          setPollResults(prev => ({
            ...prev,
            [payload.optionIndex]: (prev[payload.optionIndex] || 0) + 1
          }));
        })
        .on('broadcast', { event: 'raise_hand' }, ({ payload }: { payload: any }) => {
          toast(`${payload.studentName} mengacungkan tangan! ✋`, { icon: '✋' });
          setRaisedHands(prev => {
             if (prev.find(h => h.id === payload.id)) return prev;
             return [...prev, payload];
          });
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: any[] = [];
          Object.values(state).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.role === 'student') users.push(p);
            });
          });
          setOnlineUsers(users);
        })
        .subscribe(async (status: any) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              name: (user as any)?.user_metadata?.full_name || 'Tutor',
              role: 'tutor'
            });
          }
        });

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [resolvedParams.id, user, supabase]);

  // AV State
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const isCameraOn = isCameraEnabled;
  const isMicOn = isMicrophoneEnabled;
  const isScreenSharing = isScreenShareEnabled;
  
  const tracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false });
  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare && t.participant.isLocal);

  const toggleCamera = async () => {
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleScreenShare = async () => {
    await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
  };

  const stopAllStreams = async () => {
    if (isCameraEnabled) await localParticipant.setCameraEnabled(false);
    if (isMicrophoneEnabled) await localParticipant.setMicrophoneEnabled(false);
    if (isScreenShareEnabled) await localParticipant.setScreenShareEnabled(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: schedule?.tutor?.full_name || (user as any)?.user_metadata?.full_name || 'Tutor',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: true
    };
    channelRef.current?.send({ type: 'broadcast', event: 'chat', payload: msg });
    setChatInput("");
  };

  const handlePushPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollForm.question.trim()) {
      toast.error("Pertanyaan tidak boleh kosong!");
      return;
    }
    
    const validOptions = pollForm.options.filter(o => o.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Berikan minimal 2 pilihan jawaban!");
      return;
    }

    setPollResults({});
    channelRef.current?.send({
      type: 'broadcast',
      event: 'poll',
      payload: {
        question: pollForm.question,
        options: validOptions
      }
    });

    toast.success("Aktivitas/Polling berhasil dikirim ke layar siswa!");
    setShowPollModal(false);
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
            {isScreenSharing && screenShareTrack && (
              <div className="w-full h-full relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-300">
                <VideoTrack 
                  trackRef={screenShareTrack} 
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
              <Draggable bounds="parent" disabled={!isScreenSharing}>
                <div className={cn(
                  "relative bg-black overflow-hidden shadow-lg border border-slate-300",
                  isScreenSharing 
                    ? "absolute bottom-6 right-6 w-48 aspect-video rounded-xl z-20 shadow-2xl ring-4 ring-white/50 cursor-move" 
                    : "w-full h-full rounded-xl transition-all duration-300"
                )}>
                  {tracks.find(t => t.source === Track.Source.Camera && t.participant.isLocal) && (
                    <VideoTrack 
                      trackRef={tracks.find(t => t.source === Track.Source.Camera && t.participant.isLocal) as any} 
                      className={cn("w-full h-full", isScreenSharing ? "object-cover" : "object-contain scale-x-[-1]")}
                    />
                  )}
                  {!isScreenSharing && (
                    <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm pointer-events-none">
                      <Video className="w-4 h-4" />
                      <span className="text-xs font-bold">Kamera Anda</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-2 pointer-events-none">
                    {!isMicOn && <MicOff className="w-3 h-3 text-red-400" />}
                    {schedule.tutor?.full_name?.split(' ')[0]}
                  </div>
                </div>
              </Draggable>
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
              <button 
                onClick={() => { setShowManageStudents(!showManageStudents); setShowSettings(false); }}
                className="h-10 px-3 rounded-lg font-bold flex items-center gap-2 transition-all bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm text-sm"
              >
                <Users className="w-4 h-4 text-blue-500" />
                <span className="hidden lg:inline">Kelola Siswa ({onlineUsers.length})</span>
              </button>
              <button 
                onClick={() => { setShowSettings(!showSettings); setShowManageStudents(false); }}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm"
              >
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
          
          <div className="flex-1 p-4 flex flex-col items-center justify-center text-center overflow-y-auto">
             {messages.length === 0 ? (
               <div className="flex flex-col items-center opacity-50">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                   <MessageSquare className="w-8 h-8 text-blue-400" />
                 </div>
                 <p className="text-sm font-medium text-slate-500">Belum ada obrolan.</p>
               </div>
             ) : (
               <div className="w-full h-full flex flex-col gap-3 justify-end items-start text-left">
                 {messages.map((msg) => (
                   <div key={msg.id} className={cn("max-w-[85%] p-3 rounded-2xl text-sm", msg.isHost ? "bg-blue-100 text-blue-900 self-end rounded-br-sm" : "bg-slate-100 text-slate-800 self-start rounded-bl-sm")}>
                     <div className="flex justify-between items-end gap-2 mb-1">
                       <span className="font-bold text-xs">{msg.sender}</span>
                       <span className="text-[10px] opacity-60">{msg.time}</span>
                     </div>
                     <p>{msg.text}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* Quick Actions (Poll, Activity) */}
          <div className="px-4 pb-2 shrink-0 flex flex-col gap-2">
            {raisedHands.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-left text-xs mb-2">
                <p className="font-bold text-amber-800 mb-1">Antrean Bertanya ({raisedHands.length}):</p>
                {raisedHands.map((h, i) => (
                  <div key={i} className="flex justify-between items-center bg-white px-2 py-1.5 rounded shadow-sm mb-1">
                    <span className="font-bold text-slate-700 truncate mr-2">{h.studentName}</span>
                    <button 
                      onClick={() => {
                        channelRef.current?.send({ type: 'broadcast', event: 'accept_hand_raise', payload: { id: h.id } });
                        setRaisedHands(prev => prev.filter(r => r.id !== h.id));
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[10px] font-bold shrink-0"
                    >
                      Panggil
                    </button>
                  </div>
                ))}
              </div>
            )}
            {Object.keys(pollResults).length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-left text-xs mb-2">
                <p className="font-bold text-indigo-800 mb-1">Hasil Polling Terakhir:</p>
                {pollForm.options.map((opt, idx) => {
                  if (!opt.trim()) return null;
                  const count = pollResults[idx] || 0;
                  return (
                    <div key={idx} className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-sm mb-1">
                      <span className="truncate flex-1 pr-2">{opt}</span>
                      <span className="font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <Button onClick={() => setShowPollModal(true)} variant="secondary" className="w-full h-8 text-xs font-bold gap-2 text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
              <MonitorPlay className="w-3 h-3" /> Buat Aktivitas / Polling
            </Button>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-4 border-t border-slate-100 bg-white shrink-0">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Kirim pesan ke kelas..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-3 pr-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
              <button type="submit" disabled={!chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50 transition-colors">
                Kirim
              </button>
            </div>
          </form>
        </aside>
      </div>

      {/* Modals Overlay for Settings/Students */}
      {(showManageStudents || showSettings || showPollModal) && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => {setShowManageStudents(false); setShowSettings(false); setShowPollModal(false);}} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-600">
              <X className="w-4 h-4" />
            </button>
            
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                {showManageStudents && <><Users className="w-5 h-5 text-blue-500" /> Kelola Siswa</>}
                {showSettings && <><Settings className="w-5 h-5 text-slate-500" /> Pengaturan A/V</>}
                {showPollModal && <><MonitorPlay className="w-5 h-5 text-indigo-500" /> Buat Aktivitas/Polling</>}
              </h2>

              {showPollModal && (
                <form onSubmit={handlePushPoll} className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Pertanyaan / Instruksi</label>
                    <textarea 
                      value={pollForm.question}
                      onChange={e => setPollForm({...pollForm, question: e.target.value})}
                      placeholder="Ketik pertanyaan untuk siswa..."
                      className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Pilihan Jawaban</label>
                    <div className="space-y-2 mb-2">
                      {pollForm.options.map((opt, idx) => (
                        <input 
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newOpts = [...pollForm.options];
                            newOpts[idx] = e.target.value;
                            setPollForm({...pollForm, options: newOpts});
                          }}
                          placeholder={`Pilihan ${idx + 1}`}
                          className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      ))}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setPollForm({...pollForm, options: [...pollForm.options, ""]})}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      + Tambah Pilihan
                    </button>
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl mt-4">
                    Kirim Sekarang
                  </Button>
                </form>
              )}

              {showManageStudents && (
                <div className="space-y-4">
                  {onlineUsers.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-4">Belum ada siswa yang bergabung secara interaktif.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-600">{onlineUsers.length} Siswa Hadir</p>
                      {onlineUsers.map((u: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              <UserCircle2 className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-sm text-slate-700">{u.name}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full">Hadir</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showSettings && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Pilih Kamera</label>
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm">
                      <option>Kamera Default Sistem</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-2">Efek Wajah / Avatar AR</label>
                    <select className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm">
                      <option>Tanpa Efek (Normal)</option>
                      <option>VTuber Anime Model</option>
                      <option>Filter Kucing Lucu</option>
                      <option>Latar Belakang Kabur</option>
                    </select>
                    <p className="text-xs text-indigo-500 mt-2 font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Fitur Avatar didukung oleh MediaPipe
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
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
         participantName: (user as any)?.user_metadata?.full_name || 'Tutor',
         participantId: user?.id,
         isTutor: true
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
      <TutorOnlineClassStageInner params={params} />
    </LiveKitRoom>
  );
}
