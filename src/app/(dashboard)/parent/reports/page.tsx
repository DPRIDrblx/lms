"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { FileText, Loader2, Download, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ParentReportsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [children, setChildren] = useState<any[]>([]);
  const [reports, setReports] = useState<any>({ monthly: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student:profiles!student_id(*)")
        .eq("parent_id", profile.id);
        
      if (links) {
        const childs = links.map((l: any) => l.student);
        setChildren(childs);
        
        if (childs.length > 0) {
          const childIds = childs.map((c: any) => c.id);
          const { data: mReports } = await supabase.from("monthly_reports").select("*").in("student_id", childIds).eq("is_published", true);
          
          const mMap: any = {};
          if (mReports) {
            mReports.forEach((r: any) => {
              if (!mMap[r.student_id]) mMap[r.student_id] = [];
              mMap[r.student_id].push(r);
            });
          }
          
          setReports({ monthly: mMap });
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, [profile, supabase]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-[var(--accent)]" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <header className="mb-6 bg-indigo-500 rounded-3xl p-8 border-2 border-indigo-600 shadow-[0_8px_0_rgb(79,70,229)] text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <h1 className="text-3xl font-black flex items-center gap-3 mb-2 relative z-10">
          <div className="p-3 bg-white text-indigo-500 rounded-2xl shadow-sm rotate-3">
            <FileText className="h-6 w-6" strokeWidth={3} />
          </div>
          Academic Reports
        </h1>
        <p className="text-indigo-100 font-bold relative z-10">Lihat hasil evaluasi belajar dan rapor bulanan putra-putri Anda.</p>
      </header>

      {children.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-black border-2 border-slate-200 border-dashed rounded-3xl bg-white">
          Belum ada data anak yang tertaut dengan akun Anda.
        </div>
      ) : (
        <div className="space-y-8">
          {children.map(child => {
            const mReports = reports.monthly[child.id] || [];
            
            return (
              <div key={child.id} className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-[0_4px_0_rgb(226,232,240)]">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-500 text-2xl uppercase shadow-inner border-2 border-indigo-200">
                    {child.full_name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">{child.full_name}</h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Student Profile</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-[0_8px_0_rgb(226,232,240)] overflow-hidden">
                  <div className="bg-slate-50 p-6 border-b-2 border-slate-200">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                      <Calendar className="h-6 w-6 text-indigo-500" strokeWidth={3} /> Laporan Hasil Belajar Bulanan
                    </h3>
                  </div>
                  <div className="p-6">
                    {mReports.length > 0 ? (
                      <div className="space-y-4">
                        {mReports.map((r: any) => (
                          <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                            <div>
                              <h4 className="font-black text-slate-800 text-lg mb-1">{r.month_year}</h4>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                Rilis: {new Date(r.created_at).toLocaleDateString('id-ID')}
                              </p>
                            </div>
                            <Link href={`/parent/reports/${r.id}/pdf-view?type=monthly`}>
                              <button className="w-full sm:w-auto bg-indigo-50 text-indigo-600 border-2 border-indigo-200 font-black rounded-xl px-4 py-2 shadow-[0_4px_0_rgb(199,210,254)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2">
                                <Download className="h-4 w-4" strokeWidth={3} /> View PDF
                              </button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center text-slate-400 font-black border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50">
                        Belum ada laporan bulanan yang diterbitkan oleh wali kelas.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
