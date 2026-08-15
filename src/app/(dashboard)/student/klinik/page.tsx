"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { BookOpen, Calendar, Clock, CheckCircle2, ChevronRight, Star, AlertCircle, Plus, Users } from "lucide-react";
import { CenterLoader } from "@/components/ui/center-loader";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

export default function KlinikTanyaTutorPage() {
  const { profile } = useAuth();
  const { uiMode } = useTheme();
  const supabase = createClient();
  const [clinics, setClinics] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-20">
      {uiMode === 'clean' ? (
        <div className="mb-6 pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Klinik Tanya Tutor</h1>
            <p className="text-slate-500 mt-1">Pesan waktu khusus dengan tutor untuk membahas materi secara privat.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-11 px-5 rounded-lg shrink-0 shadow-sm transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Pesan Klinik
          </Button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border-b-4 border-emerald-600">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/30">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Klinik Tanya Tutor</h1>
              <p className="text-emerald-50 font-medium text-lg">Pesan waktu khusus dengan tutor untuk membahas materi yang belum dipahami secara privat atau kelompok kecil.</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold h-12 px-6 rounded-xl shrink-0 border-2 border-transparent hover:border-emerald-200 shadow-md transition-all"
            >
              <Plus className="w-5 h-5 mr-2" /> Buat Pesanan Baru
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          Riwayat Pengajuan
        </h2>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <CenterLoader size="md" />
          </div>
        ) : clinics.length > 0 ? (
          clinics.map(clinic => {
            const date = new Date(clinic.schedule_date);
            
            return (
              <Card 
                key={clinic.id} 
                className={cn(
                  "p-0 flex flex-col sm:flex-row items-stretch cursor-pointer transition-all overflow-hidden group",
                  uiMode === 'clean'
                    ? "border border-slate-200 bg-white hover:border-teal-400 shadow-sm"
                    : "border-2 border-slate-200 hover:scale-[1.01] hover:border-teal-300 hover:shadow-lg"
                )}
                onClick={() => {
                  setSelectedClinic(clinic);
                  setIsDetailModalOpen(true);
                }}
              >
                <div className={cn(
                  "w-full sm:w-28 p-6 flex flex-row sm:flex-col items-center justify-center shrink-0 gap-3 border-b sm:border-b-0 sm:border-r border-slate-100 transition-colors",
                  uiMode === 'clean'
                    ? "bg-slate-50 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700"
                    : "bg-slate-50 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700"
                )}>
                  <span className={cn("text-sm uppercase", uiMode === 'clean' ? "font-semibold" : "font-bold")}>{date.toLocaleDateString('id-ID', { month: 'short' })}</span>
                  <span className={cn("text-3xl sm:text-4xl leading-none", uiMode === 'clean' ? "font-bold" : "font-black")}>{date.getDate()}</span>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-2">
                    <div>
                      <h3 className={cn("text-xl text-slate-800 transition-colors", uiMode === 'clean' ? "font-semibold group-hover:text-teal-600" : "font-black group-hover:text-teal-600")}>{clinic.subject}</h3>
                      <p className="text-slate-500 font-medium line-clamp-1">{clinic.topic}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(clinic.status)}`}>
                      {getStatusLabel(clinic.status)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-auto pt-4">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {clinic.schedule_time.substring(0, 5)} WIB
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <Users className="w-4 h-4 text-indigo-500" />
                      {clinic.student_count} Siswa
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      Tutor: {clinic.tutor?.full_name || 'Menunggu'}
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:flex items-center justify-center p-6 text-slate-300 group-hover:text-teal-500 transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-1">Belum Ada Pengajuan</h3>
            <p className="text-slate-500">Anda belum pernah mengajukan Klinik Tanya Tutor.</p>
          </div>
        )}
      </div>

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

              {/* Rating Section */}
              {selectedClinic.status === 'completed' && (
                <div className="border-t border-slate-100 pt-6">
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h4 className="font-black text-amber-900 mb-1 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-600" /> Penilaian Klinik
                      </h4>
                      <p className="text-sm text-amber-800/80 font-medium">
                        {selectedClinic.rating 
                          ? "Terima kasih atas penilaian Anda." 
                          : "Beri penilaian untuk sesi klinik ini:"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = selectedClinic.rating || 0;
                        const isFilled = star <= (ratingHover || currentRating);
                        return (
                          <button
                            key={star}
                            disabled={!!selectedClinic.rating} // disabled if already rated
                            className={`p-1 transition-transform ${!selectedClinic.rating ? 'hover:scale-110' : 'cursor-default'}`}
                            onMouseEnter={() => !selectedClinic.rating && setRatingHover(star)}
                            onMouseLeave={() => !selectedClinic.rating && setRatingHover(0)}
                            onClick={() => handleRate(star)}
                          >
                            <Star 
                              className={`w-8 h-8 ${isFilled ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'fill-transparent text-slate-300'}`} 
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
    </div>
  );
}
