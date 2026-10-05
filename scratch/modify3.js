const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/student/jadwal-les/[id]/cbt/[packageId]/page.tsx', 'utf8');

// Replace the options render with conditional rendering for essay
const optionsRender = `
                  {/* Options / Essay Input */}
                  <div className="space-y-4">
                    {currentQ.question_type === 'essay' ? (
                       <textarea 
                         value={answers[currentQ.id]?.[0] || ''} 
                         onChange={e => toggleOption(currentQ.id, e.target.value, 'essay')}
                         className="w-full border-2 border-slate-200 rounded-2xl p-6 min-h-[200px] text-lg bg-slate-50 focus:bg-white transition-colors outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                         placeholder="Ketik jawaban kamu di sini..."
                       ></textarea>
                    ) : currentQ.question_type === 'material_text' ? (
                       <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 italic">
                          Silakan baca materi di atas dengan seksama. Klik 'Selanjutnya' jika sudah selesai.
                       </div>
                    ) : (
                      currentQ.options?.map((opt: any, i: number) => {
`;

code = code.replace(/                  \{\/\* Options \*\/\}\n                  <div className="space-y-4">\n                    \{currentQ\.options\?\.map\(\(opt: any, i: number\) => \{/m, optionsRender);

code = code.replace(/                      \}\)\}\n                  <\/div>/m, "                      }))}\n                  </div>");

// We also need to fix `calculateScoreAndStars` to not break on essay/material_text
code = code.replace(
  "const correctOpts = q.options.filter((o:any) => o.is_correct).map((o:any) => o.text);",
  "const correctOpts = (q.options || []).filter((o:any) => o.is_correct).map((o:any) => o.text);"
);

fs.writeFileSync('src/app/(dashboard)/student/jadwal-les/[id]/cbt/[packageId]/page.tsx', code);
console.log('Successfully injected essay support into Student CBT view!');
