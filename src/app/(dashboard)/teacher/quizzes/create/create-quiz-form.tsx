"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, MonitorCheck, Camera, Key, Zap, ShieldAlert, Clock, Calendar, CheckSquare } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { DEFAULT_CBT_CONFIG, serializeCbtPayload, dateTimeLocalToIso, isoToDateTimeLocal } from "@/lib/cbt-config";

export function CreateQuizForm() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCbtParam = searchParams.get("cbt_v2") === "true";
  
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    course_id: "",
    time_limit_minutes: 60,
    passing_score: 60,
    is_randomized: false,
    icon_url: "",
    is_cbt_v2: isCbtParam,
    schedule_start: "",
    schedule_end: "",
    target_classes: [] as string[],
    require_webcam: false,
    token_enabled: false,
    token_code: "",
    points_correct: 4,
    penalty_wrong: 1,
    exam_rules: DEFAULT_CBT_CONFIG.exam_rules,
    statement_text: DEFAULT_CBT_CONFIG.statement_text,
    show_score: true,
    show_explanation: false,
  });

  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, classesRes] = await Promise.all([
        supabase.from("courses").select("id, title"),
        supabase.from("classes").select("id, name").order("name", { ascending: true })
      ]);
      if (coursesRes.data) setCourses(coursesRes.data);
      if (classesRes.data) setAvailableClasses(classesRes.data);
    };
    fetchData();
  }, [supabase]);

  const toggleClassTarget = (className: string) => {
    setFormData((prev) => {
      const exists = prev.target_classes.includes(className);
      const updated = exists
        ? prev.target_classes.filter((c) => c !== className)
        : [...prev.target_classes, className];
      return { ...prev, target_classes: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !formData.course_id) return;
    setLoading(true);

    let finalIconUrl = formData.icon_url;

    if (iconFile) {
      const fileExt = iconFile.name.split('.').pop();
      const fileName = `quiz-icon-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("social_media").upload(fileName, iconFile);
      
      if (!uploadError) {
        const { data } = supabase.storage.from("social_media").getPublicUrl(fileName);
        finalIconUrl = data.publicUrl;
      }
    }

    const isoStart = dateTimeLocalToIso(formData.schedule_start);
    const isoEnd = dateTimeLocalToIso(formData.schedule_end);

    const cbtConfig = {
      is_cbt_v2: Boolean(formData.is_cbt_v2),
      target_classes: formData.target_classes,
      schedule_start: isoStart,
      schedule_end: isoEnd,
      token_enabled: formData.token_enabled,
      token_code: formData.token_code.trim().toUpperCase(),
      require_webcam: formData.require_webcam,
      exam_rules: formData.exam_rules,
      statement_text: formData.statement_text,
      points_correct: Number(formData.points_correct),
      penalty_wrong: Number(formData.penalty_wrong),
      show_score: formData.show_score,
      show_explanation: formData.show_explanation,
      max_tab_exits: 3,
    };

    const cbtPayload = serializeCbtPayload("", cbtConfig);

    const basePayload = {
      course_id: formData.course_id,
      title: formData.title,
      time_limit_minutes: formData.time_limit_minutes,
      passing_score: formData.passing_score,
      is_randomized: formData.is_randomized,
      icon_url: finalIconUrl,
      description: cbtPayload.description,
      show_score: formData.show_score,
      show_explanation: formData.show_explanation,
    };

    const fullPayload = {
      ...basePayload,
      is_cbt_v2: Boolean(formData.is_cbt_v2),
      target_classes: formData.target_classes,
      schedule_start: isoStart,
      schedule_end: isoEnd,
      token_enabled: formData.token_enabled,
      token_code: formData.token_code.trim().toUpperCase(),
      require_webcam: formData.require_webcam,
      points_correct: Number(formData.points_correct),
      penalty_wrong: Number(formData.penalty_wrong),
      exam_rules: formData.exam_rules,
      statement_text: formData.statement_text,
      cbt_config: cbtConfig,
    };

    let { data, error } = await supabase
      .from("quizzes")
      .insert(fullPayload)
      .select()
      .single();

    if (error && (error.message.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
      console.warn("Retrying quiz insert with base payload (migration columns missing)...", error.message);
      const retry = await supabase.from("quizzes").insert(basePayload).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (data) {
      router.push(`/teacher/quizzes/${data.id}/builder`);
    } else {
      setLoading(false);
      alert(error?.message || "Failed to create quiz");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <Link href="/teacher/quizzes" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Kembali ke Daftar Quizzes & CBT
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {formData.is_cbt_v2 ? "Buat Paket Ujian CBT MMIS v2" : "Setup Quiz Baru"}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Konfigurasi parameter ujian, sistem penilaian minus, jadwal tayang, dan pengawasan.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Mode Switcher Toggle: CBT MMIS v2 vs Standard */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <MonitorCheck className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-sm font-black text-blue-950">Platform CBT MMIS v2</h4>
                <p className="text-xs text-blue-700/80">Khususkan ujian ini untuk platform CBT MMIS v2 siswa</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_cbt_v2}
                onChange={(e) => setFormData({ ...formData, is_cbt_v2: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Judul Ujian / Kuis *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Penilaian Harian Matematika Bab 2 (7A & 7B)"
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mata Pelajaran (Course) *</label>
              <select
                required
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              >
                <option value="">Pilih Mata Pelajaran...</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            {/* Target Classes Selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Target Kelas Siswa (Kosongkan jika untuk semua kelas)
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] max-h-36 overflow-y-auto">
                {availableClasses.map((cls) => {
                  const isSelected = formData.target_classes.includes(cls.name);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClassTarget(cls.name)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {cls.name} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jadwal Tayang (Schedule Start & End) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Waktu Mulai Tayang (Jadwal Buka)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_start}
                  onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Siswa baru dapat membuka ujian pada waktu ini.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Waktu Selesai Tayang (Batas Tutup)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_end}
                  onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ujian otomatis ditutup setelah jadwal berakhir.</p>
              </div>
            </div>

            {/* Scoring & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Durasi (Menit)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.time_limit_minutes}
                  onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) || 60 })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-700 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Poin Benar (+)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.points_correct}
                  onChange={(e) => setFormData({ ...formData, points_correct: Number(e.target.value) })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-emerald-300 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rose-700 mb-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Pengurangan Salah (-)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.penalty_wrong}
                  onChange={(e) => setFormData({ ...formData, penalty_wrong: Number(e.target.value) })}
                  className="w-full h-11 px-4 rounded-xl bg-[var(--bg-secondary)] border border-rose-300 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                />
              </div>
            </div>

            {/* Security: Webcam & Token */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                Pengawasan & Akses Ujian
              </h4>

              {/* Webcam Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Wajibkan Siswa Menyalakan Webcam (Proctoring)
                  </p>
                  <p className="text-[11px] text-slate-500">Siswa wajib mengaktifkan kamera sebelum mulai ujian.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.require_webcam}
                  onChange={(e) => setFormData({ ...formData, require_webcam: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              {/* Token Switch & Code */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      Gunakan Token Masuk Ujian
                    </p>
                    <p className="text-[11px] text-slate-500">Siswa harus memasukkan kode token yang Anda berikan.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.token_enabled}
                    onChange={(e) => setFormData({ ...formData, token_enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {formData.token_enabled && (
                  <div className="pt-2">
                    <input
                      type="text"
                      value={formData.token_code}
                      onChange={(e) => setFormData({ ...formData, token_code: e.target.value.toUpperCase() })}
                      placeholder="Masukkan kode token (contoh: MMIS2026)"
                      className="w-full h-10 px-3 uppercase font-mono tracking-wider text-xs rounded-xl bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Results Visibility Toggles */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Pengaturan Hasil & Pembahasan Siswa
              </h4>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Siswa Dapat Melihat Skor / Nilai Setelah Selesai</p>
                  <p className="text-[11px] text-slate-500">Jika dimatikan, hasil ujian akan dirahasiakan dari siswa.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.show_score}
                  onChange={(e) => setFormData({ ...formData, show_score: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Siswa Dapat Melihat Pembahasan Soal</p>
                  <p className="text-[11px] text-slate-500">Mengizinkan siswa membaca kunci jawaban dan pembahasan setelah kumpul.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.show_explanation}
                  onChange={(e) => setFormData({ ...formData, show_explanation: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Link href="/teacher/quizzes">
              <Button type="button" variant="secondary">Batal</Button>
            </Link>
            <Button 
              type="submit" 
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              icon={<Save className="h-4 w-4" />}
            >
              Lanjutkan ke Builder Soal
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
}

