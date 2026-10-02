"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export default function QRScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  
  useEffect(() => {
    async function fetchSchedule() {
      const { data } = await supabase
        .from("center_schedules")
        .select("*")
        .eq("id", resolvedParams.id)
        .single();
      
      setSchedule(data);
      setLoading(false);
    }
    fetchSchedule();
  }, [resolvedParams.id]);

  const handleScan = async (detectedCodes: { rawValue: string }[]) => {
    if (!scanning || detectedCodes.length === 0) return;
    
    const decodedText = detectedCodes[0].rawValue;
    if (!decodedText) return;
    
    setScanning(false);
    
    if (!schedule || !profile) {
      toast.error("Gagal memuat data kelas atau user.");
      router.push(`/student/jadwal-les/${resolvedParams.id}`);
      return;
    }

    try {
      const data = JSON.parse(decodedText);
      if (data.type !== 'attendance' || data.scheduleId !== schedule.id) {
        toast.error("QR Code tidak valid untuk sesi ini.");
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      // Verify the time-based token
      const rawString = atob(data.token);
      const [id, timeChunkStr] = rawString.split('-');
      if (id !== schedule.id) {
        toast.error("QR Code tidak valid.");
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      const timeChunk = parseInt(timeChunkStr, 10);
      const currentChunk = Math.floor(Date.now() / 10000);
      
      // Allow +- 12 chunks for latency and device clock skew (2 minutes window)
      if (Math.abs(currentChunk - timeChunk) > 12) {
        toast.error("QR Code sudah kedaluwarsa. Silakan scan ulang QR terbaru di layar.");
        setTimeout(() => setScanning(true), 2000);
        return;
      }

      if (schedule.is_attendance_closed) {
        toast.error("Presensi sudah ditutup oleh Tutor");
        router.push(`/student/jadwal-les/${resolvedParams.id}`);
        return;
      }

      toast.loading("Memproses presensi...", { id: "attendance" });

      const { data: attData, error } = await supabase
        .from("center_schedule_attendances")
        .upsert({
          schedule_id: schedule.id,
          student_id: profile.id,
          status: "hadir"
        }, { onConflict: 'schedule_id, student_id' })
        .select()
        .single();

      if (error) {
        toast.error(error.message, { id: "attendance" });
        setTimeout(() => setScanning(true), 2000);
      } else {
        toast.success("Berhasil presensi kehadiran! +2 Bintang 🌟", { id: "attendance" });
        
        // Give 2 stars automatically
        const { data: existing } = await supabase
          .from("student_stars")
          .select("id, stars")
          .eq("schedule_id", schedule.id)
          .eq("student_id", profile.id)
          .single();
          
        if (existing) {
          await supabase.from("student_stars").update({ stars: existing.stars + 2 }).eq("id", existing.id);
        } else {
          await supabase.from("student_stars").insert({
            student_id: profile.id,
            schedule_id: schedule.id,
            stars: 2
          });
        }

        router.push(`/student/jadwal-les/${resolvedParams.id}`);
      }

    } catch (e) {
      toast.error("Format QR Code tidak dikenali.");
      setTimeout(() => setScanning(true), 2000);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-slate-900 z-[100] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center">
      <div className="w-full p-4 flex items-center justify-between text-white absolute top-0 left-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" className="text-white hover:bg-white/20 p-2 h-auto rounded-full" onClick={() => router.push(`/student/jadwal-les/${resolvedParams.id}`)}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          <span className="font-bold tracking-wider uppercase text-sm">Scan Presensi</span>
        </div>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 w-full flex items-center justify-center bg-black">
        <div className="w-full max-w-lg aspect-square relative overflow-hidden">
          {scanning ? (
            <Scanner 
              onScan={handleScan}
              onError={(error) => {
                console.error(error);
                toast.error("Kamera gagal dimuat atau tidak diizinkan.");
              }}
              components={{
                finder: true,
                onOff: true,
              }}
              styles={{
                container: { width: "100%", height: "100%" }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
          )}
        </div>
      </div>
      
      <div className="p-8 pb-12 text-center text-slate-300 w-full max-w-md mx-auto">
        <p className="font-medium">
          Arahkan kamera ke QR Code yang ditampilkan oleh Tutor di layar depan kelas.
        </p>
      </div>
    </div>
  );
}
