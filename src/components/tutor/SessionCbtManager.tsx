"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Trash2, ListChecks, ArrowRight, BookOpen, Clock, Users, PlayCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SessionCbtManager({ 
  scheduleId, 
  tutorId,
  topic,
  subtopics,
  subject,
  level
}: { 
  scheduleId: string, 
  tutorId: string,
  topic: string,
  subtopics: string[],
  subject: string,
  level: string
}) {
  const supabase = createClient();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeView, setActiveView] = useState<'list' | 'create_ai' | 'create_manual' | 'edit'>('list');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [packageTitle, setPackageTitle] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [questionTypes, setQuestionTypes] = useState<string[]>(['cek_konsep', 'latihan_soal', 'hots', 'complex_mcq']);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>(subtopics || []);
  
  // Specific package being viewed/edited
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packageQuestions, setPackageQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchPackages();
  }, [scheduleId]);

  const fetchPackages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('session_cbt_packages')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });
      
    if (data) setPackages(data);
    setLoading(false);
  };

  const loadPackageDetail = async (pkg: any) => {
    setSelectedPackage(pkg);
    const { data } = await supabase
      .from('session_cbt_questions')
      .select('*')
      .eq('package_id', pkg.id)
      .order('order_index', { ascending: true });
    
    if (data) setPackageQuestions(data);
    setActiveView('edit');
  };

  const handleGenerateAI = async () => {
    if (!packageTitle || !questionCount) return toast.error("Isi judul dan jumlah soal");
    if (!topic && !subject) return toast.error("Topik dan mata pelajaran belum diatur untuk kelas ini");

    setIsGenerating(true);
    const toastId = toast.loading("AI sedang menyusun paket soal CBT...");

    try {
      const res = await fetch("/api/ai/generate-cbt-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang: level,
          mapel: subject,
          topik: topic,
          subtopik: selectedSubtopics.length > 0 ? selectedSubtopics.join(', ') : 'Umum',
          jumlahSoal: parseInt(questionCount),
          tipeSoal: questionTypes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save Package to DB
      const { data: pkgData, error: pkgError } = await supabase
        .from('session_cbt_packages')
        .insert({
          schedule_id: scheduleId,
          tutor_id: tutorId,
          title: packageTitle || data.title || "Latihan Kelas CBT",
          status: 'draft'
        })
        .select()
        .single();
        
      if (pkgError) throw pkgError;

      const formattedQuestions = data.questions.map((q: any, i: number) => {
        const formattedOptions = q.options.map((opt: string) => ({
          text: opt,
          is_correct: q.correctAnswer?.includes(opt)
        }));
        return {
          package_id: pkgData.id,
          question_text: q.question,
          question_type: q.type || 'mcq',
          difficulty: q.difficulty || 'sedang',
          options: formattedOptions,
          explanation: q.explanation,
          order_index: i
        };
      });

      const { error: qInsertError } = await supabase.from('session_cbt_questions').insert(formattedQuestions);
      if (qInsertError) throw qInsertError;

      toast.success("Berhasil membuat paket soal dengan AI!", { id: toastId });
      
      // Reset & Reload
      setPackageTitle("");
      setQuestionCount("5");
      await fetchPackages();
      await loadPackageDetail(pkgData);
      
    } catch (err: any) {
      toast.error(err.message || "Gagal membuat paket soal", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddLinkOrPdf = async (type: 'pdf' | 'link') => {
    const url = prompt(`Masukkan URL ${type === 'pdf' ? 'PDF' : 'Tautan Eksternal'}:`);
    if (!url) return;
    
    const title = prompt(`Masukkan Judul ${type === 'pdf' ? 'PDF' : 'Tautan Eksternal'}:`);
    if (!title) return;

    const { error } = await supabase
      .from('session_cbt_packages')
      .insert({
        schedule_id: scheduleId,
        tutor_id: tutorId,
        title: title,
        status: 'active', // Automatically active for links/pdfs
        activity_type: type,
        file_url: type === 'pdf' ? url : null,
        link_url: type === 'link' ? url : null
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${type === 'pdf' ? 'PDF' : 'Tautan'} berhasil ditambahkan!`);
      fetchPackages();
    }
  };

  const handleRenamePackage = async (pkgId: string, oldTitle: string) => {
    const newTitle = prompt("Masukkan nama baru:", oldTitle);
    if (!newTitle || newTitle === oldTitle) return;

    const { error } = await supabase
      .from('session_cbt_packages')
      .update({ title: newTitle })
      .eq('id', pkgId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Berhasil mengganti nama aktivitas.");
      if (selectedPackage?.id === pkgId) setSelectedPackage({ ...selectedPackage, title: newTitle });
      fetchPackages();
    }
  };

  const handlePublish = async (pkgId: string) => {
    // End all other active cbt packages (optional, maybe not needed if multiple activities allowed, but let's keep logic for CBT)
    // Actually, we don't need to end other packages if we just want them to appear automatically.
    // The user said "jika siswa hadir otomatis muncul". We will just set it to active.
    await supabase.from('session_cbt_packages').update({ status: 'active' }).eq('id', pkgId);
    toast.success("Aktivitas berhasil dibagikan ke siswa!");
    fetchPackages();
    if (selectedPackage?.id === pkgId) {
      setSelectedPackage({ ...selectedPackage, status: 'active' });
    }
  };

  const handleEnd = async (pkgId: string) => {
    await supabase.from('session_cbt_packages').update({ status: 'ended' }).eq('id', pkgId);
    toast.success("Aktivitas ditutup.");
    fetchPackages();
    if (selectedPackage?.id === pkgId) {
      setSelectedPackage({ ...selectedPackage, status: 'ended' });
    }
  };

  const handleDelete = async (pkgId: string) => {
    if (!confirm("Hapus aktivitas ini?")) return;
    await supabase.from('session_cbt_packages').delete().eq('id', pkgId);
    toast.success("Aktivitas dihapus.");
    if (selectedPackage?.id === pkgId) {
      setActiveView('list');
      setSelectedPackage(null);
    }
    fetchPackages();
  };

  return (
    <div className="space-y-6">
      {activeView === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Bank Aktivitas</h3>
              <p className="text-sm text-slate-500">Buat paket soal, PDF, atau link materi untuk sesi ini.</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button onClick={() => handleAddLinkOrPdf('pdf')} variant="secondary" className="gap-2">
                Tambah PDF
              </Button>
              <Button onClick={() => handleAddLinkOrPdf('link')} variant="secondary" className="gap-2">
                Tambah Link
              </Button>
              <Button onClick={() => setActiveView('create_ai')} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Sparkles className="w-4 h-4" /> Paket CBT
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : packages.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
              <ListChecks className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 mb-1">Belum ada aktivitas</p>
              <p className="text-sm text-slate-500">Buat paket soal, PDF, atau materi agar siswa bisa mengerjakan/melihat.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {packages.map(pkg => (
                <Card key={pkg.id} className="p-4 hover:border-indigo-200 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => pkg.activity_type === 'cbt' ? loadPackageDetail(pkg) : null}>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      {pkg.title}
                      {pkg.status === 'active' && <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Aktif</span>}
                      {pkg.status === 'ended' && <span className="text-[10px] uppercase font-black tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Selesai</span>}
                      {pkg.status === 'draft' && <span className="text-[10px] uppercase font-black tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Draft</span>}
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase font-black">{pkg.activity_type || 'CBT'}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Dibuat pada {new Date(pkg.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleRenamePackage(pkg.id, pkg.title)}>Rename</Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(pkg.id)}><Trash2 className="w-4 h-4" /></Button>
                    {pkg.activity_type === 'cbt' && (
                      <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); loadPackageDetail(pkg); }}>Lihat <ArrowRight className="w-4 h-4 ml-1" /></Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'create_ai' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Buat Kuis dengan AI</h3>
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')}>Batal</Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">Judul Paket Kuis</label>
              <input type="text" value={packageTitle} onChange={e => setPackageTitle(e.target.value)} placeholder="Misal: Kuis Evaluasi Aljabar" className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 outline-none focus:border-indigo-500 transition-colors" />
            </div>
            
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">Jumlah Soal</label>
              <select value={questionCount} onChange={e => setQuestionCount(e.target.value)} className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 outline-none focus:border-indigo-500 transition-colors">
                <option value="1">1 Soal</option>
                <option value="3">3 Soal</option>
                <option value="5">5 Soal</option>
                <option value="10">10 Soal</option>
              </select>
            </div>

            {subtopics && subtopics.length > 0 && (
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Subtopik yang Diujikan</label>
                <div className="flex flex-wrap gap-3">
                  {subtopics.map((st) => (
                    <label key={st} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedSubtopics.includes(st)} 
                        onChange={e => setSelectedSubtopics(prev => e.target.checked ? [...prev, st] : prev.filter(s => s !== st))}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-2">Tipe Soal yang Dimasukkan</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={questionTypes.includes('cek_konsep')} 
                    onChange={e => setQuestionTypes(prev => e.target.checked ? [...prev, 'cek_konsep'] : prev.filter(t => t !== 'cek_konsep'))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  Cek Konsep (Mudah)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={questionTypes.includes('latihan_soal')} 
                    onChange={e => setQuestionTypes(prev => e.target.checked ? [...prev, 'latihan_soal'] : prev.filter(t => t !== 'latihan_soal'))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  Latihan Soal (Sedang)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={questionTypes.includes('hots')} 
                    onChange={e => setQuestionTypes(prev => e.target.checked ? [...prev, 'hots'] : prev.filter(t => t !== 'hots'))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  HOTS (Sulit)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={questionTypes.includes('complex_mcq')} 
                    onChange={e => setQuestionTypes(prev => e.target.checked ? [...prev, 'complex_mcq'] : prev.filter(t => t !== 'complex_mcq'))}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  Pilihan Ganda Kompleks
                </label>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-sm text-indigo-800">
                AI akan membaca konteks sesi ini (<strong>{level} - {subject} - {topic}</strong>) dan secara otomatis membuatkan variasi tingkat kesulitan dan tipe soal.
              </p>
            </div>
            
            <Button onClick={handleGenerateAI} disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
              Generate Paket Soal Sekarang
            </Button>
          </div>
        </Card>
      )}

      {activeView === 'edit' && selectedPackage && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="-ml-3 text-slate-500 mb-1">← Kembali ke Daftar</Button>
              <h3 className="text-2xl font-black text-slate-800">{selectedPackage.title}</h3>
              <p className="text-sm text-slate-500">{packageQuestions.length} Soal Tersedia</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleDelete(selectedPackage.id)} className="text-red-500 border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-1" /> Hapus</Button>
              {selectedPackage.status === 'draft' || selectedPackage.status === 'ended' ? (
                <Button size="sm" onClick={() => handlePublish(selectedPackage.id)} className="bg-emerald-600 hover:bg-emerald-700"><PlayCircle className="w-4 h-4 mr-1" /> Mulai Bagikan ke Siswa</Button>
              ) : (
                <Button size="sm" onClick={() => handleEnd(selectedPackage.id)} variant="danger">Hentikan Kuis</Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {packageQuestions.map((q, i) => (
              <Card key={q.id} className="p-5 border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 bg-slate-50 border-l border-b border-slate-100 text-xs font-bold text-slate-500 rounded-bl-xl uppercase tracking-widest">
                  {q.difficulty} • {q.question_type === 'mcq' ? 'PG Biasa' : 'PG Kompleks'}
                </div>
                <h4 className="font-bold text-slate-800 pr-32 mb-4">
                  {i+1}. {q.question_text}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt: any, optIdx: number) => (
                    <div key={optIdx} className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${opt.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium' : 'bg-white border-slate-200 text-slate-700'}`}>
                      <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-bold ${opt.is_correct ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300'}`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="flex-1">{opt.text}</span>
                    </div>
                  ))}
                </div>
                
                {q.explanation && (
                  <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100">
                    <strong>Penjelasan:</strong> {q.explanation}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
