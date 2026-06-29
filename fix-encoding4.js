const fs = require('fs');
let s = fs.readFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', 'utf8');

s += `
-- 6. Settings for Attendance (Managed by TU)
CREATE TABLE IF NOT EXISTS ace_attendance_settings (
  id INT PRIMARY KEY DEFAULT 1,
  late_time TIME NOT NULL DEFAULT '07:15:00',
  overtime_start TIME NOT NULL DEFAULT '15:00:00',
  is_holiday BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure only one row exists
INSERT INTO ace_attendance_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE ace_attendance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view attendance settings" ON ace_attendance_settings;
CREATE POLICY "Anyone can view attendance settings" ON ace_attendance_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "TU can update attendance settings" ON ace_attendance_settings;
CREATE POLICY "TU can update attendance settings" ON ace_attendance_settings FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));
`;

fs.writeFileSync('c:/Users/rayha/Downloads/lmsss/ace-system.sql', s);
console.log('done fixing sql for attendance settings');
