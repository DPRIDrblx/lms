const fs = require('fs');
let code = fs.readFileSync('src/components/tutor/SessionCbtManager.tsx', 'utf8');

// Add state for submissions
code = code.replace(
  '  const [packageQuestions, setPackageQuestions] = useState<any[]>([]);',
  '  const [packageQuestions, setPackageQuestions] = useState<any[]>([]);\n  const [packageSubmissions, setPackageSubmissions] = useState<any[]>([]);'
);

// Update loadPackageDetail
const newLoadPackageDetail = `
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
`;

code = code.replace(/  const loadPackageDetail = async \(pkg: any\) => \{[\s\S]*?setActiveView\('edit'\);\n  \};/m, newLoadPackageDetail.trim());

// Update onClick
code = code.replace(
  /onClick=\{\(\) => pkg\.activity_type === 'cbt' \? loadPackageDetail\(pkg\) : null\}/g,
  "onClick={() => loadPackageDetail(pkg)}"
);

code = code.replace(
  /\{pkg\.activity_type === 'cbt' && \([\s\S]*?Kelola <ArrowRight className="w-3 h-3 ml-1" \/>\n                          <\/Button>\n                        \)\}/m,
  `<Button variant="ghost" size="sm" className="h-8 px-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); loadPackageDetail(pkg); }}>
                            Buka <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>`
);

// Update question rendering to support non-options
code = code.replace(/\{q\.options\.map\(\(opt: any, optIdx: number\) => \(/g, "{q.options?.map((opt: any, optIdx: number) => (");

// Add submission view in 'edit' mode if assignment
const submissionsRender = `
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
                                         <Star className={\`w-6 h-6 \${(sub.stars_earned || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}\`} />
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
`;

// Inject submissions view at the end of the edit view
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\);\n\}/m, submissionsRender + "\n        </div>\n      )}\n    </div>\n  );\n}");

// Import Star & User icons if not imported
code = code.replace(/import \{ Sparkles, Save, Trash2, ListChecks, ArrowRight, ArrowLeft, BookOpen, Clock, Users, PlayCircle, Loader2 \} from 'lucide-react';/, "import { Sparkles, Save, Trash2, ListChecks, ArrowRight, ArrowLeft, BookOpen, Clock, Users, PlayCircle, Loader2, Star, User } from 'lucide-react';");

fs.writeFileSync('src/components/tutor/SessionCbtManager.tsx', code);
console.log('Successfully injected manual submissions views!');
