"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <header className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
          <FileText className="h-6 w-6 text-[var(--accent)]" /> Academic Reports
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">Lihat hasil evaluasi belajar dan rapor bulanan putra-putri Anda.</p>
      </header>

      {children.length === 0 ? (
        <Card className="p-10 text-center text-slate-500 border-dashed border-2">
          Belum ada data anak yang tertaut dengan akun Anda.
        </Card>
      ) : (
        <div className="space-y-8">
          {children.map(child => {
            const mReports = reports.monthly[child.id] || [];
            
            return (
              <div key={child.id} className="space-y-4">
                <div className="flex items-center gap-3 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)]">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg uppercase shadow-inner">
                    {child.full_name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)]">{child.full_name}</h2>
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Student Profile</p>
                  </div>
                </div>
                
                <Card className="p-0 overflow-hidden border-[var(--border)] shadow-sm">
                  <div className="bg-slate-50/50 p-4 border-b border-[var(--border)]">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" /> Laporan Hasil Belajar Bulanan
                    </h3>
                  </div>
                  <div className="p-0">
                    {mReports.length > 0 ? (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 font-medium text-slate-500">Bulan & Tahun</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Tanggal Rilis</th>
                            <th className="px-4 py-3 text-right font-medium text-slate-500">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {mReports.map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800">{r.month_year}</td>
                              <td className="px-4 py-3 text-slate-500">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-3 text-right">
                                <Link href={`/parent/reports/${r.id}/pdf-view?type=monthly`}>
                                  <Button size="sm" variant="secondary" className="text-[var(--accent)] border border-[var(--accent)] hover:bg-[var(--accent-light)]">
                                    <Download className="h-3 w-3 mr-1" /> View PDF
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-sm text-slate-400 italic">
                        Belum ada laporan bulanan yang diterbitkan oleh wali kelas.
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
