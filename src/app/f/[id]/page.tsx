"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Upload, Star } from "lucide-react";

export default function PublicFormPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  
  const [form, setForm] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Address lookup state
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
      setProfile(profileData);
    }

    const { data: formData, error: formError } = await supabase.from("forms").select("*").eq("id", id).single();
    if (formError || !formData) {
      setLoading(false);
      return;
    }

    if (formData.require_sso && !userData?.user) {
      // Redirect to login if SSO required
      router.push(`/login?redirect=/f/${id}`);
      return;
    }

    setForm(formData);

    const { data: pagesData } = await supabase
      .from("form_pages")
      .select("*, form_questions(*)")
      .eq("form_id", id)
      .order("order_index");

    if (pagesData) {
      const sortedPages = pagesData.map((p: any) => ({
        ...p,
        form_questions: p.form_questions.sort((a: any, b: any) => a.order_index - b.order_index)
      }));
      setPages(sortedPages);

      // Pre-fill name and email if SSO
      if (userData?.user) {
        const initialAnswers: Record<string, any> = {};
        sortedPages.forEach((p: any) => {
          p.form_questions.forEach((q: any) => {
            if (q.type === 'name' && userData.user.user_metadata?.full_name) {
              initialAnswers[q.id] = { text: userData.user.user_metadata.full_name };
            } else if (q.type === 'email') {
              initialAnswers[q.id] = { text: userData.user.email };
            }
          });
        });
        setAnswers(initialAnswers);
      }
    }
    
    // Fetch provinces
    fetch('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(e => console.error(e));

    setLoading(false);
  };

  const handleAddressChange = async (qId: string, level: 'province' | 'regency' | 'district', valueId: string, valueName: string) => {
    const current = answers[qId]?.data || {};
    let newData = { ...current };

    if (level === 'province') {
      newData = { province: valueName, provinceId: valueId, regency: '', district: '' };
      fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${valueId}.json`)
        .then(res => res.json()).then(data => setRegencies(data));
      setDistricts([]);
    } else if (level === 'regency') {
      newData.regency = valueName;
      newData.regencyId = valueId;
      newData.district = '';
      fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${valueId}.json`)
        .then(res => res.json()).then(data => setDistricts(data));
    } else if (level === 'district') {
      newData.district = valueName;
      newData.districtId = valueId;
    }

    setAnswers({ ...answers, [qId]: { ...answers[qId], data: newData, text: `${newData.province}, ${newData.regency}, ${newData.district}` } });
  };

  const handleFileUpload = async (qId: string, file: File) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `responses/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('form-uploads').upload(filePath, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('form-uploads').getPublicUrl(filePath);
      setAnswers({ ...answers, [qId]: { text: publicUrl, data: { filename: file.name, path: filePath } } });
    } else {
      alert("Gagal mengupload file: " + uploadError.message);
    }
  };

  const validatePage = () => {
    const page = pages[currentPage];
    for (const q of page.form_questions) {
      if (q.is_required) {
        const ans = answers[q.id];
        if (!ans || (!ans.text && !ans.data)) {
          alert(`Pertanyaan "${q.title}" wajib diisi.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validatePage()) {
      if (currentPage < pages.length - 1) {
        setCurrentPage(currentPage + 1);
        window.scrollTo(0, 0);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // 1. Create response
    const { data: resData, error: resError } = await supabase
      .from('form_responses')
      .insert({
        form_id: id,
        respondent_id: profile?.id || null
      })
      .select().single();

    if (resError) {
      alert("Gagal mengirim jawaban: " + resError.message);
      setSubmitting(false);
      return;
    }

    // 2. Insert answers
    const answersToInsert = Object.keys(answers).map(qId => ({
      response_id: resData.id,
      question_id: qId,
      answer_text: answers[qId].text || null,
      answer_data: answers[qId].data || null
    }));

    if (answersToInsert.length > 0) {
      const { error: ansError } = await supabase.from('form_answers').insert(answersToInsert);
      if (ansError) {
        console.error("Gagal menyimpan jawaban", ansError);
      }
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (!form || !form.is_published) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Formulir tidak ditemukan atau belum dipublikasikan.</div>;
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center max-w-md w-full">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Terima Kasih!</h2>
        <p className="text-gray-500">Jawaban Anda telah berhasil direkam.</p>
      </div>
    </div>
  );

  const page = pages[currentPage];
  const progress = ((currentPage + 1) / pages.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Form */}
      <div className="bg-indigo-900 text-white pt-12 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            {form.logo_type}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{form.title}</h1>
          {form.description && <p className="text-indigo-200 text-lg max-w-2xl mx-auto">{form.description}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-t-3xl p-6 sm:p-10 shadow-lg border border-gray-100 min-h-[400px]">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
              <span>Halaman {currentPage + 1} dari {pages.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{page.title}</h2>
                {page.description && <p className="text-gray-500 mt-2">{page.description}</p>}
              </div>

              {page.form_questions.map((q: any, idx: number) => (
                <div key={q.id} className="space-y-3">
                  <label className="block text-base font-bold text-gray-900">
                    {idx + 1}. {q.title} {q.is_required && <span className="text-red-500">*</span>}
                  </label>
                  {q.description && <p className="text-sm text-gray-500">{q.description}</p>}
                  
                  {/* TEXT INPUTS */}
                  {(q.type === 'name' || q.type === 'email' || q.type === 'phone' || q.type === 'short_text') && (
                    <input 
                      type={q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : 'text'}
                      value={answers[q.id]?.text || ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: { text: e.target.value } })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="Ketik jawaban Anda..."
                    />
                  )}

                  {q.type === 'long_text' && (
                    <textarea 
                      value={answers[q.id]?.text || ''}
                      onChange={e => setAnswers({ ...answers, [q.id]: { text: e.target.value } })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                      placeholder="Ketik jawaban Anda..."
                    />
                  )}

                  {/* ADDRESS LOOKUP */}
                  {q.type === 'address' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select 
                        value={answers[q.id]?.data?.provinceId || ''}
                        onChange={e => handleAddressChange(q.id, 'province', e.target.value, e.target.options[e.target.selectedIndex].text)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      
                      <select 
                        disabled={!answers[q.id]?.data?.provinceId}
                        value={answers[q.id]?.data?.regencyId || ''}
                        onChange={e => handleAddressChange(q.id, 'regency', e.target.value, e.target.options[e.target.selectedIndex].text)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Kab/Kota</option>
                        {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>

                      <select 
                        disabled={!answers[q.id]?.data?.regencyId}
                        value={answers[q.id]?.data?.districtId || ''}
                        onChange={e => handleAddressChange(q.id, 'district', e.target.value, e.target.options[e.target.selectedIndex].text)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 outline-none disabled:opacity-50"
                      >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* MCQ */}
                  {(q.type === 'mcq' || q.type === 'complex_mcq') && (
                    <div className="space-y-3">
                      {(q.options || []).map((opt: string) => {
                        const isChecked = q.type === 'mcq' 
                          ? answers[q.id]?.text === opt
                          : (answers[q.id]?.data?.selected || []).includes(opt);
                        
                        return (
                          <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${isChecked ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}>
                            <input 
                              type={q.type === 'mcq' ? 'radio' : 'checkbox'} 
                              name={q.id}
                              className={q.type === 'mcq' ? 'w-5 h-5 accent-indigo-600' : 'w-5 h-5 accent-indigo-600 rounded'}
                              checked={isChecked}
                              onChange={() => {
                                if (q.type === 'mcq') {
                                  setAnswers({ ...answers, [q.id]: { text: opt } });
                                } else {
                                  const currentSel = answers[q.id]?.data?.selected || [];
                                  const newSel = currentSel.includes(opt) ? currentSel.filter((o: string) => o !== opt) : [...currentSel, opt];
                                  setAnswers({ ...answers, [q.id]: { text: newSel.join(', '), data: { selected: newSel } } });
                                }
                              }}
                            />
                            <span className={`font-medium ${isChecked ? 'text-indigo-900' : 'text-gray-700'}`}>{opt}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* FILE UPLOAD */}
                  {q.type === 'file_upload' && (
                    <div className="relative">
                      <input 
                        type="file" 
                        id={`file-${q.id}`} 
                        className="hidden" 
                        onChange={e => e.target.files && handleFileUpload(q.id, e.target.files[0])}
                      />
                      <label htmlFor={`file-${q.id}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 font-bold">
                            {answers[q.id]?.data?.filename ? answers[q.id].data.filename : "Klik untuk Upload File"}
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  {/* SCHOOL DATA (Dummy Search) */}
                  {q.type === 'school' && (
                    <div className="relative">
                      <input 
                        type="text"
                        value={answers[q.id]?.data?.name || answers[q.id]?.text || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setAnswers({ ...answers, [q.id]: { text: val, data: { name: val, npsn: Math.floor(Math.random() * 90000000 + 10000000).toString() } } });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="Ketik nama sekolah..."
                      />
                      <p className="text-xs text-gray-400 mt-1">Cari dan pilih nama sekolah. (Auto-generate NPSN untuk contoh)</p>
                    </div>
                  )}

                  {/* RATING */}
                  {q.type === 'rating' && (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setAnswers({ ...answers, [q.id]: { text: star.toString() } })}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={`w-10 h-10 ${parseInt(answers[q.id]?.text) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
          
          <button 
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (currentPage === pages.length - 1 ? "Submit" : "Lanjut")}
            {!submitting && currentPage !== pages.length - 1 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
