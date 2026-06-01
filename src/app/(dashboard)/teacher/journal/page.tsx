"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function TeacherJournalPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [attendances, setAttendances] = useState<Record<string, string>>({}); // student_id -> status
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      if (data) setClasses(data);
      setLoading(false);
    };
    fetchClasses();
  }, [supabase]);

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      return;
    }
    const fetchStudents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "student")
        .eq("class_id", selectedClassId)
        .order("full_name");
      
      if (data) {
        setStudents(data);
        // Default all to present
        const defaultAtt: Record<string, string> = {};
        data.forEach((s: any) => defaultAtt[s.id] = "present");
        setAttendances(defaultAtt);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [selectedClassId, supabase]);

  const handleSave = async () => {
    if (!profile) return;
    if (!selectedClassId) return toast.error("Pilih kelas terlebih dahulu");
    if (!topic) return toast.error("Topik / Materi tidak boleh kosong");
    
    setSaving(true);
    const toastId = toast.loading("Menyimpan jurnal dan absensi...");

    try {
      // 1. Insert Journal
      const { data: journalData, error: journalError } = await supabase
        .from("teaching_journals")
        .insert({
          teacher_id: profile.id,
          class_id: selectedClassId,
          topic,
          notes,
          date: new Date().toISOString().split('T')[0]
        })
        .select("id")
        .single();

      if (journalError) throw journalError;

      // 2. Insert Attendances
      const attsToInsert = Object.entries(attendances).map(([studentId, status]) => ({
        journal_id: journalData.id,
        student_id: studentId,
        status
      }));

      if (attsToInsert.length > 0) {
        const { error: attError } = await supabase.from("attendances").insert(attsToInsert);
        if (attError) throw attError;
      }

      toast.success("Jurnal berhasil disimpan!", { id: toastId });
      
      // Reset Form
      setTopic("");
      setNotes("");
      setSelectedClassId("");
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading && classes.length === 0) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Jurnal Mengajar & Absensi</h1>
        <p className="text-[var(--text-secondary)] mt-1">Catat materi yang diajarkan dan kehadiran siswa hari ini.</p>
      </div>

      <Card className="p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Pilih Kelas</label>
            <select 
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none font-medium"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map(c => <option key={c.id} value={c.id}>Kelas {c.name}</option>)}
            </select>
          </div>

          {selectedClassId && (
            <>
              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Topik / Materi Pembelajaran</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Misal: Persamaan Kuadrat / Bab 3"
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Catatan (Opsional)</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan kejadian di kelas..."
                  className="w-full p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] outline-none font-medium resize-none"
                />
              </div>

              <div className="pt-6 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Absensi Siswa</h3>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-md">Total: {students.length} Siswa</span>
                </div>

                {students.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-tertiary)]">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>Tidak ada siswa di kelas ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border)]">
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase w-10">No</th>
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase">Nama Siswa</th>
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase text-center w-20">Hadir</th>
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase text-center w-20">Sakit</th>
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase text-center w-20">Izin</th>
                          <th className="py-3 px-2 text-xs font-bold text-[var(--text-tertiary)] uppercase text-center w-20">Alpa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, idx) => (
                          <tr key={s.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                            <td className="py-3 px-2 text-sm text-[var(--text-tertiary)] font-bold">{idx + 1}</td>
                            <td className="py-3 px-2 text-sm font-bold text-[var(--text-primary)]">{s.full_name}</td>
                            {(['present', 'sick', 'permission', 'absent'] as const).map(status => (
                              <td key={status} className="py-3 px-2 text-center">
                                <input 
                                  type="radio" 
                                  name={`att-${s.id}`} 
                                  checked={attendances[s.id] === status}
                                  onChange={() => setAttendances({ ...attendances, [s.id]: status })}
                                  className={`w-4 h-4 cursor-pointer accent-[var(--accent)]`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="px-8 h-12 gap-2 shadow-lg shadow-[var(--accent)]/20 hover:-translate-y-0.5 transition-all">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Simpan Jurnal & Absensi
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
