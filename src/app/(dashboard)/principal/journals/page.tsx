"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, AlertCircle, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrincipalJournalsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && profile.role !== "principal" && profile.role !== "tu") {
      router.push("/dashboard");
      return;
    }

    const fetchJournals = async () => {
      const { data } = await supabase
        .from("teaching_journals")
        .select(`
          id, date, topic, notes, created_at,
          profiles (full_name),
          classes (name)
        `)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (data) {
        setJournals(data);
      }
      setLoading(false);
    };

    if (profile) fetchJournals();
  }, [profile, router, supabase]);

  if (loading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Pantau Jurnal Mengajar</h1>
        <p className="text-[var(--text-secondary)] mt-1">Laporan harian materi dan absensi dari seluruh guru.</p>
      </div>

      <Card className="p-6">
        {journals.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-tertiary)]">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold">Belum ada jurnal yang diserahkan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {journals.map(journal => (
              <div key={journal.id} className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--accent)]/50 bg-white transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold">
                      {journal.classes?.name || "?"}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)] text-lg">{journal.topic}</h3>
                      <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        Guru: {journal.profiles?.full_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg w-max">
                    <Calendar className="h-4 w-4" />
                    {new Date(journal.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                
                {journal.notes && (
                  <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-secondary)] border border-[var(--border)]">
                    <span className="font-bold text-[var(--text-primary)] block mb-1">Catatan Tambahan:</span>
                    {journal.notes}
                  </div>
                )}
                
                {/* 
                  Note: A full SIMS would link this to the /principal/journals/[id] 
                  to view the specific students who were marked absent/sick.
                  For this overview, we just show the journal card. 
                */}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
