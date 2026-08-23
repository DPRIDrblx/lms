"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Save, ArrowLeft, Loader2, List, CheckCircle2, PenTool, Eraser, Trash2, Send } from "lucide-react";
import { DrawingCanvas, Stroke } from "@/components/ui/drawing-canvas";
import toast from "react-hot-toast";

// Setup pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function useContainerScale(targetWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width;
        setScale(Math.min(1, availableWidth / targetWidth));
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [targetWidth]);
  
  return { containerRef, scale };
}

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
  
  // Drawing State
  const [drawings, setDrawings] = useState<Record<number, Stroke[]>>({});
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | null>(null);
  const [penColor, setPenColor] = useState<string>('#ef4444'); // Default red
  const [savingProgress, setSavingProgress] = useState(false);

  // Sidebar TOC mobile toggle
  const [showToc, setShowToc] = useState(false);

  // Responsive scale hook
  const { containerRef, scale } = useContainerScale(800);

  // Swipe logic
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && pageNumber < numPages) {
      setPageNumber(p => p + 1);
    }
    if (isRightSwipe && pageNumber > 1) {
      setPageNumber(p => p - 1);
    }
  };

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
        if (respData.drawings) setDrawings(respData.drawings);
        if (respData.is_submitted) setHasSubmitted(true);
      }

      setLoading(false);
    };
    fetchModule();
  }, [id, router, supabase]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleInputChange = (el: any, value: any) => {
    // Prevent changing if it's a grading input and already submitted
    if (hasSubmitted && el.is_grading !== false) return; 
    setResponses(prev => ({
      ...prev,
      [el.id]: value
    }));
  };

  const handleSaveProgress = async () => {
    setSavingProgress(true);
    const { error } = await supabase.from("e_module_responses").upsert({
      e_module_id: id,
      student_id: user?.id,
      responses,
      drawings,
    }, { onConflict: 'e_module_id, student_id' });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Catatan berhasil disimpan!");
    }
    setSavingProgress(false);
  };

  const handleSubmit = async () => {
    if (!window.confirm("Yakin ingin mengumpulkan E-Modul ini? Jawaban (yang dinilai) tidak bisa diubah lagi.")) return;
    
    setSaving(true);
    
    const { error } = await supabase.from("e_module_responses").upsert({
      e_module_id: id,
      student_id: user?.id,
      responses,
      drawings,
      is_submitted: true
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between z-20 shadow-sm shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/student/e-modul")} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{moduleData?.title}</h1>
            <p className="text-xs font-bold text-[#108B96]">E-Modul Interaktif</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleSaveProgress} disabled={savingProgress || saving} variant="secondary" className="border-2 border-slate-200 text-slate-600 rounded-xl font-bold px-3 md:px-4 hover:bg-slate-50">
            {savingProgress ? <Loader2 className="w-4 h-4 md:mr-2 animate-spin" /> : <Save className="w-4 h-4 md:mr-2" />} 
            <span className="hidden md:inline">Simpan Catatan</span>
          </Button>

          {hasSubmitted ? (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 md:px-4 py-2 rounded-xl text-sm font-bold border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" /> <span className="hidden md:inline">Dikumpulkan</span>
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={saving || savingProgress} className="bg-[#108B96] hover:bg-[#0d737c] text-white rounded-xl shadow-lg shadow-[#108B96]/20 font-bold px-3 md:px-4">
              {saving ? <Loader2 className="w-4 h-4 md:mr-2 animate-spin" /> : <Send className="w-4 h-4 md:mr-2" />} 
              <span className="hidden md:inline">Kumpulkan</span>
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

        {/* Center PDF Viewer */}
        <div 
          className="flex-1 bg-slate-900/5 overflow-auto flex flex-col items-center relative p-0 md:p-8" 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          
          <div className="mb-4 md:mb-6 bg-white px-3 md:px-5 py-2.5 rounded-2xl shadow-sm flex items-center gap-3 md:gap-6 sticky top-0 z-20 border border-slate-200">
            <Button variant="ghost" disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)} className="h-8 w-8 md:h-10 md:w-10 p-0 rounded-xl hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-700 tracking-wide">Hal</span>
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
                className="w-12 text-center text-sm font-black text-[#108B96] border-b-2 border-slate-200 focus:border-[#108B96] outline-none p-0 hide-arrows bg-transparent"
                min={1} max={numPages || 1}
              />
              <span className="text-sm font-black text-slate-700 tracking-wide">/ {numPages || "?"}</span>
            </div>
            <Button variant="ghost" disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </Button>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Button 
                variant={activeTool === 'pen' ? "primary" : "ghost"} 
                size="sm"
                onClick={() => setActiveTool(activeTool === 'pen' ? null : 'pen')}
                className={`h-8 px-3 rounded-lg ${activeTool === 'pen' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
              >
                <PenTool className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline text-xs font-bold">Pena</span>
              </Button>
              {activeTool === 'pen' && (
                <div className="flex gap-1 ml-1 pr-1">
                  {['#000000', '#ef4444', '#3b82f6', '#22c55e'].map(c => (
                    <button key={c} onClick={() => setPenColor(c)} className={`w-5 h-5 rounded-full border-2 ${penColor === c ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              <Button 
                variant={activeTool === 'eraser' ? "primary" : "ghost"} 
                size="sm"
                onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
                className={`h-8 px-3 rounded-lg ${activeTool === 'eraser' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-500'}`}
              >
                <Eraser className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline text-xs font-bold">Hapus</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (window.confirm("Hapus semua coretan di halaman ini?")) {
                    setDrawings(prev => ({ ...prev, [pageNumber]: [] }));
                  }
                }}
                className="h-8 px-3 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div 
            style={{ width: `${800 * scale}px`, height: `${1131 * scale}px` }} 
            className="relative transition-transform duration-300"
          >
            <div 
              className="bg-white shadow-2xl absolute top-0 left-0 origin-top-left flex flex-col"
              style={{ transform: `scale(${scale})`, width: 800, height: 1131 }}
            >
              {moduleData?.pdf_url ? (
              <Document
                file={moduleData.pdf_url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="w-[800px] h-[1131px] flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>}
                error={<div className="w-[800px] h-[1131px] flex items-center justify-center text-red-500">Gagal memuat PDF.</div>}
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

            {/* Drawing Canvas Overlay */}
            {moduleData?.pdf_url && (
              <DrawingCanvas
                width={800}
                // React-PDF renders pages with variable heights, we estimate 1131 for A4 but it depends on the PDF.
                // We'll set height 100% via CSS in DrawingCanvas, but canvas needs absolute pixels. 
                // A4 ratio 800 * 1.414 = 1131
                height={1131} 
                drawings={drawings[pageNumber] || []}
                onDrawingsChange={(newDrawings) => setDrawings(prev => ({ ...prev, [pageNumber]: newDrawings }))}
                activeTool={activeTool}
                penColor={penColor}
                penWidth={3}
              />
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
                        placeholder={el.is_grading !== false ? "Ketik jawaban..." : "Catatan pribadi..."}
                        disabled={hasSubmitted && el.is_grading !== false}
                        value={val}
                        onChange={(e) => handleInputChange(el, e.target.value)}
                        className={`w-full h-full bg-white/90 focus:bg-white border-2 rounded-md text-xs font-bold text-slate-800 px-2 shadow-sm disabled:opacity-80 disabled:bg-slate-100 transition-all outline-none ${el.is_grading !== false ? 'border-indigo-300 focus:border-[#108B96] focus:ring-4 focus:ring-[#108B96]/20' : 'border-amber-300 focus:border-amber-500'}`}
                      />
                    )}
                    
                    {el.type === "long_text" && (
                      <textarea 
                        placeholder={el.is_grading !== false ? "Ketik jawaban panjang/esai di sini..." : "Catatan panjang..."}
                        disabled={hasSubmitted && el.is_grading !== false}
                        value={val}
                        onChange={(e) => handleInputChange(el, e.target.value)}
                        className={`w-full h-full resize-none bg-white/90 focus:bg-white border-2 rounded-md text-xs font-bold text-slate-800 p-2 shadow-sm disabled:opacity-80 disabled:bg-slate-100 transition-all outline-none ${el.is_grading !== false ? 'border-indigo-300 focus:border-[#108B96] focus:ring-4 focus:ring-[#108B96]/20' : 'border-amber-300 focus:border-amber-500'}`}
                      />
                    )}

                    {el.type === "radio" && (
                      <div className={`w-full h-full bg-white/95 border-2 rounded-md p-2 flex flex-col gap-1 overflow-auto shadow-sm ${el.is_grading !== false ? 'border-indigo-300' : 'border-amber-300'}`}>
                        {el.options?.map((opt: string, i: number) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                            <input 
                              type="radio" 
                              name={`radio-${el.id}`}
                              disabled={hasSubmitted && el.is_grading !== false}
                              checked={val === opt}
                              onChange={() => handleInputChange(el, opt)}
                              className="w-3.5 h-3.5 text-[#108B96] focus:ring-[#108B96] cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {el.type === "checkbox" && (
                      <div className={`w-full h-full bg-white/95 border-2 rounded-md p-2 flex flex-col gap-1 overflow-auto shadow-sm ${el.is_grading !== false ? 'border-indigo-300' : 'border-amber-300'}`}>
                        {el.options?.map((opt: string, i: number) => {
                          const isChecked = val.includes(opt);
                          return (
                            <label key={i} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                              <input 
                                type="checkbox" 
                                disabled={hasSubmitted && el.is_grading !== false}
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleInputChange(el, [...val, opt]);
                                  } else {
                                    handleInputChange(el, val.filter((v: string) => v !== opt));
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
      </div>
      
      {/* Overlay to close mobile TOC */}
      {showToc && (
        <div className="md:hidden fixed inset-0 bg-slate-900/20 z-0" onClick={() => setShowToc(false)} />
      )}
    </div>
  );
}
