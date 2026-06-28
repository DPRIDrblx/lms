const fs = require('fs');
let s = fs.readFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', 'utf8');
s = s.replace(/D\x00R\x00O\x00P.*/s, ''); // remove the garbled part
s += '\nDROP POLICY IF EXISTS "TU manage schedules" ON ace_schedules;\nCREATE POLICY "TU manage schedules" ON ace_schedules FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = \'tu\'));\n';
s += 'DROP POLICY IF EXISTS "Teachers update schedules" ON ace_schedules;\nCREATE POLICY "Teachers update schedules" ON ace_schedules FOR UPDATE USING (auth.uid() = teacher_id);\n';
fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', s);
console.log('done fixing sql');
