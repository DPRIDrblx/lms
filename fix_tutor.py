import re

with open(r"src\app\tutor\schedules\[id]\online\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
imports_to_add = """import { LiveKitRoom, useLocalParticipant, VideoTrack } from "@livekit/components-react";
import "@livekit/components-styles";
"""
content = content.replace('import { CenterLoader } from "@/components/ui/center-loader";', imports_to_add + 'import { CenterLoader } from "@/components/ui/center-loader";')

# 2. Rename component
content = content.replace("export default function TutorOnlineClassStage", "function TutorOnlineClassStageInner")

# 3. Add wrapper at bottom
wrapper = """
export default function TutorOnlineClassStage({ params }: { params: Promise<{ id: string }> }) {
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
         participantName: (user as any)?.full_name || 'Tutor',
         participantId: user?.id,
         isTutor: true
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
      <TutorOnlineClassStageInner params={params} />
    </LiveKitRoom>
  );
}
"""
content += wrapper

# 4. Replace video elements in JSX
old_video_block = """              {/* Show local stream */}
              {isScreenSharing ? (
                <video ref={screenRef} autoPlay playsInline muted className="w-full h-full object-contain" />
              ) : isCameraOn ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              ) : ("""
new_video_block = """              {/* Show local stream via LiveKit */}
              {isScreenSharing && screenShareTrack ? (
                <VideoTrack trackRef={screenShareTrack} className="w-full h-full object-contain" />
              ) : isCameraOn && cameraTrack ? (
                <VideoTrack trackRef={cameraTrack} className="w-full h-full object-cover scale-x-[-1]" />
              ) : ("""
content = content.replace(old_video_block, new_video_block)

# 5. Remove all the old AV state and replace with useLocalParticipant
pattern = r"// AV State.*?const stopAllStreams = \(\) => \{.*?\};"
replacement = """// AV State
  const { localParticipant, cameraTrack, microphoneTrack, screenShareTrack } = useLocalParticipant();
  const isCameraOn = !!cameraTrack;
  const isMicOn = !!microphoneTrack;
  const isScreenSharing = !!screenShareTrack;

  const toggleCamera = async () => {
    if (cameraTrack) {
      await localParticipant.setCameraEnabled(false);
    } else {
      await localParticipant.setCameraEnabled(true);
    }
  };

  const toggleMic = async () => {
    if (microphoneTrack) {
      await localParticipant.setMicrophoneEnabled(false);
    } else {
      await localParticipant.setMicrophoneEnabled(true);
    }
  };

  const toggleScreenShare = async () => {
    if (screenShareTrack) {
      await localParticipant.setScreenShareEnabled(false);
    } else {
      await localParticipant.setScreenShareEnabled(true);
    }
  };

  const stopAllStreams = async () => {
    if (cameraTrack) await localParticipant.setCameraEnabled(false);
    if (microphoneTrack) await localParticipant.setMicrophoneEnabled(false);
    if (screenShareTrack) await localParticipant.setScreenShareEnabled(false);
  };"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Fix cleanup function issue: we replaced stopAllStreams, but we also had useEffects for streams
# We need to remove these carefully
cleanup_effects = r"useEffect\(\(\) => \{\n    // Attach stream to video element.*?\n  \}, \[isCameraOn, isScreenSharing\]\);"
content = re.sub(cleanup_effects, "", content, flags=re.DOTALL)

with open(r"src\app\tutor\schedules\[id]\online\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
