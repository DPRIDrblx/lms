"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen,
  ChevronLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  CheckSquare,
  Square,
  GripVertical, 
  Save, 
  HelpCircle,
  Link as LinkIcon,
  Settings,
  Clock,
  Award,
  Flag,
  Library,
  Download,
  AlertCircle,
  LayoutGrid,
  Image as ImageIcon,
  Upload,
  Loader2,
  Type,
  X,
  MonitorCheck,
  Camera,
  Key,
  Zap,
  Volume2,
  Music,
  Calendar,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MathRenderer } from "@/components/ui/math-renderer";
import { CbtAudioPlayer } from "@/components/cbt/cbt-audio-player";
import { 
  parseCbtConfig, 
  serializeCbtPayload, 
  getCleanDescription, 
  CbtExamConfig, 
  DEFAULT_CBT_CONFIG,
  isoToDateTimeLocal,
  dateTimeLocalToIso
} from "@/lib/cbt-config";

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "essay" | "complex_mcq" | "matching" | "matrix" | "linear_scale";
  options: { text: string; is_correct?: boolean; match_pair?: string; match_pairs?: string[] }[] | null;
  points: number;
  order_index: number;
  criteria?: { minLength?: number; maxLength?: number; cols?: string[]; min?: number; max?: number; minLabel?: string; maxLabel?: string } | null;
  explanation?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  points_correct?: number | null;
  penalty_wrong?: number | null;
  metadata?: any;
}

export default function CBTBuilderPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [cbtConfig, setCbtConfig] = useState<CbtExamConfig>(DEFAULT_CBT_CONFIG);
  const [cleanDesc, setCleanDesc] = useState<string>("");
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const openBankModal = async () => {
    setShowBankModal(true);
    setLoadingBanks(true);
    const { data } = await supabase.from('ace_question_banks').select('*, items:ace_question_bank_items(*)').order('created_at', { ascending: false });
    if (data) setBanks(data);
    setLoadingBanks(false);
  };

  const importFromBank = (bank: any) => {
    const importedQuestions = bank.items.map((item: any, i: number) => ({
      id: `temp-${Date.now()}-${i}`,
      question_text: item.question_text,
      question_type: item.question_type,
      options: item.options,
      points: item.points,
      order_index: questions.length + i,
      criteria: item.criteria,
      explanation: item.explanation,
      points_correct: item.points || cbtConfig.points_correct,
      penalty_wrong: cbtConfig.penalty_wrong,
      audio_url: item.audio_url || null,
      image_url: item.image_url || null,
    }));
    setQuestions([...questions, ...importedQuestions]);
    setShowBankModal(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [quizRes, qRes, classesRes] = await Promise.all([
        supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true }),
        supabase.from("classes").select("id, name").order("name", { ascending: true })
      ]);

      if (classesRes.data) {
        setAvailableClasses(classesRes.data);
      }

      if (quizRes.data) {
        const quizData = quizRes.data;
        const parsed = parseCbtConfig(quizData);
        setCbtConfig(parsed);
        setCleanDesc(getCleanDescription(quizData.description));

        setQuiz({
          ...quizData,
          time_limit: quizData.time_limit || quizData.time_limit_minutes || 60,
          max_score: quizData.max_score || 100,
          allow_leave_exam: quizData.allow_leave_exam ?? true,
          min_time_to_submit: quizData.min_time_to_submit || 0,
          shuffle_questions: quizData.shuffle_questions ?? false,
          show_score: parsed.show_score,
          show_answers: quizData.show_answers ?? true,
          show_explanation: parsed.show_explanation,
          allow_practice_mode: quizData.allow_practice_mode ?? false,
          practice_time_limit_minutes: quizData.practice_time_limit_minutes ?? 0,
          save_practice_scores: quizData.save_practice_scores ?? false,
          is_form: quizData.is_form ?? false,
          is_one_page_layout: quizData.is_one_page_layout ?? true,
          description: quizData.description || "",
          theme_color: quizData.theme_color || "blue",
          icon_url: quizData.icon_url || ""
        });

        if (quizData.icon_url) {
          setIconPreview(quizData.icon_url);
        }
      }

      if (qRes.data) {
        const mappedQuestions = (qRes.data as any[]).map((q) => ({
          ...q,
          question_type: q.question_type || q.metadata?.question_type || "mcq",
          points_correct: q.points_correct ?? q.metadata?.points_correct ?? q.points ?? 4,
          penalty_wrong: q.penalty_wrong ?? q.metadata?.penalty_wrong ?? 1,
          audio_url: q.audio_url || q.metadata?.audio_url || null,
          image_url: q.image_url || q.metadata?.image_url || null,
          explanation: q.explanation || q.metadata?.explanation || null,
        }));
        setQuestions(mappedQuestions);

        const { data: rData } = await supabase
          .from("question_reports")
          .select("*, profiles(full_name)")
          .in("question_id", qRes.data.map((q: any) => q.id));
        if (rData) setReports(rData);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, supabase]);

  const addQuestion = (type: "mcq" | "essay" | "complex_mcq" | "matching" | "matrix" | "linear_scale") => {
    const newQ: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      question_type: type,
      points: type === "linear_scale" ? 0 : (cbtConfig.points_correct || 4),
      points_correct: cbtConfig.points_correct || 4,
      penalty_wrong: cbtConfig.penalty_wrong || 1,
      order_index: questions.length,
      options: type === "mcq" || type === "complex_mcq" ? [
        { text: "Pilihan A", is_correct: type === "mcq" ? true : false },
        { text: "Pilihan B", is_correct: false },
        { text: "Pilihan C", is_correct: false },
        { text: "Pilihan D", is_correct: false },
      ] : type === "matching" ? [
        { text: "Istilah 1", match_pair: "Definisi 1" },
        { text: "Istilah 2", match_pair: "Definisi 2" }
      ] : type === "matrix" ? [
        { text: "Pernyataan 1", match_pairs: ["Benar"] },
        { text: "Pernyataan 2", match_pairs: ["Salah"] }
      ] : null,
      criteria: type === "essay" ? { minLength: 200 } : type === "matrix" ? { cols: ["Benar", "Salah"] } : type === "linear_scale" ? { min: 1, max: 5, minLabel: "Sangat Kurang", maxLabel: "Sangat Baik" } : null,
      explanation: "",
      audio_url: null,
      image_url: null,
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, ...updates } : q));
  };

  // Upload handler for question audio
  const handleUploadQuestionAudio = async (qId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cbt-audio-${qId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("social_media").upload(fileName, file);
      if (uploadError) {
        alert("Gagal mengunggah audio: " + uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("social_media").getPublicUrl(fileName);
      updateQuestion(qId, { audio_url: data.publicUrl });
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // Upload handler for question image
  const handleUploadQuestionImage = async (qId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `cbt-img-${qId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("social_media").upload(fileName, file);
      if (uploadError) {
        alert("Gagal mengunggah gambar: " + uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("social_media").getPublicUrl(fileName);
      updateQuestion(qId, { image_url: data.publicUrl });
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const toggleTargetClass = (clsName: string) => {
    setCbtConfig((prev) => {
      const exists = prev.target_classes.includes(clsName);
      const updated = exists
        ? prev.target_classes.filter((c) => c !== clsName)
        : [...prev.target_classes, clsName];
      return { ...prev, target_classes: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    const calculatedMaxScore = questions.reduce((sum, q) => sum + (q.points_correct ?? q.points ?? 0), 0);

    let finalIconUrl = quiz.icon_url;

    if (iconFile) {
      const fileExt = iconFile.name.split('.').pop();
      const fileName = `quiz-icon-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("social_media").upload(fileName, iconFile);
      
      if (!uploadError) {
        const { data } = supabase.storage.from("social_media").getPublicUrl(fileName);
        finalIconUrl = data.publicUrl;
      }
    }

    // Serialize CBT Config into payload
    const cbtPayload = serializeCbtPayload(cleanDesc, cbtConfig);

    // Save quiz settings
    const baseQuizUpdate = { 
      time_limit: quiz.time_limit || null, 
      time_limit_minutes: quiz.time_limit || quiz.time_limit_minutes || 60,
      max_score: quiz.is_form ? 0 : calculatedMaxScore,
      allow_leave_exam: quiz.allow_leave_exam,
      min_time_to_submit: quiz.min_time_to_submit,
      shuffle_questions: quiz.shuffle_questions,
      show_score: cbtConfig.show_score,
      show_answers: quiz.show_answers,
      show_explanation: cbtConfig.show_explanation,
      allow_practice_mode: quiz.allow_practice_mode,
      practice_time_limit_minutes: quiz.practice_time_limit_minutes,
      save_practice_scores: quiz.save_practice_scores,
      is_form: quiz.is_form,
      is_one_page_layout: quiz.is_one_page_layout,
      description: cbtPayload.description,
      theme_color: quiz.theme_color,
      icon_url: finalIconUrl
    };

    const fullQuizUpdate = {
      ...baseQuizUpdate,
      is_cbt_v2: Boolean(cbtConfig.is_cbt_v2),
      target_classes: cbtConfig.target_classes,
      schedule_start: cbtConfig.schedule_start,
      schedule_end: cbtConfig.schedule_end,
      token_enabled: cbtConfig.token_enabled,
      token_code: cbtConfig.token_code,
      require_webcam: cbtConfig.require_webcam,
      points_correct: cbtConfig.points_correct,
      penalty_wrong: cbtConfig.penalty_wrong,
      exam_rules: cbtConfig.exam_rules,
      statement_text: cbtConfig.statement_text,
      cbt_config: cbtConfig,
    };

    let { error: quizError } = await supabase
      .from("quizzes")
      .update(fullQuizUpdate)
      .eq("id", id);

    if (quizError && (quizError.message.includes("column") || quizError.code === "PGRST204" || quizError.code === "42703")) {
      console.warn("Retrying quiz update with base payload (migration columns missing)...", quizError.message);
      const retry = await supabase.from("quizzes").update(baseQuizUpdate).eq("id", id);
      quizError = retry.error;
    }

    if (quizError) {
      alert("Gagal menyimpan quiz: " + quizError.message);
      setSaving(false);
      return;
    }

    // Filter ids to keep
    const questionIdsToKeep = questions.map(q => q.id).filter(qid => !qid.startsWith('temp-'));
    
    // Delete removed questions
    if (questionIdsToKeep.length > 0) {
      await supabase.from("questions").delete().eq("quiz_id", id).not('id', 'in', `(${questionIdsToKeep.join(',')})`);
    } else {
      await supabase.from("questions").delete().eq("quiz_id", id);
    }
    
    const questionsToSave = questions.map((q, idx) => {
      const qCorrect = Number(q.points_correct ?? q.points ?? cbtConfig.points_correct ?? 4);
      const qPenalty = Number(q.penalty_wrong ?? cbtConfig.penalty_wrong ?? 1);

      const metadataObj = {
        ...(q.metadata || {}),
        question_type: q.question_type,
        points_correct: qCorrect,
        penalty_wrong: qPenalty,
        audio_url: q.audio_url || null,
        image_url: q.image_url || null,
        explanation: q.explanation || null,
      };

      const payload: any = {
        quiz_id: id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        points: qCorrect,
        order_index: idx,
        criteria: q.criteria || {},
        explanation: q.explanation || null,
        metadata: metadataObj
      };

      if (!q.id.startsWith('temp-')) {
        payload.id = q.id;
      } else {
        payload.id = crypto.randomUUID();
      }
      return payload;
    });

    if (questionsToSave.length > 0) {
      const { error } = await supabase.from("questions").upsert(questionsToSave);
      if (error) alert("Gagal menyimpan soal: " + error.message);
      else router.push("/teacher/quizzes");
    } else {
      router.push("/teacher/quizzes");
    }
    
    setSaving(false);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 p-4 sm:p-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-4">
          <Link href="/teacher/quizzes" className="p-2 border border-[var(--border)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
            <ChevronLeft className="h-5 w-5 text-[var(--text-secondary)]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{quiz?.title}</h1>
              {cbtConfig.is_cbt_v2 && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">
                  CBT MMIS v2
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Course: <span className="font-semibold">{quiz?.courses?.title || "Umum"}</span> • {questions.length} Soal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Button 
            onClick={handleSave} 
            loading={saving} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
            icon={<Save className="h-4 w-4" />}
          >
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: CBT MMIS v2 & Quiz Settings */}
        <div className="lg:col-span-1 space-y-6 sticky top-6 self-start">
          
          {/* CBT MMIS v2 Settings Card */}
          <Card className="p-5 border-2 border-blue-200 bg-gradient-to-b from-blue-50/50 to-white rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <MonitorCheck className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-blue-950">Pengaturan CBT MMIS v2</h3>
                <p className="text-[10px] text-blue-600 font-medium">Platform Ujian Siswa</p>
              </div>
            </div>

            {/* Enable CBT MMIS v2 Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Mode CBT MMIS v2</label>
              <input
                type="checkbox"
                checked={cbtConfig.is_cbt_v2}
                onChange={(e) => setCbtConfig({ ...cbtConfig, is_cbt_v2: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            {cbtConfig.is_cbt_v2 && (
              <div className="space-y-4 pt-2 border-t border-blue-100">
                
                {/* Jadwal Tayang */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Waktu Mulai Tayang
                  </label>
                  <input
                    type="datetime-local"
                    value={isoToDateTimeLocal(cbtConfig.schedule_start)}
                    onChange={(e) => setCbtConfig({ ...cbtConfig, schedule_start: dateTimeLocalToIso(e.target.value) })}
                    className="w-full h-8 px-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    Waktu Selesai Tayang
                  </label>
                  <input
                    type="datetime-local"
                    value={isoToDateTimeLocal(cbtConfig.schedule_end)}
                    onChange={(e) => setCbtConfig({ ...cbtConfig, schedule_end: dateTimeLocalToIso(e.target.value) })}
                    className="w-full h-8 px-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                {/* Target Classes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Kelas</label>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-lg">
                    {availableClasses.map((cls) => {
                      const isSelected = cbtConfig.target_classes.includes(cls.name);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => toggleTargetClass(cls.name)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scoring Defaults */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Poin Benar (+)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={cbtConfig.points_correct}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, points_correct: Number(e.target.value) })}
                      className="w-full h-8 px-2 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Minus Salah (-)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={cbtConfig.penalty_wrong}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, penalty_wrong: Number(e.target.value) })}
                      className="w-full h-8 px-2 rounded-lg bg-white border border-rose-300 text-xs font-bold text-rose-700"
                    />
                  </div>
                </div>

                {/* Webcam Proctoring */}
                <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    Wajibkan Webcam
                  </label>
                  <input
                    type="checkbox"
                    checked={cbtConfig.require_webcam}
                    onChange={(e) => setCbtConfig({ ...cbtConfig, require_webcam: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>

                {/* Token Masuk */}
                <div className="space-y-1.5 pt-2 border-t border-blue-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      Gunakan Token
                    </label>
                    <input
                      type="checkbox"
                      checked={cbtConfig.token_enabled}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, token_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </div>
                  {cbtConfig.token_enabled && (
                    <input
                      type="text"
                      value={cbtConfig.token_code}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, token_code: e.target.value.toUpperCase() })}
                      placeholder="Kode Token (e.g. MMIS2026)"
                      className="w-full h-8 px-2 uppercase font-mono tracking-wider rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                    />
                  )}
                </div>

                {/* Peraturan Ujian */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tata Tertib Ujian (Pop-up Siswa)</label>
                  <textarea
                    rows={3}
                    value={cbtConfig.exam_rules}
                    onChange={(e) => setCbtConfig({ ...cbtConfig, exam_rules: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                {/* Kotak Pernyataan Siswa */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Kotak Pernyataan Persetujuan Siswa</label>
                  <textarea
                    rows={3}
                    value={cbtConfig.statement_text}
                    onChange={(e) => setCbtConfig({ ...cbtConfig, statement_text: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                {/* Result Visibility */}
                <div className="space-y-2 pt-2 border-t border-blue-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Siswa Boleh Lihat Skor</label>
                    <input
                      type="checkbox"
                      checked={cbtConfig.show_score}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, show_score: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Siswa Boleh Lihat Pembahasan</label>
                    <input
                      type="checkbox"
                      checked={cbtConfig.show_explanation}
                      onChange={(e) => setCbtConfig({ ...cbtConfig, show_explanation: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

              </div>
            )}
          </Card>

          {/* Standard Settings Card */}
          <Card className="p-5 border-[var(--border)] shadow-sm bg-[var(--bg-primary)] rounded-md space-y-4">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold border-b border-[var(--border)] pb-2">
              <Settings className="h-4 w-4" />
              <h2>Pengaturan Dasar</h2>
            </div>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Durasi Ujian (Menit)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full h-8 px-2 border border-slate-300 rounded text-xs"
                  value={quiz.time_limit}
                  onChange={(e) => setQuiz({ ...quiz, time_limit: parseInt(e.target.value) || 60 })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Deskripsi Umum Ujian</label>
                <textarea
                  rows={2}
                  value={cleanDesc}
                  onChange={(e) => setCleanDesc(e.target.value)}
                  placeholder="Deskripsi singkat..."
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </Card>

          {/* Add Question Button Panel */}
          <Card className="p-5 border-[var(--border)] shadow-sm bg-[var(--bg-primary)] rounded-md">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2 mb-4">Tambah Soal Baru</h2>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm text-xs" onClick={() => addQuestion("mcq")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Pilihan Ganda (MCQ)
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm text-xs" onClick={() => addQuestion("complex_mcq")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Pilihan Ganda Kompleks
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm text-xs" onClick={() => addQuestion("matching")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Menjodohkan (Matching)
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm text-xs" onClick={() => addQuestion("essay")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Uraian / Essay
              </Button>
              <Button variant="secondary" className="justify-start border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 mt-2 text-xs" onClick={openBankModal}>
                <Download className="h-4 w-4 mr-2" />
                Impor dari Bank Soal
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content: Questions List */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence>
            {questions.map((q, idx) => {
              const qCorrect = q.points_correct ?? q.points ?? cbtConfig.points_correct ?? 4;
              const qPenalty = q.penalty_wrong ?? cbtConfig.penalty_wrong ?? 1;

              return (
                <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Card className="relative group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                    
                    {/* Question Header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab text-slate-400 hover:text-slate-600">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-800">Nomor {idx + 1}</span>
                        <Badge variant="info" className="bg-white text-slate-600 border-slate-200 font-normal text-xs">
                          {q.question_type.toUpperCase().replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Positive & Negative Points Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <span className="text-[11px] font-bold text-emerald-700">+Benar:</span>
                          <input
                            type="number"
                            step="any"
                            className="w-12 px-1 text-center text-xs font-bold text-emerald-800 bg-white border border-emerald-300 rounded focus:outline-none"
                            value={qCorrect}
                            onChange={(e) => updateQuestion(q.id, { points_correct: Number(e.target.value), points: Number(e.target.value) })}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                          <span className="text-[11px] font-bold text-rose-700">-Salah:</span>
                          <input
                            type="number"
                            step="any"
                            className="w-12 px-1 text-center text-xs font-bold text-rose-800 bg-white border border-rose-300 rounded focus:outline-none"
                            value={qPenalty}
                            onChange={(e) => updateQuestion(q.id, { penalty_wrong: Number(e.target.value) })}
                          />
                        </div>

                        <button onClick={() => removeQuestion(q.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors" title="Hapus Soal">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      
                      {/* Media Bar: Image & Audio Attachments */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                            Media Soal (Gambar & Audio / Musik)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          {/* Image Upload / Link */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                              Gambar Soal
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="URL Gambar..."
                                value={q.image_url || ""}
                                onChange={(e) => updateQuestion(q.id, { image_url: e.target.value })}
                                className="flex-1 h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                              />
                              <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded cursor-pointer shrink-0">
                                Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadQuestionImage(q.id, file);
                                  }}
                                />
                              </label>
                              {q.image_url && (
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { image_url: null })}
                                  className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                                  title="Hapus Gambar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {q.image_url && (
                              <img src={q.image_url} alt="Preview" className="h-20 w-auto object-contain rounded border border-slate-200 mt-1" />
                            )}
                          </div>

                          {/* Audio / Music Upload / Link */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              <Music className="w-3.5 h-3.5 text-indigo-600" />
                              Audio / Musik Soal
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="URL Audio MP3..."
                                value={q.audio_url || ""}
                                onChange={(e) => updateQuestion(q.id, { audio_url: e.target.value })}
                                className="flex-1 h-8 px-2 text-xs bg-white border border-slate-300 rounded"
                              />
                              <label className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded cursor-pointer shrink-0">
                                Upload
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadQuestionAudio(q.id, file);
                                  }}
                                />
                              </label>
                              {q.audio_url && (
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { audio_url: null })}
                                  className="text-rose-500 p-1 hover:bg-rose-50 rounded"
                                  title="Hapus Audio"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {q.audio_url && (
                              <div className="mt-1">
                                <CbtAudioPlayer src={q.audio_url} title={`Audio Soal ${idx + 1}`} />
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* Question Text Rich Editor */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-slate-800">
                            Teks Pertanyaan (Mendukung LaTeX / KaTeX $...$ &amp; $$...$$)
                          </label>
                        </div>
                        <RichTextEditor 
                          value={q.question_text} 
                          onChange={(val) => updateQuestion(q.id, { question_text: val })} 
                        />
                        {q.question_text && (q.question_text.includes('$') || q.question_text.includes('\\(')) && (
                          <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 mb-1.5 uppercase tracking-wider">Preview Formula Matematika (KaTeX)</p>
                            <MathRenderer className="prose prose-sm max-w-none text-slate-800" htmlContent={q.question_text} />
                          </div>
                        )}
                      </div>

                      {/* Multiple Choice & Complex MCQ Options */}
                      {(q.question_type === "mcq" || q.question_type === "complex_mcq") && q.options && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="text-sm font-semibold text-slate-800 block mb-2">
                            Pilihan Jawaban (Tandai yang Benar)
                          </label>
                          {q.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const hasMath = opt.text && (opt.text.includes('$') || opt.text.includes('\\('));

                            return (
                              <div key={oIdx} className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                                <div className="flex items-center gap-3">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newOpts = q.options!.map((o, i) => {
                                        if (q.question_type === "mcq") {
                                          return { ...o, is_correct: i === oIdx };
                                        } else {
                                          if (i === oIdx) return { ...o, is_correct: !o.is_correct };
                                          return o;
                                        }
                                      });
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                    className={`shrink-0 ${opt.is_correct ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
                                    title={opt.is_correct ? "Kunci Benar" : "Tandai sebagai kunci benar"}
                                  >
                                    {q.question_type === "mcq" ? (
                                      opt.is_correct ? <CheckCircle2 className="h-5 w-5 fill-emerald-100" /> : <Circle className="h-5 w-5" />
                                    ) : (
                                      opt.is_correct ? <CheckSquare className="h-5 w-5 fill-emerald-100" /> : <Square className="h-5 w-5" />
                                    )}
                                  </button>

                                  <span className="w-6 font-bold text-xs text-slate-500">{letter}.</span>

                                  <input
                                    className="flex-1 text-sm bg-transparent border-none p-1 focus:ring-0 focus:outline-none text-slate-900"
                                    value={opt.text}
                                    placeholder="Ketik pilihan jawaban (misal: $x = \\frac{-b}{2a}$)..."
                                    onChange={(e) => {
                                      const newOpts = [...q.options!];
                                      newOpts[oIdx].text = e.target.value;
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                  />

                                  {q.options!.length > 2 && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const newOpts = q.options!.filter((_, i) => i !== oIdx);
                                        updateQuestion(q.id, { options: newOpts });
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-1"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Option Math Preview if LaTeX is used */}
                                {hasMath && (
                                  <div className="pl-14 text-xs text-blue-700 bg-blue-50/60 p-1.5 rounded-lg border border-blue-100">
                                    <MathRenderer inline={true} htmlContent={opt.text} />
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="mt-2 bg-white border-slate-300 text-xs"
                            onClick={() => {
                              updateQuestion(q.id, { options: [...q.options!, { text: `Pilihan ${String.fromCharCode(65 + q.options!.length)}`, is_correct: false }] });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Tambah Pilihan
                          </Button>
                        </div>
                      )}

                      {/* Matching Options */}
                      {q.question_type === "matching" && q.options && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="text-sm font-semibold text-slate-800 block mb-2">Pasangan Menjodohkan</label>
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                              <input
                                className="w-full text-sm bg-transparent border-none p-1 focus:ring-0 focus:outline-none"
                                value={opt.text}
                                onChange={(e) => {
                                  const newOpts = [...q.options!];
                                  newOpts[oIdx].text = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                placeholder="Istilah / Pertanyaan..."
                              />
                              <LinkIcon className="h-4 w-4 text-slate-400" />
                              <input
                                className="w-full text-sm bg-transparent border-none p-1 focus:ring-0 focus:outline-none"
                                value={opt.match_pair || ""}
                                onChange={(e) => {
                                  const newOpts = [...q.options!];
                                  newOpts[oIdx].match_pair = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                placeholder="Pasangan / Jawaban..."
                              />
                              {q.options!.length > 2 ? (
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const newOpts = q.options!.filter((_, i) => i !== oIdx);
                                    updateQuestion(q.id, { options: newOpts });
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : <span className="w-6"></span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Essay Criteria */}
                      {q.question_type === "essay" && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <label className="text-sm font-semibold text-slate-800 block mb-1">Kriteria Essay</label>
                          <div className="flex items-center gap-4 text-xs text-slate-700">
                            <label>Min Karakter:</label>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                              value={q.criteria?.minLength || 0}
                              onChange={(e) => updateQuestion(q.id, { criteria: { ...q.criteria, minLength: parseInt(e.target.value) || 0 } })}
                            />
                            <label>Max Karakter:</label>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                              value={q.criteria?.maxLength || 0}
                              onChange={(e) => updateQuestion(q.id, { criteria: { ...q.criteria, maxLength: parseInt(e.target.value) || 0 } })}
                            />
                          </div>
                        </div>
                      )}

                      {/* Pembahasan / Solution Editor */}
                      <div className="space-y-2 pt-4 border-t border-slate-200">
                        <label className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          Pembahasan Soal (Mendukung KaTeX LaTeX &amp; Gambar)
                        </label>
                        <p className="text-xs text-slate-500">
                          Pembahasan ini akan muncul di ulasan siswa jika fitur ulasan diaktifkan.
                        </p>
                        <RichTextEditor 
                          value={q.explanation || ""} 
                          onChange={(val) => updateQuestion(q.id, { explanation: val })} 
                        />
                        {q.explanation && (q.explanation.includes('$') || q.explanation.includes('\\(')) && (
                          <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">Preview Formula Pembahasan</p>
                            <MathRenderer className="prose prose-sm max-w-none text-slate-800" htmlContent={q.explanation} />
                          </div>
                        )}
                      </div>

                    </div>
                  </Card>
                </motion.div>
              );
            })}
            
            {questions.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 bg-white">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-bold text-slate-700">Belum ada soal ditambahkan.</p>
                <p className="text-xs text-slate-500 mt-1">Gunakan panel di sebelah kiri untuk menambah soal pilihan ganda, essay, atau impor dari bank soal.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Modal: Bank Soal */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden border border-slate-200"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Library className="w-5 h-5 text-blue-600" /> Impor dari Bank Soal Pusat
                </h2>
                <button onClick={() => setShowBankModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-3">
                {loadingBanks ? (
                  <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : banks.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">Tidak ada bank soal yang tersedia.</div>
                ) : (
                  banks.map(bank => (
                    <div key={bank.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{bank.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{bank.description}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1">{bank.items?.length || 0} SOAL TERSEDIA</p>
                      </div>
                      <Button onClick={() => importFromBank(bank)} className="bg-blue-600 hover:bg-blue-700 text-xs">
                        Impor Soal
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
