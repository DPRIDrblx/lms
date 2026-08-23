"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Save, ArrowLeft, Loader2, Users, CheckCircle2, CircleDashed } from "lucide-react";
import toast from "react-hot-toast";

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function EModuleResponses() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [moduleData, setModuleData] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // Grade state
  const [gradeXP, setGradeXP] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    // 1. Fetch Module
    const { data: modData, error: modError } = await supabase.from("e_modules").select("*").eq("id", id).single();
    if (modError) {
      toast.error("Gagal memuat modul");
      router.push("/operator-les/e-modules");
      return;
    }
    setModuleData(modData);

    // 2. Fetch Responses with User info
    const { data: respData, error: respError } = await supabase
      .from("e_module_responses")
      .select("*, profiles!student_id(id, full_name)")
      .eq("e_module_id", id)
      .order("created_at", { ascending: false });
      
    if (respData) setResponses(respData);
    setLoading(false);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const selectStudent = (resp: any) => {
    setSelectedResponse(resp);
    setGradeXP(resp.xp_awarded || 0);
    setPageNumber(1);
  };

  const handleSaveGrade = async () => {
    if (!selectedResponse) return;
    setSaving(true);
    
    // Get current user (grader)
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("e_module_responses")
      .update({ xp_awarded: gradeXP, graded_by: user?.id })
      .eq("id", selectedResponse.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Nilai (XP) berhasil disimpan!");
      // Update local state
      setResponses(responses.map(r => r.id === selectedResponse.id ? { ...r, xp_awarded: gradeXP } : r));
      setSelectedResponse({ ...selectedResponse, xp_awarded: gradeXP });
    }
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>;

  // Only show grading elements to the operator
  const elements = (moduleData?.interactive_elements || []).filter((el: any) => el.is_grading !== false);
  const currentPageElements = elements.filter((el: any) => el.page === pageNumber);
  const totalMaxXp = elements.reduce((acc: number, el: any) => acc + (el.xp || 0), 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/operator-les/e-modules")} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{moduleData?.title}</h1>
            <p className="text-xs font-bold text-indigo-500">Penilaian E-Modul (Manual Grading)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Student List */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-10 shadow-sm shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-500" /> Daftar Pengumpulan
            </h2>
            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">{responses.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {responses.map((resp) => (
              <button 
                key={resp.id}
                onClick={() => selectStudent(resp)}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selectedResponse?.id === resp.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-700 line-clamp-1">{resp.profiles?.full_name}</span>
                  {resp.xp_awarded !== null ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <CircleDashed className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  {resp.xp_awarded !== null ? (
                    <span className="text-emerald-600">Dinilai: {resp.xp_awarded} XP</span>
                  ) : (
                    <span className="text-amber-600">Belum dinilai</span>
                  )}
                </div>
              </button>
            ))}
            {responses.length === 0 && (
              <div className="text-center p-8">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">Belum ada siswa yang mengumpulkan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: PDF Viewer & Grading Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/5">
          {!selectedResponse ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 font-bold">
              Pilih siswa di sebelah kiri untuk melihat jawaban.
            </div>
          ) : (
            <>
              {/* Grading Toolbar */}
              <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block leading-none mb-1">Siswa</span>
                    <span className="text-sm font-black text-indigo-900 leading-none">{selectedResponse.profiles?.full_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)} className="h-8 w-8 p-0">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Hal</span>
                      <input 
                        type="number" 
                        value={pageNumber} 
                        onChange={e => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) return;
                          if (val < 1) val = 1;
                          if (numPages && val > numPages) val = numPages;
                          setPageNumber(val);
                        }}
                        className="w-10 text-center text-xs font-bold border-b-2 border-slate-200 focus:border-indigo-500 outline-none p-0 hide-arrows bg-transparent text-indigo-700"
                        min={1} max={numPages || 1}
                      />
                      <span className="text-xs font-bold text-slate-600">/ {numPages || "?"}</span>
                    </div>
                    <Button variant="ghost" size="sm" disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)} className="h-8 w-8 p-0">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">XP Awarded:</label>
                    <input 
                      type="number" 
                      value={gradeXP} 
                      onChange={e => setGradeXP(parseInt(e.target.value) || 0)} 
                      className="w-20 text-sm font-bold border-2 border-slate-200 rounded-lg p-1.5 text-center focus:border-indigo-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">/ {totalMaxXp}</span>
                  </div>
                  <Button onClick={handleSaveGrade} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan Nilai
                  </Button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto flex flex-col items-center relative p-8">
                <div className="bg-white shadow-xl rounded-sm relative">
                  {moduleData?.pdf_url ? (
                    <Document
                      file={moduleData.pdf_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<div className="w-[800px] h-[1000px] flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-indigo-500" /></div>}
                      error={<div className="w-[800px] h-[1000px] flex items-center justify-center text-red-500 font-bold">Gagal memuat PDF.</div>}
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        width={800} // MATCH EXACTLY with builder's width
                        className="rounded-sm overflow-hidden"
                      />
                    </Document>
                  ) : (
                    <div className="w-[800px] h-[1000px] flex items-center justify-center bg-white text-slate-500 text-sm font-bold border-2 border-dashed border-slate-300">
                      PDF URL tidak ditemukan. Modul lama?
                    </div>
                  )}

                  {/* Student Responses Rendered Read-Only */}
                  {currentPageElements.map((el: any, index: number) => {
                    const studentAns = selectedResponse.responses[el.id];
                    
                    return (
                      <div 
                        key={el.id}
                        className="absolute p-2 bg-amber-500/10 rounded-md border-2 border-amber-500/40 shadow-sm flex flex-col"
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: `${el.width}%`,
                          height: `${el.height}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {/* Grade Label Tooltip */}
                        <div className="absolute -top-7 left-0 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg z-30 pointer-events-none">
                          Pertanyaan {index + 1} (Max {el.xp} XP)
                        </div>
                        
                        {/* Read-Only Answer */}
                        <div className="flex-1 w-full h-full bg-white/95 rounded p-2 text-xs font-bold text-slate-800 overflow-auto border border-amber-200">
                          {el.type === 'short_text' || el.type === 'long_text' ? (
                            <p>{studentAns || <span className="text-slate-400 italic">Tidak dijawab</span>}</p>
                          ) : el.type === 'radio' ? (
                            <div className="space-y-1">
                              {el.options?.map((opt: string, i: number) => (
                                <div key={i} className={`flex items-center gap-2 p-1 rounded ${studentAns === opt ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-400'}`}>
                                  <CircleDashed className={`w-3 h-3 ${studentAns === opt ? 'text-amber-600' : 'opacity-30'}`} />
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          ) : el.type === 'checkbox' ? (
                            <div className="space-y-1">
                              {el.options?.map((opt: string, i: number) => {
                                const isChecked = studentAns?.includes(opt);
                                return (
                                  <div key={i} className={`flex items-center gap-2 p-1 rounded ${isChecked ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-400'}`}>
                                    <CheckCircle2 className={`w-3 h-3 ${isChecked ? 'text-amber-600' : 'opacity-30'}`} />
                                    <span>{opt}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
