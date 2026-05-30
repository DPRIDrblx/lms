"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, use, useCallback } from "react";

// Lucide icons removed to keep it "Old School/Classic" 
// Using basic HTML symbols instead where needed.

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Drag and drop state for matching
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const initExam = useCallback(async () => {
    if (!profile) return;
    
    const [qData, qsData] = await Promise.all([
      supabase.from("quizzes").select("*, courses(title)").eq("id", id).single(),
      supabase.from("questions").select("*").eq("quiz_id", id).order("order_index", { ascending: true })
    ]);

    if (qData.data) setQuiz(qData.data);
    if (qsData.data) setQuestions(qsData.data);

    // Session Persistence
    const { data: existing } = await supabase.from("exam_sessions").select("*").eq("student_id", profile.id).eq("quiz_id", id).single();
    
    if (existing) {
      if (existing.status === 'submitted') { setIsFinished(true); setLoading(false); return; }
      setSession(existing);
      setTimeLeft(existing.time_left_seconds);
      
      const { data: resp } = await supabase.from("quiz_responses").select("*").eq("student_id", profile.id).eq("quiz_id", id);
      if (resp) {
        const initialResp: Record<string, any> = {};
        const initialFlags: Record<string, boolean> = {};
        resp.forEach((r: any) => {
          if (r.metadata?.answer) {
             initialResp[r.question_id] = r.metadata.answer;
          }
          initialFlags[r.question_id] = r.is_flagged;
        });
        setResponses(initialResp);
        setFlags(initialFlags);
      }
    } else {
      const { data: newSession } = await supabase.from("exam_sessions").insert({
        student_id: profile.id,
        quiz_id: id,
        time_left_seconds: (qData.data?.time_limit_minutes || 60) * 60,
        status: 'in_progress',
        metadata: { started_at: new Date().toISOString() }
      }).select().single();
      
      if (newSession) {
        setSession(newSession);
        setTimeLeft(newSession.time_left_seconds);
      }
    }
    
    setLoading(false);
  }, [profile, id, supabase]);

  useEffect(() => { initExam(); }, [initExam]);

  useEffect(() => {
    if (timeLeft <= 0 || loading || isFinished) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); submitExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, isFinished]);

  // Handle Tab blur for anti-cheat
  useEffect(() => {
    const handleBlur = () => {
      if (!isFinished && !loading) {
        alert("PERINGATAN KECURANGAN: Anda telah meninggalkan halaman ujian! Aktivitas dicatat.");
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [isFinished, loading]);

  const saveAnswer = async (qId: string, answer: any) => {
    const newResponses = { ...responses, [qId]: answer };
    setResponses(newResponses);
    
    await supabase.from("quiz_responses").upsert({
      student_id: profile?.id,
      quiz_id: id,
      question_id: qId,
      metadata: { answer },
      is_flagged: flags[qId] || false
    }, { onConflict: 'student_id,question_id' });
  };

  const setFlag = async (qId: string) => {
    const val = !flags[qId];
    const newFlags = { ...flags, [qId]: val };
    setFlags(newFlags);
    
    await supabase.from("quiz_responses").update({ is_flagged: val }).eq("student_id", profile?.id).eq("question_id", qId);
  };

  const submitExam = async () => {
    if (timeLeft > 0 && !confirm("Apakah Anda yakin ingin mengakhiri ujian ini?")) return;
    await supabase.from("exam_sessions").update({ status: 'submitted', time_left_seconds: 0 }).eq("id", session?.id);
    
    // We also need to process grading!
    let totalScore = 0;
    let maxScore = 0;
    let hasEssay = false;

    questions.forEach(q => {
      maxScore += q.points;
      const ans = responses[q.id];
      if (!ans) return;

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
          if (ans[opt.text] === opt.match_pair) matches++;
        });
        totalScore += (matches / totalPairs) * q.points;
      } else if (q.question_type === "essay") {
        hasEssay = true;
      }
    });

    const finalPercentage = Math.round((totalScore / maxScore) * 100);

    // Save final grade
    await supabase.from("student_scores").insert({
      student_id: profile?.id,
      target_id: id,
      target_type: "quiz",
      score: finalPercentage,
      is_graded: !hasEssay,
      submission_url: JSON.stringify(responses), 
      graded_at: hasEssay ? null : new Date().toISOString()
    });

    setIsFinished(true);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', fontFamily: 'Arial, sans-serif'}}>Memuat Data Ujian...</div>;

  if (isFinished) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', fontFamily: 'Arial, sans-serif'}}>
         <div style={{backgroundColor: '#fff', padding: '40px', border: '1px solid #ccc', maxWidth: '500px', textAlign: 'center'}}>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '10px'}}>UJIAN SELESAI</h1>
            <p style={{fontSize: '14px', color: '#475569', marginBottom: '20px'}}>Jawaban Anda telah disinkronisasikan dengan server.</p>
            <p style={{fontSize: '14px', color: '#475569', marginBottom: '30px'}}>
              Silakan kembali ke Dashboard. Jika terdapat soal Essay, nilai Anda berstatus <strong>Menunggu Penilaian Guru</strong>.
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{padding: '10px 20px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}
            >
              KEMBALI KE DASHBOARD
            </button>
         </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div style={{minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Arial, Helvetica, sans-serif', color: '#1e293b'}}>
      {/* HEADER CLASSIC */}
      <header style={{backgroundColor: '#1e3a8a', color: 'white', borderBottom: '5px solid #ef4444', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '30px'}}>
          <div style={{borderRight: '1px solid #3b82f6', paddingRight: '30px'}}>
            <div style={{fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px'}}>CBT Application System</div>
            <div style={{fontSize: '18px', fontWeight: 'bold'}}>{quiz?.title}</div>
          </div>
          <div>
            <div style={{fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase'}}>Nama Peserta</div>
            <div style={{fontSize: '14px', fontWeight: 'bold'}}>{profile?.full_name}</div>
          </div>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={{backgroundColor: timeLeft < 300 ? '#ef4444' : '#334155', padding: '10px 20px', border: '2px solid #475569'}}>
            <div style={{fontSize: '10px', color: '#cbd5e1', textTransform: 'uppercase', textAlign: 'center'}}>Sisa Waktu</div>
            <div style={{fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px'}}>{formatTime(timeLeft)}</div>
          </div>
        </div>
      </header>

      <main style={{display: 'flex', gap: '20px', padding: '20px', maxWidth: '1400px', margin: '0 auto', height: 'calc(100vh - 85px)'}}>
        
        {/* LEFT PANEL: QUESTION CONTENT */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{flex: 1, backgroundColor: 'white', border: '1px solid #cbd5e1', padding: '25px', display: 'flex', flexDirection: 'column'}}>
            
            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a'}}>Soal No. {currentIndex + 1}</div>
                <div style={{backgroundColor: '#e2e8f0', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #cbd5e1'}}>
                  Tipe: {currentQ?.question_type?.toUpperCase().replace("_", " ")}
                </div>
              </div>
            </div>

            <div style={{flex: 1, overflowY: 'auto', fontSize: '16px', lineHeight: '1.6'}}>
              <div style={{marginBottom: '30px'}} dangerouslySetInnerHTML={{ __html: currentQ?.question_text }} />

              {/* RENDER QUESTION BY TYPE */}
              <div style={{marginTop: '20px'}}>
                
                {/* MCQ */}
                {currentQ?.question_type === 'mcq' && currentQ.options?.map((opt: any, i: number) => {
                  const isSelected = responses[currentQ.id] === opt.text;
                  return (
                    <div 
                      key={i}
                      onClick={() => saveAnswer(currentQ.id, opt.text)}
                      style={{display: 'flex', alignItems: 'center', padding: '15px', border: '1px solid', borderColor: isSelected ? '#1e3a8a' : '#cbd5e1', backgroundColor: isSelected ? '#eff6ff' : 'white', marginBottom: '10px', cursor: 'pointer'}}
                    >
                      <div style={{width: '30px', height: '30px', backgroundColor: isSelected ? '#1e3a8a' : '#e2e8f0', color: isSelected ? 'white' : 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px', border: '1px solid #94a3b8'}}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span>{opt.text}</span>
                    </div>
                  );
                })}

                {/* COMPLEX MCQ */}
                {currentQ?.question_type === 'complex_mcq' && currentQ.options?.map((opt: any, i: number) => {
                  const selectedArr = responses[currentQ.id] || [];
                  const isSelected = selectedArr.includes(opt.text);
                  
                  const toggleSelect = () => {
                    let newArr = [...selectedArr];
                    if (isSelected) newArr = newArr.filter(item => item !== opt.text);
                    else newArr.push(opt.text);
                    saveAnswer(currentQ.id, newArr);
                  };

                  return (
                    <div 
                      key={i}
                      onClick={toggleSelect}
                      style={{display: 'flex', alignItems: 'center', padding: '15px', border: '1px solid', borderColor: isSelected ? '#1e3a8a' : '#cbd5e1', backgroundColor: isSelected ? '#eff6ff' : 'white', marginBottom: '10px', cursor: 'pointer'}}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly
                        style={{width: '20px', height: '20px', marginRight: '15px', cursor: 'pointer'}}
                      />
                      <span>{opt.text}</span>
                    </div>
                  );
                })}

                {/* MATCHING (Simple Drag and Drop) */}
                {currentQ?.question_type === 'matching' && (() => {
                  const answersMap = responses[currentQ.id] || {}; // { term: definition }
                  const terms = currentQ.options?.map((o: any) => o.text) || [];
                  
                  // Shuffle definitions only once per question (deterministic based on length for simplicity)
                  const defs = currentQ.options?.map((o: any) => o.match_pair) || [];
                  const availableDefs = defs.filter((d: string) => !Object.values(answersMap).includes(d));

                  return (
                    <div>
                      <p style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '15px'}}>Tarik kotak definisi di sebelah kanan ke area kosong di sebelah kiri.</p>
                      <div style={{display: 'flex', gap: '30px'}}>
                        {/* Terms Column */}
                        <div style={{flex: 1}}>
                          {terms.map((term: string, i: number) => {
                            const matchedDef = answersMap[term];
                            return (
                              <div key={i} style={{display: 'flex', alignItems: 'center', marginBottom: '15px'}}>
                                <div style={{width: '40%', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 'bold'}}>
                                  {term}
                                </div>
                                <div style={{padding: '10px', fontWeight: 'bold', color: '#94a3b8'}}>&#8594;</div>
                                <div 
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    if (draggedItem) {
                                      const newAnswers = { ...answersMap, [term]: draggedItem };
                                      saveAnswer(currentQ.id, newAnswers);
                                      setDraggedItem(null);
                                    }
                                  }}
                                  style={{
                                    flex: 1, 
                                    padding: '10px', 
                                    border: '2px dashed #94a3b8', 
                                    minHeight: '42px',
                                    backgroundColor: matchedDef ? '#eff6ff' : 'transparent',
                                    color: '#1e3a8a',
                                    fontWeight: 'bold',
                                    cursor: matchedDef ? 'pointer' : 'default'
                                  }}
                                  onClick={() => {
                                    if (matchedDef) {
                                      const newAnswers = { ...answersMap };
                                      delete newAnswers[term];
                                      saveAnswer(currentQ.id, newAnswers);
                                    }
                                  }}
                                  title={matchedDef ? "Klik untuk membatalkan" : ""}
                                >
                                  {matchedDef || <span style={{opacity: 0.5}}>Area Jawaban</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Definitions Column */}
                        <div style={{width: '300px', backgroundColor: '#f1f5f9', padding: '15px', border: '1px solid #cbd5e1'}}>
                          <div style={{fontSize: '12px', fontWeight: 'bold', marginBottom: '10px'}}>Pilihan Jawaban:</div>
                          {availableDefs.map((def: string, i: number) => (
                            <div 
                              key={i}
                              draggable
                              onDragStart={() => setDraggedItem(def)}
                              style={{padding: '10px', backgroundColor: '#fff', border: '1px solid #64748b', marginBottom: '10px', cursor: 'grab', fontSize: '14px', boxShadow: '2px 2px 0px #cbd5e1'}}
                            >
                              {def}
                            </div>
                          ))}
                          {availableDefs.length === 0 && <div style={{fontSize: '12px', color: '#16a34a', fontWeight: 'bold', textAlign: 'center', marginTop: '20px'}}>Semua terpasang!</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ESSAY */}
                {currentQ?.question_type === 'essay' && (
                  <textarea 
                    value={responses[currentQ.id] || ""}
                    onChange={(e) => saveAnswer(currentQ.id, e.target.value)}
                    style={{width: '100%', minHeight: '300px', padding: '15px', backgroundColor: '#fff', border: '1px solid #94a3b8', fontSize: '16px', outline: 'none', resize: 'vertical'}}
                    placeholder="Ketikkan jawaban essay Anda di sini..."
                  />
                )}
              </div>
            </div>

            {/* BUTTON CONTROLS */}
            <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '15px', marginTop: '15px'}}>
              <button 
                disabled={currentIndex === 0} 
                onClick={() => setCurrentIndex(prev => prev - 1)}
                style={{padding: '12px 20px', backgroundColor: currentIndex === 0 ? '#f1f5f9' : '#fff', color: currentIndex === 0 ? '#cbd5e1' : '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'}}
              >
                &#9664; SOAL SEBELUMNYA
              </button>

              <button 
                onClick={() => setFlag(currentQ.id)}
                style={{padding: '12px 20px', backgroundColor: flags[currentQ.id] ? '#eab308' : '#fff', color: flags[currentQ.id] ? '#fff' : '#1e293b', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer'}}
              >
                &#9873; RAGU-RAGU
              </button>

              {currentIndex === questions.length - 1 ? (
                <button 
                  onClick={submitExam} 
                  style={{padding: '12px 20px', backgroundColor: '#16a34a', color: '#fff', border: '1px solid #15803d', fontWeight: 'bold', cursor: 'pointer'}}
                >
                  SELESAI &#9632;
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIndex(i => i + 1)}
                  style={{padding: '12px 20px', backgroundColor: '#1e3a8a', color: '#fff', border: '1px solid #1e40af', fontWeight: 'bold', cursor: 'pointer'}}
                >
                  SOAL BERIKUTNYA &#9654;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: NUMBER GRID */}
        <div style={{width: '320px', backgroundColor: 'white', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column'}}>
          <div style={{backgroundColor: '#e2e8f0', padding: '15px', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '14px', textAlign: 'center'}}>
            NAVIGASI SOAL
          </div>
          <div style={{padding: '15px', flex: 1, overflowY: 'auto'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px'}}>
              {questions.map((q, i) => {
                const ans = responses[q.id];
                // Check if answered based on question type
                let isAnswered = false;
                if (q.question_type === 'mcq' || q.question_type === 'essay') {
                  isAnswered = !!ans && ans.length > 0;
                } else if (q.question_type === 'complex_mcq') {
                  isAnswered = Array.isArray(ans) && ans.length > 0;
                } else if (q.question_type === 'matching') {
                  isAnswered = ans && Object.keys(ans).length > 0;
                }

                const isFlagged = flags[q.id];
                
                let bgColor = '#fff';
                let color = '#334155';
                let border = '1px solid #94a3b8';
                
                if (isFlagged) {
                  bgColor = '#eab308';
                  color = '#fff';
                  border = '1px solid #ca8a04';
                } else if (isAnswered) {
                  bgColor = '#3b82f6';
                  color = '#fff';
                  border = '1px solid #2563eb';
                }

                if (currentIndex === i) {
                  border = '3px solid #0f172a';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: bgColor,
                      color: color,
                      border: border,
                      cursor: 'pointer'
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{padding: '15px', borderTop: '1px solid #cbd5e1', fontSize: '12px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
              <div style={{width: '15px', height: '15px', backgroundColor: '#3b82f6', border: '1px solid #2563eb'}} />
              <span>Sudah Dijawab</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
              <div style={{width: '15px', height: '15px', backgroundColor: '#eab308', border: '1px solid #ca8a04'}} />
              <span>Ragu-ragu</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <div style={{width: '15px', height: '15px', backgroundColor: '#fff', border: '1px solid #94a3b8'}} />
              <span>Belum Dijawab</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
