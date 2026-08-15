"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Check, X as XIcon, User, Calendar, Clock, Users, Star } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase";

export default function OperatorKlinikPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const supabase = createClient();

  const fetchClinics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tutor_clinics")
      .select(`
        *,
        student:profiles!tutor_clinics_student_id_fkey(full_name),
        tutor:profiles!tutor_clinics_tutor_id_fkey(full_name),
        branch:nia_branches(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal memuat data klinik");
    } else if (data) {
      setClinics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("tutor_clinics")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Gagal mengubah status: " + error.message);
    } else {
      toast.success(`Klinik berhasil di-${status}`);
      fetchClinics();
    }
  };

  const filteredClinics = clinics.filter(c => c.status === filter);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Klinik Tanya Tutor</h1>
        <p className="text-slate-500 font-medium">Persetujuan dan pemantauan Klinik Tanya Tutor siswa.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'approved', 'completed', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${filter === status ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : filteredClinics.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Tidak ada data klinik dengan status {filter}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClinics.map(clinic => (
            <Card key={clinic.id} className="p-6 flex flex-col h-full border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black text-lg text-slate-900">{clinic.subject}</h3>
                  <p className="text-slate-600 font-medium">{clinic.topic}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{clinic.branch?.name}</div>
                  <div className="text-xs text-slate-500">{new Date(clinic.created_at).toLocaleDateString('id-ID')}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-600">Siswa:</span>
                  <span className="font-bold text-slate-900">{clinic.student?.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-600">Tutor:</span>
                  <span className="font-bold text-slate-900">{clinic.tutor?.full_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm pt-1">
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
                    <span className="font-bold text-slate-700">{clinic.student_count} Org</span>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex-1">
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Bantuan yang diminta:</div>
                <p className="text-sm text-slate-700">{clinic.help_needed}</p>
              </div>

              {clinic.status === 'completed' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Rating Siswa:</span>
                    {clinic.rating ? (
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`w-4 h-4 ${star <= clinic.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-slate-300'}`} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Belum di-rating</span>
                    )}
                  </div>
                </div>
              )}

              {filter === 'pending' && (
                <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
                  <Button 
                    onClick={() => handleUpdateStatus(clinic.id, 'rejected')}
                    variant="ghost" 
                    className="flex-1 border-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XIcon className="w-4 h-4 mr-2" /> Tolak
                  </Button>
                  <Button 
                    onClick={() => handleUpdateStatus(clinic.id, 'approved')}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  >
                    <Check className="w-4 h-4 mr-2" /> Setujui
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
