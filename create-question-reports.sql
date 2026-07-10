CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their own reports" ON question_reports;
CREATE POLICY "Students can insert their own reports" ON question_reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Teachers can view all reports" ON question_reports;
CREATE POLICY "Teachers can view all reports" ON question_reports
FOR SELECT TO authenticated USING (true);
