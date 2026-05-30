"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function StudentLeadershipAttendance() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [leadership, setLeadership] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClass = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("classes")
        .select("*")
        .or(`president_id.eq.${profile.id},vice_president_id.eq.${profile.id},secretary_1_id.eq.${profile.id},secretary_2_id.eq.${profile.id}`)
        .single();
      
      if (data) {
        setLeadership(data);
        const { data: roster } = await supabase.from("profiles").select("*").eq("class_id", data.id).eq("role", "student").order("full_name");
        setStudents(roster || []);
      }
      setLoading(false);
    };
    fetchClass();
  }, [profile, supabase]);

  const markManualAttendance = async (studentId: string, status: string) => {
     toast.success(`Marked as ${status}. This requires teacher verification.`);
  };

  if (loading) return <div className="p-12 text-center text-[var(--text-tertiary)]">Loading Leadership Tools...</div>;

  if (!leadership) return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-center">
      <ShieldAlert className="h-16 w-16 text-orange-500 mb-4" />
      <h2 className="text-xl font-bold">Unauthorized Access</h2>
      <p className="text-sm text-[var(--text-secondary)] mt-2">You are not a designated class leader.</p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>Return Home</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard" className="text-xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-4">
           <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Class {leadership.name} Attendance</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">As a class leader, you can assist with marking attendance if the teacher is unavailable.</p>
      </div>

      <Card className="p-0 overflow-hidden border-[var(--border)]">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
           <h3 className="font-bold text-[var(--text-primary)]">Daily Roster ({new Date().toLocaleDateString()})</h3>
           <Badge variant="info">Manual Override Mode</Badge>
        </div>
        <div className="divide-y divide-[var(--border)]">
           {students.map(s => (
             <div key={s.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold text-[10px]">
                      {s.full_name[0]}
                   </div>
                   <span className="text-sm font-bold text-[var(--text-primary)]">{s.full_name}</span>
                </div>
                <div className="flex gap-2">
                   <Button size="sm" variant="ghost" className="h-8 border border-[var(--border)] text-emerald-600 hover:bg-emerald-50" onClick={() => markManualAttendance(s.id, 'Present')}>
                      Present
                   </Button>
                   <Button size="sm" variant="ghost" className="h-8 border border-[var(--border)] text-amber-600 hover:bg-amber-50" onClick={() => markManualAttendance(s.id, 'Sick')}>
                      Sick
                   </Button>
                   <Button size="sm" variant="ghost" className="h-8 border border-[var(--border)] text-red-600 hover:bg-red-50" onClick={() => markManualAttendance(s.id, 'Absent')}>
                      Absent
                   </Button>
                </div>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
}
