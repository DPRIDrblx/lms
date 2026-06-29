const fs = require('fs');
let s = fs.readFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', 'utf8');
s += '\nDROP POLICY IF EXISTS "Teachers update attendances" ON ace_attendances;\nCREATE POLICY "Teachers update attendances" ON ace_attendances FOR UPDATE USING (auth.uid() = teacher_id);\n';
fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', s);
console.log('done fixing sql');
