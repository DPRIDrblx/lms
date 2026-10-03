"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Trash2, ListChecks, ArrowRight, ArrowLeft, BookOpen, Clock, Users, PlayCircle, Loader2, Star, User } from 'lucide-react';
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
  
  const [activeView, setActiveView] = useState<string>('list');
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
  const [packageSubmissions, setPackageSubmissions] = useState<any[]>([]);

  // Manual Creation States
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualQuestions, setManualQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: '' }]);


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
    
    const [qRes, subRes] = await Promise.all([
      supabase.from('session_cbt_questions').select('*').eq('package_id', pkg.id).order('order_index', { ascending: true }),
      supabase.from('session_cbt_submissions').select('*, student:profiles!student_id(id, full_name, avatar_url)').eq('package_id', pkg.id)
    ]);
    
    if (qRes.data) setPackageQuestions(qRes.data);
    if (subRes.data) setPackageSubmissions(subRes.data);
    
    setActiveView('edit');
  };

  const handleGiveStar = async (subId: string, stars: number) => {
     const { error } = await supabase.from('session_cbt_submissions').update({ stars_earned: stars }).eq('id', subId);
     if (error) {
       toast.error("Gagal memberi bintang");
     } else {
       toast.success("Bintang diberikan!");
       setPackageSubmissions(prev => prev.map(s => s.id === subId ? { ...s, stars_earned: stars } : s));
     }
  };


  const handleSaveManual = async (type: 'material' | 'assignment' | 'cbt') => {
    if (!manualTitle) return toast.error('Judul harus diisi');
    const toastId = toast.loading('Menyimpan ' + type + '...');
    try {
      const { data: pkgData, error: pkgError } = await supabase
        .from('session_cbt_packages')
        .insert({
          schedule_id: scheduleId,
          tutor_id: tutorId,
          title: manualTitle,
          status: 'active',
          activity_type: type
        })
        .select()
        .single();
      if (pkgError) throw pkgError;

      if (type === 'material' || type === 'assignment') {
        const { error: qError } = await supabase.from('session_cbt_questions').insert({
          package_id: pkgData.id,
          question_text: manualContent,
          question_type: type === 'material' ? 'material_text' : 'essay',
          difficulty: 'sedang',
          options: [],
          order_index: 0
        });
        if (qError) throw qError;
      } else if (type === 'cbt') {
         const formattedQs = manualQuestions.map((q, i) => ({
            package_id: pkgData.id,
            question_text: q.question,
            question_type: 'mcq',
            difficulty: 'sedang',
            options: q.options.map(o => ({ text: o, is_correct: o === q.correct })),
            order_index: i
         }));
         const { error: qError } = await supabase.from('session_cbt_questions').insert(formattedQs);
         if (qError) throw qError;
      }
      toast.success('Berhasil menyimpan aktivitas!', { id: toastId });
      setActiveView('list');
      setManualTitle('');
      setManualContent('');
      setManualQuestions([{ question: '', options: ['', '', '', ''], correct: '' }]);
      fetchPackages();
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    }
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

  const handleGenerateMockAi = async (type: 'assignment' | 'form' | 'material') => {
    if (!topic && !subject) return toast.error("Topik dan mata pelajaran belum diatur untuk kelas ini");
    
    const toastId = toast.loading(`AI sedang menyusun ${type === 'assignment' ? 'Tugas' : type === 'form' ? 'Formulir' : 'Materi'}...`);
    
    // Simulate AI generation time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const titles = {
      'assignment': `📝 Tugas AI: ${topic || subject || 'Latihan Mandiri'}`,
      'form': `📊 Formulir Evaluasi AI: ${topic || subject || 'Feedback'}`,
      'material': `📚 Modul Rangkuman AI: ${topic || subject || 'Materi Belajar'}`
    };

    const { error } = await supabase
      .from('session_cbt_packages')
      .insert({
        schedule_id: scheduleId,
        tutor_id: tutorId,
        title: titles[type],
        status: 'active',
        activity_type: 'link', // Store as link to open mock generated document
        link_url: `https://example.com/ai-generated-${type}-${Date.now()}`
      });

    if (error) {
      toast.error(error.message, { id: toastId });
    } else {
      toast.success(`Berhasil membuat ${type === 'assignment' ? 'Tugas' : type === 'form' ? 'Formulir' : 'Materi'} dengan AI!`, { id: toastId });
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
            
              <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Materi Bacaan</span>
                  <div className="flex gap-1">
                    <Button onClick={() => setActiveView('create_manual_material')} variant="secondary" className="h-9 text-xs px-3">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('material')} variant="secondary" className="h-9 text-xs px-3 border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50"><Sparkles className="w-3 h-3 mr-1"/> AI</Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Tugas / Latihan</span>
                  <div className="flex gap-1">
                    <Button onClick={() => setActiveView('create_manual_assignment')} variant="secondary" className="h-9 text-xs px-3">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('assignment')} variant="secondary" className="h-9 text-xs px-3 border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50"><Sparkles className="w-3 h-3 mr-1"/> AI</Button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Paket Soal CBT</span>
                  <div className="flex gap-1">
                    <Button onClick={() => setActiveView('create_manual_cbt')} variant="secondary" className="h-9 text-xs px-3">Buat Soal Manual</Button>
                    <Button onClick={() => setActiveView('create_ai')} className="h-9 text-xs px-3 bg-indigo-600 hover:bg-indigo-700 text-white"><Sparkles className="w-3 h-3 mr-1"/> AI Generator</Button>
                  </div>
                </div>
              </div>
</div>

          {loading ? (
            <div className="flex justify-center items-center p-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-slate-500 font-medium">Memuat aktivitas...</p>
              </div>
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center p-12 bg-gradient-to-b from-slate-50 to-white border-2 border-dashed border-slate-200 rounded-3xl animate-in fade-in">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ListChecks className="w-10 h-10 text-indigo-400" />
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-2">Belum ada aktivitas</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">Buat paket kuis interaktif, materi bacaan, atau tugas dengan bantuan AI untuk kelas ini.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Materi</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_material')} variant="secondary" className="h-10 px-4 rounded-xl shadow-sm">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('material')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 h-10 px-4 rounded-xl shadow-sm border border-indigo-100"><Sparkles className="w-4 h-4 mr-2"/> Pakai AI</Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tugas</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_assignment')} variant="secondary" className="h-10 px-4 rounded-xl shadow-sm">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('assignment')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 h-10 px-4 rounded-xl shadow-sm border border-indigo-100"><Sparkles className="w-4 h-4 mr-2"/> Pakai AI</Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">CBT</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_cbt')} variant="secondary" className="h-10 px-4 rounded-xl shadow-sm">Buat Soal</Button>
                    <Button onClick={() => setActiveView('create_ai')} className="bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 rounded-xl shadow-sm"><Sparkles className="w-4 h-4 mr-2 text-indigo-200"/> AI Generator</Button>
                  </div>
                </div>
              </div>
</div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {packages.map(pkg => (
                <Card key={pkg.id} className="p-0 overflow-hidden border-0 shadow-md ring-1 ring-slate-100 hover:ring-indigo-300 hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl flex flex-col h-full">
                  <div className={`h-2 w-full ${pkg.status === 'active' ? 'bg-emerald-500' : pkg.status === 'ended' ? 'bg-slate-300' : 'bg-amber-400'}`}></div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between cursor-pointer" onClick={() => loadPackageDetail(pkg)}>
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md shadow-sm border ${
                          pkg.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          pkg.status === 'ended' ? 'bg-slate-50 text-slate-600 border-slate-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {pkg.status === 'active' ? 'Sedang Aktif' : pkg.status === 'ended' ? 'Selesai' : 'Draft'}
                        </span>
                        
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md uppercase font-black shadow-sm border border-indigo-100 flex items-center gap-1">
                          {pkg.activity_type === 'cbt' ? <><Sparkles className="w-3 h-3" /> Kuis CBT</> : pkg.activity_type.toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
                        {pkg.title}
                      </h4>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> {new Date(pkg.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}</span>
                    </div>
                  </div>
                  
                  <div className="px-3 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRenamePackage(pkg.id, pkg.title) }} className="text-slate-500 hover:text-indigo-600 h-8 px-2 text-xs">Ubah Nama</Button>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 h-8 w-8 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); handleDelete(pkg.id) }}><Trash2 className="w-4 h-4" /></Button>
                      {pkg.activity_type === 'cbt' && (
                        <Button variant="ghost" size="sm" className="h-8 px-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); loadPackageDetail(pkg); }}>
                          Kelola <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      
      {activeView === 'create_manual_material' && (
        <Card className="p-6 border-slate-200 shadow-sm rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <h3 className="text-lg font-black text-slate-800">Buat Materi Manual</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Judul Materi</label>
              <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="Misal: Rangkuman Bab 1" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Isi Materi</label>
              <textarea value={manualContent} onChange={e => setManualContent(e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 min-h-[200px] outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="Ketik isi materi di sini..."></textarea>
            </div>
            <Button onClick={() => handleSaveManual('material')} className="w-full bg-slate-900 text-white rounded-xl h-12 hover:bg-slate-800">Simpan Materi</Button>
          </div>
        </Card>
      )}

      {activeView === 'create_manual_assignment' && (
        <Card className="p-6 border-slate-200 shadow-sm rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <h3 className="text-lg font-black text-slate-800">Buat Tugas Manual</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Judul Tugas</label>
              <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="Misal: Esai Sejarah Kemerdekaan" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Pertanyaan / Instruksi Tugas</label>
              <textarea value={manualContent} onChange={e => setManualContent(e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 min-h-[150px] outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="Ketik instruksi atau pertanyaan tugas..."></textarea>
            </div>
            <Button onClick={() => handleSaveManual('assignment')} className="w-full bg-slate-900 text-white rounded-xl h-12 hover:bg-slate-800">Simpan Tugas</Button>
          </div>
        </Card>
      )}

      {activeView === 'create_manual_cbt' && (
        <Card className="p-6 border-slate-200 shadow-sm rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
            <h3 className="text-lg font-black text-slate-800">Buat Soal CBT Manual</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Judul Paket CBT</label>
              <input type="text" value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="w-full border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="Misal: Latihan Persiapan Ujian" />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Daftar Soal</h4>
              {manualQuestions.map((q, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-700">Soal {idx + 1}</span>
                    <Button variant="ghost" size="sm" className="text-rose-500 h-8 hover:bg-rose-50 rounded-lg" onClick={() => setManualQuestions(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                  <textarea value={q.question} onChange={e => {
                    const newQ = [...manualQuestions];
                    newQ[idx].question = e.target.value;
                    setManualQuestions(newQ);
                  }} className="w-full border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 ring-indigo-500/20" placeholder="Ketik pertanyaan di sini..."></textarea>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                        <input type="radio" name={`correct-${idx}`} checked={q.correct === opt && opt !== ''} onChange={() => {
                           const newQ = [...manualQuestions];
                           newQ[idx].correct = opt;
                           setManualQuestions(newQ);
                        }} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        <input type="text" value={opt} onChange={e => {
                          const newQ = [...manualQuestions];
                          newQ[idx].options[oIdx] = e.target.value;
                          setManualQuestions(newQ);
                        }} className="w-full border-none bg-transparent outline-none text-sm" placeholder={`Opsi ${String.fromCharCode(65+oIdx)}`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setManualQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correct: '' }])} className="w-full border-dashed border-2 rounded-xl h-12 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">+ Tambah Soal</Button>
            </div>
            
            <Button onClick={() => handleSaveManual('cbt')} className="w-full bg-slate-900 text-white rounded-xl h-12 hover:bg-slate-800">Simpan Paket CBT</Button>
          </div>
        </Card>
      )}

      {activeView === 'create_ai' && (

        <Card className="p-0 overflow-hidden border-indigo-100 shadow-lg animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-black flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-200" /> Buat Kuis dengan AI</h3>
              <p className="text-indigo-100 text-sm mt-1 opacity-90">AI akan otomatis membuat paket soal interaktif untuk siswa.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="text-white hover:bg-white/20 rounded-full h-10 px-4">Batal</Button>
          </div>
          
          <div className="p-6 md:p-8 space-y-8 bg-slate-50">
            <div>
              <label className="text-sm font-black text-slate-800 block mb-2 uppercase tracking-wide">Judul Paket Kuis</label>
              <input type="text" value={packageTitle} onChange={e => setPackageTitle(e.target.value)} placeholder="Misal: Kuis Evaluasi Aljabar" className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700" />
            </div>
            
            <div>
              <label className="text-sm font-black text-slate-800 block mb-2 uppercase tracking-wide">Jumlah Soal</label>
              <select value={questionCount} onChange={e => setQuestionCount(e.target.value)} className="w-full md:w-1/2 border-2 border-slate-200 rounded-2xl px-4 py-3 bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 cursor-pointer appearance-none">
                <option value="1">1 Soal (Quick Test)</option>
                <option value="3">3 Soal (Short Quiz)</option>
                <option value="5">5 Soal (Standard)</option>
                <option value="10">10 Soal (Full Assessment)</option>
              </select>
            </div>

            {subtopics && subtopics.length > 0 && (
              <div>
                <label className="text-sm font-black text-slate-800 block mb-3 uppercase tracking-wide">Pilih Subtopik Pendukung</label>
                <div className="flex flex-wrap gap-2">
                  {subtopics.map((st) => {
                    const isSelected = selectedSubtopics.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => setSelectedSubtopics(prev => isSelected ? prev.filter(s => s !== st) : [...prev, st])}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                          isSelected 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-black text-slate-800 block mb-3 uppercase tracking-wide">Komposisi & Tipe Soal (Pilih Minimal 1)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'cek_konsep', label: 'Cek Konsep (Mudah)', stars: 2, icon: '🌟', desc: 'Pemahaman dasar' },
                  { id: 'latihan_soal', label: 'Latihan Soal (Sedang)', stars: 3, icon: '🌟🌟', desc: 'Penerapan konsep' },
                  { id: 'hots', label: 'HOTS (Sulit)', stars: 4, icon: '🔥', desc: 'Analisis mendalam' },
                  { id: 'complex_mcq', label: 'Pilihan Ganda Kompleks', stars: 2, icon: '✨', desc: 'Lebih dari 1 jawaban' },
                ].map(type => {
                  const isSelected = questionTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => setQuestionTypes(prev => isSelected ? prev.filter(t => t !== type.id) : [...prev, type.id])}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-1 text-left ${
                        isSelected 
                        ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' 
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between w-full items-center">
                        <span className={`font-black ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{type.label}</span>
                        <span className="text-lg">{type.icon}</span>
                      </div>
                      <p className={`text-xs font-medium ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>{type.desc} (+{type.stars} Bintang)</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-indigo-600/5 p-5 rounded-2xl border border-indigo-600/10 flex items-start gap-4">
              <div className="bg-indigo-100 p-2 rounded-full shrink-0"><Sparkles className="w-5 h-5 text-indigo-600" /></div>
              <p className="text-sm text-indigo-900 leading-relaxed font-medium">
                AI akan membaca konteks sesi ini (<strong>{level} - {subject} - {topic}</strong>) dan secara otomatis meracik soal interaktif yang akan langsung muncul di HP/Laptop siswa Anda tanpa perlu ketik manual.
              </p>
            </div>
            
            <Button onClick={handleGenerateAI} disabled={isGenerating || questionTypes.length === 0 || !packageTitle} className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-lg font-black shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] hover:-translate-y-0.5">
              {isGenerating ? (
                <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Meracik Soal AI...</>
              ) : (
                <><Sparkles className="w-6 h-6 mr-2" /> Generate Kuis Sekarang</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {activeView === 'edit' && selectedPackage && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setActiveView('list')} className="-ml-3 text-slate-500 mb-2 hover:bg-slate-100 rounded-full h-8"><ArrowLeft className="w-4 h-4 mr-1" /> Daftar Aktivitas</Button>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">{selectedPackage.title}</h3>
              <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold">{packageQuestions.length} Soal</span> 
                Tersedia untuk sesi ini.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              {selectedPackage.status === 'draft' || selectedPackage.status === 'ended' ? (
                <Button onClick={() => handlePublish(selectedPackage.id)} className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 h-12 px-6 rounded-xl font-bold transition-all hover:scale-[1.02]">
                  <PlayCircle className="w-5 h-5 mr-2" /> Mulai & Bagikan
                </Button>
              ) : (
                <Button onClick={() => handleEnd(selectedPackage.id)} className="flex-1 lg:flex-none bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 h-12 px-6 rounded-xl font-bold transition-all hover:scale-[1.02]">
                  Tutup Akses Kuis
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 max-w-4xl mx-auto">
            {packageQuestions.map((q, i) => (
              <div key={q.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0">
                  <div className={`px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${
                    q.difficulty.toLowerCase() === 'mudah' ? 'bg-emerald-100 text-emerald-700' :
                    q.difficulty.toLowerCase() === 'sedang' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {q.difficulty} • {q.question_type === 'mcq' ? 'PG Biasa' : 'PG Kompleks'}
                  </div>
                </div>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 shrink-0 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-lg">
                    {i+1}
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg md:text-xl leading-snug pt-1.5 pr-20">
                    {q.question_text}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 pl-14">
                  {q.options?.map((opt: any, optIdx: number) => (
                    <div key={optIdx} className={`p-4 rounded-2xl border-2 text-sm flex items-start gap-3 transition-colors ${
                      opt.is_correct 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-sm shadow-emerald-100' 
                      : 'bg-slate-50 border-transparent text-slate-600'
                    }`}>
                      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                        opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="flex-1 pt-0.5 leading-relaxed">{opt.text}</span>
                    </div>
                  ))}
                </div>
                
                {q.explanation && (
                  <div className="ml-14 bg-indigo-50 text-indigo-900 text-sm p-5 rounded-2xl border border-indigo-100 font-medium leading-relaxed">
                    <strong className="text-indigo-700 uppercase tracking-wider text-xs block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Penjelasan Jawaban
                    </strong> 
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {selectedPackage?.activity_type === 'assignment' && (
            <div className="max-w-4xl mx-auto mt-10">
              <h3 className="text-xl font-black text-slate-800 mb-6">Respons Siswa ({packageSubmissions.length})</h3>
              {packageSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-slate-500 font-medium">Belum ada siswa yang mengumpulkan tugas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packageSubmissions.map(sub => {
                     // Get answer text (usually the first key in answers object)
                     const ansKey = Object.keys(sub.answers || {})[0];
                     const ansText = ansKey ? (sub.answers[ansKey][0] || '') : 'Tidak ada jawaban tertulis';
                     return (
                        <div key={sub.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 {sub.student?.avatar_url ? (
                                    <img src={sub.student.avatar_url} alt="ava" className="w-10 h-10 rounded-full object-cover border" />
                                 ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-5 h-5 text-slate-400"/></div>
                                 )}
                                 <div>
                                    <p className="font-bold text-slate-800">{sub.student?.full_name}</p>
                                    <p className="text-xs text-slate-500">Dikumpulkan pada: {new Date(sub.created_at).toLocaleString()}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <div className="flex gap-1">
                                    {[1, 2, 3].map(star => (
                                      <button key={star} onClick={() => handleGiveStar(sub.id, star)} className="hover:scale-110 transition-transform">
                                         <Star className={`w-6 h-6 ${(sub.stars_earned || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                                      </button>
                                    ))}
                                 </div>
                                 <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Beri Nilai Bintang!</span>
                              </div>
                           </div>
                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 whitespace-pre-wrap">
                              {ansText}
                           </div>
                        </div>
                     )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
