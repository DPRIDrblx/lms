import re

with open(r"src\app\(dashboard)\student\jadwal-les\[id]\online\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
imports_to_add = """import { LiveKitRoom, useTracks, VideoTrack, RoomAudioRenderer } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
"""
content = content.replace('import { CenterLoader } from "@/components/ui/center-loader";', imports_to_add + 'import { CenterLoader } from "@/components/ui/center-loader";')

# 2. Rename component
content = content.replace("export default function StudentOnlineClassStage", "function StudentOnlineClassStageInner")

# 3. Add wrapper at bottom
wrapper = """
export default function StudentOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!resolvedParams.id || !user) return;
    fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         roomName: `room_${resolvedParams.id}`,
         participantName: (user as any)?.full_name || 'Siswa',
         participantId: user?.id,
         isTutor: false
      })
    }).then(r => r.json()).then(d => {
       if (d.token) setToken(d.token);
    });
  }, [resolvedParams.id, user]);

  if (!token) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><CenterLoader size="lg" /></div>;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
    >
      <StudentOnlineClassStageInner params={params} />
    </LiveKitRoom>
  );
}
"""
content += wrapper

# 4. Replace video preview
old_video_block = """              <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">
                Tutor {schedule.tutor?.full_name?.split(' ')[0] || ''}
              </h2>
              {tutorState.isScreenSharing ? (
                <p className="text-blue-400 font-bold bg-blue-900/30 px-4 py-2 rounded-lg">Memulai Share Screen...</p>
              ) : tutorState.isCameraOn ? (
                <p className="text-emerald-400 font-bold bg-emerald-900/30 px-4 py-2 rounded-lg">Tutor sedang menyalakan kamera...</p>
              ) : (
                <p className="text-slate-400 font-medium">Video Tutor akan muncul di sini saat sesi dimulai.</p>
              )}"""

new_video_block = """              <TutorStreamRenderer schedule={schedule} tutorState={tutorState} />"""
content = content.replace(old_video_block, new_video_block)

renderer_component = """
function TutorStreamRenderer({ schedule, tutorState }: { schedule: any, tutorState: any }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: true });
  const screenTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const camTrack = tracks.find(t => t.source === Track.Source.Camera);

  if (screenTrack) {
    return (
      <>
        <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain absolute inset-0" />
        <RoomAudioRenderer />
      </>
    );
  }

  if (camTrack) {
    return (
      <>
        <VideoTrack trackRef={camTrack} className="w-full h-full object-cover absolute inset-0" />
        <RoomAudioRenderer />
      </>
    );
  }

  return (
    <>
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
"""
content = content.replace('export default function StudentOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {', renderer_component + '\nexport default function StudentOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {')

with open(r"src\app\(dashboard)\student\jadwal-les\[id]\online\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
