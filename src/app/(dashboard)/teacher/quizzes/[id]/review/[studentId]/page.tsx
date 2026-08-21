"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TeacherQuizGradingPage({ params }: { params: Promise<{ id: string, studentId: string }> }) {
  const { id, studentId } = use(params);
  const supabase = createClient();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [scoreRecord, setScoreRecord] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  // Essay grading state: mapping question_id -> assigned points
  const [essayGrades, setEssayGrades] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [quizRes, qRes, scoreRes, respRes] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("quiz_id", id).order("order_index"),
        supabase.from("student_scores").select("*, profiles!student_scores_student_id_fkey(full_name, avatar_url)").eq("target_id", id).eq("student_id", studentId).single(),
        supabase.from("quiz_responses").select("*").eq("quiz_id", id).eq("student_id", studentId)
      ]);
      
      if (quizRes.data) setQuiz(quizRes.data);
      if (qRes.data) setQuestions(qRes.data);
      
      let answersFromScore = {};
      if (scoreRes.data) {
         setScoreRecord(scoreRes.data);
         let savedGrades = {};
         try {
            let metadata = scoreRes.data.metadata || {};
            if (typeof metadata === 'string') {
               metadata = JSON.parse(metadata);
            }
            
            // Extreme fallback check
            if (metadata.essayGrades) savedGrades = metadata.essayGrades;
            
            if (metadata.responses) {
               answersFromScore = typeof metadata.responses === 'string' ? JSON.parse(metadata.responses) : metadata.responses;
            } else if (metadata.rawResponses) {
               answersFromScore = typeof metadata.rawResponses === 'string' ? JSON.parse(metadata.rawResponses) : metadata.rawResponses;
            }
         } catch(e) {
            console.error("Error parsing metadata:", e);
         }
         setEssayGrades(savedGrades);
      }
      
      let respMap: Record<string, any> = {};
      if (respRes.data && respRes.data.length > 0) {
         respRes.data.forEach((r: any) => {
            if (r.metadata?.answer) {
              respMap[r.question_id] = r.metadata.answer;
            }
         });
      }
      
      // Fallback to answers from score metadata if quiz_responses is empty
      setResponses(Object.keys(respMap).length > 0 ? respMap : answersFromScore);

      
      setLoading(false);
    };
    fetchData();
  }, [id, studentId, supabase]);

  const handleSaveGrading = async () => {
    setSaving(true);
    let totalScore = 0;
    let maxScore = quiz?.total_points || 0;
    if (!maxScore && questions && questions.length > 0) {
       maxScore = questions.reduce((acc, q) => acc + (q.points || 10), 0);
    }
    // Prevent division by zero
    if (!maxScore) maxScore = 100;

    questions.forEach(q => {
      const ans = responses[q.id];
      
      if (q.question_type === "mcq") {
        const correctOpt = q.options?.find((o: any) => o.is_correct);
        if (ans === correctOpt?.text) totalScore += q.points;
      } else if (q.question_type === "complex_mcq") {
        const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
        const isCorrect = Array.isArray(ans) && ans.length === correctOpts.length && ans.every(a => correctOpts.includes(a));
        if (isCorrect) totalScore += q.points;
      } else if (q.question_type === "matching") {
        let matches = 0;
        let totalPairs = q.options?.length || 1;
        q.options?.forEach((opt: any) => {
          if (ans && ans[opt.text] === opt.match_pair) matches++;
        });
        totalScore += (matches / totalPairs) * q.points;
      } else if (q.question_type === "essay") {
         // Add the manual grade
         const grade = parseFloat(essayGrades[q.id] || "0");
         totalScore += isNaN(grade) ? 0 : grade;
      }
    });

    const finalPercentage = Math.round((totalScore / maxScore) * 100);

    // Save final grade
    const submissionMeta = { 
       rawResponses: responses, 
       essayGrades 
    };

    await supabase.from("student_scores").update({
      score: finalPercentage,
      is_graded: true,
      metadata: submissionMeta,
      graded_at: new Date().toISOString()
    }).eq("id", scoreRecord.id);

    // Also update the local state to show it's finalized
    setScoreRecord({ ...scoreRecord, score: finalPercentage, is_graded: true });
    setSaving(false);
    alert("Grading berhasil disimpan!");
  };

  if (loading) return <div className="h-[80vh] flex items-center justify-center animate-pulse text-[var(--accent)] font-bold">Memuat Detail Ujian...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--border)]">
         <div>
            <Link href={`/teacher/quizzes/${id}/review`}>
               <Button variant="ghost" className="mb-2 -ml-4" icon={<ChevronLeft className="h-4 w-4" />}>Back to Submissions</Button>
            </Link>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Student Grading</h1>
            <div className="flex items-center gap-3 mt-2">
               <div className="h-8 w-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center font-bold text-[var(--accent)] text-xs border border-[var(--accent)]/20">
                  {scoreRecord?.profiles?.full_name?.[0] || "?"}
               </div>
               <p className="text-[var(--text-secondary)] font-medium">
                  <span className="font-bold text-[var(--accent)]">{scoreRecord?.profiles?.full_name}</span> &bull; {quiz?.title}
               </p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Final Score</p>
            <div className="text-4xl font-black text-[var(--accent)]">{scoreRecord?.score}<span className="text-xl text-[var(--text-tertiary)]">/100</span></div>
            <Badge variant={scoreRecord?.is_graded ? "success" : "warning"} className="mt-2 font-bold">
               {scoreRecord?.is_graded ? "Finalized" : "Pending Review"}
            </Badge>
         </div>
      </header>

      <div className="space-y-6">
        {questions.map((q, index) => {
          const ans = responses[q.id];
          
          let isCorrect = false;
          let showCorrectness = true;
          let earnedPoints = 0;

          if (q.question_type === "mcq") {
             const correctOpt = q.options?.find((o: any) => o.is_correct);
             isCorrect = ans === correctOpt?.text;
             earnedPoints = isCorrect ? q.points : 0;
          } else if (q.question_type === "complex_mcq") {
             const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
             isCorrect = Array.isArray(ans) && ans.length === correctOpts.length && ans.every(a => correctOpts.includes(a));
             earnedPoints = isCorrect ? q.points : 0;
          } else if (q.question_type === "matching") {
             let matches = 0;
             q.options?.forEach((opt: any) => {
                if (ans && ans[opt.text] === opt.match_pair) matches++;
             });
             earnedPoints = (matches / (q.options?.length || 1)) * q.points;
             isCorrect = matches === q.options?.length;
             showCorrectness = false; // Partial points possible
          } else if (q.question_type === "matrix") {
             let correctRows = 0;
             const totalRows = q.options?.length || 1;
             q.options?.forEach((opt: any) => {
                const correctCols = [...(opt.match_pairs || [])].sort().join(',');
                const userCols = [...(ans?.[opt.text] || [])].sort().join(',');
                if (correctCols === userCols) correctRows++;
             });
             earnedPoints = (correctRows / totalRows) * q.points;
             isCorrect = correctRows === totalRows;
             showCorrectness = false;
          } else if (q.question_type === "essay") {
             showCorrectness = false;
             earnedPoints = parseFloat(essayGrades[q.id] || "0") || 0;
          }

          return (
            <Card key={q.id} className={`p-6 border-l-4 ${q.question_type === 'essay' ? 'border-l-[var(--warning)]' : showCorrectness ? (isCorrect ? 'border-l-[var(--success)]' : 'border-l-[var(--error)]') : 'border-l-[var(--accent)]'} relative overflow-hidden`}>
              <div className="flex justify-between items-start mb-6 gap-4">
                 <div>
                    <Badge variant="info" className="mb-3 text-[10px] uppercase font-bold tracking-wider opacity-80">
                       Question {index + 1} &bull; {q.question_type.toUpperCase()}
                    </Badge>
                    <p className="font-bold text-[var(--text-primary)] text-lg leading-relaxed">{q.text}</p>
                 </div>
                 <div className="text-right whitespace-nowrap bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                    <span className="font-black text-[var(--text-primary)]">{earnedPoints}</span>
                    <span className="text-xs text-[var(--text-tertiary)]"> / {q.points} pts</span>
                 </div>
              </div>

              {/* Student's Answer Render */}
              <div className="bg-[var(--bg-secondary)]/50 p-4 rounded-xl border border-[var(--border)] mb-4">
                 <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-2">Student's Answer:</p>
                 {q.question_type === "mcq" ? (
                    <div className="flex items-center gap-2">
                       {showCorrectness && (isCorrect ? <CheckCircle2 className="h-5 w-5 text-[var(--success)]" /> : <XCircle className="h-5 w-5 text-[var(--error)]" />)}
                       <p className={`font-bold ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>{ans || <span className="italic opacity-50">No answer provided</span>}</p>
                    </div>
                 ) : q.question_type === "complex_mcq" ? (
                    <div className="space-y-1">
                       {showCorrectness && !isCorrect && <div className="text-[10px] text-[var(--error)] font-bold mb-1"><XCircle className="h-3 w-3 inline mr-1" />Incorrect Combination</div>}
                       {showCorrectness && isCorrect && <div className="text-[10px] text-[var(--success)] font-bold mb-1"><CheckCircle2 className="h-3 w-3 inline mr-1" />Perfect Match</div>}
                       {Array.isArray(ans) && ans.length > 0 ? ans.map((a, i) => (
                          <div key={i} className="px-3 py-1 bg-white border border-[var(--border)] rounded shadow-sm text-sm font-medium">{a}</div>
                       )) : <span className="italic opacity-50 text-sm">No answer provided</span>}
                    </div>
                 ) : q.question_type === "matching" ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                       {q.options?.map((opt: any, i: number) => {
                          const studentMatch = ans?.[opt.text];
                          const isMatchCorrect = studentMatch === opt.match_pair;
                          return (
                             <div key={i} className="col-span-2 flex items-center gap-2">
                                <div className="flex-1 p-2 bg-white border border-[var(--border)] rounded">{opt.text}</div>
                                <div className="text-[var(--text-tertiary)]">&rarr;</div>
                                <div className={`flex-1 p-2 border rounded font-bold flex items-center justify-between ${isMatchCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                   <span>{studentMatch || "Unanswered"}</span>
                                   {isMatchCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 ) : q.question_type === "matrix" ? (
                     <div className="overflow-x-auto rounded-xl border border-[var(--border)] mt-2">
                        <table className="w-full text-left border-collapse min-w-[500px] text-sm">
                           <thead>
                              <tr className="bg-[var(--bg-tertiary)] border-b border-[var(--border)]">
                                 <th className="p-3 font-semibold text-[var(--text-secondary)] w-1/3">Pernyataan</th>
                                 {q.criteria?.cols?.map((col: string, cIdx: number) => (
                                    <th key={cIdx} className="p-3 font-semibold text-center border-l border-[var(--border)] text-[var(--text-secondary)]">{col}</th>
                                 ))}
                              </tr>
                           </thead>
                           <tbody>
                              {q.options?.map((row: any, rIdx: number) => {
                                 const userSelections = ans ? (ans[row.text] || []) : [];
                                 const correctSelections = row.match_pairs || [];
                                 const isRowCorrect = [...userSelections].sort().join(',') === [...correctSelections].sort().join(',');
                                 return (
                                    <tr key={rIdx} className="border-b border-[var(--border)] last:border-b-0">
                                       <td className="p-3 text-[var(--text-primary)] font-medium">
                                          {row.text}
                                          {!isRowCorrect && <div className="text-[10px] text-[var(--error)] mt-1 font-bold">Salah (Kunci: {correctSelections.join(', ') || '-'})</div>}
                                       </td>
                                       {q.criteria?.cols?.map((col: string, cIdx: number) => {
                                          const isSelected = userSelections.includes(col);
                                          const isCorrectOption = correctSelections.includes(col);
                                          let cellBg = '';
                                          let checkColor = 'border-slate-300';
                                          
                                          if (isCorrectOption) {
                                             cellBg = 'bg-green-50';
                                             checkColor = 'bg-[var(--success)] border-[var(--success)] text-white';
                                          } else if (isSelected && !isCorrectOption) {
                                             cellBg = 'bg-red-50';
                                             checkColor = 'bg-[var(--error)] border-[var(--error)] text-white';
                                          }
                                          
                                          return (
                                             <td key={cIdx} className={`p-3 text-center border-l border-[var(--border)] ${cellBg}`}>
                                                <div className={`w-4 h-4 mx-auto rounded flex items-center justify-center border ${checkColor}`}>
                                                   {(isCorrectOption || isSelected) && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                             </td>
                                          )
                                       })}
                                    </tr>
                                 )
                              })}
                           </tbody>
                        </table>
                     </div>
                 ) : (
                    <div>
                       <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{ans || <span className="italic opacity-50">No answer provided</span>}</p>
                    </div>
                 )}
              </div>

              {/* Correct Answer Display for Non-Essay */}
              {q.question_type !== "essay" && !isCorrect && (
                 <div className="bg-[var(--success)]/10 border border-[var(--success)]/30 p-3 rounded-lg text-sm">
                    <p className="text-[10px] font-bold text-[var(--success)] uppercase mb-1">Correct Answer:</p>
                    {q.question_type === "mcq" ? (
                       <p className="font-bold text-[var(--text-primary)]">{q.options?.find((o: any) => o.is_correct)?.text}</p>
                    ) : q.question_type === "complex_mcq" ? (
                       <div className="flex flex-wrap gap-2 mt-1">
                          {q.options?.filter((o: any) => o.is_correct).map((o: any, i: number) => (
                             <Badge variant="default" key={i} className="bg-[var(--success)]">{o.text}</Badge>
                          ))}
                       </div>
                    ) : null}
                 </div>
              )}

              {/* Grading Input for Essay */}
              {q.question_type === "essay" && (
                 <div className="mt-6 p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-yellow-700">
                       <AlertCircle className="h-5 w-5" />
                       <div>
                          <p className="text-sm font-bold">Manual Grading Required</p>
                          <p className="text-xs opacity-80">Review the essay above and assign points.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <input 
                          type="number"
                          min="0"
                          max={q.points}
                          value={essayGrades[q.id] || ""}
                          onChange={(e) => setEssayGrades({...essayGrades, [q.id]: e.target.value})}
                          placeholder="0"
                          className="w-20 px-3 py-2 text-center rounded-lg border border-[var(--accent)] font-black text-xl text-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 outline-none"
                       />
                       <span className="text-sm font-bold text-[var(--text-tertiary)]">/ {q.points} pts</span>
                    </div>
                 </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Floating Save Bar */}
      <motion.div 
         initial={{ y: 100 }}
         animate={{ y: 0 }}
         className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[var(--border)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex justify-center"
      >
         <div className="max-w-4xl w-full flex items-center justify-between">
            <div>
               <p className="font-bold text-[var(--text-primary)]">Done reviewing?</p>
               <p className="text-xs text-[var(--text-secondary)]">Save grades to finalize this student's score.</p>
            </div>
            <Button size="lg" className="px-10 h-14 rounded-2xl shadow-xl shadow-[var(--accent)]/30 font-black text-lg" onClick={handleSaveGrading} disabled={saving}>
               {saving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
               Save Final Grade
            </Button>
         </div>
      </motion.div>
    </div>
  );
}
