"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, UserPlus, ArrowRight, CheckCircle2, Building, DoorOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";

export default function TutorSchedulesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    setLoading(true);
    // Fetch upcoming center schedules
    const { data, error } = await supabase
      .from("center_schedules")
      .select("*, classes(name), tutor:tutor_id(full_name), branch:branch_id(name), room:room_id(room_number)")
      .order("schedule_time", { ascending: true });

    if (data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimingSchedule, setClaimingSchedule] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  const handleOpenClaimModal = async (sched: any) => {
    setClaimingSchedule(sched);
    setSelectedRoomId("");
    setIsClaimModalOpen(true);
    
    if (sched.branch_id) {
      setLoadingRooms(true);
      const { data } = await supabase
        .from("branch_rooms")
        .select("*")
        .eq("branch_id", sched.branch_id)
        .order("floor", { ascending: true })
        .order("room_number", { ascending: true });
      if (data) setAvailableRooms(data);
      setLoadingRooms(false);
    } else {
      setAvailableRooms([]);
    }
  };

  const claimSchedule = async () => {
    if (!profile || !claimingSchedule) return;
    
    if (claimingSchedule.branch_id && !selectedRoomId) {
      toast.error("Silakan pilih ruangan terlebih dahulu.");
      return;
    }

    const toastId = toast.loading("Mengklaim jadwal...");
    
    const { error } = await supabase
      .from("center_schedules")
      .update({ 
        tutor_id: profile.id, 
        status: 'scheduled',
        room_id: selectedRoomId || null
      })
      .eq("id", claimingSchedule.id)
      .is("tutor_id", null); // Ensure it's not already claimed

    if (error) {
      toast.error("Gagal mengklaim jadwal. Mungkin sudah diklaim tutor lain.", { id: toastId });
    } else {
      toast.success("Jadwal berhasil diklaim!", { id: toastId });
      setIsClaimModalOpen(false);
      fetchSchedules();
    }
  };

  if (loading) {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const mySchedules = schedules.filter(s => s.tutor_id === profile?.id);
  const openSchedules = schedules.filter(s => !s.tutor_id);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Jadwal Ajar</h1>
        <p className="text-slate-500 font-medium">Kelola kelas bimbingan Anda atau klaim jadwal baru yang tersedia.</p>
      </div>

      {mySchedules.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-500" /> Kelas Saya
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mySchedules.map(sched => (
              <Card key={sched.id} className="p-5 border-l-4 border-l-teal-500 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{sched.title}</h3>
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100 whitespace-nowrap">
                      {sched.classes?.name || 'Umum'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(sched.schedule_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(sched.schedule_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                    {sched.branch && (
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold pt-1">
                        <MapPin className="w-4 h-4" />
                        Cabang {sched.branch.name}
                        {sched.room && <span> • Ruang {sched.room.room_number}</span>}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                  <Button 
                    onClick={() => router.push(`/tutor/schedules/${sched.id}`)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    Masuk Workspace <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" /> Jadwal Tersedia
        </h2>
        {openSchedules.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">Tidak ada jadwal kosong saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openSchedules.map(sched => (
              <Card key={sched.id} className="p-5 flex flex-col h-full hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 line-clamp-2">{sched.title}</h3>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap">
                      {sched.classes?.name || 'Umum'}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 mt-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(sched.schedule_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(sched.schedule_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </div>
                    {sched.branch && (
                      <div className="flex items-center gap-2 text-indigo-600 font-semibold pt-1">
                        <MapPin className="w-4 h-4" />
                        Cabang {sched.branch.name}
                      </div>
                    )}
                    {sched.description && (
                      <p className="text-slate-500 italic mt-2 line-clamp-2 text-xs">"{sched.description}"</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button 
                    onClick={() => handleOpenClaimModal(sched)}
                    variant="secondary"
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Klaim Jadwal Ini
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Claim Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Klaim Jadwal"
      >
        {claimingSchedule && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-2">{claimingSchedule.title}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Calendar className="w-4 h-4" />
                {new Date(claimingSchedule.schedule_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                <Clock className="w-4 h-4" />
                {new Date(claimingSchedule.schedule_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
              {claimingSchedule.branch && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-bold mt-2">
                  <MapPin className="w-4 h-4" />
                  Cabang: {claimingSchedule.branch.name}
                </div>
              )}
            </div>

            {claimingSchedule.branch_id ? (
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">Pilih Ruangan <span className="text-red-500">*</span></label>
                {loadingRooms ? (
                  <div className="h-20 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : availableRooms.length === 0 ? (
                  <div className="p-4 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-100">
                    Cabang ini belum memiliki ruangan yang terdaftar. Hubungi admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableRooms.map(room => (
                      <label 
                        key={room.id}
                        className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRoomId === room.id 
                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                            : 'border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <input 
                          type="radio"
                          name="room"
                          className="hidden"
                          checked={selectedRoomId === room.id}
                          onChange={() => setSelectedRoomId(room.id)}
                        />
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <DoorOpen className="w-4 h-4" />
                          Ruang {room.room_number}
                        </div>
                        <div className="text-xs opacity-70">
                          Lantai {room.floor} • Kapasitas: {room.capacity}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                Jadwal ini belum memiliki data Cabang.
              </div>
            )}

            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-6 rounded-xl"
              onClick={claimSchedule}
              disabled={claimingSchedule.branch_id && !selectedRoomId}
            >
              Konfirmasi Klaim
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
