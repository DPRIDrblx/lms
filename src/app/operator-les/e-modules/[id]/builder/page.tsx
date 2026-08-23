"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Save, Plus, Trash2, GripVertical, Settings, ArrowLeft, Loader2, FileText, CheckSquare, AlignLeft, CircleDot, Menu } from "lucide-react";
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

type ElementType = "short_text" | "long_text" | "radio" | "checkbox";

interface InteractiveElement {
  id: string;
  page: number;
  x: number; // percentage
  y: number; // percentage
  width: number;
  height: number;
  type: ElementType;
  label: string;
  xp: number;
  is_grading?: boolean; // New property
  options?: string[]; // for radio/checkbox
}

interface TOCItem {
  id: string;
  title: string;
  page: number;
}

export default function EModuleBuilder() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const pdfClickRef = useRef<HTMLDivElement>(null);
  const { containerRef: wrapperRef, scale } = useContainerScale(800);
  
  // Builder state
  const [elements, setElements] = useState<InteractiveElement[]>([]);
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeTab, setActiveTab] = useState<"elements" | "toc">("elements");
  
  // Tool state
  const [selectedTool, setSelectedTool] = useState<ElementType>("short_text");
  
  // Mobile sidebar
  const [showSidebar, setShowSidebar] = useState(false);
  
  useEffect(() => {
    const fetchModule = async () => {
      const { data, error } = await supabase.from("e_modules").select("*").eq("id", id).single();
      if (error) {
        toast.error("Gagal memuat modul");
        router.push("/operator-les/e-modules");
        return;
      }
      setModuleData(data);
      if (data.interactive_elements) setElements(data.interactive_elements);
      if (data.table_of_contents) setToc(data.table_of_contents);
      setLoading(false);
    };
    fetchModule();
  }, [id, router, supabase]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTab !== "elements") return;
    
    if (!pdfClickRef.current) return;
    const rect = pdfClickRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newEl: InteractiveElement = {
      id: Math.random().toString(36).substr(2, 9),
      page: pageNumber,
      x,
      y,
      width: selectedTool === "long_text" ? 40 : 25,
      height: selectedTool === "long_text" ? 15 : 5,
      type: selectedTool,
      label: `Pertanyaan ${elements.length + 1}`,
      xp: 10,
      is_grading: true, // Default to true
      options: (selectedTool === "radio" || selectedTool === "checkbox") ? ["Opsi 1", "Opsi 2"] : []
    };

    setElements([...elements, newEl]);
  };

  const updateElement = (elId: string, updates: Partial<InteractiveElement>) => {
    setElements(elements.map(el => el.id === elId ? { ...el, ...updates } : el));
  };

  const deleteElement = (elId: string) => {
    setElements(elements.filter(el => el.id !== elId));
  };

  const addTocItem = () => {
    setToc([...toc, { id: Math.random().toString(36).substr(2, 9), title: "Bab Baru", page: pageNumber }]);
  };

  const updateTocItem = (tocId: string, updates: Partial<TOCItem>) => {
    setToc(toc.map(t => t.id === tocId ? { ...t, ...updates } : t));
  };

  const deleteTocItem = (tocId: string) => {
    setToc(toc.filter(t => t.id !== tocId));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("e_modules").update({
      interactive_elements: elements,
      table_of_contents: toc
    }).eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil disimpan!");
    }
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>;

  const currentPageElements = elements.filter(el => el.page === pageNumber);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/operator-les/e-modules")} className="hidden md:flex">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/operator-les/e-modules")} className="md:hidden">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-bold text-slate-800 line-clamp-1">{moduleData?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="md:hidden">
            <Menu className="w-4 h-4" />
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 md:mr-2 animate-spin" /> : <Save className="w-4 h-4 md:mr-2" />} 
            <span className="hidden md:inline">Simpan</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className={`absolute md:relative w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full z-20 shadow-xl md:shadow-md shrink-0 transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex border-b border-slate-200 bg-white">
            <button 
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "elements" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("elements")}
            >
              Input Interaktif
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "toc" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setActiveTab("toc")}
            >
              Daftar Isi
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === "elements" && (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alat Input (Klik pada PDF)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={selectedTool === "short_text" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedTool("short_text")} className="justify-start text-xs h-9">
                      <FileText className="w-3.5 h-3.5 mr-2" /> Teks Singkat
                    </Button>
                    <Button variant={selectedTool === "long_text" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedTool("long_text")} className="justify-start text-xs h-9">
                      <AlignLeft className="w-3.5 h-3.5 mr-2" /> Esai
                    </Button>
                    <Button variant={selectedTool === "radio" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedTool("radio")} className="justify-start text-xs h-9">
                      <CircleDot className="w-3.5 h-3.5 mr-2" /> Pilgan
                    </Button>
                    <Button variant={selectedTool === "checkbox" ? "primary" : "secondary"} size="sm" onClick={() => setSelectedTool("checkbox")} className="justify-start text-xs h-9">
                      <CheckSquare className="w-3.5 h-3.5 mr-2" /> Checkbox
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500 bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-center font-medium">Pilih alat, lalu klik area pada PDF untuk menyematkan input.</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    Input di Halaman {pageNumber}
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{currentPageElements.length}</span>
                  </h3>
                  {currentPageElements.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">Belum ada input di halaman ini.</p>
                    </div>
                  ) : (
                    currentPageElements.map((el, i) => (
                      <Card key={el.id} className="p-3 bg-white shadow-sm border-slate-200 space-y-3 relative overflow-visible group">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                            <span className="text-xs font-bold text-slate-700 capitalize">{el.type.replace("_", " ")}</span>
                          </div>
                          <button onClick={() => deleteElement(el.id)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Label / Pertanyaan</label>
                            <input 
                              className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white" 
                              value={el.label} 
                              onChange={e => updateElement(el.id, { label: e.target.value })} 
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tipe Penilaian</label>
                              <select 
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white"
                                value={el.is_grading === false ? "false" : "true"}
                                onChange={e => updateElement(el.id, { is_grading: e.target.value === "true" })}
                              >
                                <option value="true">Dinilai (Grading)</option>
                                <option value="false">Tidak Dinilai (Catatan Siswa)</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className={`text-[10px] font-bold mb-1 block ${el.is_grading === false ? 'text-slate-300' : 'text-slate-500'}`}>Max XP</label>
                              <input 
                                type="number" 
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white disabled:opacity-50 disabled:bg-slate-100" 
                                value={el.is_grading === false ? 0 : el.xp} 
                                onChange={e => updateElement(el.id, { xp: parseInt(e.target.value) || 0 })} 
                                disabled={el.is_grading === false}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Lebar (%)</label>
                              <input 
                                type="number" 
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white" 
                                value={el.width} 
                                onChange={e => updateElement(el.id, { width: parseInt(e.target.value) || 10 })} 
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tinggi (%)</label>
                              <input 
                                type="number" 
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white" 
                                value={el.height} 
                                onChange={e => updateElement(el.id, { height: parseInt(e.target.value) || 5 })} 
                              />
                            </div>
                          </div>
                          
                          {(el.type === "radio" || el.type === "checkbox") && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 mb-1 block">Opsi (Pisahkan koma)</label>
                              <input 
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-md bg-slate-50 focus:bg-white" 
                                value={el.options?.join(", ")} 
                                onChange={e => updateElement(el.id, { options: e.target.value.split(",").map(s => s.trim()) })} 
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === "toc" && (
              <div className="space-y-4">
                <Button onClick={addTocItem} variant="ghost" size="sm" className="w-full border-dashed border-2 text-indigo-600 hover:bg-indigo-50 border-indigo-200">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Item Daftar Isi
                </Button>
                
                <div className="space-y-2">
                  {toc.map((t, index) => (
                    <Card key={t.id} className="p-3 bg-white shadow-sm border-slate-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Item #{index + 1}</span>
                        <button onClick={() => deleteTocItem(t.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div>
                        <input 
                          className="w-full text-sm p-2 border border-slate-200 rounded-md" 
                          value={t.title} 
                          onChange={e => updateTocItem(t.id, { title: e.target.value })} 
                          placeholder="Judul Bab / Bagian"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Lompat ke halaman:</span>
                        <input 
                          type="number" 
                          className="w-20 text-sm p-1.5 border border-slate-200 rounded-md" 
                          value={t.page} 
                          onChange={e => updateTocItem(t.id, { page: parseInt(e.target.value) || 1 })} 
                          min={1} max={numPages}
                        />
                      </div>
                    </Card>
                  ))}
                  {toc.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm">Belum ada daftar isi.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay to close sidebar on mobile */}
        {showSidebar && (
          <div className="md:hidden fixed inset-0 bg-slate-900/20 z-10" onClick={() => setShowSidebar(false)} />
        )}

        {/* Center PDF Viewer */}
        <div className="flex-1 bg-slate-900/5 overflow-auto flex flex-col items-center relative p-0 md:p-8" ref={wrapperRef}>
          <div className="mb-4 bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-4 sticky top-0 z-20 border border-slate-200">
            <Button variant="ghost" size="sm" disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)} className="h-8 w-8 p-0 rounded-full">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">Hal</span>
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
                className="w-12 text-center text-sm font-bold border-b-2 border-indigo-200 focus:border-indigo-600 outline-none p-0 hide-arrows"
                min={1} max={numPages || 1}
              />
              <span className="text-sm font-bold text-slate-500">dari {numPages || "?"}</span>
            </div>
            <Button variant="ghost" size="sm" disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)} className="h-8 w-8 p-0 rounded-full">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div 
            style={{ width: `${800 * scale}px`, height: `${1131 * scale}px` }} 
            className="relative transition-transform duration-300 mx-auto"
          >
            {/* Floating Nav Buttons */}
            <div className="fixed md:absolute inset-y-0 left-0 flex items-center z-30 pointer-events-none">
              <Button 
                variant="default" 
                size="icon" 
                disabled={pageNumber <= 1} 
                onClick={() => setPageNumber(p => p - 1)} 
                className="pointer-events-auto h-12 w-10 md:h-16 md:w-12 rounded-r-2xl rounded-l-none bg-indigo-600/80 hover:bg-indigo-700 shadow-xl border border-indigo-500/50 backdrop-blur-sm -ml-1 transition-transform"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </Button>
            </div>
            <div className="fixed md:absolute inset-y-0 right-0 flex items-center z-30 pointer-events-none">
              <Button 
                variant="default" 
                size="icon" 
                disabled={pageNumber >= numPages} 
                onClick={() => setPageNumber(p => p + 1)} 
                className="pointer-events-auto h-12 w-10 md:h-16 md:w-12 rounded-l-2xl rounded-r-none bg-indigo-600/80 hover:bg-indigo-700 shadow-xl border border-indigo-500/50 backdrop-blur-sm -mr-1 transition-transform"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </Button>
            </div>

            <div 
              className={`bg-white shadow-xl absolute top-0 left-0 origin-top-left transition-all duration-200 ${activeTab === 'elements' ? 'cursor-crosshair ring-2 ring-indigo-500/50 hover:ring-indigo-500' : ''}`}
              style={{ transform: `scale(${scale})`, width: 800, height: 1131 }}
              ref={pdfClickRef}
              onClick={handlePdfClick}
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
                    width={800} // Fixed width for consistent overlay coordinate mapping
                    className="rounded-sm overflow-hidden"
                  />
                </Document>
              ) : (
                <div className="w-[800px] h-[1131px] flex items-center justify-center bg-white text-slate-500 text-sm border-2 border-dashed border-slate-300">
                  PDF URL tidak ditemukan. Modul lama?
                </div>
              )}

              {/* Overlays */}
              {currentPageElements.map((el, index) => (
                <div 
                  key={el.id}
                  className="absolute border-2 border-indigo-500 bg-indigo-500/10 rounded-sm shadow-sm hover:bg-indigo-500/20 transition-colors pointer-events-none flex items-start p-1 overflow-hidden"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    transform: 'translate(-50%, -50%)' // Center exactly where clicked
                  }}
                >
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm mr-1 shrink-0">{index + 1}</span>
                  <span className="text-[10px] font-bold text-indigo-900 truncate">{el.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
