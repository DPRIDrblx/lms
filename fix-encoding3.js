const fs = require('fs');
let s = fs.readFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', 'utf8');
s += '\nDROP POLICY IF EXISTS "HoD manage all certificates" ON ace_certificates;\nCREATE POLICY "HoD manage all certificates" ON ace_certificates FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_hod = true));\n';
fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', s);
console.log('done fixing sql for hod certificates');
