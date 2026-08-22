"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, Star, AlertCircle, Plus, Users, Beaker, User, Loader2 } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";
import { TabsSlider, TabItem } from "@/components/ui/tabs-slider";
import { DateSlider, DateItem } from "@/components/ui/date-slider";

const TABS: TabItem[] = [
  { id: "tersedia", label: "Sesi Tersedia" },
  { id: "dipesan", label: "Sesi Dipesan" },
  { id: "riwayat", label: "Riwayat Sesi" }
];

const generateDates = (): DateItem[] => {
  const dates: DateItem[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      date: d,
      label: d.getDate().toString(),
      dayName: d.toLocaleDateString('id-ID', { weekday: 'short' })
    });
  }
  return dates;
};

export default function KlinikTanyaTutorPage() {
  const { profile } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const [clinics, setClinics] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout State
  const [activeTab, setActiveTab] = useState("tersedia");
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const dateItems = useMemo(() => generateDates(), []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedTutor, setSelectedTutor] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [studentCount, setStudentCount] = useState(1);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [helpNeeded, setHelpNeeded] = useState("");

  // Detail Modal State
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const fetchData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    // Fetch user's clinics
    const { data: clinicData } = await supabase
      .from("tutor_clinics")
      .select(`
        *,
        tutor:profiles!tutor_clinics_tutor_id_fkey(id, full_name),
        branch:nia_branches(id, name)
      `)
      .eq("student_id", profile.id)
      .order("created_at", { ascending: false });
      
    if (clinicData) setClinics(clinicData);

    // Fetch Tutors
    const { data: tutorData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "tutor");
    if (tutorData) setTutors(tutorData);

    // Fetch Branches
    const { data: branchData } = await supabase
      .from("nia_branches")
      .select("id, name")
      .eq("is_active", true);
    if (branchData) setBranches(branchData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile?.id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentCount < 1 || studentCount > 3) {
      toast.error("Jumlah siswa maksimal 3 orang.");
      return;
    }

    if (!selectedBranch || !selectedTutor || !scheduleDate || !scheduleTime || !subject || !topic || !helpNeeded) {
      toast.error("Mohon lengkapi semua data.");
      return;
    }

    setIsSubmitting(true);
    
    // Check quota
    const { data: todayClinics } = await supabase
      .from("tutor_clinics")
      .select("id")
      .eq("branch_id", selectedBranch)
      .eq("schedule_date", scheduleDate);
      
    if (todayClinics && todayClinics.length >= 15) {
      toast.error("Maaf, kuota klinik tanya tutor di cabang ini untuk tanggal tersebut sudah penuh (maks 15).");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("tutor_clinics")
      .insert({
        student_id: profile?.id,
        branch_id: selectedBranch,
        tutor_id: selectedTutor,
        schedule_date: scheduleDate,
        schedule_time: scheduleTime,
        student_count: studentCount,
        subject,
        topic,
        help_needed: helpNeeded
      });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil memesan jadwal Klinik Tanya Tutor!");
      setIsModalOpen(false);
      fetchData();
      
      // Reset form
      setSelectedBranch("");
      setSelectedTutor("");
      setScheduleDate("");
      setScheduleTime("");
      setStudentCount(1);
      setSubject("");
      setTopic("");
      setHelpNeeded("");
    }
  };

  const handleRate = async (rating: number) => {
    if (!selectedClinic || selectedClinic.status !== 'completed' || selectedClinic.rating) return;

    const { error } = await supabase
      .from("tutor_clinics")
      .update({ rating })
      .eq("id", selectedClinic.id);

    if (error) {
      toast.error("Gagal mengirim rating");
    } else {
      toast.success("Terima kasih atas penilaianmu!");
      setSelectedClinic({ ...selectedClinic, rating });
      fetchData();
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic || !rescheduleDate || !rescheduleTime) {
      toast.error("Mohon lengkapi tanggal dan waktu baru");
      return;
    }

    setIsSubmitting(true);
    
    // Check quota if date is changed
    if (rescheduleDate !== selectedClinic.schedule_date) {
      const { data: todayClinics } = await supabase
        .from("tutor_clinics")
        .select("id")
        .eq("branch_id", selectedClinic.branch_id)
        .eq("schedule_date", rescheduleDate);
        
      if (todayClinics && todayClinics.length >= 15) {
        toast.error("Maaf, kuota klinik tanya tutor di cabang ini untuk tanggal tersebut sudah penuh (maks 15).");
        setIsSubmitting(false);
        return;
      }
    }

    const { error } = await supabase
      .from("tutor_clinics")
      .update({ 
        schedule_date: rescheduleDate, 
        schedule_time: rescheduleTime + ":00",
        status: "pending" 
      })
      .eq("id", selectedClinic.id);

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil mengubah jadwal! Menunggu persetujuan tutor.");
      setIsRescheduleModalOpen(false);
      fetchData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Persetujuan';
      case 'approved': return 'Disetujui';
      case 'completed': return 'Selesai';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  // Filter logic
  const activeDateString = activeDate.toISOString().split('T')[0];
  
  const filteredClinics = clinics.filter(clinic => {
    const isPast = new Date(clinic.schedule_date) < new Date(new Date().setHours(0,0,0,0));
    
    if (activeTab === 'dipesan') {
      return clinic.schedule_date === activeDateString && clinic.status !== 'completed' && clinic.status !== 'rejected' && !isPast;
    } else if (activeTab === 'riwayat') {
      return clinic.status === 'completed' || clinic.status === 'rejected' || isPast;
    }
    return false; // tersedia uses a different empty state UI
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-2">
          <h1 className="text-[28px] font-black text-slate-800 tracking-tight">Klinik Tanya Tutor</h1>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border-b-4 border-emerald-600 mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Klinik Tanya Tutor</h1>
              <p className="text-emerald-50 font-medium text-lg">Pesan waktu khusus dengan tutor untuk membahas materi yang belum dipahami secara privat atau kelompok kecil.</p>
            </div>
          </div>
        </div>
      )}

      {uiMode === 'clean' && (
        <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden">
          <TabsSlider tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
          
          <div className="p-5 sm:p-6 bg-slate-50/50">
            {activeTab !== 'riwayat' && (
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 overflow-hidden">
                  <DateSlider dates={dateItems} activeDate={activeDate} onChange={setActiveDate} />
                </div>
                <div className="w-full md:w-48 shrink-0">
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 outline-none focus:border-[#108B96] bg-white">
                    <option value="">Pilih Mata Pelajaran</option>
                    <option value="matematika">Matematika</option>
                    <option value="fisika">Fisika</option>
                    <option value="biologi">Biologi</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'tersedia' ? (
              <div className="space-y-6">
                <div className="bg-[#E6F6F4] border border-[#B3E3DF] rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0">
                      <AlertCircle className="w-6 h-6 text-[#108B96]" />
                    </div>
                    <div>
                      <h3 className="text-[#0D6D76] font-bold text-[15px]">Belum ada jadwal yang cocok?</h3>
                      <p className="text-[#0D6D76]/80 text-[13px] font-medium">Request jadwal Klinik Tanya Tutor di sini!</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto bg-[#108B96] hover:bg-[#0D6D76] text-white font-bold h-11 px-6 rounded-xl shadow-sm transition-all"
                  >
                    Request Klinik Tanya Tutor
                  </Button>
                </div>
                
                <div className="text-center py-16 bg-white rounded-[20px] border border-dashed border-slate-200">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <BookOpen className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-700 mb-1">Belum Ada Sesi Tersedia</h3>
                  <p className="text-slate-500 text-[13px]">Silakan request jadwal terlebih dahulu menggunakan tombol di atas.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                  <div className="col-span-full flex flex-col justify-center items-center py-12">
                    <CenterLoader size="md" />
                  </div>
                ) : filteredClinics.length > 0 ? (
                  filteredClinics.map(clinic => {
                    const date = new Date(clinic.schedule_date);
                    
                    if (clinic.status === 'completed' || clinic.status === 'rejected') {
                      return (
                        <div key={clinic.id} className="bg-white rounded-[20px] border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all">
                          {clinic.banner_url ? (
                            <div className="h-32 relative overflow-hidden flex items-end p-5">
                              <img src={clinic.banner_url} alt={clinic.subject} className="absolute inset-0 w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                              <h2 className="text-white font-black text-3xl tracking-tight relative z-10">{clinic.subject}</h2>
                            </div>
                          ) : (
                            <div className="h-32 bg-[#70C16C] relative overflow-hidden flex items-end p-5">
                              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px'}}></div>
                              <div className="absolute right-2 bottom-0 opacity-20 pointer-events-none">
                                <Users className="w-32 h-32 text-white -mr-4 -mb-4" />
                              </div>
                              <h2 className="text-white font-black text-3xl tracking-tight relative z-10">{clinic.subject}</h2>
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">
                                {clinic.status === 'completed' ? 'Selesai' : 'Ditolak'}
                              </span>
                              {clinic.status === 'completed' && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Hadir
                                </span>
                              )}
                              {clinic.status === 'completed' && !clinic.rating && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-orange-100 text-[#E87525] uppercase tracking-wider">
                                  Belum isi rating
                                </span>
                              )}
                              {clinic.status === 'completed' && clinic.rating && (
                                <span className="px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">
                                  Sudah isi rating
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-[17px] font-black text-slate-800 mb-4 leading-tight">
                              Klinik Tanya Tutor - {clinic.subject}
                            </h3>
                            
                            <div className="space-y-2 mb-5">
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                {date.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                {clinic.schedule_time.substring(0, 5)} - {
                                  (() => {
                                    const [h, m] = clinic.schedule_time.substring(0,5).split(':').map(Number);
                                    const d = new Date();
                                    d.setHours(h, m + 45);
                                    return d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
                                  })()
                                } WIB
                              </div>
                              <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                  <User className="w-2.5 h-2.5 text-slate-500" />
                                </div>
                                {clinic.tutor?.full_name || 'Menunggu Konfirmasi Tutor'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                              <Button 
                                onClick={() => {
                                  setSelectedClinic(clinic);
                                  setIsDetailModalOpen(true);
                                }}
                                variant="ghost"
                                className={cn("border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 w-full h-11 rounded-[12px] text-[13px] font-bold", clinic.status === 'completed' && !clinic.rating ? "col-span-1" : "col-span-2")}
                              >
                                Lihat Detail
                              </Button>
                              {clinic.status === 'completed' && !clinic.rating && (
                                <Button 
                                  onClick={() => {
                                    setSelectedClinic(clinic);
                                    setIsDetailModalOpen(true);
                                  }}
                                  className="w-full h-11 bg-[#F16B25] hover:bg-[#D95F1E] text-white rounded-[12px] text-[13px] font-bold shadow-sm"
                                >
                                  Beri Rating
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={clinic.id} className="bg-white rounded-[20px] border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:border-[#108B96]/30 transition-all">
                        {clinic.banner_url ? (
                          <div className="h-28 relative overflow-hidden flex items-center justify-center">
                            <img src={clinic.banner_url} alt={clinic.subject} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="absolute top-3 left-3 relative z-10">
                              <span className={cn("px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-wider", 
                                clinic.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                              )}>
                                {getStatusLabel(clinic.status)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 bg-[#E6F6F4] relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                             <Beaker className="w-14 h-14 text-[#108B96]/30" />
                             <div className="absolute top-3 left-3">
                               <span className={cn("px-2.5 py-1 rounded-[8px] text-[10px] font-black uppercase tracking-wider", 
                                 clinic.status === 'approved' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                               )}>
                                 {getStatusLabel(clinic.status)}
                               </span>
                             </div>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-[17px] font-black text-slate-800 mb-1 leading-tight">{clinic.subject}</h3>
                          <p className="text-slate-500 text-[13px] font-medium line-clamp-2 mb-4 flex-1">{clinic.topic}</p>
                          
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </div>
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Clock className="w-4 h-4 text-slate-400" />
                              {clinic.schedule_time.substring(0, 5)} WIB
                            </div>
                            <div className="flex items-center gap-3 text-[13px] font-semibold text-slate-600">
                              <Users className="w-4 h-4 text-slate-400" />
                              {clinic.tutor?.full_name || 'Menunggu Konfirmasi Tutor'}
                            </div>
                          </div>
                          
                          <div className="mt-auto grid grid-cols-2 gap-2">
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClinic(clinic);
                                setRescheduleDate(clinic.schedule_date);
                                setRescheduleTime(clinic.schedule_time.substring(0, 5));
                                setIsRescheduleModalOpen(true);
                              }}
                              variant="secondary"
                              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 h-11 rounded-[12px] text-[13px] font-bold"
                            >
                              Ubah Jadwal
                            </Button>
                            <Button 
                              onClick={() => {
                                setSelectedClinic(clinic);
                                setIsDetailModalOpen(true);
                              }}
                              variant="ghost"
                              className="w-full border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 h-11 rounded-[12px] text-[13px] font-bold"
                            >
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-16 bg-white rounded-[20px] border border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Calendar className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-[17px] font-bold text-slate-700 mb-1">Belum Ada Pengajuan</h3>
                    <p className="text-slate-500 text-[13px]">Tidak ada sesi yang ditemukan pada filter ini.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Klinik Tanya Tutor"
        size="lg"
      >
        {selectedClinic && (() => {
          const dateObj = new Date(selectedClinic.schedule_date);

          return (
            <div className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">{selectedClinic.subject}</h2>
                  <p className="text-slate-600 font-medium mb-3">{selectedClinic.topic}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {selectedClinic.schedule_time.substring(0, 5)} WIB
                    </span>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusColor(selectedClinic.status)}`}>
                  {getStatusLabel(selectedClinic.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tutor yang ditunjuk</div>
                  <div className="font-bold text-slate-800">{selectedClinic.tutor?.full_name || '-'}</div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Siswa</div>
                  <div className="font-bold text-slate-800">{selectedClinic.student_count} Orang</div>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl md:col-span-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cabang</div>
                  <div className="font-bold text-slate-800">{selectedClinic.branch?.name || '-'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2">Bantuan yang Dibutuhkan</h4>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100">
                  {selectedClinic.help_needed}
                </div>
              </div>
              
              {selectedClinic.clinic_plan && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Rencana Klinik (Dari Tutor)
                  </h4>
                  <div className="bg-blue-50 p-4 rounded-xl text-blue-900 text-sm leading-relaxed whitespace-pre-wrap border border-blue-100">
                    {selectedClinic.clinic_plan}
                  </div>
                </div>
              )}

              {selectedClinic.clinic_report && (
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-black uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Laporan Hasil Klinik
                  </h4>
                  <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 text-sm leading-relaxed whitespace-pre-wrap border border-emerald-100">
                    {selectedClinic.clinic_report}
                  </div>
                </div>
              )}

              {/* Rating Section Redesigned */}
              {selectedClinic.status === 'completed' && (
                <div className="pt-2">
                  <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-[20px] flex flex-col sm:flex-row gap-5 items-center justify-between shadow-sm">
                    <div>
                      <h4 className="font-black text-amber-900 text-[17px] mb-1 flex items-center gap-2">
                        Beri Penilaian
                      </h4>
                      <p className="text-[13px] text-amber-800/80 font-semibold">
                        {selectedClinic.rating 
                          ? "Terima kasih atas penilaian Anda." 
                          : "Bagaimana pengalamanmu belajar di sesi ini?"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = selectedClinic.rating || 0;
                        const isFilled = star <= (ratingHover || currentRating);
                        return (
                          <button
                            key={star}
                            disabled={!!selectedClinic.rating}
                            className={`p-1 transition-transform ${!selectedClinic.rating ? 'hover:scale-110' : 'cursor-default'}`}
                            onMouseEnter={() => !selectedClinic.rating && setRatingHover(star)}
                            onMouseLeave={() => !selectedClinic.rating && setRatingHover(0)}
                            onClick={() => handleRate(star)}
                          >
                            <Star 
                              className={`w-10 h-10 ${isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'fill-transparent text-slate-300'}`} 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}
      </Modal>

      {/* Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pesan Klinik Tanya Tutor"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
            <p>Layanan ini <strong>gratis</strong> dengan kuota terbatas (maksimal 15 per hari per cabang). Maksimal 3 siswa per sesi.</p>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Cabang Center</label>
            <select 
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
              required
            >
              <option value="">Pilih Cabang</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal</label>
              <input 
                type="date" 
                value={scheduleDate}
                min={new Date().toISOString().split('T')[0]} // Cannot book past dates
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Waktu / Jam</label>
              <input 
                type="time" 
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Jumlah Siswa</label>
              <input 
                type="number" 
                min="1"
                max="3"
                value={studentCount}
                onChange={e => setStudentCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Maks 3 siswa</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Tutor yang dituju</label>
              <select 
                value={selectedTutor}
                onChange={e => setSelectedTutor(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
                required
              >
                <option value="">Pilih Tutor</option>
                {tutors.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Mata Pelajaran</label>
            <input 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
              placeholder="Contoh: Matematika"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Topik / Materi</label>
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium" 
              placeholder="Contoh: Persamaan Kuadrat"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Bantuan yang Dibutuhkan</label>
            <textarea 
              value={helpNeeded}
              onChange={e => setHelpNeeded(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 font-medium h-24 resize-none" 
              placeholder="Jelaskan secara singkat bagian mana yang tidak kamu mengerti..."
              required
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-6">
              {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
            </Button>
          </div>
          </form>
        </Modal>

      {/* Reschedule Modal */}
      {selectedClinic && (
        <Modal isOpen={isRescheduleModalOpen} onClose={() => setIsRescheduleModalOpen(false)} title="Ubah Jadwal Klinik">
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
              <p className="text-sm text-amber-800 font-medium">
                Mengubah jadwal akan mengembalikan status klinik menjadi <strong>Menunggu Persetujuan</strong>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tanggal Baru</label>
                <input 
                  type="date"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Jam Mulai Baru</label>
                <input 
                  type="time"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsRescheduleModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
