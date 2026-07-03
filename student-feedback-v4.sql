-- student-feedback-v4.sql

-- Add additional criteria columns for an extended student feedback questionnaire
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS criteria_6_score DOUBLE PRECISION CHECK (criteria_6_score >= 1 AND criteria_6_score <= 4);
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS criteria_7_score DOUBLE PRECISION CHECK (criteria_7_score >= 1 AND criteria_7_score <= 4);
ALTER TABLE ace_student_feedbacks ADD COLUMN IF NOT EXISTS criteria_8_score DOUBLE PRECISION CHECK (criteria_8_score >= 1 AND criteria_8_score <= 4);

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
