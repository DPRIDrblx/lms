ALTER TABLE ace_attendance_settings ADD COLUMN IF NOT EXISTS routine_holidays JSONB DEFAULT '[0, 6]'::jsonb;

DROP POLICY IF EXISTS "TU can update all attendances" ON ace_attendances;
CREATE POLICY "TU can update all attendances" ON ace_attendances FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));
