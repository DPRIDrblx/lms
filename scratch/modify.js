const fs = require('fs');
let code = fs.readFileSync('src/components/tutor/SessionCbtManager.tsx', 'utf8');

// We need to add state for manual creation
const stateAdditions = `
  // Manual Creation States
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualQuestions, setManualQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: '' }]);
`;

code = code.replace('  const [packageQuestions, setPackageQuestions] = useState<any[]>([]);', '  const [packageQuestions, setPackageQuestions] = useState<any[]>([]);\n' + stateAdditions);

// We need to add functions for handling manual saves
const handleSaveManualMaterial = `
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
`;

code = code.replace('  const handleGenerateAI = async () => {', handleSaveManualMaterial + '\n  const handleGenerateAI = async () => {');

// Replace the mock AI buttons and add manual buttons
const buttonsHTML = `
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
`;

code = code.replace(/<div className="flex flex-wrap gap-2 w-full sm:w-auto">[\s\S]*?<\/div>\s*<\/div>\s*\{loading \? \(/m, buttonsHTML + '</div>\n\n          {loading ? (');

const emptyStateHTML = `
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Materi</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_material')} variant="outline" className="h-10 px-4 rounded-xl shadow-sm">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('material')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 h-10 px-4 rounded-xl shadow-sm border border-indigo-100"><Sparkles className="w-4 h-4 mr-2"/> Pakai AI</Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Tugas</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_assignment')} variant="outline" className="h-10 px-4 rounded-xl shadow-sm">Ketik Sendiri</Button>
                    <Button onClick={() => handleGenerateMockAi('assignment')} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 h-10 px-4 rounded-xl shadow-sm border border-indigo-100"><Sparkles className="w-4 h-4 mr-2"/> Pakai AI</Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">CBT</p>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveView('create_manual_cbt')} variant="outline" className="h-10 px-4 rounded-xl shadow-sm">Buat Soal</Button>
                    <Button onClick={() => setActiveView('create_ai')} className="bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 rounded-xl shadow-sm"><Sparkles className="w-4 h-4 mr-2 text-indigo-200"/> AI Generator</Button>
                  </div>
                </div>
              </div>
`;

code = code.replace(/<div className="flex flex-wrap justify-center gap-3">[\s\S]*?<\/div>\s*<\/div>\s*\)\s*:\s*\(/m, emptyStateHTML + '</div>\n            ) : (');

const manualViewsHTML = `
      {activeView === 'create_manual_material' && (
        <Card className="p-6 border-slate-200 shadow-sm rounded-2xl animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
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
            <Button variant="ghost" size="icon" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
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
            <Button variant="ghost" size="icon" onClick={() => setActiveView('list')} className="rounded-full hover:bg-slate-100">
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
                        <input type="radio" name={\`correct-\${idx}\`} checked={q.correct === opt && opt !== ''} onChange={() => {
                           const newQ = [...manualQuestions];
                           newQ[idx].correct = opt;
                           setManualQuestions(newQ);
                        }} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                        <input type="text" value={opt} onChange={e => {
                          const newQ = [...manualQuestions];
                          newQ[idx].options[oIdx] = e.target.value;
                          setManualQuestions(newQ);
                        }} className="w-full border-none bg-transparent outline-none text-sm" placeholder={\`Opsi \${String.fromCharCode(65+oIdx)}\`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() => setManualQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correct: '' }])} className="w-full border-dashed border-2 rounded-xl h-12 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">+ Tambah Soal</Button>
            </div>
            
            <Button onClick={() => handleSaveManual('cbt')} className="w-full bg-slate-900 text-white rounded-xl h-12 hover:bg-slate-800">Simpan Paket CBT</Button>
          </div>
        </Card>
      )}

      {activeView === 'create_ai' && (
`;

code = code.replace("{activeView === 'create_ai' && (", manualViewsHTML);
code = code.replace(/useState\<'list' \| 'create_ai' \| 'create_manual' \| 'edit'\>/g, "useState<string>");

fs.writeFileSync('src/components/tutor/SessionCbtManager.tsx', code);
console.log('Successfully injected manual creation views!');
