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
  GripVertical, 
  Save,
  HelpCircle,
  Type,
  Loader2,
  X
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "essay";
  options: { text: string; is_correct: boolean }[] | null;
  points: number;
  order_index: number;
}

export default function CBTBuilderPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: quizData } = await supabase.from("quizzes").select("*, courses(title)").eq("id", id).single();
      const { data: qData } = await supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true });
      
      if (quizData) setQuiz(quizData);
      if (qData) setQuestions(qData as Question[]);
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const addQuestion = (type: "mcq" | "essay") => {
    const newQ: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      question_type: type,
      points: 10,
      order_index: questions.length,
      options: type === "mcq" ? [
        { text: "Option 1", is_correct: true },
        { text: "Option 2", is_correct: false },
      ] : null
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
    // Delete existing questions and insert new ones (simple sync strategy)
    await supabase.from("questions").delete().eq("quiz_id", id);
    
    const questionsToSave = questions.map((q, idx) => ({
      quiz_id: id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      points: q.points,
      order_index: idx
    }));

    const { error } = await supabase.from("questions").insert(questionsToSave);
    
    if (error) alert(error.message);
    else router.push("/teacher/quizzes");
    setSaving(false);
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/teacher/quizzes" className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{quiz?.title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">Course: {quiz?.courses?.title}</p>
          </div>
        </div>
        <Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>
          Save Assessment
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="relative group">
                <div className="absolute left-3 top-7 text-[var(--text-tertiary)] cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>
                
                <div className="pl-8 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <input
                        className="w-full text-lg font-bold bg-transparent border-none focus:outline-none placeholder:text-[var(--text-tertiary)]"
                        placeholder="Enter your question here..."
                        value={q.question_text}
                        onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info" className="flex items-center gap-1">
                        {q.question_type === "mcq" ? <HelpCircle className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                        {q.question_type.toUpperCase()}
                      </Badge>
                      <button onClick={() => removeQuestion(q.id)} className="p-2 text-[var(--error)] hover:bg-[var(--error-light)] rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {q.question_type === "mcq" && q.options && (
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              const newOpts = q.options!.map((o, i) => ({ ...o, is_correct: i === oIdx }));
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className={opt.is_correct ? "text-[var(--success)]" : "text-[var(--text-tertiary)]"}
                          >
                            {opt.is_correct ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </button>
                          <input
                            className="flex-1 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-2 focus:ring-1 focus:ring-[var(--accent)]"
                            value={opt.text}
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
                              className="text-[var(--text-tertiary)] hover:text-[var(--error)]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs" 
                        onClick={() => {
                          updateQuestion(q.id, { options: [...q.options!, { text: `Option ${q.options!.length + 1}`, is_correct: false }] });
                        }}
                      >
                        + Add Option
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-tertiary)]">Points:</span>
                      <input
                        type="number"
                        className="w-16 h-8 text-center text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg"
                        value={q.points}
                        onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-4 py-8">
          <Button variant="secondary" onClick={() => addQuestion("mcq")} icon={<Plus className="h-4 w-4" />}>
            Multiple Choice
          </Button>
          <Button variant="secondary" onClick={() => addQuestion("essay")} icon={<Plus className="h-4 w-4" />}>
            Essay Question
          </Button>
        </div>
      </div>
    </div>
  );
}
