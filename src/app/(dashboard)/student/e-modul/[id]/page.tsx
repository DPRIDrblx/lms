"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Save, ArrowLeft, Loader2, List, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function StudentInteractiveEModule() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // State
  const [elements, setElements] = useState<any[]>([]);
  const [toc, setToc] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  // Sidebar TOC mobile toggle
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);

      // 1. Fetch Module
      const { data, error } = await supabase.from("e_modules").select("*").eq("id", id).single();
      if (error) {
        toast.error("Gagal memuat E-Modul");
        router.push("/student/e-modul");
        return;
      }
      setModuleData(data);
      if (data.interactive_elements) setElements(data.interactive_elements);
      if (data.table_of_contents) setToc(data.table_of_contents);

      // 2. Fetch Response
      const { data: respData } = await supabase
        .from("e_module_responses")
        .select("*")
        .eq("e_module_id", id)
        .eq("student_id", currentUser.id)
        .maybeSingle();

      if (respData) {
        setResponses(respData.responses || {});
        setHasSubmitted(true);
      }

      setLoading(false);
    };
    fetchModule();
  }, [id, router, supabase]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleInputChange = (elId: string, value: any) => {
    if (hasSubmitted) return; // Prevent changing after submission
    setResponses(prev => ({
      ...prev,
      [elId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!window.confirm("Yakin ingin mengumpulkan E-Modul ini? Jawaban tidak bisa diubah lagi.")) return;
    
    setSaving(true);
    
    const { error } = await supabase.from("e_module_responses").upsert({
      e_module_id: id,
      student_id: user?.id,
      responses,
    }, { onConflict: 'e_module_id, student_id' });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-Modul berhasil dikumpulkan!");
      setHasSubmitted(true);
    }
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#108B96]" /></div>;

  const currentPageElements = elements.filter(el => el.page === pageNumber);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 md:-m-10 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/student/e-modul")} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{moduleData?.title}</h1>
            <p className="text-xs font-bold text-[#108B96]">E-Modul Interaktif</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasSubmitted ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> Sudah Dikumpulkan
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={saving} className="bg-[#108B96] hover:bg-[#0d737c] text-white rounded-xl shadow-lg shadow-[#108B96]/20 font-bold px-6">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Kumpulkan
            </Button>
          )}
          
          <Button variant="ghost" className="md:hidden border-2 border-slate-200 text-slate-600 rounded-xl" onClick={() => setShowToc(!showToc)}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Table of Contents Sidebar */}
        <div className={`absolute md:relative z-10 w-72 h-full bg-white border-r border-slate-200 shadow-xl md:shadow-none transition-transform duration-300 flex flex-col ${showToc ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-black text-slate-700 text-sm flex items-center gap-2 uppercase tracking-wider">
              <List className="w-4 h-4 text-[#108B96]" /> Daftar Isi
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {toc.map((t, idx) => (
              <button 
                key={t.id}
                onClick={() => {
                  setPageNumber(t.page);
                  setShowToc(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${pageNumber === t.page ? 'bg-[#108B96]/10 text-[#108B96]' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="line-clamp-2">{idx + 1}. {t.title}</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">Halaman {t.page}</div>
              </button>
            ))}
            {toc.length === 0 && (
              <div className="text-center p-6 text-sm text-slate-400 font-medium">Belum ada daftar isi.</div>
            )}
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 md:p-8 relative">
          
          <div className="mb-6 bg-white px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-6 sticky top-0 z-20 border border-slate-200">
            <Button variant="ghost" disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <span className="text-sm font-black text-slate-700 tracking-wide">Hal {pageNumber} / {numPages || "?"}</span>
            <Button variant="ghost" disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </Button>
          </div>

          <div className="bg-white shadow-2xl rounded-sm relative">
            {moduleData?.pdf_url ? (
              <Document
                file={moduleData.pdf_url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="w-[800px] h-[1000px] flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-[#108B96]" /></div>}
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

            {/* Interactive Inputs */}
            {currentPageElements.map((el) => {
              const val = responses[el.id] || (el.type === 'checkbox' ? [] : '');
              
              return (
                <div 
                  key={el.id}
                  className="absolute p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md border border-indigo-500/30 transition-colors group flex flex-col"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {/* Label Tooltip */}
                  <div className="absolute -top-7 left-0 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-30 pointer-events-none">
                    {el.label} (Max {el.xp} XP)
                  </div>
                  
                  {/* Inputs */}
                  <div className="flex-1 w-full h-full relative z-20">
                    {el.type === "short_text" && (
                      <input 
                        type="text"
                        placeholder="Ketik jawaban..."
                        disabled={hasSubmitted}
                        value={val}
                        onChange={(e) => handleInputChange(el.id, e.target.value)}
                        className="w-full h-full bg-white/90 focus:bg-white border-2 border-indigo-300 focus:border-[#108B96] focus:ring-4 focus:ring-[#108B96]/20 rounded-md text-xs font-bold text-slate-800 px-2 shadow-sm disabled:opacity-80 disabled:bg-slate-100 transition-all outline-none"
                      />
                    )}
                    
                    {el.type === "long_text" && (
                      <textarea 
                        placeholder="Ketik jawaban panjang/esai di sini..."
                        disabled={hasSubmitted}
                        value={val}
                        onChange={(e) => handleInputChange(el.id, e.target.value)}
                        className="w-full h-full resize-none bg-white/90 focus:bg-white border-2 border-indigo-300 focus:border-[#108B96] focus:ring-4 focus:ring-[#108B96]/20 rounded-md text-xs font-bold text-slate-800 p-2 shadow-sm disabled:opacity-80 disabled:bg-slate-100 transition-all outline-none"
                      />
                    )}

                    {el.type === "radio" && (
                      <div className="w-full h-full bg-white/95 border-2 border-indigo-300 rounded-md p-2 flex flex-col gap-1 overflow-auto shadow-sm">
                        {el.options?.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                            <input 
                              type="radio" 
                              name={`radio-${el.id}`}
                              disabled={hasSubmitted}
                              checked={val === opt}
                              onChange={() => handleInputChange(el.id, opt)}
                              className="w-3.5 h-3.5 text-[#108B96] focus:ring-[#108B96] cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {el.type === "checkbox" && (
                      <div className="w-full h-full bg-white/95 border-2 border-indigo-300 rounded-md p-2 flex flex-col gap-1 overflow-auto shadow-sm">
                        {el.options?.map((opt: string, i: number) => {
                          const isChecked = val.includes(opt);
                          return (
                            <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                              <input 
                                type="checkbox" 
                                disabled={hasSubmitted}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange(el.id, [...val, opt]);
                                  } else {
                                    handleInputChange(el.id, val.filter((v: string) => v !== opt));
                                  }
                                }}
                                className="w-3.5 h-3.5 text-[#108B96] rounded-sm focus:ring-[#108B96] cursor-pointer border-slate-300"
                              />
                              <span className="text-[11px] font-bold text-slate-700">{opt}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Overlay to close mobile TOC */}
      {showToc && (
        <div className="md:hidden fixed inset-0 bg-slate-900/20 z-0" onClick={() => setShowToc(false)} />
      )}
    </div>
  );
}
