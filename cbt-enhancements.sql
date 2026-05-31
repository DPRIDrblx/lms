-- Add time_limit (in minutes) and max_score to quizzes
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

-- Add criteria (JSONB) to questions for essay rules etc.
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}'::jsonb;
