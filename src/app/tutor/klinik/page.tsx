"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Loader2, BookOpen, User, Calendar, Clock, Users, Edit3, CheckCircle2, Star, MapPin, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const PREDEFINED_BANNERS = [
  "BAHASA INDONESIA.png",
  "BAHASA INGGRIS.png",
  "DASAR PEMROGRAMAN.png",
  "DESIGN GRAFIS & UI_UX APLIKASI.png",
  "IPA.png",
  "IPS.png",
  "KEAMANAN SIBER.png",
  "LOGIKA & ALGORITMA DIGITAL.png",
  "Matematika.png",
  "PENGEMBANGAN GAME KOMPUTER DASAR.png",
  "PENGENALAN IOT & SENSOR.png",
  "PPKN.png",
  "TES MINAT BAKAT.png",
  "TRYOUT.png",
  "NTC SKILL UP.png",
  "Skill Up Agustusan.png"
];

export default function TutorKlinikPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  
  // Form states
  const [clinicPlan, setClinicPlan] = useState("");
  const [clinicReport, setClinicReport] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClinics = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tutor_clinics")
      .select(`
        *,
        student:profiles!tutor_clinics_student_id_fkey(full_name),
        branch:nia_branches(name)
      `)
      .eq("tutor_id", profile.id)
      .in("status", ["approved", "completed"])
      .order("schedule_date", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data klinik");
    } else if (data) {
      setClinics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
  }, [profile?.id, supabase]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from("tutor_clinics")
      .update({ clinic_plan: clinicPlan })
      .eq("id", selectedClinic.id);

    setIsSubmitting(false);
    if (error) {
      toast.error("Gagal menyimpan rencana klinik: " + error.message);
    } else {
      toast.success("Rencana klinik berhasil disimpan!");
      setIsPlanModalOpen(false);
      fetchClinics();
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from("tutor_clinics")
      .update({ 
        clinic_report: clinicReport,
        status: "completed"
      })
      .eq("id", selectedClinic.id);

    setIsSubmitting(false);
    if (error) {
      toast.error("Gagal menyelesaikan klinik: " + error.message);
    } else {
      toast.success("Klinik berhasil diselesaikan!");
      setIsReportModalOpen(false);
      fetchClinics();
    }
  };
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinic) return;
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from("tutor_clinics")
      .update({ banner_url: bannerUrl || null })
      .eq("id", selectedClinic.id);

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Banner berhasil diubah!");
      setIsBannerModalOpen(false);
      fetchClinics();
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Klinik Tanya Tutor</h1>
        <p className="text-slate-500 font-medium">Jadwal klinik yang ditugaskan kepada Anda.</p>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : clinics.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Belum ada jadwal klinik untuk Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clinics.map(clinic => {
            const isCompleted = clinic.status === 'completed';
            
            return (
              <Card key={clinic.id} className="p-6 flex flex-col h-full border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg text-slate-900">{clinic.subject}</h3>
                    <p className="text-slate-600 font-medium">{clinic.topic}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCompleted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {isCompleted ? 'Selesai' : 'Disetujui'}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Siswa:</span>
                    </div>
                    <span className="font-bold text-slate-900">{clinic.student?.full_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-600">Cabang:</span>
                    </div>
                    <span className="font-bold text-slate-900">{clinic.branch?.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 text-sm pt-2 border-t border-slate-200/60 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-slate-700">{new Date(clinic.schedule_date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-700">{clinic.schedule_time.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-slate-700">{clinic.student_count} Siswa</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">Bantuan yang diminta:</div>
                  <p className="text-sm text-slate-700">{clinic.help_needed}</p>
                </div>

                {isCompleted && clinic.rating && (
                  <div className="mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-800">Rating Siswa:</span>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= clinic.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setSelectedClinic(clinic);
                      setBannerUrl(clinic.banner_url || "");
                      setIsBannerModalOpen(true);
                    }}
                    variant="ghost"
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    <ImageIcon className="w-4 h-4 mr-2 text-slate-400" /> Ubah Banner
                  </Button>
                  {!isCompleted && (
                    <>
                      <Button 
                        onClick={() => {
                          setSelectedClinic(clinic);
                          setClinicPlan(clinic.clinic_plan || "");
                          setIsPlanModalOpen(true);
                        }}
                        variant="ghost" 
                        className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit3 className="w-4 h-4 mr-2" /> {clinic.clinic_plan ? "Ubah Rencana Klinik" : "Isi Rencana Klinik"}
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedClinic(clinic);
                          setClinicReport(clinic.clinic_report || "");
                          setIsReportModalOpen(true);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                        disabled={!clinic.clinic_plan}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Selesaikan & Laporan
                      </Button>
                      {!clinic.clinic_plan && (
                        <p className="text-[10px] text-center text-slate-400 font-medium">Isi rencana klinik terlebih dahulu untuk menyelesaikan.</p>
                      )}
                    </>
                  )}
                  
                  {isCompleted && (
                    <Button 
                      onClick={() => {
                        setSelectedClinic(clinic);
                        setClinicReport(clinic.clinic_report || "");
                        setIsReportModalOpen(true);
                      }}
                      variant="secondary"
                      className="w-full"
                    >
                      Lihat Laporan Saya
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Rencana Klinik">
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Apa rencana Anda untuk sesi ini?</label>
            <textarea 
              value={clinicPlan}
              onChange={e => setClinicPlan(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-medium h-32 resize-none" 
              placeholder="Contoh: Menggunakan metode A untuk menjelaskan konsep B..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsPlanModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-500 hover:bg-blue-600 text-white">Simpan Rencana</Button>
          </div>
        </form>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Laporan Hasil Klinik">
        <form onSubmit={handleSaveReport} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Laporan hasil pelaksanaan klinik</label>
            <textarea 
              value={clinicReport}
              onChange={e => setClinicReport(e.target.value)}
              disabled={selectedClinic?.status === 'completed'}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium h-32 resize-none disabled:opacity-70" 
              placeholder="Contoh: Siswa sudah memahami konsep dengan baik, perlu latihan tambahan di bagian..."
              required
            />
          </div>
          {selectedClinic?.status !== 'completed' && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-sm text-amber-800">
              <strong className="block mb-1">Perhatian!</strong>
              Menyimpan laporan ini akan mengubah status klinik menjadi <strong>Selesai</strong> dan tidak dapat diubah lagi.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsReportModalOpen(false)}>Tutup</Button>
            {selectedClinic?.status !== 'completed' && (
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600 text-white">Selesaikan Klinik</Button>
            )}
          </div>
        </form>
      </Modal>

      {/* Banner Modal */}
      <Modal isOpen={isBannerModalOpen} onClose={() => setIsBannerModalOpen(false)} title="Pilih Banner">
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Banner</label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
            >
              <option value="">-- Tanpa Banner --</option>
              {PREDEFINED_BANNERS.map(b => (
                <option key={b} value={`/banners/${b}`}>{b.replace('.png', '')}</option>
              ))}
            </select>
          </div>
          {bannerUrl && (
            <div className="w-full aspect-video rounded-xl bg-slate-100 overflow-hidden relative">
              <img src={bannerUrl} alt="Preview Banner" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsBannerModalOpen(false)}>Batal</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Banner"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
