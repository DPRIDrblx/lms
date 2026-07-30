"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Plus, Settings, Trash2, GripVertical, 
  ChevronUp, ChevronDown, Save, FileText, CheckSquare, 
  MapPin, Building, Star, Image as ImageIcon, Type,
  Phone, Mail, User
} from "lucide-react";

const QUESTION_TYPES = [
  { id: 'name', label: 'Nama Lengkap', icon: User },
  { id: 'email', label: 'Alamat Email', icon: Mail },
  { id: 'phone', label: 'Nomor Telepon', icon: Phone },
  { id: 'address', label: 'Alamat (Prov, Kab/Kota)', icon: MapPin },
  { id: 'school', label: 'Data Sekolah', icon: Building },
  { id: 'mcq', label: 'Pilihan Ganda', icon: CheckSquare },
  { id: 'complex_mcq', label: 'Pilihan Ganda Kompleks', icon: CheckSquare },
  { id: 'rating', label: 'Rating / Penilaian', icon: Star },
  { id: 'short_text', label: 'Teks Pendek', icon: Type },
  { id: 'long_text', label: 'Paragraf Panjang', icon: FileText },
  { id: 'file_upload', label: 'Upload File', icon: ImageIcon },
];

export default function FormBuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  
  const [form, setForm] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    // Fetch form
    const { data: formData } = await supabase.from("forms").select("*").eq("id", id).single();
    if (formData) setForm(formData);

    // Fetch pages with questions
    const { data: pagesData } = await supabase
      .from("form_pages")
      .select("*, form_questions(*)")
      .eq("form_id", id)
      .order("order_index");

    if (pagesData) {
      // Sort questions inside pages
      const sortedPages = pagesData.map((p: any) => ({
        ...p,
        form_questions: p.form_questions.sort((a: any, b: any) => a.order_index - b.order_index)
      }));
      
      // If no pages exist, create the first page
      if (sortedPages.length === 0) {
        await handleAddPage();
      } else {
        setPages(sortedPages);
      }
    }
    setLoading(false);
  };

  const handleAddPage = async () => {
    const newOrder = pages.length;
    const { data, error } = await supabase
      .from("form_pages")
      .insert({
        form_id: id,
        title: `Halaman ${newOrder + 1}`,
        order_index: newOrder
      })
      .select("*, form_questions(*)")
      .single();

    if (data) {
      setPages([...pages, { ...data, form_questions: [] }]);
    }
  };

  const handleAddQuestion = async (pageId: string, type: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    
    const newOrder = pages[pageIndex].form_questions?.length || 0;
    const { data, error } = await supabase
      .from("form_questions")
      .insert({
        page_id: pageId,
        type: type,
        title: "Pertanyaan Baru",
        is_required: true,
        order_index: newOrder,
        options: type === 'mcq' || type === 'complex_mcq' ? ["Opsi 1", "Opsi 2"] : null
      })
      .select()
      .single();

    if (data) {
      const newPages = [...pages];
      newPages[pageIndex].form_questions.push(data);
      setPages(newPages);
    }
  };

  const handleDeleteQuestion = async (pageIndex: number, questionId: string) => {
    if (!confirm("Hapus pertanyaan ini?")) return;
    
    await supabase.from("form_questions").delete().eq("id", questionId);
    
    const newPages = [...pages];
    newPages[pageIndex].form_questions = newPages[pageIndex].form_questions.filter((q: any) => q.id !== questionId);
    setPages(newPages);
  };

  const updateQuestion = async (pageIndex: number, questionIndex: number, field: string, value: any) => {
    const newPages = [...pages];
    const q = newPages[pageIndex].form_questions[questionIndex];
    q[field] = value;
    setPages(newPages);

    // Save to DB (debounced/direct)
    await supabase.from("form_questions").update({ [field]: value }).eq("id", q.id);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat Builder...</div>;
  if (!form) return <div className="p-10 text-center text-red-500">Form tidak ditemukan.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/tu/forms")} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
            <div className="flex gap-2 items-center text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">{form.logo_type}</span>
              {form.require_sso ? "• Wajib SSO" : "• Publik"}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={async () => {
              await supabase.from("forms").update({ is_published: !form.is_published }).eq("id", form.id);
              setForm({ ...form, is_published: !form.is_published });
            }}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${
              form.is_published 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {form.is_published ? "Batal Publikasi" : "Publikasikan"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8 pb-32">
          
          {pages.map((page, pIdx) => (
            <div key={page.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Page Header */}
              <div className="bg-indigo-50/50 px-6 py-4 border-b border-gray-100">
                <input
                  type="text"
                  value={page.title || ""}
                  onChange={(e) => {
                    const newPages = [...pages];
                    newPages[pIdx].title = e.target.value;
                    setPages(newPages);
                  }}
                  onBlur={async (e) => await supabase.from("form_pages").update({ title: e.target.value }).eq("id", page.id)}
                  className="text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 w-full p-0"
                  placeholder="Judul Halaman"
                />
                <input
                  type="text"
                  value={page.description || ""}
                  onChange={(e) => {
                    const newPages = [...pages];
                    newPages[pIdx].description = e.target.value;
                    setPages(newPages);
                  }}
                  onBlur={async (e) => await supabase.from("form_pages").update({ description: e.target.value }).eq("id", page.id)}
                  className="text-sm text-gray-500 bg-transparent border-none focus:ring-0 w-full p-0 mt-1"
                  placeholder="Deskripsi halaman (opsional)"
                />
              </div>

              {/* Questions */}
              <div className="p-6 space-y-6">
                {page.form_questions?.map((q: any, qIdx: number) => (
                  <div key={q.id} className="group relative border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 transition-colors bg-gray-50/30">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={q.title}
                            onChange={(e) => updateQuestion(pIdx, qIdx, 'title', e.target.value)}
                            className="font-bold text-gray-900 text-base bg-transparent border-none focus:ring-0 w-full p-0"
                            placeholder="Pertanyaan"
                          />
                          <input
                            type="text"
                            value={q.description || ""}
                            onChange={(e) => updateQuestion(pIdx, qIdx, 'description', e.target.value)}
                            className="text-sm text-gray-500 bg-transparent border-none focus:ring-0 w-full p-0 mt-1"
                            placeholder="Deskripsi tambahan (opsional)"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold flex items-center gap-1">
                            {QUESTION_TYPES.find(t => t.id === q.type)?.label || q.type}
                          </div>
                          <button onClick={() => handleDeleteQuestion(pIdx, q.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Options rendering for MCQ */}
                      {(q.type === 'mcq' || q.type === 'complex_mcq') && (
                        <div className="pl-4 space-y-2 border-l-2 border-indigo-100">
                          {(q.options || []).map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <div className={`w-4 h-4 ${q.type === 'mcq' ? 'rounded-full' : 'rounded'} border-2 border-gray-300`}></div>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...(q.options || [])];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(pIdx, qIdx, 'options', newOpts);
                                }}
                                className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm"
                                placeholder={`Opsi ${optIdx + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const newOpts = (q.options || []).filter((_: any, i: number) => i !== optIdx);
                                  updateQuestion(pIdx, qIdx, 'options', newOpts);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const newOpts = [...(q.options || []), `Opsi ${(q.options?.length || 0) + 1}`];
                              updateQuestion(pIdx, qIdx, 'options', newOpts);
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
                          >
                            <Plus className="w-3 h-3" /> Tambah Opsi
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end items-center gap-4 pt-2 border-t border-gray-200/60">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-bold text-gray-500">Wajib Diisi</span>
                          <div className="relative">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={q.is_required}
                              onChange={(e) => updateQuestion(pIdx, qIdx, 'is_required', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${q.is_required ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${q.is_required ? 'transform translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-bold text-gray-600 flex items-center mr-2">Tambah Soal:</span>
                  {QUESTION_TYPES.map(qt => (
                    <button
                      key={qt.id}
                      onClick={() => handleAddQuestion(page.id, qt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-sm"
                    >
                      <qt.icon className="w-3.5 h-3.5" />
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddPage}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex justify-center items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Tambah Halaman Baru
          </button>
        </div>
      </div>
    </div>
  );
}
