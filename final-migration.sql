-- 1. Create table for Attendance Settings
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

-- 2. Alter ace_substitutions for the new workflow
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES ace_schedules(id) ON DELETE CASCADE;
ALTER TABLE ace_substitutions ADD COLUMN IF NOT EXISTS substitution_date DATE;
ALTER TABLE ace_substitutions DROP CONSTRAINT IF EXISTS ace_substitutions_status_check;

-- Just in case we have existing data, we update 'pending' to 'pending_tu'
UPDATE ace_substitutions SET status = 'pending_tu' WHERE status = 'pending';
UPDATE ace_substitutions SET status = 'rejected_tu' WHERE status = 'rejected';

-- Apply the new status constraint
ALTER TABLE ace_substitutions ADD CONSTRAINT ace_substitutions_status_check CHECK (status IN ('pending_tu', 'rejected_tu', 'pending_sub', 'rejected_sub', 'accepted'));
