-- student-feedback-v2.sql

-- 1. Create table for Feedback Sessions (when a teacher releases the form)
CREATE TABLE IF NOT EXISTS ace_feedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semester TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ace_feedback_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for ace_feedback_sessions
DROP POLICY IF EXISTS "View active sessions" ON ace_feedback_sessions;
CREATE POLICY "View active sessions" ON ace_feedback_sessions FOR SELECT USING (true); -- everyone can see, especially students

DROP POLICY IF EXISTS "Teachers manage own sessions" ON ace_feedback_sessions;
CREATE POLICY "Teachers manage own sessions" ON ace_feedback_sessions FOR ALL USING (auth.uid() = teacher_id);

-- 2. Alter ace_student_feedbacks to add new columns
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES ace_feedback_sessions(id) ON DELETE CASCADE;
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS suggestion TEXT;
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS engaging_score DOUBLE PRECISION CHECK (engaging_score >= 1 AND engaging_score <= 4);
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS understanding_score DOUBLE PRECISION CHECK (understanding_score >= 1 AND understanding_score <= 4);

-- Update policies for ace_student_feedbacks
DROP POLICY IF EXISTS "Students can insert feedbacks" ON ace_student_feedbacks;
CREATE POLICY "Students can insert feedbacks" ON ace_student_feedbacks FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Teachers can view their own feedbacks
DROP POLICY IF EXISTS "View own feedbacks" ON ace_student_feedbacks;
CREATE POLICY "View own feedbacks" ON ace_student_feedbacks FOR SELECT USING (auth.uid() = teacher_id);

-- HoD can view their department's feedbacks (simplified: HoD sees all for MVP or based on department)
DROP POLICY IF EXISTS "HoD view feedbacks" ON ace_student_feedbacks;
CREATE POLICY "HoD view feedbacks" ON ace_student_feedbacks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_hod = true)
);

-- Principal can view all
DROP POLICY IF EXISTS "Principal view feedbacks" ON ace_student_feedbacks;
CREATE POLICY "Principal view feedbacks" ON ace_student_feedbacks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'principal')
);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
