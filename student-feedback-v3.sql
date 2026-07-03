-- student-feedback-v3.sql

-- Add additional criteria columns for the expanded student feedback questionnaire
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS criteria_4_score DOUBLE PRECISION CHECK (criteria_4_score >= 1 AND criteria_4_score <= 4);
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS criteria_5_score DOUBLE PRECISION CHECK (criteria_5_score >= 1 AND criteria_5_score <= 4);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
