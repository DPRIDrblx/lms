"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, User, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function ParentReportsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  
  const [children, setChildren] = useState<any[]>([]);
  const [reports, setReports] = useState<any>({});
  const [semesterReports, setSemesterReports] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("student:profiles(*)")
        .eq("parent_id", profile.id);
        
      if (links) {
        const childs = links.map((l: any) => l.student);
        setChildren(childs);
        
        if (childs.length > 0) {
          const childIds = childs.map((c: any) => c.id);
          const [mReportsRes, sReportsRes] = await Promise.all([
            supabase.from("monthly_reports").select("*").in("student_id", childIds).eq("is_published", true),
            supabase.from("report_cards").select("*").in("student_id", childIds)
          ]);
          
          const mMap: any = {};
          if (mReportsRes.data) {
            mReportsRes.data.forEach((r: any) => {
              if (!mMap[r.student_id]) mMap[r.student_id] = [];
              mMap[r.student_id].push(r);
            });
          }
          setReports(mMap);
          
          const sMap: any = {};
          if (sReportsRes.data) {
            sReportsRes.data.forEach((r: any) => {
              if (!sMap[r.student_id]) sMap[r.student_id] = [];
              sMap[r.student_id].push(r);
            });
          }
          setSemesterReports(sMap);
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, [profile, supabase]);

  if (loading) return <div className="p-20 text-center animate-pulse">Loading academic records...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Academic Reports</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Official Monthly and Semester Report Cards for your children.</p>
      </header>

      {children.length === 0 ? (
        <div className="text-center py-20 border border-[var(--border)] rounded-2xl bg-white shadow-sm">
          <AlertCircle className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No children linked to your account.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {children.map(child => (
            <div key={child.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold text-lg">
                  {child.full_name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">{child.full_name}</h2>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Student ID: {child.id.substring(0,8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 md:pl-16">
                <Card className="p-6 border-[var(--border)] shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4" /> Monthly Reports
                  </h3>
                  
                  <div className="space-y-3">
                    {reports[child.id]?.length > 0 ? (
                      reports[child.id].map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 group">
                          <span className="font-bold text-sm text-[var(--text-primary)]">{r.month_year}</span>
                          <Link href={`/parent/reports/${r.id}/pdf-view`}>
                            <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" icon={<FileText className="h-4 w-4" />}>
                              View PDF
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] italic">No published monthly reports yet.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border-[var(--border)] shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-tertiary)] flex items-center gap-2 mb-4">
                    <BookOpen className="h-4 w-4" /> Semester Reports
                  </h3>
                  
                  <div className="space-y-3">
                    {semesterReports[child.id]?.length > 0 ? (
                      semesterReports[child.id].map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100 group">
                          <div>
                            <span className="block font-bold text-sm text-[var(--text-primary)]">{r.semester}</span>
                            <span className="block text-[10px] text-indigo-600 font-semibold">{r.academic_year}</span>
                          </div>
                          {/* Note: In future we can also make PDF for semester. Using pdf-view but with semester logic or fallback to review. */}
                          <Link href={`/parent/reports/${r.id}/pdf-view?type=semester`}>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white opacity-0 group-hover:opacity-100 transition-opacity" icon={<FileText className="h-4 w-4" />}>
                              View Rapot
                            </Button>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] italic">No official report cards finalized yet.</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
