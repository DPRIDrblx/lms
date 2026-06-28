"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Receipt, Download, FileText, Lock, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

export default function ACESlipGaji() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayslips = async () => {
      let query = supabase.from('ace_payslips').select('*').order('year', { ascending: false }).order('month', { ascending: false });
      if (profile?.role === 'teacher') {
        query = query.eq('teacher_id', profile.id);
      }
      const { data } = await query;
      if (data) setPayslips(data);
      setLoading(false);
    };
    if (profile) fetchPayslips();
  }, [profile, supabase]);

  const markAsViewed = async (id: string) => {
    await supabase.from('ace_payslips').update({ is_viewed: true }).eq('id', id);
    // Refresh local state to avoid refetching
    setPayslips(payslips.map(p => p.id === id ? { ...p, is_viewed: true } : p));
  };

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('id-ID', { month: 'long' });
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Slip Gaji & Honorarium</h1>
        <p className="text-slate-500 font-medium mt-1">Unduh dokumen finansial bulanan secara rahasia</p>
      </div>

      <Card className="p-6 bg-slate-800 text-white border-0 rounded-3xl overflow-hidden relative shadow-xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700 rounded-full blur-[100px] -z-10" />
        <div className="flex items-start gap-4 z-10 relative">
          <div className="p-4 bg-slate-700/50 rounded-2xl border border-slate-600">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-black mb-1">Dokumen Rahasia & Pribadi</h2>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Seluruh slip gaji yang ada di sini bersifat rahasia. Dilarang menyebarluaskan, memotret, atau membagikan informasi finansial kepada pihak yang tidak berkepentingan sesuai dengan peraturan sekolah.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {loading ? <p>Memuat...</p> : payslips.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada slip gaji yang diterbitkan untuk Anda.</p>
          </div>
        ) : payslips.map(slip => (
          <Card key={slip.id} className={`p-5 border-2 rounded-2xl flex items-center justify-between group transition-colors ${!slip.is_viewed ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${!slip.is_viewed ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 text-slate-400'}`}>
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Slip Gaji {getMonthName(slip.month)} {slip.year}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {!slip.is_viewed && <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">Baru</span>}
                  <span className="text-sm font-bold text-slate-500">Diterbitkan oleh TU</span>
                </div>
              </div>
            </div>
            
            <a 
              href={slip.file_url} 
              target="_blank" 
              onClick={() => markAsViewed(slip.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${!slip.is_viewed ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              <Download className="w-4 h-4" /> Unduh PDF
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
