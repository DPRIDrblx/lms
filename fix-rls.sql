DROP POLICY IF EXISTS "TU can update attendance settings" ON ace_attendance_settings;
CREATE POLICY "TU can manage attendance settings" ON ace_attendance_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'tu'));
