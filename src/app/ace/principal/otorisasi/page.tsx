"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Scale, CheckCircle2, XCircle, FileSignature } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrincipalOtorisasi() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [promotions, setPromotions] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending promotions
    const { data: promoData } = await supabase
      .from('ace_promotions')
      .select('*, profiles(full_name)')
      .eq('status', 'pending');
      
    if (promoData) setPromotions(promoData);

    // Fetch all teachers to review contract renewals and structural roles
    const { data: teacherData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('full_name');
      
    if (teacherData) {
      setTeachers(teacherData.filter((t: any) => t.employment_status === 'kontrak'));
      setAllStaff(teacherData);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleApprovePromotion = async (id: string, targetRole: string, teacherId: string) => {
    setProcessing(true);
    try {
      await supabase.from('ace_promotions').update({ status: 'approved' }).eq('id', id);
      setPromotions(prev => prev.filter(p => p.id !== id));
      alert("Kenaikan pangkat/jabatan telah disetujui dan disahkan.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectPromotion = async (id: string) => {
    setProcessing(true);
    try {
      await supabase.from('ace_promotions').update({ status: 'rejected' }).eq('id', id);
      setPromotions(prev => prev.filter(p => p.id !== id));
      alert("Pengajuan ditolak.");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleContractAction = async (teacherId: string, newStatus: string) => {
    setProcessing(true);
    try {
      await supabase.from('profiles').update({ employment_status: newStatus }).eq('id', teacherId);
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      alert(`Status kontrak guru berhasil diperbarui menjadi: ${newStatus}`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRoleAssignment = async (teacherId: string, roleType: 'is_hod' | 'is_hod_assistant' | 'is_assessment_head', currentValue: boolean) => {
    setProcessing(true);
    try {
      await supabase.from('profiles').update({ [roleType]: !currentValue }).eq('id', teacherId);
      setAllStaff(prev => prev.map(t => t.id === teacherId ? { ...t, [roleType]: !currentValue } : t));
      alert(`Jabatan struktural berhasil diperbarui.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!profile || profile.role !== 'principal') return null;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Otorisasi Hukum & Mutasi</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm">Pusat Persetujuan Keputusan Eksekutif</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Validasi Kenaikan Pangkat/Jabatan</h2>
              <p className="text-xs text-slate-500 font-medium">Antrean dari Kepala Tata Usaha</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : promotions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm font-medium text-slate-500">Tidak ada pengajuan validasi saat ini.</p>
              </div>
            ) : promotions.map(promo => (
              <div key={promo.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{promo.profiles?.full_name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Mengajukan Mutasi Ke: <span className="font-semibold text-indigo-600">{promo.target_role}</span></p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">Pending</span>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                  <button 
                    disabled={processing}
                    onClick={() => handleApprovePromotion(promo.id, promo.target_role, promo.teacher_id)}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white font-bold text-xs rounded shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileSignature className="w-3.5 h-3.5" /> E-Sign SK
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleRejectPromotion(promo.id)}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Otorisasi Kontrak Kerja</h2>
              <p className="text-xs text-slate-500 font-medium">Evaluasi Guru Berstatus Kontrak</p>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : teachers.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm font-medium text-slate-500">Seluruh guru saat ini berstatus tetap atau tidak ada kontrak yang perlu dievaluasi.</p>
              </div>
            ) : teachers.map(teacher => (
              <div key={teacher.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="font-bold text-slate-800 text-sm mb-1">{teacher.full_name}</h3>
                <p className="text-xs text-slate-500 mb-4">Status saat ini: <span className="font-medium">Kontrak</span></p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    disabled={processing}
                    onClick={() => handleContractAction(teacher.id, 'tetap')}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded hover:bg-emerald-200 transition-colors text-center"
                  >
                    Angkat Jadi Pegawai Tetap
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleContractAction(teacher.id, 'kontrak')}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded hover:bg-indigo-200 transition-colors text-center"
                  >
                    Perpanjang Kontrak 1 Thn
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleContractAction(teacher.id, 'non-aktif')}
                    className="col-span-2 px-3 py-1.5 bg-rose-100 text-rose-700 font-bold text-[11px] rounded hover:bg-rose-200 transition-colors text-center"
                  >
                    Putus Kontrak (Non-Aktifkan)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* New Card for Structural Assignment */}
        <Card className="p-6 rounded-lg border border-slate-200 shadow-sm bg-white lg:col-span-2">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Penunjukan Jabatan Struktural</h2>
              <p className="text-xs text-slate-500 font-medium">Angkat Guru Menjadi Kepala Departemen atau Asisten</p>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? <p className="text-xs text-slate-500">Memuat data...</p> : allStaff.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 text-center py-4">Belum ada guru yang terdaftar.</p>
            ) : allStaff.map(staff => (
              <div key={staff.id} className="flex flex-col md:flex-row items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="mb-3 md:mb-0 w-full md:w-auto">
                  <h3 className="font-bold text-slate-800 text-sm">{staff.full_name}</h3>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {staff.is_hod && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase">Kepala Departemen</span>}
                    {staff.is_hod_assistant && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-bold uppercase">Asisten HoD</span>}
                    {staff.is_assessment_head && <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold uppercase">Kepala Asesmen</span>}
                    {!staff.is_hod && !staff.is_hod_assistant && !staff.is_assessment_head && <span className="text-xs text-slate-500">Guru Reguler</span>}
                  </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    disabled={processing}
                    onClick={() => handleRoleAssignment(staff.id, 'is_hod', !!staff.is_hod)}
                    className={`flex-1 md:flex-none px-3 py-1.5 font-bold text-[11px] rounded transition-colors text-center border ${
                      staff.is_hod 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {staff.is_hod ? 'Cabut Posisi HoD' : 'Angkat Jadi HoD'}
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleRoleAssignment(staff.id, 'is_hod_assistant', !!staff.is_hod_assistant)}
                    className={`flex-1 md:flex-none px-3 py-1.5 font-bold text-[11px] rounded transition-colors text-center border ${
                      staff.is_hod_assistant 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                        : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {staff.is_hod_assistant ? 'Cabut Posisi Asisten' : 'Angkat Jadi Asisten'}
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleRoleAssignment(staff.id, 'is_assessment_head', !!staff.is_assessment_head)}
                    className={`flex-1 md:flex-none px-3 py-1.5 font-bold text-[11px] rounded transition-colors text-center border ${
                      staff.is_assessment_head 
                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {staff.is_assessment_head ? 'Cabut Posisi HoA' : 'Angkat Jadi HoA'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <div className="pt-6">
        <button className="px-5 py-2.5 bg-slate-800 text-white font-bold text-sm rounded-lg shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-2">
           The Executive Ledger Export (Buku Induk)
        </button>
        <p className="text-xs text-slate-500 mt-2 font-medium max-w-lg">Unduh rekapan komprehensif Buku Induk Pegawai yang telah di-otorisasi dalam format tersertifikasi siap lapor ke Yayasan.</p>
      </div>
    </div>
  );
}
