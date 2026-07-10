"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
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
  Type,
  Loader2,
  X,
  Link as LinkIcon,
  Settings,
  Clock,
  Award,
  Flag
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "essay" | "complex_mcq" | "matching";
  options: { text: string; is_correct?: boolean; match_pair?: string }[] | null;
  points: number;
  order_index: number;
  criteria?: { minLength?: number; maxLength?: number } | null;
}

export default function CBTBuilderPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizData } = await supabase.from("quizzes").select("*, courses(title)").eq("id", id).single();
      const { data: qData } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true });
      
      if (quizData) {
        // Initialize new fields if they don't exist
        setQuiz({
          ...quizData,
          time_limit: quizData.time_limit || 0,
          max_score: quizData.max_score || 100,
          allow_leave_exam: quizData.allow_leave_exam ?? true,
          min_time_to_submit: quizData.min_time_to_submit || 0,
          shuffle_questions: quizData.shuffle_questions ?? false
        });
      }
      if (qData) {
        setQuestions(qData as Question[]);
        const { data: rData } = await supabase
          .from("question_reports")
          .select("*, profiles(full_name)")
          .in("question_id", qData.map((q: any) => q.id));
        if (rData) setReports(rData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const addQuestion = (type: "mcq" | "essay" | "complex_mcq" | "matching") => {
    const newQ: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      question_type: type,
      points: 10,
      order_index: questions.length,
      options: type === "mcq" || type === "complex_mcq" ? [
        { text: "Option 1", is_correct: type === "mcq" ? true : false },
        { text: "Option 2", is_correct: false },
      ] : type === "matching" ? [
        { text: "Term 1", match_pair: "Definition 1" },
        { text: "Term 2", match_pair: "Definition 2" }
      ] : null,
      criteria: type === "essay" ? { minLength: 250 } : null
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Save quiz settings
    const { error: quizError } = await supabase
      .from("quizzes")
      .update({ 
        time_limit: quiz.time_limit || null, 
        max_score: quiz.max_score || 100,
        allow_leave_exam: quiz.allow_leave_exam,
        min_time_to_submit: quiz.min_time_to_submit,
        shuffle_questions: quiz.shuffle_questions
      })
      .eq("id", id);

    if (quizError) {
      alert(quizError.message);
      setSaving(false);
      return;
    }

    // Filter ids to keep
    const questionIdsToKeep = questions.map(q => q.id).filter(id => !id.startsWith('temp-'));
    
    // Delete removed questions
    if (questionIdsToKeep.length > 0) {
      await supabase.from("questions").delete().eq("quiz_id", id).not('id', 'in', `(${questionIdsToKeep.join(',')})`);
    } else {
      await supabase.from("questions").delete().eq("quiz_id", id);
    }
    
    const questionsToSave = questions.map((q, idx) => {
      const payload: any = {
        quiz_id: id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        points: q.points,
        order_index: idx,
        criteria: q.criteria || {}
      };
      if (!q.id.startsWith('temp-')) {
        payload.id = q.id; // Preserve existing UUID
      }
      return payload;
    });

    if (questionsToSave.length > 0) {
      const { error } = await supabase.from("questions").upsert(questionsToSave);
      if (error) alert(error.message);
      else router.push("/teacher/quizzes");
    } else {
      router.push("/teacher/quizzes");
    }
    
    setSaving(false);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
        <div className="flex items-center gap-4">
          <Link href="/teacher/quizzes" className="p-2 border border-[var(--border)] rounded-md hover:bg-[var(--bg-secondary)] transition-colors">
            <ChevronLeft className="h-5 w-5 text-[var(--text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-serif text-[var(--text-primary)]">Edit Assessment: {quiz?.title}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{quiz?.courses?.title}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Settings & Controls */}
        <div className="lg:col-span-1 space-y-6 sticky top-6 self-start">
          <Card className="p-5 border-[var(--border)] shadow-sm bg-[var(--bg-primary)] rounded-md">
            <div className="flex items-center gap-2 mb-4 text-[var(--text-primary)] font-semibold border-b border-[var(--border)] pb-2">
              <Settings className="h-4 w-4" />
              <h2>Assessment Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  placeholder="0 for unlimited"
                  className="w-full text-sm bg-white dark:bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  value={quiz.time_limit || ""}
                  onChange={(e) => setQuiz({ ...quiz, time_limit: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-[var(--text-tertiary)]">Leave 0 for no time limit.</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Award className="h-4 w-4 text-[var(--text-tertiary)]" />
                  Maximum Score
                </label>
                <input
                  type="number"
                  className="w-full text-sm bg-white dark:bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  value={quiz.max_score}
                  onChange={(e) => setQuiz({ ...quiz, max_score: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-[var(--text-tertiary)]">Grades will be scaled to this max score.</p>
              </div>

              <div className="space-y-2 border-t border-[var(--border)] pt-4 mt-2">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  Minimum Time to Submit (minutes)
                </label>
                <input
                  type="number"
                  className="w-full text-sm bg-white dark:bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                  value={quiz.min_time_to_submit}
                  onChange={(e) => setQuiz({ ...quiz, min_time_to_submit: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Allow Leaving Exam Page</label>
                <input 
                  type="checkbox" 
                  checked={quiz.allow_leave_exam} 
                  onChange={(e) => setQuiz({ ...quiz, allow_leave_exam: e.target.checked })}
                  className="h-4 w-4 text-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Shuffle Questions</label>
                <input 
                  type="checkbox" 
                  checked={quiz.shuffle_questions} 
                  onChange={(e) => setQuiz({ ...quiz, shuffle_questions: e.target.checked })}
                  className="h-4 w-4 text-[var(--accent)]"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-[var(--border)] shadow-sm bg-[var(--bg-primary)] rounded-md">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2 mb-4">Add Question</h2>
            <div className="flex flex-col gap-2">
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm" onClick={() => addQuestion("mcq")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Multiple Choice
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm" onClick={() => addQuestion("complex_mcq")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Complex PG
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm" onClick={() => addQuestion("matching")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Matching
              </Button>
              <Button variant="secondary" className="justify-start border-[var(--border)] bg-white dark:bg-[var(--bg-secondary)] shadow-sm" onClick={() => addQuestion("essay")}>
                <Plus className="h-4 w-4 mr-2 text-[var(--accent)]" />
                Essay
              </Button>
            </div>
          </Card>
        </div>

        {/* Main Content: Questions List */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="relative group border border-[var(--border)] shadow-sm bg-white dark:bg-[var(--bg-primary)] rounded-md overflow-hidden">
                  <div className="bg-[var(--bg-secondary)] px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-[var(--text-primary)]">Question {idx + 1}</span>
                      <Badge variant="info" className="bg-white dark:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)] flex items-center gap-1 font-normal">
                        {q.question_type === "mcq" && <HelpCircle className="h-3 w-3" />}
                        {q.question_type === "complex_mcq" && <CheckSquare className="h-3 w-3" />}
                        {q.question_type === "matching" && <LinkIcon className="h-3 w-3" />}
                        {q.question_type === "essay" && <Type className="h-3 w-3" />}
                        {q.question_type.toUpperCase().replace("_", " ")}
                      </Badge>
                      {reports.filter(r => r.question_id === q.id).length > 0 && (
                        <Badge variant="error" className="bg-[var(--error)] text-white border-[var(--error)] flex items-center gap-1 font-normal ml-2">
                          <Flag className="h-3 w-3" />
                          {reports.filter(r => r.question_id === q.id).length} Laporan
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Points:</span>
                        <input
                          type="number"
                          className="w-16 px-2 py-1 text-center text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                          value={q.points}
                          onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <button onClick={() => removeQuestion(q.id)} className="text-[var(--error)] hover:bg-[var(--error-light)] p-1.5 rounded transition-colors" title="Remove question">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text-primary)]">Question Text</label>
                      <RichTextEditor 
                        value={q.question_text} 
                        onChange={(val) => updateQuestion(q.id, { question_text: val })} 
                      />
                    </div>

                    {reports.filter(r => r.question_id === q.id).length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-md space-y-3">
                        <h4 className="text-sm font-bold text-red-700 flex items-center gap-2">
                          <Flag className="h-4 w-4" /> Laporan dari Siswa
                        </h4>
                        <div className="space-y-2">
                          {reports.filter(r => r.question_id === q.id).map(r => (
                            <div key={r.id} className="bg-white p-3 rounded border border-red-100 text-sm">
                              <p className="font-semibold text-slate-700 mb-1">{r.profiles?.full_name || 'Siswa'}</p>
                              <p className="text-slate-600">{r.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice & Complex MCQ */}
                    {(q.question_type === "mcq" || q.question_type === "complex_mcq") && q.options && (
                      <div className="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border)]">
                        <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">Answers</label>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-start gap-3 bg-white dark:bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)] shadow-sm">
                            <button 
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
                              className={`mt-1 ${opt.is_correct ? "text-[var(--success)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
                              title={opt.is_correct ? "Correct answer" : "Mark as correct"}
                            >
                              {q.question_type === "mcq" ? (
                                opt.is_correct ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />
                              ) : (
                                opt.is_correct ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />
                              )}
                            </button>
                            <input
                              className="flex-1 text-sm bg-transparent border-none p-1 focus:ring-0 focus:outline-none text-[var(--text-primary)]"
                              value={opt.text}
                              placeholder="Enter option text"
                              onChange={(e) => {
                                const newOpts = [...q.options!];
                                newOpts[oIdx].text = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                            />
                            {q.options!.length > 2 && (
                              <button 
                                onClick={() => {
                                  const newOpts = q.options!.filter((_, i) => i !== oIdx);
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="text-[var(--text-tertiary)] hover:text-[var(--error)] p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="mt-2 bg-white dark:bg-[var(--bg-secondary)] border-[var(--border)]"
                          onClick={() => {
                            updateQuestion(q.id, { options: [...q.options!, { text: `Option ${q.options!.length + 1}`, is_correct: false }] });
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Option
                        </Button>
                      </div>
                    )}

                    {/* Matching Option */}
                    {q.question_type === "matching" && q.options && (
                      <div className="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border)]">
                        <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">Matching Pairs</label>
                        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center mb-1 px-1">
                          <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Premise (Term)</span>
                          <span className="w-4"></span>
                          <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Response (Definition)</span>
                          <span className="w-6"></span>
                        </div>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 items-center bg-white dark:bg-[var(--bg-secondary)] p-2 rounded border border-[var(--border)] shadow-sm">
                            <input
                              className="w-full text-sm bg-transparent border-none p-2 focus:ring-0 focus:outline-none text-[var(--text-primary)]"
                              value={opt.text}
                              onChange={(e) => {
                                const newOpts = [...q.options!];
                                newOpts[oIdx].text = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              placeholder="e.g. Mitochondria"
                            />
                            <LinkIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                            <input
                              className="w-full text-sm bg-transparent border-none p-2 focus:ring-0 focus:outline-none text-[var(--text-primary)]"
                              value={opt.match_pair || ""}
                              onChange={(e) => {
                                const newOpts = [...q.options!];
                                newOpts[oIdx].match_pair = e.target.value;
                                updateQuestion(q.id, { options: newOpts });
                              }}
                              placeholder="e.g. Powerhouse of the cell"
                            />
                            {q.options!.length > 2 ? (
                              <button 
                                onClick={() => {
                                  const newOpts = q.options!.filter((_, i) => i !== oIdx);
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                className="text-[var(--text-tertiary)] hover:text-[var(--error)] p-1 justify-self-end"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            ) : <span className="w-6"></span>}
                          </div>
                        ))}
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="mt-2 bg-white dark:bg-[var(--bg-secondary)] border-[var(--border)]"
                          onClick={() => {
                            updateQuestion(q.id, { options: [...q.options!, { text: `Term ${q.options!.length + 1}`, match_pair: `Definition ${q.options!.length + 1}` }] });
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Pair
                        </Button>
                      </div>
                    )}

                    {/* Essay Options */}
                    {q.question_type === "essay" && (
                      <div className="space-y-3 bg-[var(--bg-tertiary)] p-4 rounded border border-[var(--border)]">
                        <label className="text-sm font-semibold text-[var(--text-primary)] block mb-2">Essay Criteria</label>
                        <div className="flex items-center gap-3 bg-white dark:bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)] shadow-sm">
                          <label className="text-sm text-[var(--text-secondary)]">Min Characters:</label>
                          <input
                            type="number"
                            className="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                            value={q.criteria?.minLength || 0}
                            onChange={(e) => {
                              updateQuestion(q.id, { 
                                criteria: { ...q.criteria, minLength: parseInt(e.target.value) || 0 } 
                              });
                            }}
                          />
                          <label className="text-sm text-[var(--text-secondary)] ml-4">Max Characters:</label>
                          <input
                            type="number"
                            className="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                            value={q.criteria?.maxLength || 0}
                            onChange={(e) => {
                              updateQuestion(q.id, { 
                                criteria: { ...q.criteria, maxLength: parseInt(e.target.value) || 0 } 
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
            
            {questions.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No questions added yet.</p>
                <p className="text-sm mt-1">Use the panel on the left to add questions to your assessment.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
